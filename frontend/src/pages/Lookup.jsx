import { useState } from "react";
import Ticket from "../components/Ticket.jsx";
import { getFile } from "../lib/api.js";
import "./Lookup.css";

export default function Lookup() {
  const [number, setNumber] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!/^\d{6}$/.test(number)) {
      setError("Enter a 6-digit claim number.");
      return;
    }

    setLoading(true);
    try {
      const data = await getFile(number);
      setResult(data);
    } catch (err) {
      setError(err.message || "That code wasn't found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lookup stack">
      <section className="lookup__intro">
        <p className="eyebrow">Claim lookup</p>
        <h1>Check a claim number</h1>
        <p className="lookup__sub">See whether a file has been paid for and is ready to print.</p>
      </section>

      <form className="lookup__form" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="482913"
          value={number}
          onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {error && <p className="error-banner critical">{error}</p>}

      {result && (
        <Ticket
          number={result.number}
          filename={result.filename}
          pages={result.pages}
          amount={result.amount}
          status={result.status}
        />
      )}
    </div>
  );
}
