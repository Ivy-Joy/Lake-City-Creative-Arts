// src/pages/ContactPage.jsx
import MainLayout from "../layouts/MainLayout";
//import NewsLetter from "../components/NewsLetter";

export default function ContactPage() {
  return (
    <MainLayout>
      {/* Contact Header */}
      <section id="contact-header">
        <h2>Let's Talk...</h2>
        <p>Leave a Message. We love to hear from you!</p>
      </section>

      {/* Contact Details */}
      <section id="contact-details" className="section-p1">
        <div className="details">
          <span>GET IN TOUCH</span>
          <h2>Visit one of our physical locations or contact us today.</h2>
          <h3>Head Office</h3>
          <ul>
            <li>
              <i className="fa fa-map-marker" />
              <p>Riat, Opposite Kisumu Int. Airport</p>
            </li>
            <li>
              <i className="fa fa-phone-square" />
              <p>+254728000000</p>
            </li>
            <li>
              <i className="fa fa-envelope" />
              <p>www.lakecitycreativeart.co.ke</p>
            </li>
            <li>
              <i className="fa fa-calendar-o" />
              <p>Monday to Saturday: 9:00am to 6pm</p>
            </li>
          </ul>
        </div>

        {/* Google Map */}
        <div className="map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.8142417735157!2d34.72601667349411!3d-0.08192473549252478!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182aa5ac750c293d%3A0x229e6bdbae2184b6!2sKisumu%20International%20Airport!5e0!3m2!1sen!2ske!4v1753716587197!5m2!1sen!2ske"
            width="600"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Kisumu International Airport"
          ></iframe>
        </div>
      </section>

      {/* Contact Form */}
      <section id="form-details" className="section-p1">
        <form id="contact-form">
          <span>LEAVE A MESSAGE</span>
          <h2>We love to hear from you</h2>

          <span>Full Name</span>
          <input type="text" placeholder="Enter your name" required />

          <span>Email</span>
          <input type="email" placeholder="Enter your email" required />

          <span>Subject</span>
          <input type="text" placeholder="Enter subject" required />

          <span>Message</span>
          <textarea
            cols="30"
            rows="10"
            placeholder="Write your message here..."
            required
          ></textarea>

          <button className="normal">Send Message</button>
        </form>

        {/* People Section */}
        <div className="people">
          <div>
            <img src="/img/Male.png" alt="Founder" />
            <p>
              <span>Dom</span> Founder <br />
              Location: Kisumu, Kenya <br />
              Email: dom1@gmail.com
            </p>
          </div>
          <div>
            <img src="/img/pic1.jpeg" alt="Co-Founder" />
            <p>
              <span>Ivy Joy</span> Co-Founder <br />
              Location: Nairobi, Kenya <br />
              Email: ivyjoyweda@gmail.com
            </p>
          </div>
          <div>
            <img src="/img/pic2.jpeg" alt="Tech Expert" />
            <p>
              <span>Brea Swan</span> Tech Expert <br />
              Location: Nairobi, Kenya <br />
              Email: breesw1@gmail.com
            </p>
          </div>
        </div>
      </section>
      {/* <NewsLetter /> */}
    </MainLayout>
  );
}
