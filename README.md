# blockchain-gr40-escrow

Proyecto final del curso **Blockchain y Ledgers Distribuidos GR40**: implementación de un sistema Escrow mediante Smart Contracts.

---

## Descripción del Sistema

Un **Escrow** (custodia) es un mecanismo financiero en el que un tercero neutral retiene fondos durante una transacción entre dos partes (comprador y vendedor), liberándolos únicamente cuando se cumplen las condiciones acordadas.

Este proyecto implementa un sistema de Escrow descentralizado sobre la blockchain de Polygon (Amoy Testnet), eliminando la necesidad de confiar en un intermediario centralizado. El Smart Contract actúa como el custodio imparcial que:

- **Recibe y custodia** los fondos depositados por el comprador.
- **Libera el pago** al vendedor cuando el comprador confirma la recepción del bien o servicio.
- **Permite reembolsos** al comprador si el vendedor no cumple, mediante la intervención de un árbitro.
- **Resuelve disputas** a través de un árbitro designado que puede decidir a favor del comprador o vendedor.

### Actores del Sistema

| Actor | Rol |
|-------|-----|
| **Comprador (Buyer)** | Deposita los fondos en el contrato. Confirma la entrega para liberar el pago. |
| **Vendedor (Seller)** | Recibe el pago una vez que el comprador confirma o el árbitro falla a su favor. |
| **Árbitro (Arbiter)** | Interviene solo en caso de disputa. Puede liberar fondos al vendedor o reembolsar al comprador. |

### Funcionalidades Principales

1. **Depositar fondos**: El comprador envía POL/ETH al contrato, iniciando el escrow.
2. **Liberar pago**: El comprador confirma que recibió el bien/servicio y los fondos se transfieren al vendedor.
3. **Abrir disputa**: Comprador o vendedor pueden abrir una disputa si hay desacuerdo.
4. **Resolución por árbitro**: El árbitro decide si liberar al vendedor o reembolsar al comprador.

---

## Arquitectura

El proyecto sigue la arquitectura estándar de una DApp (Aplicación Descentralizada) con tres capas:

```
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                  │
│                   (Frontend / Web UI)                   │
│         HTML + JavaScript + ethers.js + MetaMask        │
└────────────────────────┬────────────────────────────────┘
                         │  JSON-RPC (via MetaMask / Provider)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 CAPA DE SMART CONTRACTS                 │
│                     Escrow.sol                          │
│              Solidity ^0.8.20 / Hardhat                 │
└────────────────────────┬────────────────────────────────┘
                         │  Transacciones / Lecturas
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE BLOCKCHAIN                    │
│         Polygon Amoy Testnet / Hardhat Local            │
│                     (EVM)                               │
└─────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Smart Contract | Solidity ^0.8.20 |
| Entorno de desarrollo | Hardhat |
| Blockchain local | Hardhat Network |
| Testnet | Polygon Amoy |
| Frontend | HTML, CSS, JavaScript |
| Librería Web3 | ethers.js |
| Wallet | MetaMask |
| Testing | Chai + Hardhat Chai Matchers |

### Estructura del Proyecto

```
blockchain-gr40-escrow/
├── contracts/
│   └── Escrow.sol            # Smart Contract del Escrow
├── scripts/
│   ├── deploy.js             # Script de despliegue
│   └── interact.js           # Script de interacción por consola
├── test/
│   └── Escrow.js             # Tests unitarios del contrato
├── web/
│   └── escrow/
│       ├── index.html        # Interfaz de usuario
│       └── app.js            # Lógica de conexión con el contrato
├── .env.example              # Variables de entorno de ejemplo
├── hardhat.config.js         # Configuración de Hardhat y redes
├── package.json              # Dependencias del proyecto
└── README.md                 # Este archivo
```

---

## Flujo de Transacciones

### Flujo Principal (Sin Disputa)

```
Comprador                    Smart Contract                   Vendedor
    │                              │                              │
    │  1. createEscrow(vendedor,   │                              │
    │     árbitro) + envía fondos  │                              │
    │─────────────────────────────►│                              │
    │                              │  Fondos custodiados          │
    │                              │  Estado: AWAITING_DELIVERY   │
    │                              │                              │
    │    (Vendedor entrega el      │                              │
    │     bien/servicio off-chain) │                              │
    │                              │                              │
    │  2. confirmDelivery()        │                              │
    │─────────────────────────────►│                              │
    │                              │  3. Transfiere fondos ──────►│
    │                              │  Estado: COMPLETED           │
    │                              │                              │
