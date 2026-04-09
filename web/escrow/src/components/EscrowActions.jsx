import { useState } from "react";

export default function EscrowActions({ contract, account, setStatus }) {
  const [escrowId, setEscrowId] = useState("");
  const [loading, setLoading] = useState(false);

  const execute = async (label, action) => {
    if (escrowId === "") return;
    setLoading(true);
    setStatus("");

    try {
      setStatus(`${label}: enviando transacción...`);
      const tx = await action();
      setStatus(`${label}: esperando confirmación...`);
      await tx.wait();
      setStatus(`${label} completado exitosamente.`);
    } catch (err) {
      setStatus(`Error en ${label}: ` + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () =>
    execute("Confirm Delivery", () => contract.confirmDelivery(escrowId));

  const handleDispute = () =>
    execute("Raise Dispute", () => contract.raiseDispute(escrowId));

  const handleResolve = (sellerWins) =>
    execute(
      sellerWins ? "Resolve → Seller" : "Resolve → Buyer",
      () => contract.resolveDispute(escrowId, sellerWins)
    );

  return (
    <div className="card">
      <h2>Acciones</h2>
      <div className="form-group">
        <label>Escrow ID</label>
        <input
          type="number"
          min="0"
          placeholder="Escrow ID"
          value={escrowId}
          onChange={(e) => setEscrowId(e.target.value)}
        />
      </div>

      <div className="actions-grid">
        <button
          className="btn btn-success"
          onClick={handleConfirm}
          disabled={loading || escrowId === ""}
          title="Solo el Buyer puede confirmar"
        >
          Confirmar Entrega
        </button>

        <button
          className="btn btn-warning"
          onClick={handleDispute}
          disabled={loading || escrowId === ""}
          title="Buyer o Seller pueden abrir disputa"
        >
          Abrir Disputa
        </button>

        <button
          className="btn btn-primary"
          onClick={() => handleResolve(true)}
          disabled={loading || escrowId === ""}
          title="Solo el Arbiter — libera fondos al Seller"
        >
          Resolver → Seller
        </button>

        <button
          className="btn btn-danger"
          onClick={() => handleResolve(false)}
          disabled={loading || escrowId === ""}
          title="Solo el Arbiter — reembolsa al Buyer"
        >
          Resolver → Buyer
        </button>
      </div>
    </div>
  );
}
