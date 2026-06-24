import React from "react";
import {
  Car,
  DollarSign,
  Plane,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";

export default function DriverRecruitmentLanding() {
  const whatsappLink =
    "https://wa.me/263781052424?text=Hello%20I%20would%20like%20to%20apply%20as%20an%20SUV%20driver%20for%20your%20airport%20transport%20service.";

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero">
        <div className="overlay" />

        <div className="container">
          <div className="logo">
            <img src="/logo512.png" alt="Company Logo" />
          </div>
          <span className="badge">Kuvo Rides - Premium Airport Transport</span>

          <h1>
            Turn Your SUV Into a<span>Reliable Income Stream</span>
          </h1>

          <p>
            Join our premium airport transfer network and earn money with your
            SUV while helping families, business travelers, and passengers with
            luggage.
          </p>

          <div className="cta">
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              Apply To Become A Driver <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mission" id="mission">
        <h2>Our Mission</h2>
        <p>
          We provide reliable transport to and from the airport, helping large
          families and passengers with luggage travel comfortably and safely.
        </p>
        <p>
          We also help SUV owners turn their vehicles into consistent income
          sources.
        </p>
      </section>

      {/* Benefits */}
      <section className="benefits">
        {[
          {
            icon: DollarSign,
            title: "Earn More",
            text: "Use your SUV to generate income.",
          },
          {
            icon: Plane,
            title: "Airport Demand",
            text: "Constant airport trips available.",
          },
          {
            icon: Users,
            title: "Large Groups",
            text: "Serve families and groups.",
          },
          {
            icon: Briefcase,
            title: "Premium Clients",
            text: "Business and travel customers.",
          },
        ].map((item) => (
          <div key={item.title} className="card">
            <item.icon />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      {/* Requirements */}
      <section className="requirements">
        <Car className="icon" />

        <h2>Driver Requirements</h2>

        <div className="grid">
          <div>Own a clean SUV</div>
          <div>Valid driver’s licence</div>
          <div>Professional attitude</div>
          <div>Good customer service</div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <h2>Ready To Start Earning?</h2>

        <div className="cta">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            Apply on Whatsapp <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </div>
  );
}
