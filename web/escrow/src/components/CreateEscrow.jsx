import { useState } from "react";
import { parseEther } from "ethers";

export default function CreateEscrow({ contract, setStatus }) {
  const [seller, setSeller] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const tx = await contract.createEscrow(seller, arbiter, {
        value: parseEther(amount),
      });
      setStatus("Transacción enviada. Esperando confirmación...");
      const receipt = await tx.wait();
      const escrowCount = await contract.escrowCount();
      setStatus(`Escrow #${(escrowCount - 1n).toString()} creado exitosamente. Tx: ${receipt.hash}`);
      setSeller("");
      setArbiter("");
      setAmount("");
    } catch (err) {
      setStatus("Error: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Crear Escrow</h2>
      <form onSubmit={handleCreate}>
        <div className="form-group">
          <label>Dirección del Vendedor (Seller)</label>
          <input
            type="text"
            placeholder="0x..."
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Dirección del Árbitro (Arbiter)</label>
          <input
            type="text"
            placeholder="0x..."
            value={arbiter}
            onChange={(e) => setArbiter(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Monto (POL)</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            placeholder="1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Crear Escrow"}
        </button>
      </form>
    </div>
  );
}
