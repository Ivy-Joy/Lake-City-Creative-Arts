import { useState } from "react";

export default function NewsLetter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  function submitEmail(e) {
    e?.preventDefault();
    if (!email) return setMsg("Please enter an email.");
    // TODO: integrate with API
    setMsg("Thanks — we'll email you soon!");
    setEmail("");
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <section id="newsletter" className="newsletter">
      <div className="newsletter-content">
        <h4>Stay in the Loop</h4>
        <p>
          Get updates on new arrivals, exclusive offers, and more.
        </p>

        <form className="newsletter-form" onSubmit={submitEmail}>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            required
          />
          <button type="submit">Sign Up</button>
        </form>

        {msg && <p className="newsletter-msg">{msg}</p>}
      </div>
    </section>
  );
}
