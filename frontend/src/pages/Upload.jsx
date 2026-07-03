import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dropzone from "../components/Dropzone.jsx";
import Ticket from "../components/Ticket.jsx";
import { uploadFile } from "../lib/api.js";
import { getCart, addCartItem, removeCartItem, setCart } from "../lib/cart.js";
import "./Upload.css";

let localId = 0;
const nextId = () => `local-${Date.now()}-${localId++}`;

export default function Upload() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  // Hydrate from any files already added earlier in the session.
  useEffect(() => {
    const cart = getCart();
    setItems(cart.map((entry) => ({ id: nextId(), status: "ready", ...entry })));
  }, []);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleFiles = (files) => {
    files.forEach((file) => {
      const id = nextId();
      setItems((prev) => [
        ...prev,
        { id, status: "uploading", progress: 0, filename: file.name },
      ]);

      uploadFile(file, {
        onProgress: (progress) => updateItem(id, { progress }),
      })
        .then((data) => {
          const entry = {
            number: data.number,
            filename: data.filename ?? file.name,
            pages: data.pages,
            amount: data.amount,
          };
          updateItem(id, { status: "ready", ...entry });
          addCartItem(entry);
        })
        .catch((error) => {
          updateItem(id, { status: "error", errorMessage: error.message });
        });
    });
  };

  const handleRemove = (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (item.number) removeCartItem(item.number);
  };

  const payable = items.filter((item) => item.status === "ready");
  const uploading = items.some((item) => item.status === "uploading");
  const total = payable.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleContinue = () => {
    // Keep sessionStorage in sync with whatever is currently showing as ready.
    setCart(
      payable.map(({ number, filename, pages, amount }) => ({ number, filename, pages, amount }))
    );
    navigate("/checkout");
  };

  return (
    <div className="upload stack">
      <section className="upload__intro">
        <p className="eyebrow">Step 1 of 2</p>
        <h1>Upload your documents</h1>
        <p className="upload__sub">
          Each file gets its own claim ticket and its own 6-digit code. Add as many as you like, then pay
          for them all at once.
        </p>
      </section>

      <Dropzone onFiles={handleFiles} disabled={false} />

      {items.length > 0 && (
        <div className="upload__tickets stack">
          {items.map((item) => (
            <Ticket
              key={item.id}
              number={item.number}
              filename={item.filename}
              pages={item.pages}
              amount={item.amount}
              status={item.status}
              progress={item.progress}
              errorMessage={item.errorMessage}
              onRemove={() => handleRemove(item)}
            />
          ))}
        </div>
      )}

      {payable.length > 0 && (
        <div className="upload__summary">
          <div className="upload__summary-row">
            <span>
              {payable.length} {payable.length === 1 ? "file" : "files"} ready
            </span>
            <span className="upload__summary-amount">PKR {total}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={uploading}
            onClick={handleContinue}
          >
            Continue to payment
          </button>
        </div>
      )}
    </div>
  );
}
