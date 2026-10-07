import axios from "axios";

// withCredentials lets the browser send the httpOnly auth cookie on every request.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 15000,
  // Required by the server's CSRF protection; other websites can't send this header cross-site.
  headers: { "X-Requested-With": "XMLHttpRequest" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    error.userMessage =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED" ? "Request timed out" : error.message) ||
      "Something went wrong";

    // A 401 on a normal request means the session expired. The auth store listens for this event
    // (an event avoids a circular import between api.js and the store).
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.startsWith("/auth/")) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (err) => err?.userMessage || err?.message || "Something went wrong";

// Turns the server's [{ field, message }] validation errors into { field: message } for forms.
export function getFieldErrors(err) {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message;
    return acc;
  }, {});
}
