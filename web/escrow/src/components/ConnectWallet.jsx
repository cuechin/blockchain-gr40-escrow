import { useEffect, useState } from "react";

export default function ConnectWallet({
  account,
  onConnect,
  contractAddress,
  networkLabel,
  explorerBaseUrl,
  contract,
}) {
  const [owner, setOwner] = useState("");
  const [newOwner, setNewOwner] = useState("");

  const handleTransferOwnership = async () => {
    try {
      setStatus("Transfiriendo ownership...");
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();

      setStatus("Ownership transferido ✅");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const shortAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const contractUrl = explorerBaseUrl
    ? `${explorerBaseUrl}/address/${contractAddress}`
    : "";

  useEffect(() => {
    const loadOwner = async () => {
      try {
        if (contract) {
          const o = await contract.owner();
          setOwner(o);
        }
      } catch (err) {
        console.error("Error loading owner", err);
      }
    };

    loadOwner();
  }, [contract]);

  const isOwner =
    account && owner && account.toLowerCase() === owner.toLowerCase();

  return (
    <div className="card connect-card">
      {account ? (
        <div className="connected-info">
          <span className="badge connected">Conectado</span>
          <span className="badge network">{networkLabel}</span>

          <span className="address" title={account}>
            {shortAddr(account)}
          </span>

          <span className="contract-label">
            Contrato:{" "}
            {contractUrl ? (
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

          {owner && (
            <span
              className={`badge ${isOwner ? "connected" : "network"}`}
              title={owner}
            >
              Owner: {shortAddr(owner)}
            </span>
          )}
        </div>
      ) : (
        <button className="btn btn-primary" onClick={onConnect}>
          Conectar MetaMask
        </button>
      )}

      {isOwner && (
        <div className="owner-actions">
          <input
            type="text"
            placeholder="Nueva dirección owner"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={handleTransferOwnership}
          >
            Transferir Ownership
          </button>
        </div>
      )}
    </div>
  );
}
