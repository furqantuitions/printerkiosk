import "./Ticket.css";

const STATUS_LABEL = {
  uploading: "Converting…",
  ready: "Ready to pay",
  paid: "Paid",
  already_paid: "Already paid",
  error: "Not accepted",
};

/**
 * A claim ticket: a numbered stub on one side, document details on the
 * other, with a perforated edge and a dashed tear-line between them —
 * the same shape the person will eventually be looking for on a kiosk
 * screen, so it's introduced here first.
 */
export default function Ticket({
  number,
  filename,
  pages,
  amount,
  status = "ready",
  progress,
  errorMessage,
  large = false,
  onRemove,
}) {
  const statusClass = `ticket--${status}`;

  return (
    <div className={`ticket ticket-edge ${statusClass} ${large ? "ticket--large" : ""}`}>
      <div className="ticket__stub">
        <span className="ticket__eyebrow">Claim no.</span>
        <span className="ticket__number">{number ?? "------"}</span>
        <span className={`ticket__status ticket__status--${status}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="ticket__tear" aria-hidden="true" />

      <div className="ticket__body">
        <p className="ticket__filename" title={filename}>
          {filename}
        </p>

        {status === "uploading" && (
          <div className="ticket__progress-track">
            <div className="ticket__progress-fill" style={{ width: `${progress ?? 0}%` }} />
          </div>
        )}

        {status === "error" && <p className="ticket__error">{errorMessage}</p>}

        {(status === "ready" || status === "paid" || status === "already_paid") && (
          <div className="ticket__meta">
            <span>{pages} {pages === 1 ? "page" : "pages"}</span>
            <span className="ticket__dot">·</span>
            <span>PKR {amount}</span>
          </div>
        )}

        {onRemove && status !== "uploading" && (
          <button type="button" className="ticket__remove" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
