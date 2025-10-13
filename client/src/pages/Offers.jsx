import React, { useEffect, useState } from "react";
import { Gift, Percent } from "lucide-react";
import axios from "axios";

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get(`${API_URL}/get-all`);
        setOffers(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load offers.");
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading)
    return <div className="text-center mt-20 text-stone-600">Loading offers...</div>;
  if (error)
    return (
      <div className="text-center mt-20 text-red-500 font-medium">{error}</div>
    );

  return (
    <div className="min-h-screen font-sans bg-stone-50">

      {/* Hero Header with Background */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-light tracking-widest mb-4">
            EXCLUSIVE OFFERS
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Grab our special deals and discounts crafted just for you.
          </p>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="px-4 max-w-7xl mx-auto py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Featured Offer */}
          {offers[0] && (
            <div className="lg:col-span-3 bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center gap-6 transition-transform hover:-translate-y-1 hover:shadow-xl">
              <div className="flex-shrink-0">
                <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Gift size={56} className="text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-medium mb-2">
                  {offers[0].offerName}
                </h2>
                <p className="text-amber-100 mb-4 text-lg">
                  {offers[0].discountType === "PERCENTAGE"
                    ? `Get ${offers[0].discountValue}% off!`
                    : `Flat ₹${offers[0].discountValue} off!`}
                </p>
                <p className="text-sm text-amber-200">
                  Expires: {new Date(offers[0].validityEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Other Offers */}
          {offers.slice(1).map((offer) => (
            <div
              key={offer._id}
              className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center border border-stone-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Percent className="text-amber-600" size={32} />
              </div>
              <h3 className="text-xl font-medium text-stone-800">{offer.offerName}</h3>
              <p className="text-stone-600 text-sm my-2">
                {offer.discountType === "PERCENTAGE"
                  ? `Get ${offer.discountValue}% off.`
                  : `Flat ₹${offer.discountValue} off.`}
              </p>
              <p className="text-xs text-stone-400 mb-4">
                Expires: {new Date(offer.validityEnd).toLocaleDateString()}
              </p>
              <button className="w-full py-2 bg-amber-600 text-white font-medium rounded-sm hover:bg-amber-700 transition-all duration-300">
                Use Code: {offer.couponCode}
              </button>
            </div>
          ))}

        </div>
      </section>
    </div>
  );
}
