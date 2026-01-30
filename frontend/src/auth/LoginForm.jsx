// src/auth/LoginForm.jsx
// Inline field-level validation + field focus
// Error/success feedback/messages (aria)
// Secure login flow using your useAuthContext().setAuth({token, user})
//Supports backend-set refresh cookie (credentials: "include" )
// Redirect after successful login back to `from` location  (or "/" by default)
//Shows `?verified=true` message if present after email verification
// Disabled button on submit to prevent double clicks
// Accessible form markup
import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuthContext } from "./useAuthContext.jsx";
import "./LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthContext();

  //redirect target (where user was trying to go)
  const from = location.state?.from?.pathname || "/"; // redirect after login

  //show verification success message if redirected after verifying email
  const urlParams = new URLSearchParams(location.search);
  const verifiedSuccess = urlParams.get("verified") === "true";

  // Form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  //refs for focusing on first invalid input
  const emailRef = useRef();
  const passwordRef = useRef();

  useEffect (() => {
    if (verifiedSuccess) {
      //small UX delay so user sees the message
      const t = setTimeout (() => {
        //optionally focus email input so user can login
        emailRef.current?.focus();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [verifiedSuccess]);

  // Validate rules (field-level) ....e stands for newErrors
  const validate = () => {
    const e = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email))
      e.email = "Enter a valid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8)
      e.password = "Password must be at least 8 characters";

    return e;
  };

  //handle input change (clears field error on type)
  // const handleChange = (e) =>
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleChange = (ev) => {
    const { name, value } = ev.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
    setServerError("");
  };

  // focus first invalid field helper
  const focusFirstError = (errObj) => {
    if (errObj.email) emailRef.current?.focus();
    else if (errObj.password) passwordRef.current?.focus();
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setServerError("");
  //   const validationErrors = validate();
  //   if (Object.keys(validationErrors).length > 0) {
  //     setErrors(validationErrors);
  //     return;
  //   }
  //   setErrors({});

    const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      focusFirstError(validation);
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // allow httpOnly cookie if backend uses it
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Save token + user
        //IMPORTANT: backend returns `accessToken` in your controller
        //We pass it into setAuth as `token` because useAuth expects {token, user}.
        //If your backend returns `token` instead, adjust accordingly.
        setAuth({ token: data.accessToken ?? data.token, user: data.user });

        //redirect to original page
        navigate(from, { replace: true }); 
      } else if (
        //handle common server responses
        data.message === "Email not verified") {
          navigate("/verify-email");
           //setServerError("Your email is not verified. Please check your inbox and verify first before logging in."); 
         } else {
          setServerError(data.message || "Login failed. Please try again.");
        }
       
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Unable to connect to server. Please try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="login-container">
        {/* Left Section visual */}
        <div className="loginsignup-left">
          <div className="signup-overlay">
            <h1>Welcome Back to Lake City Creative Arts</h1>
            <p>Login to continue your journey</p>
          </div>
        </div>

        {/* Right Section form*/}
        <div className="signup-right">
          <h2>Login</h2>

          {verifiedSuccess && (
            <div className="success-text" role="status" aria-live="polite">
              Email verified successfully. Please login.
            </div>
          )}
          {serverError && (
            <div className="error-text" role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <input
                ref={emailRef}
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                required
                className={errors.email ? "error" : ""}
              />
              {errors.email && (
                <span id="email-error" className="error-text">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group has-icon" style={{position: "relative"}}>
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                required
                className={errors.password ? "error" : ""}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
              {errors.password && (
                <span id="password-error" className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login with Email →"}
            </button>
          </form>

          <div className="divider">or</div>

          <div className="social-login">
            <button type="button" className="btn google" disabled={loading}>
              <i className="fa fa-google" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn facebook" disabled={loading}>
              <i className="fa fa-facebook-square" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn apple" disabled={loading}>
              <i className="fa fa-apple" aria-hidden="true"></i>
            </button>
          </div>

          <Link to="/forgot-password" className="loginhere-link">
            Forgot password?
          </Link>
          <p className="signup-prompt">
            Don’t have an account?{" "}
            <Link to="/register" className="loginhere-link">
              Register Here →
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
