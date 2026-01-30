import React, { useEffect, useState } from "react";
import "./Footer.css";

/**
 * High-end Footer component for Maasai Sandals
 * - Newsletter subscribe (POST /api/newsletter/subscribe)
 * - Responsive columns, contact, social links, payment badges
 * - Back-to-top button
 * - Accessible labels + aria-live for messages
 *
 * Usage: <Footer />
 */

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [msg, setMsg] = useState("");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 320);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!validateEmail(email)) {
      setStatus("error");
      setMsg("Enter a valid email address.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (res.ok) {
        setStatus("success");
        setMsg("Thanks — check your inbox for a confirmation!");
        setEmail("");
      } else {
        const d = await res.json().catch(() => ({}));
        setStatus("error");
        setMsg(d.message || "Subscription failed. Try again later.");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      setStatus("error");
      setMsg("Network error. Please try again.");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="site-footer" role="contentinfo" aria-labelledby="footer-heading">
      <div className="footer-inner container">
        {/* Newsletter + Trust */}
        <div className="footer-top">
          <section className="newsletter" aria-labelledby="newsletter-title">
            <h3 id="newsletter-title">Join the Maasai Sandals community</h3>
            <p className="muted">Get early access to new drops, artisan stories & exclusive offers.</p>

            <form className="subscribe-form" onSubmit={handleSubscribe} noValidate>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "subscribe-msg" : undefined}
                disabled={status === "loading"}
              />
              <button type="submit" className="btn-primary" disabled={status === "loading"}>
                {status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>

            <p id="subscribe-msg" className={`subscribe-msg ${status}`} aria-live="polite">
              {msg}
            </p>
          </section>

          <aside className="trust">
            <div className="trust-item">
              <svg className="trust-svg" viewBox="0 0 24 24" aria-hidden focusable="false">
                <path fill="currentColor" d="M12 1 3 5v6c0 5 3.7 9.7 9 11 5.3-1.3 9-6 9-11V5l-9-4z" />
              </svg>
              <div>
                <div className="trust-title">Secure payments</div>
                <div className="muted">SSL & trusted providers</div>
              </div>
            </div>

            <div className="trust-item">
              <svg className="trust-svg" viewBox="0 0 24 24" aria-hidden focusable="false">
                <path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v8m4-4H8" />
              </svg>
              <div>
                <div className="trust-title">Handmade quality</div>
                <div className="muted">Crafted by Maasai artisans</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Links Grid */}
        <nav className="footer-grid" aria-label="Footer navigation">
          <div className="col">
            <h4>Shop</h4>
            <ul>
              <li><a href="/shop?category=men">Men</a></li>
              <li><a href="/shop?category=women">Women</a></li>
              <li><a href="/shop?category=kids">Kids</a></li>
              <li><a href="/shop?category=unisex">Unisex</a></li>
              <li><a href="/shop?collection=best-sellers">Best Sellers</a></li>
            </ul>
          </div>

          <div className="col">
            <h4>Customer</h4>
            <ul>
              <li><a href="/shipping">Shipping & Delivery</a></li>
              <li><a href="/returns">Returns & Exchanges</a></li>
              <li><a href="/faq">FAQ</a></li>
              <li><a href="/contact">Contact Support</a></li>
            </ul>
          </div>

          <div className="col">
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press</a></li>
              <li><a href="/sustainability">Sustainability</a></li>
            </ul>
          </div>

          <div className="col contact">
            <h4>Contact</h4>
            <address>
              <div>Lake City Creative Arts Ltd.</div>
              <div>Kisumu Near Airport, Kisumu, Kenya</div>
              <div><a href="tel:+254700000000">+254 700 000 000</a></div>
              <div><a href="mailto:hello@lakecitycreativearts.co">hello@lakecitycreativearts.co</a></div>
            </address>

            <div className="social">
              <a className="social-link" href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 12A10 10 0 1012 22V14h-2v-2h2v-1.3C12 8.1 13.1 7 14.9 7h1.6v2h-1c-.6 0-1 .5-1 1.1V12h2.1l-.3 2H15v8A10 10 0 0022 12z"/></svg></a>
              <a className="social-link" href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 4.5A4.5 4.5 0 1016.5 11 4.5 4.5 0 0012 6.5zM18.5 6a1.2 1.2 0 11-1.2-1.2A1.2 1.2 0 0118.5 6z"/></svg></a>
              <a className="social-link" href="#" aria-label="Twitter"><svg viewBox="0 0 24 24"><path fill="currentColor"d="M22 5.9a8.2 8.2 0 01-2.4.7 4.2 4.2 0 001.8-2.3 8.4 8.4 0 01-2.7 1.1 4.2 4.2 0 00-7.2 3.8 11.9 11.9 0 01-8.6-4.4 4.2 4.2 0 001.3 5.6 4 4 0 01-1.9-.5v.05a4.2 4.2 0 003.4 4.1c-.9.3-1.9.4-2.9.1a4.3 4.3 0 003.9 3 8.5 8.5 0 01-5.2 1.8c-.3 0-.6 0-.9-.05A12 12 0 008 21c7.2 0 11.1-6 11.1-11.1v-.5A7.9 7.9 0 0022 5.9z"/></svg></a>
            </div>
          </div>
        </nav>

        {/* bottom area */}
        <div className="footer-bottom">
          {/* bottom area */}
<div className="footer-bottom">
  <div className="payments" aria-hidden>
    {/* Visa */}
    <svg className="pay pay-visa" viewBox="0 0 36 24" role="img" aria-hidden="false" focusable="false">
      <title>Visa</title>
      <rect rx="4" width="36" height="18" fill="#fff" />
      <g transform="translate(3,4)" fill="#1A1F71" fontWeight="700" fontSize="9">
        <text x="2" y="10">VISA</text>
      </g>
    </svg>

    {/* Mastercard */}
    <svg className="pay pay-mastercard" viewBox="0 0 36 24" role="img" aria-hidden="false" focusable="false">
      <title>Mastercard</title>
      <rect rx="4" width="36" height="18" fill="#fff" />
      <g transform="translate(6,3)">
        <circle cx="7" cy="8" r="6" fill="#EB001B" />
        <circle cx="15" cy="8" r="6" fill="#F79E1B" />
      </g>
    </svg>

    {/* M-Pesa */}
    <svg className="pay pay-mpesa" viewBox="0 0 36 24" role="img" aria-hidden="false" focusable="false">
      <title>M-Pesa</title>
      <rect rx="4" width="36" height="18" fill="#fff" />
      <g transform="translate(4,4)">
        <rect width="28" height="10" rx="2" fill="#0AA74F" />
        <text x="14" y="8" fill="#fff" fontWeight="700" fontSize="8" textAnchor="middle">M-PESA</text>
      </g>
    </svg>
  </div>

  <div className="copyright">
    <small>© {new Date().getFullYear()} Lake City Creative Arts Ltd. All rights reserved.</small>
    <nav aria-label="Legal">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/cookies">Cookies</a>
    </nav>
  </div>
</div>


          <div className="copyright">
            <small>© {new Date().getFullYear()} Lake City Creative Arts Ltd. All rights reserved.</small>
            <nav aria-label="Legal">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/cookies">Cookies</a>
            </nav>
          </div>
        </div>
      </div>

      <button
        className={`back-to-top ${showTop ? "visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        ↑
      </button>
    </footer>
  );
}
