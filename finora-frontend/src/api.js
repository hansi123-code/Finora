
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("finora-token");

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join("\n")
      : "";

    throw new Error(
      validationErrors || data.message || "Something went wrong."
    );
  }

  return data;
}

export async function loginUser(email, password) {
  const data = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("finora-token", data.token);
  return data;
}

export async function registerUser(name, email, password, passwordConfirmation) {
  const data = await apiRequest("/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });

  localStorage.setItem("finora-token", data.token);
  return data;
}

export async function logoutUser() {
  try {
    await apiRequest("/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("finora-token");
  }
}
