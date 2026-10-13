"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2, AlertOctagon, Mail } from "lucide-react";

export default function TermsOfServicePage() {
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
            Legal & Customer Policies
          </span>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 bg-[#2B0B14] text-ivory border-2 border-gold/40 py-12 px-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] uppercase tracking-[0.25em] text-[#E5C378] font-bold">
            <Sparkles className="w-3 h-3 text-[#E5C378]" />
            <span>Official Client Terms & Conditions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-white uppercase tracking-wider font-normal">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-ivory-300 max-w-xl mx-auto leading-relaxed">
            Terms governing purchases, bespoke tailoring, artisan ethnic drapes, designer kurtis, and boutique orders at Kaavu Styless.
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold pt-2">
            Effective Date: October 2026 • Kaavu Styless Flagship Atelier
          </p>
        </div>

        {/* PROMINENT POLICY HIGHLIGHT: STRICT NO RETURN & NO REPLACEMENT */}
        <div className="bg-[#5E1A2D] text-ivory border-2 border-[#E5C378] p-6 sm:p-8 shadow-lg space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-black/30 rounded border border-gold/40 flex-shrink-0 mt-0.5">
              <AlertOctagon className="w-6 h-6 text-[#E5C378]" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#E5C378] font-bold block">
                Crucial Notice to All Valued Patrons
              </span>
              <h2 className="font-serif text-xl sm:text-2xl text-white font-normal uppercase tracking-wide">
                Strict No Return, No Replacement & No Exchange Policy
              </h2>
              <p className="text-xs text-ivory-200 leading-relaxed font-sans">
                Every creation at <strong className="text-white">Kaavu Styless</strong> is an artisanal, luxury ethnic ensemble crafted from intricate embroideries, fine fabrics, and delicate natural weaves. Because each garment is made in limited artisan batches, tailored to individual client orders, and curated with exquisite delicacy,{" "}
                <span className="text-[#E5C378] font-bold underline underline-offset-2">
                  ALL SALES ARE STRICTLY FINAL. WE DO NOT ACCEPT RETURNS, EXCHANGES, REPLACEMENTS, OR ISSUANCE OF CASH REFUNDS UNDER ANY CIRCUMSTANCES.
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gold/30 text-xs">
            <div className="bg-black/20 p-3 rounded border border-gold/20 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#E5C378] flex-shrink-0" />
              <span className="font-medium text-ivory-100">No Product Returns</span>
            </div>
            <div className="bg-black/20 p-3 rounded border border-gold/20 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#E5C378] flex-shrink-0" />
              <span className="font-medium text-ivory-100">No Size or Color Replacements</span>
            </div>
            <div className="bg-black/20 p-3 rounded border border-gold/20 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#E5C378] flex-shrink-0" />
              <span className="font-medium text-ivory-100">Zero Monetary Refunds</span>
            </div>
          </div>
        </div>

        {/* Detailed Terms Content Cards */}
        <div className="bg-white border border-ivory-300 p-6 sm:p-10 space-y-8 shadow-sm text-xs text-ink leading-relaxed font-sans">
          
          {/* SECTION 1 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Comprehensive No Return & No Replacement Policy
              </h3>
            </div>
            <p className="text-ink-muted">
              By completing an order on <span className="font-medium text-ink">kavvustyle.com</span> or contacting our official email at <strong className="text-crimson font-medium">kaavustyles@gmail.com</strong>, you unconditionally acknowledge and agree to our strict policy:
            </p>
            <ul className="list-disc list-inside space-y-2 text-ink-muted pl-2">
              <li>
                <strong className="text-ink">No Returns:</strong> Delivered goods cannot be returned back to the studio or warehouse. We do not provide pickup services or accept returned shipments.
              </li>
              <li>
                <strong className="text-ink">No Replacements or Exchanges:</strong> We do not replace items for different sizes, alternate colors, or different silhouettes. Customers must verify their exact size measurements against our standardized sizing guide prior to checking out.
              </li>
              <li>
                <strong className="text-ink">No Cash Refunds or Store Credits:</strong> Once a payment is authorized via Razorpay or direct gateway, no refunds (partial or full) or store credits will be provided under any circumstances.
              </li>
              <li>
                <strong className="text-ink">Hygiene and Preservation Standards:</strong> In accordance with luxury couture standards and personal apparel hygiene regulations, luxury drapes, designer kurtis, co-ords, stitched ensembles, and bespoke garments cannot be re-packaged or re-sold once handled outside our sterile atelier.
              </li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Authentic Artistry & Natural Fabric Variations
              </h3>
            </div>
            <p className="text-ink-muted">
              Every designer kurti, luxury ethnic ensemble, bespoke co-ord set, embellished suit, and handcrafted drape at Kaavu Styless is created by skilled artisans using handlooms, hand-block prints, fine embroideries, and premium fabrics.
            </p>
            <div className="bg-ivory-100 p-4 rounded border border-ivory-300 space-y-1.5 text-ink-muted">
              <p className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                Please note the following intrinsic handcrafted characteristics:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Slight irregularities in weaving knots, slub textures, thread runs, or embroidery density are natural badges of artisan craftsmanship, not manufacturing defects.</li>
                <li>Digital display screen calibrations (monitors, mobile phone panels) can occasionally display minor color variance compared to natural sunlight. Such minor color variations do not qualify as a defect or misrepresentation.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Order Placement & Non-Cancellable Policy
              </h3>
            </div>
            <p className="text-ink-muted">
              Because our atelier initiates fabric allocation, pattern cutting, and quality verification immediately upon receiving order confirmation:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li>
                <strong className="text-ink">Orders Cannot Be Cancelled:</strong> Once an order is placed and confirmed through payment, it cannot be cancelled or modified by the customer.
              </li>
              <li>
                <strong className="text-ink">Address Modifications:</strong> Shipping address changes can only be requested within 3 hours of order placement by contacting <strong className="text-crimson font-medium">kaavustyles@gmail.com</strong>, provided the shipment has not been handed over to courier partners.
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                4
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Garment Care & Fabric Maintenance
              </h3>
            </div>
            <p className="text-ink-muted">
              Luxury ethnic couture, delicate embroideries, fine silks, georgettes, and embellished fabrics must be handled with utmost care:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-ink-muted pl-2">
              <li><strong className="text-ink">Professional Dry Clean Only:</strong> Do not machine wash, hand wash, soak, or use detergent bleach on any garment.</li>
              <li><strong className="text-ink">Ironing Guidelines:</strong> Low-temperature reverse steam iron or professional pressing only. Never place a hot iron directly onto metallic work or embroidery.</li>
              <li>Kaavu Styless is not liable for fabric shrinkage, bleeding, or thread damage caused by improper laundering or home washing.</li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3 pb-6 border-b border-ivory-300">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                5
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Payments & Razorpay Security
              </h3>
            </div>
            <p className="text-ink-muted">
              All transactions are conducted in Indian Rupees (INR) and processed securely through Razorpay payment gateway adhering to PCI-DSS Level 1 compliance. Kaavu Styless never accesses, stores, or handles credit card numbers, CVVs, or UPI credentials.
            </p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-crimson text-ivory text-[10px] font-bold flex items-center justify-center font-mono">
                6
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-ink uppercase tracking-wide">
                Governing Law & Atelier Jurisdiction
              </h3>
            </div>
            <p className="text-ink-muted">
              These terms and all boutique transactions are governed by the laws of India. Any disputes arising in connection with purchases, shipments, or concierge services shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Contact Concierge Box */}
          <div className="p-6 bg-ivory-100 border border-gold/40 rounded-none space-y-3 mt-6">
            <h4 className="font-serif text-base text-ink uppercase tracking-wider font-semibold">
              Boutique Assistance & Concierge Support
            </h4>
            <p className="text-xs text-ink-muted">
              Have questions regarding sizing, fabric drape, or styling consultations prior to making your purchase? Our concierge team is available to assist you:
            </p>
            <div className="pt-2 text-xs">
              <div className="flex items-center space-x-2 text-ink">
                <Mail className="w-4 h-4 text-crimson flex-shrink-0" />
                <span>Official Inquiries: <a href="mailto:kaavustyles@gmail.com" className="text-crimson font-medium hover:underline">kaavustyles@gmail.com</a></span>
              </div>
            </div>
          </div>

          {/* Footer Back Links */}
          <div className="pt-6 border-t border-ivory-300 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-crimson font-medium hover:underline flex items-center">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                <span>Back to Home</span>
              </Link>
              <span className="text-ivory-300">|</span>
              <Link href="/privacy" className="text-ink-muted hover:text-gold transition-colors font-medium">
                View Privacy Policy →
              </Link>
            </div>
            <span className="text-[10px] uppercase text-gold tracking-widest font-mono">
              © {new Date().getFullYear()} Kaavu Styless Atelier
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
