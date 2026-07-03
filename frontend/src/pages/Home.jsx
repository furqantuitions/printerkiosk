import { Link } from "react-router-dom";
import Ticket from "../components/Ticket.jsx";
import "./Home.css";

const STEPS = [
  { label: "Upload your document", detail: "PDF, Word, Excel, PowerPoint, or a photo of a page." },
  { label: "Pay with JazzCash", detail: "PKR 10 per page, billed straight to your mobile wallet." },
  { label: "Get your claim number", detail: "A 6-digit code — this is your receipt." },
  { label: "Collect at the kiosk", detail: "Type the code in at any Cloud Print Kiosk to print." },
];

export default function Home() {
  return (
    <div className="home">
      <section className="home__hero">
        <p className="eyebrow">Cloud Print Kiosk</p>
        <h1 className="home__headline">
          Upload it here.
          <br />
          Print it there.
        </h1>
        <p className="home__sub">
          Send a document from your phone, pay online, and walk up to any Cloud Print Kiosk to collect a
          printed copy. No queues, no cash, no app to install.
        </p>
        <Link to="/upload" className="btn btn-primary home__cta">
          Upload a document
        </Link>

        <div className="home__sample-ticket">
          <Ticket number="482913" filename="semester-project-final.pdf" pages={12} amount={120} status="paid" />
        </div>
      </section>

      <section className="home__steps" aria-label="How it works">
        <p className="eyebrow home__steps-eyebrow">How it works</p>
        <ol className="receipt">
          {STEPS.map((step, index) => (
            <li className="receipt__line" key={step.label}>
              <span className="receipt__index">{index + 1}</span>
              <span className="receipt__text">
                <span className="receipt__label">{step.label}</span>
                <span className="receipt__detail">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="home__pricing">
        <div className="home__pricing-row">
          <span>Price per page</span>
          <span className="home__pricing-amount">PKR 10</span>
        </div>
        <hr className="hairline" />
        <p className="home__pricing-note">
          Files over 30MB are compressed automatically. Password-protected files can't be converted — remove
          the password first and re-upload.
        </p>
      </section>

      <Link to="/upload" className="btn btn-primary btn-block">
        Get started
      </Link>
    </div>
  );
}
