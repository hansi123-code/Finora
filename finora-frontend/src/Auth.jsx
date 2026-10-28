
import { useState } from "react";
import { loginUser, registerUser } from "./api";
import "./Auth.css";

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      let result;

      if (mode === "register") {
        result = await registerUser(
          name,
          email,
          password,
          confirmPassword
        );
      } else {
        result = await loginUser(email, password);
      }

      onAuthenticated(result.user);
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Finora<span>.</span></div>

        <h1>
          {mode === "login" ? "Welcome Back!" : "Create Account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to manage your personal finances."
            : "Create your account to start managing your money."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => changeMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => changeMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {mode === "register" && (
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() =>
              changeMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
