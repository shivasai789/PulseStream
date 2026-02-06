import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PulseStreamLogo from "../components/PulseStreamLogo";
import { useAuth } from "../context/useAuth.js";
import toast from "../utils/toast.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(name, email, password) {
  const errors = {};
  if (!(name ?? "").trim()) errors.name = "Full name is required";
  const trimmedEmail = (email ?? "").trim();
  if (!trimmedEmail) errors.email = "Email is required";
  else if (!EMAIL_REGEX.test(trimmedEmail))
    errors.email = "Please enter a valid email address";
  const pwd = (password ?? "").trim();
  if (!pwd) errors.password = "Password is required";
  else if (pwd.length < 6)
    errors.password = "Password must be at least 6 characters";
  return errors;
}

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => clearError, [clearError]);

  function clearFieldError(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleBlur(field) {
    const errors = validateSignup(fullName, email, password);
    if (errors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validateSignup(fullName, email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    const result = await register(fullName.trim(), email.trim(), password);
    if (result?.success) {
      toast.success("Account created successfully! Welcome to PulseStream.");
      navigate("/", { replace: true });
    } else if (result?.message) {
      toast.error(result.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <PulseStreamLogo />
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Get started with PulseStream</p>

        {error && <p className="auth-error">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Full Name
            <input
              type="text"
              className={`auth-input ${
                fieldErrors.name ? "auth-input-invalid" : ""
              }`}
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("name");
              }}
              onBlur={() => handleBlur("name")}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className="auth-field-error">{fieldErrors.name}</span>
            )}
          </label>
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
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="auth-field-error">{fieldErrors.password}</span>
            )}
          </label>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