```

### Flujo con Disputa

```
Comprador         Smart Contract          Árbitro            Vendedor
    │                    │                    │                   │
    │  1. createEscrow() │                    │                   │
    │   + envía fondos   │                    │                   │
    │───────────────────►│                    │                   │
    │                    │ Estado:             │                   │
    │                    │ AWAITING_DELIVERY   │                   │
    │                    │                    │                   │
    │  2. raiseDispute() │                    │                   │
    │───────────────────►│                    │                   │
    │                    │ Estado: DISPUTED    │                   │
    │                    │                    │                   │
    │                    │ 3. resolveDispute() │                   │
    │                    │◄───────────────────│                   │
    │                    │                    │                   │
    │  Si falla a favor  │                    │                   │
    │  del vendedor:     │  Transfiere ──────────────────────────►│
    │                    │  Estado: COMPLETED  │                   │
    │                    │                    │                   │
    │  Si falla a favor  │                    │                   │
    │◄───── Reembolso ──│                    │                   │
    │  del comprador:    │  Estado: REFUNDED   │                   │
    │                    │                    │                   │
```

### Estados del Escrow

| Estado | Descripción |
|--------|-------------|
| `AWAITING_DELIVERY` | Fondos depositados, esperando que el comprador confirme la entrega. |
| `DISPUTED` | Una de las partes abrió una disputa. Solo el árbitro puede resolver. |
| `COMPLETED` | Fondos liberados al vendedor. Transacción finalizada. |
| `REFUNDED` | Fondos reembolsados al comprador. Transacción cancelada. |

---

## Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                         USUARIO / NAVEGADOR                      │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐  │
│  │  index.html  │◄──►│    app.js    │◄──►│     MetaMask       │  │
│  │  (UI Escrow) │    │  (ethers.js) │    │  (Wallet/Signer)   │  │
│  └──────────────┘    └──────┬───────┘    └────────┬───────────┘  │
│                             │                     │              │
└─────────────────────────────┼─────────────────────┼──────────────┘
                              │ ABI + Contract Addr │ JSON-RPC
                              ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN (EVM)                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Escrow.sol                             │  │
│  │                                                            │  │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │   Storage        │  │   Funciones                    │  │  │
│  │  │                  │  │                                │  │  │
│  │  │  - buyer         │  │  + createEscrow()              │  │  │
│  │  │  - seller        │  │  + confirmDelivery()           │  │  │
│  │  │  - arbiter       │  │  + raiseDispute()              │  │  │
│  │  │  - amount        │  │  + resolveDispute()            │  │  │
│  │  │  - state         │  │  + getEscrowDetails()          │  │  │
│  │  │                  │  │                                │  │  │
│  │  └──────────────────┘  └────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Events: FundsDeposited, DeliveryConfirmed,                │  │
│  │          DisputeRaised, DisputeResolved, FundsRefunded     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Red: Hardhat Local (31337) / Polygon Amoy Testnet (80002)       │
└──────────────────────────────────────────────────────────────────┘
```

### Interacción entre Componentes

| Componente | Responsabilidad | Comunica con |
|------------|----------------|--------------|
| **index.html** | Interfaz gráfica para el usuario | app.js |
| **app.js** | Conecta la UI con el contrato vía ethers.js | MetaMask, Escrow.sol |
| **MetaMask** | Firma transacciones y gestiona cuentas | Blockchain (JSON-RPC) |
| **Escrow.sol** | Lógica de negocio on-chain: custodia, liberación, disputas | Blockchain (EVM) |
| **Hardhat** | Compilación, testing, despliegue | Escrow.sol, Blockchain |

---

## Cómo Ejecutar

### Prerrequisitos

- Node.js >= 18
- Yarn
- MetaMask (extensión del navegador)

### Instalación

```bash
yarn install
```

### Compilar Contratos

```bash
yarn compile
```

### Ejecutar Tests

```bash
yarn test
```

### Desplegar Localmente

```bash
# Terminal 1: Levantar nodo local
yarn local:node

# Terminal 2: Desplegar contrato
yarn local:deploy
```

### Desplegar en Polygon Amoy

```bash
# Configurar .env con las credenciales
cp .env.example .env
# Editar .env con tu PRIVATE_KEY y AMOY_RPC_URL

yarn amoy:deploy
```
