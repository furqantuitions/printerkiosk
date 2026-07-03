// Thin client for the Cloud PDF Service API.
// Base URL + API key come from Vite env vars (see .env.example).
// NOTE: this API uses a single shared x-api-key. Because this is a static
// front end, that key ships in the JS bundle and is visible to anyone who
// opens dev tools — see the README for why, and how to close that gap with
// a tiny server-side proxy if this ever needs to be more than a demo.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Upload a single file. Uses XMLHttpRequest instead of fetch so we can
 * report upload progress (LibreOffice conversion happens server-side after
 * the bytes land, so progress only reflects the transfer itself).
 */
export function uploadFile(file, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.open("POST", `${BASE_URL}/api/files/upload`);
    xhr.setRequestHeader("x-api-key", API_KEY);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      const payload = (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return null;
        }
      })();

      if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
        resolve(payload.data);
      } else {
        const message =
          payload?.message ||
          (xhr.status === 401
            ? "The upload was rejected — check the API key configuration."
            : "Something went wrong converting that file.");
        reject(new ApiError(message, xhr.status, payload));
      }
    };

    xhr.onerror = () => {
      reject(new ApiError("Couldn't reach the print service. Check your connection and try again.", 0, null));
    };

    xhr.send(form);
  });
}

export async function getFile(number) {
  const response = await fetch(`${BASE_URL}/api/files/${number}`, {
    headers: { "x-api-key": API_KEY },
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || "That code wasn't found.", response.status, payload);
  }
  return payload.data;
}

export async function billPayment({ number, mobileNumber, cnicLast6 }) {
  const response = await fetch(`${BASE_URL}/api/payment/bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify({ number, mobileNumber, cnicLast6 }),
  });
  const payload = await parseJsonSafe(response);

  if (response.status === 409) {
    // Already billed — treat as a soft success so a retried checkout doesn't
    // look like a failure to the person paying.
    return { alreadyBilled: true, number };
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || "The payment didn't go through.", response.status, payload);
  }

  return payload;
}

export { ApiError };
