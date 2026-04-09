import { useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, ESCROW_ABI } from "./contract";
import ConnectWallet from "./components/ConnectWallet";
import CreateEscrow from "./components/CreateEscrow";
import EscrowDetails from "./components/EscrowDetails";
import EscrowActions from "./components/EscrowActions";

function getNetworkInfo(chainId) {
  if (chainId === 80002) {
    return {
      label: "Polygon Amoy",
      explorerBaseUrl: "https://amoy.polygonscan.com",
    };
  }

  if (chainId === 31337 || chainId === 1337) {
    return {
      label: "Hardhat Local",
      explorerBaseUrl: "",
    };
  }

  return {
    label: `Red no soportada (chainId: ${chainId})`,
    explorerBaseUrl: "",
  };
}

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [networkLabel, setNetworkLabel] = useState("Sin conectar");
  const [explorerBaseUrl, setExplorerBaseUrl] = useState("");
  const [status, setStatus] = useState("");

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setStatus("MetaMask no detectado. Instalá la extensión.");
      return;
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const userSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const networkInfo = getNetworkInfo(Number(network.chainId));
      const escrowContract = new Contract(CONTRACT_ADDRESS, ESCROW_ABI, userSigner);

      setProvider(browserProvider);
      setSigner(userSigner);
      setContract(escrowContract);
      setAccount(accounts[0]);
      setNetworkLabel(networkInfo.label);
      setExplorerBaseUrl(networkInfo.explorerBaseUrl);
      setStatus("");
    } catch (err) {
      setStatus("Error al conectar: " + err.message);
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Escrow DApp</h1>
        <p className="subtitle">Sistema de custodia descentralizado en Polygon Amoy</p>
      </header>

      <ConnectWallet
        account={account}
        onConnect={connectWallet}
        contractAddress={CONTRACT_ADDRESS}
        networkLabel={networkLabel}
        explorerBaseUrl={explorerBaseUrl}
      />

      {status && <div className="status error">{status}</div>}

      {contract && (
        <div className="main-content">
          <CreateEscrow contract={contract} setStatus={setStatus} />
          <EscrowDetails contract={contract} account={account} />
          <EscrowActions contract={contract} account={account} setStatus={setStatus} />
        </div>
      )}
    </div>
  );
}
