# Cloud Print Kiosk

Upload a document, pay PKR 10/page with JazzCash, and collect a printed copy
at any Cloud Print Kiosk using a 6-digit claim number.

## Setup

```bash
npm install
cp .env.example .env
# edit .env with your API base URL + key
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Structure

- `src/pages` — `Home`, `Upload`, `Checkout`, `Receipt` (thank-you), `Lookup`
- `src/components` — `Header`, `Footer`, `Dropzone`, `Ticket`
- `src/lib/api.js` — client for the Cloud PDF Service API (upload, get file, bill payment)
- `src/lib/cart.js` — sessionStorage-backed cart + receipt state
- `src/global.css` — design tokens and shared utility classes

## Flow

1. **Home** (`/`) — intro + sample ticket.
2. **Upload** (`/upload`) — drag/drop or browse files; each uploads independently and gets its own claim ticket.
3. **Checkout** (`/checkout`) — enter JazzCash mobile number + CNIC last 6 digits, pay for everything in the cart.
4. **Receipt** (`/receipt`) — large claim tickets to note down or screenshot.
5. **Lookup** (`/lookup`) — check the status of a claim number later.

## Notes

- `VITE_API_KEY` ships in the client bundle since this is a static front end — see `api.js` for why, and consider a small server-side proxy before using this beyond a demo.
- Cart/receipt state lives in `sessionStorage`, so it survives a refresh mid-flow but clears when the tab closes.
