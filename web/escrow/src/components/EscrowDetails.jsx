import { useState } from "react";
import { formatEther } from "ethers";
import { STATE_LABELS, STATE_COLORS } from "../contract";

export default function EscrowDetails({ contract, account }) {
  const [escrowId, setEscrowId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const shortAddr = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleQuery = async (e) => {
    e.preventDefault();
    setError("");
    setData(null);

    try {
      const result = await contract.escrows(escrowId);

      if (result.buyer === "0x0000000000000000000000000000000000000000") {
        setError("Escrow no existe.");
        return;
      }

      const stateLabel = STATE_LABELS[Number(result.state)];

      setData({
        buyer: result.buyer,
        seller: result.seller,
        arbiter: result.arbiter,
        amount: formatEther(result.amount),
        state: stateLabel,
        stateColor: STATE_COLORS[stateLabel],
        deadline: Number(result.deadline),
        isBuyer: result.buyer.toLowerCase() === account.toLowerCase(),
        isSeller: result.seller.toLowerCase() === account.toLowerCase(),
        isArbiter: result.arbiter.toLowerCase() === account.toLowerCase(),
      });
    } catch (err) {
      setError("Error: " + (err.reason || err.message));
    }
  };

  const roleLabel = () => {
    if (!data) return null;
    if (data.isBuyer) return <span className="badge buyer">Sos el Buyer</span>;
    if (data.isSeller)
      return <span className="badge seller">Sos el Seller</span>;
    if (data.isArbiter)
      return <span className="badge arbiter">Sos el Arbiter</span>;
    return <span className="badge observer">Observador</span>;
  };

  const now = Math.floor(Date.now() / 1000);

  const isExpired = data && now > data.deadline;

  const canClaimTimeout =
    data && data.state === "AWAITING_DELIVERY" && isExpired;

  return (
    <div className="card">
      <h2>Consultar Escrow</h2>
      <form onSubmit={handleQuery} className="inline-form">
        <input
          type="number"
          min="0"
          placeholder="Escrow ID"
          value={escrowId}
          onChange={(e) => setEscrowId(e.target.value)}
          required
        />
        <button className="btn btn-secondary" type="submit">
          Consultar
        </button>
      </form>

      {error && <div className="status error">{error}</div>}

      {data && (
        <div className="escrow-info">
          <div className="escrow-header">
            <div className="badges">
              <span
                className="state-badge"
                style={{ backgroundColor: data.stateColor }}
              >
                {data.state}
              </span>

              {roleLabel()}

              {isExpired && canClaimTimeout && <span className="badge expired">Expirado</span>}
            </div>
          </div>
          {canClaimTimeout && (
            <div className="alert alert-warning">
              Este escrow expiró. Podés ejecutar{" "}
              <strong>Claim Timeout</strong>.
            </div>
          )}
          <table>
            <tbody>
              <tr>
                <td>
                  <strong>Buyer</strong>
                </td>
                <td title={data.buyer}>{shortAddr(data.buyer)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Seller</strong>
                </td>
                <td title={data.seller}>{shortAddr(data.seller)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Arbiter</strong>
                </td>
                <td title={data.arbiter}>{shortAddr(data.arbiter)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Monto</strong>
                </td>
                <td>{data.amount} POL</td>
              </tr>
              <tr>
                <td>
                  <strong>Deadline</strong>
                </td>
                <td>
                  {new Date(data.deadline * 1000).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
