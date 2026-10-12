"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, FileText, PhoneCall, Mail, Sparkles, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-ivory-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href="/"
            className="text-crimson hover:text-burgundy font-medium flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Return to Boutique</span>
          </Link>
          <span className="text-[11px] uppercase tracking-[0.2em] text-gold font-semibold">
            Trust & Security
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 bg-[#2B0B14] text-ivory border-2 border-gold/40 py-12 px-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] uppercase tracking-[0.25em] text-[#E5C378] font-bold">
            <ShieldCheck className="w-3 h-3 text-[#E5C378]" />
            <span>Data Protection & Client Confidentiality</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-white uppercase tracking-wider font-normal">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-ivory-300 max-w-xl mx-auto leading-relaxed">
            Kaavu Styles is dedicated to safeguarding your privacy with the highest degree of discretion, security, and integrity.
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold pt-2">
            Last Updated: October 2026 • Kaavu Styles Control Center
          </p>
        </div>

        {/* Privacy Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-ivory-300 p-5 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-ink uppercase">Bank-Grade Encryption</h3>
            <p className="text-xs text-ink-muted">
              All transactions encrypted via 256-bit SSL and PCI-DSS Level 1 certified Razorpay gateway.
            </p>
          </div>

          <div className="bg-white border border-ivory-300 p-5 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-crimson/10 flex items-center justify-center text-crimson">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-ink uppercase">Zero Data Monetization</h3>
            <p className="text-xs text-ink-muted">
              We never sell, trade, or distribute your personal details to third-party advertising companies.
            </p>
          </div>

          <div className="bg-white border border-ivory-300 p-5 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700/10 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-ink uppercase">Verified Dispatch</h3>
            <p className="text-xs text-ink-muted">
              Client records are used solely to fulfill handcrafted orders and provide real-time tracking updates.
            </p>
          </div>
        </div>

        {/* Detailed Privacy Content */}
        <div className="bg-white border border-ivory-300 p-6 sm:p-10 space-y-8 shadow-sm text-xs text-ink leading-relaxed font-sans">
          
          {/* SECTION 1 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Information We Collect
              </h3>
            </div>
            <p className="text-ink-muted">
              To deliver bespoke ethnic couture and seamless concierge services, we gather necessary client details at the time of purchase or registration:
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-muted pl-2">
              <li>
                <strong className="text-ink">Contact & Shipping Details:</strong> Full name, delivery shipping address, billing address, phone/WhatsApp number, and email address.
              </li>
              <li>
                <strong className="text-ink">Payment & Transaction Records:</strong> Razorpay payment ID, order amount, and transaction timestamp. <em className="text-ink">Note: Kaavu Styles never stores or accesses your complete debit/credit card numbers, CVV codes, net banking passwords, or UPI PINs. All payment credential handling is performed directly by the certified payment gateway.</em>
              </li>
              <li>
                <strong className="text-ink">Technical & Browsing Data:</strong> Internet Protocol (IP) address, device browser type, operating system, and session tokens to preserve shopping bag items across visits.
              </li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                How We Use Your Information
              </h3>
            </div>
            <p className="text-ink-muted">
              Your personal data is used solely for the following legitimate purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li>Fulfilling, cutting, packaging, and dispatching your handcrafted garment orders.</li>
              <li>Generating official computer-generated GST tax invoices.</li>
              <li>Transmitting order confirmation SMS, WhatsApp notifications, and express courier tracking codes.</li>
              <li>Providing dedicated boutique concierge assistance regarding size charts, styling consultations, and delivery coordination.</li>
              <li>Complying with statutory taxation, accounting, and anti-fraud verification requirements.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Strict Order Records & No Return/No Replacement Policy Alignment
              </h3>
            </div>
            <p className="text-ink-muted">
              In strict accordance with our <strong className="text-ink">Strict No Return, No Replacement, and No Exchange Policy</strong>, once an order is dispatched and delivered, customer order records and photographic inspection archives are permanently retained in our audit log for verification and warranty against false chargebacks or unverified claims.
            </p>
            <p className="text-ink-muted">
              Because all purchases of our handcrafted luxury ethnic wear are final, order records cannot be altered or reverted once processed.
            </p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                4
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Third-Party Disclosures & Logistics Partners
              </h3>
            </div>
            <p className="text-ink-muted">
              We uphold strict client confidentiality. Your information is never sold, leased, or rented to any third parties. We share only necessary information with verified operational partners:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li>
                <strong className="text-ink">Courier & Logistics Providers:</strong> Recipient name, destination address, and contact telephone number are provided to trusted shipping partners (e.g. BlueDart, Delhivery, DTDC, India Post) solely for physical order transit.
              </li>
              <li>
                <strong className="text-ink">Payment Gateway:</strong> Transaction amounts and billing names are shared with Razorpay for payment verification and settlement.
              </li>
              <li>
                <strong className="text-ink">Legal Requirements:</strong> Disclosures made only if required by valid court order, government authority, or law enforcement agency in accordance with Indian law.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                5
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Data Security & Infrastructure
              </h3>
            </div>
            <p className="text-ink-muted">
              Kaavu Styles employs robust administrative, technical, and physical safeguards:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li>All web traffic between your browser and our servers is secured via HTTPS with TLS 1.3 encryption.</li>
              <li>Client database records are hosted on secure Supabase cloud infrastructure with automated backups and role-based access restrictions.</li>
              <li>Internal admin access is restricted strictly to authorized boutique staff with multi-factor authentication.</li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                6
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Cookies & Local Storage
              </h3>
            </div>
            <p className="text-ink-muted">
              We utilize essential browser cookies and local storage tokens to provide a responsive, seamless boutique experience:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li>Remembering items placed in your shopping bag and wishlist between visits.</li>
              <li>Maintaining your authenticated client session.</li>
              <li>You may disable non-essential cookies via your web browser settings; however, doing so may affect checkout features.</li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-gold text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                7
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Client Rights & Grievance Officer
              </h3>
            </div>
            <p className="text-ink-muted">
              In accordance with the Information Technology Act, 2000 and associated privacy rules, you have the right to request access to or correction of your personal data stored with us.
            </p>
            <div className="p-4 bg-ivory-100 border border-ivory-300 rounded space-y-2 text-ink-muted">
              <p className="font-semibold text-ink uppercase text-[11px] tracking-wider">
                Official Grievance Officer Contact:
              </p>
              <p>Kaavu Styles Legal & Privacy Officer</p>
              <p>Email: <strong className="text-crimson font-medium">Kaavustyles@gmail.com</strong></p>
              <p>Phone: <strong className="text-ink font-medium">+91 98765 43210</strong></p>
              <p>Flagship Atelier: Bengaluru, Karnataka & Jubilee Hills, Hyderabad, India</p>
            </div>
          </section>

          {/* Footer Back Links */}
          <div className="pt-6 border-t border-ivory-300 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-crimson font-medium hover:underline flex items-center">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back to Home</span>
              </Link>
              <span className="text-ivory-300">|</span>
              <Link href="/terms" className="text-ink-muted hover:text-gold transition-colors font-medium">
                View Terms of Service →
              </Link>
            </div>
            <span className="text-[10px] uppercase text-gold tracking-widest font-mono">
              © {new Date().getFullYear()} Kaavu Styles Atelier
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
