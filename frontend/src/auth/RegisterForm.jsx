// src/auth/RegisterForm.jsx
// Full validation (names, email, password strength, confirm password)
// Calls backend /api/auth/signup
// Updates auth context (setAuth) & prepares for email verification flow
// Redirects to /verify-email after signup
// Loading + disabled button states

import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./RegisterForm.css";
//import { useAuthContext } from "./useAuthContext.jsx";

export default function RegisterForm() {
  const navigate = useNavigate();
  //const { setAuth } = useAuthContext();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false, //use acceptedTerms to match backend
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  
  const [loading, setLoading] = useState(false);

  // Shake animation state for invalid fields
  const [shakeFields, setShakeFields] = useState({});

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for scrolling/focusing to invalid fields
  const inputRefs = {
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
  };

  // Validate a single field
  const validateField = (name, value) => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required";
        return null;
      case "lastName":
        if (!value.trim()) return "Last name is required";
        return null;
      case "email":
        if (!value) return "Email is required";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) 
          ///^\S+@\S+\.\S+$/
          return "Enter a valid email address";
        return null;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) 
          return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value))
          return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(value)) 
          return "Password must contain at least one number";
        if (!/[!@#$%^&*]/.test(value))
          return "Password must contain at least one special character";
        return null;
      case "confirmPassword":
        if (value !== formData.password)
          return "Passwords do not match";
        return null;
      case "acceptedTerms":
        if (!value) 
          return "You must accept Terms & Conditions";
        return null;
      default:
        return null;
    }
  };
  // Validate all fields/whole form at once on submit
  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    return newErrors;
  };

  //Handle input changes (live validation)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // live validate current single field being changed
    const error = validateField(name, fieldValue);
    setErrors((prev) => ({ ...prev, [name]: error }));

    setServerError("");

    // clear the error for the field being typed in
    // setErrors((prevErrors) => {
    //   const { [name]: _, ...rest } = prevErrors;
    //   return rest;
    // });
  };


  const focusAndScroll = (fieldName) => {
    const el = inputRefs[fieldName]?.current;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({
        behavior: "smooth", 
        block: "center"
      });
      el.focus({preventScroll: true});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validateAll();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      //trigger shake animation for invalid fields
      const shakeMap = {};
      Object.keys(validationErrors).forEach((field) => {
        shakeMap[field] = true;
      });
      setShakeFields(shakeMap);

      // Clear shake class after animation duration (e.g., 500ms)
      setTimeout(() => setShakeFields({}), 500);


      // scroll + focus to first invalid field
      const firstErrorField = Object.keys(validationErrors)[0];
      focusAndScroll(firstErrorField);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
       // Map to payload expected by backend - ensure acceptedTerms key matches backend
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        acceptedTerms: formData.acceptedTerms,
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        //The current backend does not return tokenyet, rediretc to email verification
        // Store auth if backend returns token/(optional — depends on backend returning token immediately or after verify)
        // if (data.token && data.user) {
        //   setAuth({ token: data.token, user: data.user });
        // }
        // Redirect user to verify email
      //   navigate("/verify-email", { state: { email: payload.email } });
      // } else {
      //   setServerError(data.message || "Registration failed. Please try again.");
      // }
      // Store email for potential resend verification
        localStorage.setItem("pendingEmail", formData.email);
        navigate("/verify-email");
      } else {
        setServerError(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setServerError("Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  //Dynamic input class based on validation
  /**Force re-trigger animation when errors appear:
  Browsers don’t re-run CSS animations if the class is already applied.
  To handle this, tweak your getInputClass function to append a shake flag 
  whenever there’s a fresh validation error: **/
  const getInputClass = (name) => {
    let base = "";
    if (touched[name]) {
      if (errors[name]){
        base = "error"; 
        // Force re-trigger animation
        if (shakeFields[name]) base += " shake"; //optional extra shake class
      } else {
        base = "success";
      }
    }
    return base;
    
  };

  return (
    <>
      <Header />
      <h1 className="register-title">Lake City Creatives</h1>

      <div className="register-container">
        {/* Left Section */}
        <div className="signup-left">
          {/* <div className="signup-overlay">
           
          </div> */}
        </div>

        {/* Right Section */}
        <div className="signup-right">
          <h2>Sign Up</h2>
          <span style={{ color: "gray", textAlign: "center" }}>
            <i>It's quick and easy!</i>
          </span>

          {serverError && (
            <div className="error-text" role="alert" aria-live="assertive">
              {serverError}
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit} noValidate>
            {/* First Name */}
            <div className="form-group">
              <input
                ref={inputRefs.firstName}
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                disabled={loading}
                required
                className={getInputClass("firstName")}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
              />
              {errors.firstName && (
                <span id="firstName-error" className="error-text">
                  {errors.firstName}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="form-group">
              <input
                ref={inputRefs.lastName}
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                disabled={loading}
                required
                className={getInputClass("lastName")}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
              />
              {errors.lastName && (
                <span id="lastName-error" className="error-text">
                  {errors.lastName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <input
                ref={inputRefs.email}
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className={getInputClass("email")}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className="error-text">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group has-icon" style={{ position: "relative" }}>
              <input
                ref={inputRefs.password}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className={getInputClass("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                // onClick={() => setShowPassword((prev) => !prev)}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  aria-hidden="true"
                />
              </button>
              {errors.password && (
                <span id="password-error" className="error-text">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group has-icon" style={{ position: "relative" }}>
              <input
                ref={inputRefs.confirmPassword}
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
                className={getInputClass("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              <button
                type="button"
                className="password-toggle"
                //onClick={() => setShowConfirmPassword((prev) => !prev)}
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <i
                  className={`fa ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
                  aria-hidden="true"
                />
              </button>
              {errors.confirmPassword && (
                <span id="confirmPassword-error" className="error-text">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms */}
            <label className="acceptedTerms">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={handleChange}
                disabled={loading}
                aria-invalid={!!errors.acceptedTerms}
              />
              Accept Terms & Conditions
            </label>
            {errors.acceptedTerms && <span className="error-text">{errors.acceptedTerms}</span>}

            {/* Submit ...when Join Us button is clicked, it runs handleSubmit.
            If validation passes, submits form->your code send a request to /api/auth/signup
            (backend endpoint for creating an account*/}
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Signing up..." : "Join us →"}
            </button>

            <div className="divider">or</div>

            {/* Social buttons */}
            <button type="button" className="btn google" disabled={loading}>
              <i className="fa fa-google" aria-hidden="true"></i> Sign up with Google
            </button>

            <button type="button" className="btn facebook" disabled={loading}>
              <i className="fa fa-facebook" aria-hidden="true"></i> Sign up with Facebook
            </button>

            <button type="button" className="btn apple" disabled={loading}>
              <i className="fa fa-apple" aria-hidden="true"></i> Sign up with Apple
            </button>
          </form>

          <p className="signup-prompt">
            Already have an account?{" "}
            <Link to="/login" className="loginhere-link">
              Login Here →
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
