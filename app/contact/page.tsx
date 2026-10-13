"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Instagram } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: " Bengaluru Flagship",
    subject: "Bridal Inquiry",
    message: "",
  });

  const instagramLink = "https://www.instagram.com/kaavu_styles?stkn=MWR6eWVtamh2cGZyag==";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", location: " Bengaluru Flagship", subject: "Bridal Inquiry", message: "" });
    }, 4000);
  };

  return (
    <div className="w-full space-y-12 pb-12">
      {/* FULL-WIDTH HEADER BANNER (#2B0B14 BURGUNDY BACKGROUND - NO SIDE MARGINS) */}
      <div className="relative w-full text-center space-y-2.5 bg-[#2B0B14] border-y-2 border-gold/40 py-8 sm:py-10 px-4 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-[0.35em] text-[#E5C378] font-bold">
            Client Concierge
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-white uppercase font-light">
            Contact Kaavu Styless
          </h1>
          <p className="text-xs text-ivory-300 max-w-md mx-auto">
            Reach out to our boutique stylists in Bengaluru for bridal appointments, bespoke fitting, or online orders.
          </p>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-ivory-50 border border-ivory-300 p-8 space-y-6">
          <h2 className="font-serif text-2xl text-ink uppercase">Send A Message</h2>

          {submitted && (
            <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-4 border border-emerald-200 rounded">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Thank you for reaching out. Our client concierge will respond within 24 hours.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ananya Reddy"
                className="w-full border border-ivory-300 rounded bg-ivory p-3 text-xs text-ink outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ananya@example.com"
                  className="w-full border border-ivory-300 rounded bg-ivory p-3 text-xs text-ink outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-ivory-300 rounded bg-ivory p-3 text-xs text-ink outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted mb-1">
                Message
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Share your requirements or preferred appointment date..."
                className="w-full border border-ivory-300 rounded bg-ivory p-3 text-xs text-ink outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Message</span>
            </button>
          </form>
        </div>

        {/* Store Info & Locations */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="bg-ivory-200 border border-ivory-300 p-8 space-y-6">
            <h2 className="font-serif text-2xl text-ink uppercase"> Locations</h2>

            <div className="space-y-5 text-xs text-ink-muted">
              {/* Location 2: Bengaluru */}
              <div className="flex items-start space-x-3 border-b border-ivory-300 pb-4">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink text-sm">Bengaluru Boutique</p>
                  <p>Bengaluru, Karnataka, India</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">Email Concierge:</p>
                  <a href="mailto:Kaavustyles@gmail.com" className="text-crimson font-medium underline">
                    Kaavustyles@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <Instagram className="w-5 h-5 text-gold flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">Instagram Journal:</p>
                  <a href={instagramLink} target="_blank" rel="noreferrer" className="text-crimson font-medium underline">
                    @kaavu_styles
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-ink text-ivory p-8 border border-gold space-y-3">
            <h3 className="font-serif text-xl uppercase tracking-wider text-gold">
              Working Hours
            </h3>
            <div className="text-xs space-y-1 text-ivory/80">
              <p>Monday – Saturday: 10:30 AM – 8:30 PM</p>
              <p>Sunday: 11:30 AM – 7:00 PM</p>
              <p className="text-[11px] text-gold pt-2">Private VIP appointments available on request.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
