import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
//import NewsLetter from "../components/NewsLetter";

export default function AboutPage() {
  const milestones = [
    { year: 2023, title: "Founded", description: "Lake City Creatives Arts was born to support local artists and connect them with enthusiasts." },
    { year: 2024, title: "First Artisan Collaboration", description: "Partnered with 15 Maasai artisans to launch our first sandal collection." },
    { year: 2025, title: "Expanded Collections", description: "Expanded product line with kids and unisex sandals, and launched custom art pieces." },
  ];

  return (
    <MainLayout>
      {/* Hero header */}
      <section id="about-header">
        <h2>Get to Know Us...</h2>
        <p>Discover our journey, mission, and artisan collaborations.</p>
      </section>

      {/* About & Story */}
      <section id="about-head" className="section-p1 about-head">
        <img src="/img/picf.jpeg" alt="About Us" />
        <div className="about-content">
          <h1>Our Story</h1>
          <p>
            Lake City Creatives Arts is a vibrant community of artists and creators
            dedicated to bringing the beauty of art to life. We foster creativity,
            support local talent, and create products that tell a story.
          </p>

          <abbr title="Founded 2023">
            Since our foundation, we have grown into a hub for artists and enthusiasts alike.
          </abbr>

          {/* Milestones / Timeline */}
          <div className="timeline">
            {milestones.map((m, i) => (
              <div key={i} className="milestone">
                <div className="year">{m.year}</div>
                <div className="milestone-content">
                  <h4>{m.title}</h4>
                  <p>{m.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="browse-links">
            Want to browse our sandals? Try a category:{" "}
            <Link to="/shop?category=women">Women</Link> •{" "}
            <Link to="/shop?category=men">Men</Link> •{" "}
            <Link to="/shop?category=kids">Kids</Link>
          </p>
        </div>
      </section>

      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
