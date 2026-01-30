// src/pages/ShopPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.json";
//import NewsLetter from "../components/NewsLetter";

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || null;
  const bestseller = searchParams.get("bestseller") === "true";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [page, setPage] = useState(Number.isNaN(pageParam) ? 1 : pageParam);
  const PAGE_SIZE = 9;

  useEffect(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    setPage(Number.isNaN(p) ? 1 : p);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = Array.isArray(productsData) ? productsData : [];

    if (category) list = list.filter((p) => p.category === category);
    if (bestseller) list = list.filter((p) => p.bestseller);

    return list;
  }, [category, bestseller]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const goToPage = useCallback((n) => {
    const next = Math.max(1, Math.min(totalPages, n));
    setPage(next);

    const params = {};
    if (category) params.category = category;
    if (bestseller) params.bestseller = "true";
    if (next > 1) params.page = String(next);
    setSearchParams(params, { replace: false });
  }, [totalPages, category, bestseller, setSearchParams]);

    useEffect(() => {
    if (page > totalPages) {
      goToPage(totalPages);
    } else if (page < 1) {
      goToPage(1);
    }
  }, [page, totalPages, goToPage]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const heading = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)}`
    : bestseller
    ? "Best Sellers"
    : "All Products";

  console.log("Products loaded:", productsData);
  console.log("Page items:", pageItems);

  return (
    <MainLayout>
      <section id="page-header">
        <h2>Stay at Home, Save your Energy</h2>
        <p>Just Order Online.</p>
      </section>

      <section id="product1" className="section-p1">
        <h2 id="category-heading">{heading}</h2>

        <div className="pro-container" id="product-list">
          {pageItems.length === 0 ? (
            <div style={{ padding: 20 }}>
              <p>No products found.</p>
              {category ? (
                <p>
                  Try a different category or{" "}
                  <button onClick={() => setSearchParams({}, { replace: false })}>
                    View all
                  </button>
                  .
                </p>
              ) : null}
            </div>
          ) : (
            pageItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>

      {/* Pagination */}
      <section id="pagination" className="section-p1">
        <div className="page-btn" id="pagination-controls">
          <button
            className="normal"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            style={{ marginRight: 8 }}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={p === page ? "active" : ""}
                style={{ margin: "0 4px" }}
              >
                {p}
              </button>
            );
          })}

          <button
            className="normal"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            style={{ marginLeft: 8 }}
          >
            Next
          </button>
        </div>
      </section>

      {/*<NewsLetter />  fixed typo */}
    </MainLayout>
  );
}
