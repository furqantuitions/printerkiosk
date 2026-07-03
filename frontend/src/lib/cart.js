// Cart + receipt state lives in sessionStorage so it survives a page
// refresh mid-flow but doesn't linger once the browser tab closes —
// there's no backend "order" concept to persist against, each file is
// its own independent 6-digit record.

const CART_KEY = "cpk.cart.v1";
const RECEIPT_KEY = "cpk.receipt.v1";

function read(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private mode, quota) — fail silently,
    // the flow still works within a single page load.
  }
}

export function getCart() {
  return read(CART_KEY, []);
}

export function setCart(items) {
  write(CART_KEY, items);
}

export function addCartItem(item) {
  const items = [...getCart(), item];
  setCart(items);
  return items;
}

export function removeCartItem(number) {
  const items = getCart().filter((item) => item.number !== number);
  setCart(items);
  return items;
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY);
}

export function getReceipt() {
  return read(RECEIPT_KEY, null);
}

export function setReceipt(receipt) {
  write(RECEIPT_KEY, receipt);
}

export function clearReceipt() {
  sessionStorage.removeItem(RECEIPT_KEY);
}
