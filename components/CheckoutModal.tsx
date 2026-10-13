"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { payWithRazorpay } from "@/lib/razorpay-checkout";
import {
  X,
  CheckCircle2,
  MapPin,
  Phone,
  User as UserIcon,
    Ticket,
  CheckCircle,
  Building,
  Navigation,
  Plus,
  BookmarkCheck,
  ShieldCheck,
} from "lucide-react";

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

export default function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    cart,
    getCartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    acceptPaidOrder,
    currentUser,
    ipAddress,
  } = useStore();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");

  // Address Entry Form Fields
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Telangana");
  const [postalCode, setPostalCode] = useState("");
  const [saveAddressLocally, setSaveAddressLocally] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Load Saved Addresses on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ks_saved_addresses");
        if (saved) {
          const parsed: SavedAddress[] = JSON.parse(saved);
          setSavedAddresses(parsed);
          if (parsed.length > 0) {
            const def = parsed[0];
            setSelectedAddressId(def.id);
            setName(def.name);
            setPhone(def.phone);
            setAddress(def.address);
            setLandmark(def.landmark || "");
            setCity(def.city);
            setState(def.state);
            setPostalCode(def.postalCode);
          }
        }
      } catch (e) {
        console.warn("Could not load ks_saved_addresses:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.email) setEmail(currentUser.email);
    if (currentUser?.name && !name) setName(currentUser.name);
  }, [currentUser, name]);

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setAddress(addr.address);
    setLandmark(addr.landmark || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
  };

  const handleAddNewAddressClick = () => {
    setSelectedAddressId("new");
    setName(currentUser?.name || "");
    setPhone("");
    setAddress("");
    setLandmark("");
    setCity("");
    setState("Telangana");
    setPostalCode("");
  };

  if (!isOpen) return null;

  const subtotal = getCartTotal();
  const discount = getDiscountAmount();
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const grandTotal = discountedSubtotal;

  const handleApplyCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(couponInput);
    setCouponMsg({ success: res.success, text: res.message });
    if (res.success) {
      setCouponInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || placing) return;

    // Save address locally if checked
    if (saveAddressLocally && address && city && postalCode) {
      try {
        const newAddr: SavedAddress = {
          id: "addr-" + Date.now(),
          name,
          phone,
          address,
          landmark,
          city,
          state,
          postalCode,
        };
        const updatedList = [newAddr, ...savedAddresses.filter((a) => a.address !== address)];
        setSavedAddresses(updatedList);
        localStorage.setItem("ks_saved_addresses", JSON.stringify(updatedList));
      } catch (err) {
        console.warn("Could not save address to localStorage:", err);
      }
    }

    const fullShippingAddress = `${address}${landmark ? `, Near ${landmark}` : ""}, ${city}, ${state}`;

    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      image: item.product.colorImages?.[item.selectedColor]?.[0] || item.product.images[0] || "",
    }));

    setPlacing(true); setOrderError("");
    try {
    const newOrder = await payWithRazorpay({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      shippingAddress: fullShippingAddress,
      city,
      postalCode,
      couponCode: appliedCoupon?.code,
      status: "Pending",
      items: orderItems,
      ipAddress,
    });

    acceptPaidOrder(newOrder);
    setPlacedOrder(newOrder);
    } catch (error) { setOrderError(error instanceof Error ? error.message : "Could not place order. Please try again."); } finally { setPlacing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-ivory rounded-none border-2 border-gold shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gold/40 bg-[#2B0B14] text-ivory flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-[0.16em]">
              Secure Checkout & Delivery Address
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gold hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {placedOrder ? (
            /* Order Confirmation View */
            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="font-serif text-3xl text-ink uppercase tracking-wide">
                  Order Confirmed!
                </h2>
                <p className="text-xs text-gold uppercase tracking-[0.2em] font-semibold mt-1">
                  Order Number: #{placedOrder.orderNumber}
                </p>
              </div>

              <div className="bg-ivory-200 p-5 border-2 border-gold/40 text-left text-xs space-y-2">
                <p className="font-bold text-burgundy uppercase tracking-wider text-[11px] border-b border-ivory-300 pb-1">
                  Shipping Delivery Address:
                </p>
                <p className="text-ink font-semibold">{placedOrder.customerName} (Phone: {placedOrder.customerPhone})</p>
                <p className="text-ink-muted leading-relaxed">{placedOrder.shippingAddress}</p>
                <p className="text-ink-muted">PIN Code: {placedOrder.postalCode}</p>
                <p className="font-semibold text-ink pt-2 border-t border-ivory-300 flex justify-between items-center">
                  <span>Total Paid / Due:</span>
                  <span className="text-crimson font-serif font-bold text-base">{formatPrice(placedOrder.totalAmount)}</span>
                </p>
              </div>

              <p className="text-xs text-ink-muted">
                Thank you for shopping with Kaavu Styless. Order details have been sent to <span className="font-semibold text-ink">{placedOrder.customerEmail}</span>.
              </p>

              <button
                onClick={onClose}
                className="px-8 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.2em] font-semibold shadow-md transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Checkout Address Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              {orderError && <p role="alert" className="p-4 text-sm text-crimson">{orderError}</p>}
              {/* SAVED ADDRESSES SELECTOR */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2 border-b border-ivory-300 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-burgundy flex items-center space-x-1.5">
                      <BookmarkCheck className="w-4 h-4 text-gold" />
                      <span>Select Saved Delivery Address</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddNewAddressClick}
                      className="text-[10px] uppercase font-bold text-crimson hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Enter New Address</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3 border text-xs cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "border-crimson bg-crimson/5 shadow-sm"
                            : "border-ivory-300 bg-white hover:border-gold"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-ink">
                          <span>{addr.name}</span>
                          {selectedAddressId === addr.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-crimson" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted truncate mt-0.5">{addr.phone}</p>
                        <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5">{addr.address}, {addr.city}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDRESS ENTRY FORM HEADER */}
              <div className="space-y-1">
                <h3 className="font-serif text-lg uppercase text-ink flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>Enter Shipping Address Details</span>
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Please enter your complete doorstep delivery address.
                </p>
              </div>

              {/* NAME & PHONE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Full Name <span className="text-crimson">*</span>
                  </label>
                  <div className="flex items-center border border-ivory-300 rounded-none bg-white p-2.5 focus-within:border-gold">
                    <UserIcon className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Phone Number (10 Digits) <span className="text-crimson">*</span>
                  </label>
                  <div className="flex items-center border border-ivory-300 rounded-none bg-white p-2.5 focus-within:border-gold">
                    <Phone className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STREET ADDRESS */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                  Flat, House No., Building Name & Street Address <span className="text-crimson">*</span>
                </label>
                <div className="flex items-start border border-ivory-300 rounded-none bg-white p-2.5 focus-within:border-gold">
                  <Building className="w-4 h-4 text-gold mr-2 mt-0.5 flex-shrink-0" />
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Flat 402, Royal Residency, Road No. 12, Jubilee Hills"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-transparent text-xs text-ink outline-none resize-none"
                  />
                </div>
              </div>

              {/* LANDMARK & CITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    Landmark / Nearby Area (Optional)
                  </label>
                  <div className="flex items-center border border-ivory-300 rounded-none bg-white p-2.5 focus-within:border-gold">
                    <Navigation className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="e.g. Near Metro Station / Temple"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    City / Town <span className="text-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-ivory-300 rounded-none bg-white p-2.5 text-xs text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* STATE & POSTAL CODE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    State <span className="text-crimson">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-ivory-300 rounded-none bg-white p-2.5 text-xs text-ink outline-none focus:border-gold"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink mb-1">
                    PIN Code / Postal Code <span className="text-crimson">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500033"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border border-ivory-300 rounded-none bg-white p-2.5 text-xs font-mono font-bold text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* SAVE ADDRESS CHECKBOX */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="saveAddressCheck"
                  checked={saveAddressLocally}
                  onChange={(e) => setSaveAddressLocally(e.target.checked)}
                  className="w-4 h-4 accent-crimson cursor-pointer"
                />
                <label htmlFor="saveAddressCheck" className="text-xs text-ink font-medium cursor-pointer">
                  Save this address for fast 1-click checkout in future orders
                </label>
              </div>


              {/* COUPON CODE IN CHECKOUT */}
              <div className="bg-ivory-100 p-3 border border-ivory-300 space-y-2">
                <div className="flex items-center space-x-1.5 text-ink font-bold text-[11px] uppercase tracking-wider">
                  <Ticket className="w-3.5 h-3.5 text-crimson" />
                  <span>Have a Promo Coupon Code?</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-2 border border-emerald-300 text-xs">
                    <div className="flex items-center space-x-2 text-emerald-800 font-bold font-mono">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-700">(-{formatPrice(discount)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[10px] text-crimson hover:underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter Coupon Code"
                      className="flex-1 bg-white border border-ivory-300 p-2 text-xs font-mono font-bold uppercase text-ink outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCouponSubmit}
                      className="px-4 py-2 bg-crimson hover:bg-crimson-800 text-ivory text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponMsg && !appliedCoupon && (
                  <p className={`text-[10px] font-semibold ${couponMsg.success ? "text-emerald-700" : "text-crimson"}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* ORDER PRICE SUMMARY */}
              <div className="bg-ivory-200 p-4 border border-ivory-300 space-y-2 text-xs">

                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink uppercase tracking-wider">Total Amount:</span>
                  <span className="font-serif text-2xl text-crimson font-bold">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* PLACE ORDER BUTTON */}
              <button
                type="submit" disabled={placing}
                className="w-full py-4 bg-crimson hover:bg-crimson-800 text-ivory font-sans text-xs uppercase tracking-[0.24em] font-extrabold transition-all shadow-lg cursor-pointer border border-gold/40"
              >
                {placing ? "Processing payment…" : `Pay ${formatPrice(grandTotal)} & Place Order`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
