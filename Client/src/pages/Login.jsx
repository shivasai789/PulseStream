import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PulseStreamLogo from "../components/PulseStreamLogo";
import { useAuth } from "../context/useAuth.js";
import toast from "../utils/toast.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin(email, password) {
  const errors = {};
  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(trimmedEmail))
    errors.email = "Please enter a valid email address";
  if (!(password ?? "").trim()) errors.password = "Password is required";
  return errors;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => clearError, [clearError]);

  function clearFieldError(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleBlur(field) {
    const errors = validateLogin(email, password);
    if (errors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateLogin(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const result = await login(email.trim(), password);
    if (result?.success) {
      toast.success("Login successful! Welcome back!");
      navigate("/", { replace: true });
    } else if (result?.message) {
      toast.error(result.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <PulseStreamLogo />
        <h1 className="auth-title">Welcome to PulseStream</h1>
        <p className="auth-subtitle">Sign in to access your dashboard</p>

        {error && <p className="auth-error">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              type="email"
              className={`auth-input ${
                fieldErrors.email ? "auth-input-invalid" : ""
              }`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              onBlur={() => handleBlur("email")}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="auth-field-error">{fieldErrors.email}</span>
            )}
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              className={`auth-input ${
                fieldErrors.password ? "auth-input-invalid" : ""
              }`}
              placeholder="********"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              onBlur={() => handleBlur("password")}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="auth-field-error">{fieldErrors.password}</span>
            )}
          </label>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
