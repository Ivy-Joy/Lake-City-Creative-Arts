import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
//import NewsLetter from "../components/NewsLetter";
import products from "../data/products"; // your products.js converted to an array export

export default function ProductPage() {
  const { id } = useParams(); // from /product/:id route
  const product = products.find((p) => p.id.toString() === id);

  const [mainImg, setMainImg] = useState(product?.image || "");
  const [size, setSize] = useState("Select Size");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) setMainImg(product.image);
  }, [product]);

  const handleAddToCart = () => {
    if (size === "Select Size") {
      alert("Please select a size.");
      return;
    }
    if (quantity < 1) {
      alert("Please enter a valid quantity of 1 or more.");
      return;
    }

    const productToAdd = {
      id: product.id,
      image: product.image,
      name: product.name,
      price: product.price,
      quantity,
      size,
    };

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const index = cart.findIndex(
      (item) => item.id === productToAdd.id && item.size === productToAdd.size
    );

    if (index !== -1) {
      cart[index].quantity += quantity;
    } else {
      cart.push(productToAdd);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Dispatch cartChanged event to notify other parts of the app in this window to update the bagde count
    window.dispatchEvent(new CustomEvent("cartChanged", { detail: cart }));
    alert("Product added to cart!");
    window.location.href = "/cart"; // redirect to cart page
  };

  if (!product) {
    return (
      <MainLayout>
        <h2>Product Not Found</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section id="prodetails" className="section-p1">
        {/* Left: Images */}
        <div className="single-pro-image">
          <img src={mainImg} width="100%" alt={product.name} />
          <div className="small-img-group">
            {[...Array(4)].map((_, i) => (
              <div className="small-img-col" key={i}>
                <img
                  src={product.image}
                  width="100%"
                  alt="Thumb"
                  className="small-img"
                  onClick={() => setMainImg(product.image)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="single-pro-details">
          <h6>
            <Link to="/">Home</Link>
            <i className="fa fa-angle-right"></i>{" "}
            <Link to="/shop">Shop</Link>
            <i className="fa fa-angle-right"></i>{" "}
            <span>{product.category}</span>
          </h6>

          <h4>{product.name}</h4>
          <h2>Ksh {product.price}</h2>

          {/* Size Selector */}
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option>Select Size</option>
            {Array.from({ length: 24 }, (_, i) => 20 + i).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Quantity */}
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />

          <button className="normal" onClick={handleAddToCart}>
            Add To Cart
          </button>

          <h4>Product Details</h4>
          <span>{product.description}</span>
        </div>
      </section>

      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
