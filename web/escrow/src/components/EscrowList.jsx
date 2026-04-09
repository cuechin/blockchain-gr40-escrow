import { useEffect, useState } from "react";
import { STATE_LABELS, STATE_COLORS } from "../contract"; 

export default function EscrowList({ contract, account, onSelectEscrow }) {
  const [role, setRole] = useState("buyer");
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadEscrows = async () => {
    if (!contract || !account) return;

    setLoading(true);
    try {
      let result;
      if (role === "buyer") {
        result = await contract.getEscrowsByBuyer(account);
      } else if (role === "seller") {
        result = await contract.getEscrowsBySeller(account);
      } else {
        result = await contract.getEscrowsByArbiter(account);
      }

      const ids = result.map((id) => id.toString());

      const detailedEscrows = await Promise.all(
        ids.map(async (id) => {
          const info = await contract.escrows(id);
          const stateLabel = STATE_LABELS[Number(info.state)];
          return {
            id,
            state: stateLabel,
            stateColor: STATE_COLORS[stateLabel]
          };
        })
      );

      setEscrows(detailedEscrows);
    } catch (err) {
      console.error("Error cargando lista de escrows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscrows();
  }, [contract, account, role]);

  return (
    <div className="card">
      <h2>Mis Escrows</h2>

      <div className="form-group">
        <label>Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="arbiter">Arbiter</option>
        </select>
      </div>

      <button
        className="btn btn-secondary"
        onClick={loadEscrows}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Actualizar Lista"}
      </button>

      {escrows.length > 0 && (
        <div className="escrow-list">
          {escrows.map((escrow) => (
            <div
              key={escrow.id}
              className="escrow-item"
              onClick={() => onSelectEscrow(escrow.id)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Escrow #{escrow.id}</span>
              
              <span 
                className="state-badge-mini" 
                style={{ 
                  backgroundColor: escrow.stateColor,
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              >
                {escrow.state}
              </span>
            </div>
          ))}
        </div>
      )}

      {escrows.length === 0 && !loading && (
        <div className="status">No hay escrows para este rol.</div>
      )}
    </div>
  );
}