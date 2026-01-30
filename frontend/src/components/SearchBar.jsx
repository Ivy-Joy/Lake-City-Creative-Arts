// SearchBar.jsx
import React, { useEffect, useRef, useState } from "react";
import "./SearchBar.css";

/**
 * SearchBar with:
 * - debounce
 * - suggestions dropdown (keyboard nav)
 * - expects backend /api/search?q=<term> which returns array of {id, title, subtitle}
 * If you don't have a backend yet, mock by returning static suggestions when q length > 1
 */

export default function SearchBar({ placeholder = "Search...", onSelect }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const controllerRef = useRef(null);
  const inputRef = useRef();

  // debounce helper
  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const id = setTimeout(async () => {
      // cancel previous
      if (controllerRef.current) controllerRef.current.abort?.();
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/search?q=${encodeURIComponent(q)}`;
      try {
        // You can replace fetch with your search endpoint; below we try fetch but fallback to mock
        const res = await fetch(url).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 8));
        } else {
          // Mock suggestions if backend unavailable
          setSuggestions([
            { id: "m1", title: `${q} braided leather sandals`, subtitle: "Men - size 42" },
            { id: "w1", title: `${q} plain sandals`, subtitle: "Women - size 38" },
            { id: "u1", title: `${q} kids sandals`, subtitle: "Kids - size 28" },
          ]);
        }
        setOpen(true);
        setActive(-1);
      } catch (err) {
        console.error("search err", err);
      }
    }, 260);

    return () => clearTimeout(id);
  }, [q]);

  // keyboard nav
  const onKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && suggestions[active]) {
        select(suggestions[active]);
      } else if (q.trim()) {
        // navigate to search results page (implement route)
        window.location.href = `/shop?search=${encodeURIComponent(q)}`;
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const select = (item) => {
    setQ("");
    setOpen(false);
    if (onSelect) onSelect(item);
    // navigate to product or search page
    window.location.href = `/product/${item.id}`;
  };

  return (
    <div className="searchbar" onKeyDown={onKey}>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        onFocus={() => q.length >= 2 && setOpen(true)}
      />
      <button type="button" onClick={() => { if (q.trim()) window.location.href = `/shop?search=${encodeURIComponent(q)}`; }}>
        <i className="fa fa-search" aria-hidden />
      </button>

      {open && suggestions.length > 0 && (
        <ul className="suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
            >
              <div className="s-title">{s.title}</div>
              <div className="s-sub">{s.subtitle}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
