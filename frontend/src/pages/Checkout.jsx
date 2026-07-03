import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { billPayment } from "../lib/api.js";
import { getCart, setReceipt, clearCart } from "../lib/cart.js";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCartState] = useState([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [cnicLast6, setCnicLast6] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) {
      navigate("/upload", { replace: true });
      return;
    }
    setCartState(items);
  }, [navigate]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.amount || 0), 0), [cart]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^03\d{9}$/.test(mobileNumber)) {
      setError("Enter a valid JazzCash mobile number, e.g. 03001234567.");
      return;
    }
    if (!/^\d{6}$/.test(cnicLast6)) {
      setError("Enter the last 6 digits of your CNIC.");
      return;
    }

    setSubmitting(true);
    try {
      const results = [];
      for (const item of cart) {
        const result = await billPayment({ number: item.number, mobileNumber, cnicLast6 });
        results.push({ ...item, alreadyBilled: result.alreadyBilled ?? false });
      }
      setReceipt({ items: results, mobileNumber, paidAt: new Date().toISOString() });
      clearCart();
      navigate("/receipt");
    } catch (err) {
      setError(err.message || "The payment didn't go through. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout stack">
      <section className="checkout__intro">
        <p className="eyebrow">Step 2 of 2</p>
        <h1>Pay with JazzCash</h1>
        <p className="checkout__sub">
          PKR {total} for {cart.length} {cart.length === 1 ? "file" : "files"}. You'll get a claim number
          for each one.
        </p>
      </section>

      <form className="checkout__form stack" onSubmit={handleSubmit}>
        <label className="checkout__field">
          <span className="checkout__label">JazzCash mobile number</span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="03001234567"
            value={mobileNumber}
            onChange={(event) => setMobileNumber(event.target.value.trim())}
            disabled={submitting}
            required
          />
        </label>

        <label className="checkout__field">
          <span className="checkout__label">Last 6 digits of CNIC</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={cnicLast6}
            onChange={(event) => setCnicLast6(event.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={submitting}
            required
          />
        </label>

        {error && <p className="error-banner critical">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Processing…" : `Pay PKR ${total}`}
        </button>
      </form>
    </div>
  );
}
