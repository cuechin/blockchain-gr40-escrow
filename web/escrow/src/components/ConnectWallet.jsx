export default function ConnectWallet({ account, onConnect, contractAddress }) {
  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <div className="card connect-card">
      {account ? (
        <div className="connected-info">
          <span className="badge connected">Conectado</span>
          <span className="address" title={account}>{shortAddr(account)}</span>
          <span className="contract-label">
            Contrato: <a
              href={`https://amoy.polygonscan.com/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              title={contractAddress}
            >
              {shortAddr(contractAddress)}
            </a>
          </span>
        </div>
      ) : (
        <button className="btn btn-primary" onClick={onConnect}>
          Conectar MetaMask
        </button>
      )}
    </div>
  );
}
