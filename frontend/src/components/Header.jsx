// The React Router way is to use NavLink (it handles active detection) and/or useLocation() 
// for custom logic (e.g. mark the Shop parent active when on /product/:id or when ?category=...).
// src/components/Header.jsx
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";


import SearchBar from "./SearchBar.jsx"; // Import the SearchBar component
import "./Header.css";
import { useAuthContext } from "../auth/useAuthContext.jsx";

// small inline SVG icon helpers (easy to replace with images)
const Icon = {
  men: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="7" r="3.2" fill="#4a2707" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#a0522d" />
    </svg>
  ),
  women: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="7" r="3.2" fill="#4a2707" />
      <path d="M8 20c1-3 7-3 8 0" fill="#b06a3f" />
    </svg>
  ),
  kids: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="7" r="3.2" fill="#4a2707" />
      <path d="M6 20c0-2 4-4 6-4s6 2 6 4" fill="#c07b4c" />
    </svg>
  ),
  unisex: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="4" width="12" height="12" rx="3" fill="#4a2707" />
    </svg>
  ),
  bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2a4 4 0 00-4 4v1.2A6 6 0 006 15v2l-1 1h14l-1-1v-2a6 6 0 00-2-7.8V6a4 4 0 00-4-4z" fill="#4a2707"/>
    </svg>
  ),
};

export default function Header() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const { user } = useAuthContext(); //expects {auth} where auth.user exists when logged in 

  // Make "Shop" active for: /shop, /product/:id, ?category=..., ?bestseller=true
  const shopActive =
    pathname.startsWith("/shop") ||
    pathname.startsWith("/product") ||
    params.has("category") ||
    params.has("bestseller");
  
  // Cart count state and effect to listen for cart changes in this window and update count on the badge
  //on all pages on (Header.jsx)
  const [cartCount, setCartCount] = useState(0);

  const updateCartCountFromStorage = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    setCartCount(count);
  };

  useEffect(() => {
    updateCartCountFromStorage(); // initial load

    // listen for our custom event
    const handler = () => updateCartCountFromStorage();
    window.addEventListener("cartChanged", handler);

    return () => window.removeEventListener("cartChanged", handler);
  }, []);

  //mobile menu toggles
  const [mobileOpen, setMobileOpen] = useState(false); // state for mobile menu

  //notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  //language & currency
  const [lang, setLang] = useState("EN");
  const [currency, setCurrency] = useState("KES");

  //dark mode toggle
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  // visual mega menu state
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef(null);

  // close mega on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!megaRef.current) return;
      if (!megaRef.current.contains(e.target)) setMegaOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // categories for mega menu
  const categories = [
    { key: "men", title: "Men", hint: "Classic & modern sandals", Icon: Icon.men },
    { key: "women", title: "Women", hint: "Handmade leather styles", Icon: Icon.women },
    { key: "kids", title: "Kids", hint: "Comfort & durability", Icon: Icon.kids },
    { key: "unisex", title: "Unisex", hint: "Minimal & versatile", Icon: Icon.unisex },
  ];

  return (
    <header className={`header-main ${dark ? "dark-mode" : ""}`}>
      {/* Top Strip */}
      <div className="top-strip">
        <div className="container">
          <div className="top-left">✨ Free shipping over KES 10,000 • Local handcrafted in Kenya</div>
          <div className="top-right">
            <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Choose language">
              <option value="EN">EN</option>
              <option value="SW">SW</option>
            </select>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Choose currency">
              <option value="KES">KES</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="header-main-sticky">
        <div className="container header-inner">
          <div className="left">
            <button className="mobile-toggle" onClick={() => setMobileOpen((s) => !s)} aria-label="Open menu">
              <span className="hamburger" />
            </button>

            <NavLink to="/" className="brand" aria-label="Maasai Sandals home">
              <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="6" width="18" height="12" rx="3" fill="#4a2707" />
              </svg>
              <span className="brand-text">Lake City Creative Arts</span>
            </NavLink>
          </div>

          <div className="center">
            <nav className={`main-nav ${mobileOpen ? "open" : ""}`}>
              <ul>
                <li>
                  <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
                </li>

                <li>
                  <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>About</NavLink>
                </li>

                <li
                  className={`mega ${shopActive ? "active" : ""}`}
                  onMouseEnter={() => setMegaOpen(true)}
                  onMouseLeave={() => setMegaOpen(false)}
                  ref={megaRef}
                >
                  <NavLink to="/shop" className={({ isActive }) => (isActive ? "active" : "")}>
                    Shop <span className="caret">▾</span>
                  </NavLink>

                  {/* Visual mega menu */}
                  {megaOpen && (
                    <div className="mega-panel" role="menu" aria-label="Shop categories">
                      <div className="mega-grid">
                        {categories.map((c) => (
                          <Link key={c.key} to={`/shop?category=${c.key}`} className="mega-item" role="menuitem">
                            <div className="icon-wrap"><c.Icon /></div>
                            <div className="meta">
                              <div className="title">{c.title}</div>
                              <div className="hint">{c.hint}</div>
                            </div>
                          </Link>
                        ))}

                        {/* Promo / spotlight card */}
                        <div className="mega-spot">
                          <div className="spot-title">New: Maasai Leather Collection</div>
                          <div className="spot-desc">Limited runs — handcrafted in small batches.</div>
                          <Link to="/shop?collection=maasai-leather" className="spot-cta">Shop Collection</Link>
                        </div>
                      </div>
                    </div>
                  )}
                </li>

                <li><NavLink to="/blog" className={({ isActive }) => (isActive ? "active" : "")}>Blog</NavLink></li>
                <li><NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>Contact</NavLink></li>
              </ul>
            </nav>
          </div>

          <div className="right">
            <div className="search-wrap">
              <SearchBar placeholder="Search sandals, straps, sizes..." />
            </div>

            <div className="icons">
              {/* Notification bell */}
              <div className="icon-btn notif" onClick={() => setNotifOpen((s) => !s)} aria-haspopup="true">
                <span className="bell">{Icon.bell()}</span>
                <span className="notif-dot" />
                {notifOpen && (
                  <div className="notif-panel" role="dialog" aria-label="Notifications">
                    <div className="notif-header">Notifications</div>
                    <div className="notif-list">
                      <div className="notif-item">🎉 10% off selected sandals - today only</div>
                      <div className="notif-item">🚚 Order #123 shipped</div>
                    </div>
                    <div className="notif-footer"><Link to="/notifications">View all</Link></div>
                  </div>
                )}
              </div>

              {/* Dark/Light */}
              <button className="icon-btn small" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
                {dark ? "🌙" : "☀️"}
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                ❤️
              </Link>

              {/* Account — show only when logged in */}
              {user ? (
                <Link to="/account" className="icon-btn account" aria-label="Account">
                  <span className="icon">👤</span>
                  <span className="avatar">{user.firstName ? user.firstName[0].toUpperCase() : "U"}</span>
                </Link>
              ) : (
                <NavLink to="/login" className="signin">
      
                  <span className="label">Sign In</span>
                </NavLink>
              )}

              {/* Cart */}
              <Link to="/cart" className="icon-btn cart" aria-label="Cart">
                <span className="bag">🛍️</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
  
}

// NavLink automatically applies isActive. We use className={({ isActive }) => isActive ? "active" : ""} 
// so your existing .active CSS works.
// end on the Home NavLink ensures / is exact (not active on /shop).
// shopActive uses useLocation() + URLSearchParams so the Shop parent li gets
//  .active when child routes or query params are present (this matches UX expectations).