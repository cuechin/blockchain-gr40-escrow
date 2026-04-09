export default function ConnectWallet({
  account,
  onConnect,
  contractAddress,
  networkLabel,
  explorerBaseUrl,
}) {
  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
  const contractUrl = explorerBaseUrl
    ? `${explorerBaseUrl}/address/${contractAddress}`
    : "";

  return (
    <div className="card connect-card">
      {account ? (
        <div className="connected-info">
          <span className="badge connected">Conectado</span>
          <span className="badge network">{networkLabel}</span>
          <span className="address" title={account}>{shortAddr(account)}</span>
          <span className="contract-label">
            Contrato: {contractUrl ? (
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={contractAddress}
              >
                {shortAddr(contractAddress)}
              </a>
            ) : (
              <span title={contractAddress}>{shortAddr(contractAddress)}</span>
            )}
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
