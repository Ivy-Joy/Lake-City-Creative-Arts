// src/pages/HomePage.jsx

import MainLayout from "../layouts/MainLayout"; // or use Header/Footer directly
import Hero from "../components/Hero";
import Features from "../components/Features";
import Categories from "../components/Categories";
import BestSellers from "../components/BestSellers";
//import NewsLetter from "../components/NewsLetter";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <MainLayout>
      <Hero
        title={
          <>
            Welcome to Lake City<br />
            Creatives Arts
          </>
        }
        subtitle="Your one-stop destination for unique and handcrafted art pieces."
        showButton={true}
      />
      <Features />
      <Categories />
      <BestSellers />
      <section id="banner" className="section-m1">
        <h4>We Offer Repair Services</h4>
        <h2>Upto <span>60% Off</span> - of All Maasai Sandals</h2>
        <Link to='/blog/payments'>
          <button className="normal">Explore More</button>
        </Link>
      </section>
      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
