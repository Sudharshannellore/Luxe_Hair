import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Check,
  X,
  ChevronDownCircle,
  Search,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loader";

const Services = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false); // used for COD confirm
  const [showPaymentPopup, setShowPaymentPopup] = useState(false); // used for Online payment popup
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethods, setPaymentMethods] = useState({ online: false, cod: false });

  const [bookingData, setBookingData] = useState({
    date: "",
    paymentMode: "cod", // default to COD if available
  });

  const [couponData, setCouponData] = useState({
    code: "",
    discount: 0,
    finalAmount: 0,
  });

  const toastOptions = {
    position: "top-right",
    autoClose: 2000,
    theme: "colored",
    transition: Bounce,
  };

  // Fetch services, coupons, and payment methods
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [serviceRes, couponRes, paymentRes] = await Promise.all([
          axios.get(`${API_URL}/service/get`),
          axios.get(`${API_URL}/coupon/get-all`),
          axios.get(`${API_URL}/payment/get/payment-method`), // your provided endpoint
        ]);

        const serviceData = serviceRes.data || [];
        setServices(serviceData);
        setFilteredServices(serviceData);
        setCoupons(couponRes.data || []);
        if (paymentRes.data?.payment) {
          setPaymentMethods(paymentRes.data.payment);

          // set default booking paymentMode if cod available
          setBookingData((prev) => ({
            ...prev,
            paymentMode: paymentRes.data.payment.cod ? "cod" : paymentRes.data.payment.online ? "online" : "",
          }));
        }

        const uniqueCategories = [
          "All",
          ...new Set(serviceData.map((s) => s.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        toast.error("Failed to load data!", toastOptions);
        console.error("fetchData error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Search + Filter
  useEffect(() => {
    let result = [...services];
    if (selectedCategory !== "All") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      result = result.filter((s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredServices(result);
  }, [searchTerm, selectedCategory, services]);

  // Coupon validation
  const validateCoupon = async (code) => {
    const token = localStorage.getItem("userToken");
    if (!selectedService) return;

    try {
      const res = await axios.post(
        `${API_URL}/coupon/apply`,
        { code, orderValue: selectedService.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setCouponData({
          code: res.data.code,
          discount: res.data.discount,
          finalAmount: res.data.finalAmount,
        });
        toast.success("Coupon applied successfully!", toastOptions);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid coupon!", toastOptions);
      setCouponData({ code: "", discount: 0, finalAmount: 0 });
      console.error("validateCoupon error:", error);
    }
  };

  // Booking handler (used for both COD and Online after payment popup)
  const handleBooking = async () => {
    if (!selectedService || !bookingData.date || !bookingData.paymentMode) return;

    setBookingLoading(true);
    const token = localStorage.getItem("userToken");

    const payload = {
      serviceId: selectedService._id,
      date: bookingData.date,
      paymentMethod: bookingData.paymentMode,
      finalAmount:
        couponData.finalAmount > 0 ? couponData.finalAmount : selectedService.price,
      ...(couponData.code && {
        couponCode: couponData.code,
        discount: couponData.discount,
      }),
    };

    try {
      const response = await axios.post(`${API_URL}/booking/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(response.data.message || "Booking successful!", toastOptions);
      resetBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!", toastOptions);
      console.error("handleBooking error:", error);
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingData({ date: "", paymentMode: paymentMethods.cod ? "cod" : paymentMethods.online ? "online" : "" });
    setCouponData({ code: "", discount: 0, finalAmount: 0 });
    setShowConfirmPopup(false);
    setShowPaymentPopup(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {loading && <Loader />}

      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1920)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-light tracking-widest mb-4">
            OUR SERVICES
          </h1>
          <p className="text-lg md:text-xl font-light max-w-2xl mx-auto">
            Experience elegance and care — where every detail matters.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-10 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-amber-600 text-white"
                    : "bg-white hover:bg-stone-100 text-stone-700 border border-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-3.5 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-stone-200 focus:ring-2 focus:ring-amber-600 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.slice(0, visibleCount).map((service) => (
            <div
              key={service._id}
              className="bg-white rounded-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-stone-100"
            >
              <div className="overflow-hidden">
                <img
                  src={`${API_URL}/uploads/${service.image}`}
                  alt={service.title}
                  className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-6">
                <p className="text-xs text-amber-600 font-medium tracking-wider mb-2 uppercase">
                  {service.category}
                </p>
                <h3 className="text-lg font-medium mb-3">{service.title}</h3>
                <p className="text-sm text-stone-600 mb-4 line-clamp-3">
                  {service.description}
                </p>
                <ul className="text-sm text-stone-700 space-y-1 mb-4">
                  {(service.benefits || []).slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-center">
                      <Check size={16} className="text-green-500 mr-2" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-light text-stone-900">
                    ₹{service.price}
                  </span>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("userToken");
                      if (!token) return navigate("/login");
                      setSelectedService(service);

                      // ensure default paymentMode when opening modal
                      setBookingData((prev) => ({
                        ...prev,
                        paymentMode: paymentMethods.cod ? "cod" : paymentMethods.online ? "online" : "",
                      }));
                    }}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-sm transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {visibleCount < filteredServices.length && (
          <div className="flex justify-center mt-10">
            <ChevronDownCircle
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="h-10 w-10 text-amber-600 cursor-pointer hover:text-amber-700 transition-all"
            />
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            {!bookingLoading && (
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            <img
              src={`${API_URL}/uploads/${selectedService.image}`}
              alt={selectedService.title}
              className="w-full h-56 object-cover rounded-lg mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">{selectedService.title}</h2>
            <p className="text-stone-600 mb-4">{selectedService.description}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // If online selected => show payment popup; else for COD show confirm popup
                if (bookingData.paymentMode === "online") {
                  setShowPaymentPopup(true);
                } else {
                  setShowConfirmPopup(true);
                }
              }}
              className="flex flex-col gap-4 relative"
            >
              {bookingLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
                  <Loader />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block mb-1 font-medium text-stone-700">Date</label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, date: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block mb-1 font-medium text-stone-700">Payment Method</label>
                <select
                  value={bookingData.paymentMode}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, paymentMode: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  {paymentMethods.cod && <option value="cod">Cash on Delivery</option>}
                  {paymentMethods.online && <option value="online">Online Payment</option>}
                </select>
              </div>

              {/* Coupons */}
              <div>
                <h3 className="font-semibold mb-2 text-stone-700">Available Coupons</h3>
                {coupons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {coupons.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => validateCoupon(c.couponCode)}
                        disabled={!!couponData.code}
                        className={`px-3 py-1 text-sm rounded-full ${
                          couponData.code === c.couponCode
                            ? "bg-green-200 cursor-not-allowed"
                            : "bg-amber-100 hover:bg-amber-200"
                        }`}
                      >
                        {c.couponCode}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No coupons available</p>
                )}
              </div>

              {couponData.discount > 0 && (
                <div className="bg-green-100 p-3 rounded-lg text-sm">
                  <p>Discount: ₹{couponData.discount}</p>
                  <p className="font-semibold">
                    Final Amount: ₹{couponData.finalAmount}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-sm font-semibold transition-all disabled:opacity-60"
              >
                {bookingLoading ? "Processing..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Online Payment Popup */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-center relative">
            <h3 className="text-xl font-semibold mb-4 flex items-center justify-center gap-2">
              <CreditCard className="text-amber-600" /> Online Payment
            </h3>

            <div className="space-y-4 text-left">
              <div>
                <label className="font-medium text-sm">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="font-medium text-sm">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-medium text-sm">CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    className="w-full border rounded px-3 py-2 mt-1"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              <div className="flex items-center gap-2 text-sm justify-center text-gray-600">
                <Smartphone className="text-amber-600" size={18} />
                <span>or Pay using UPI ID</span>
              </div>
              <input
                type="text"
                placeholder="example@upi"
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => setShowPaymentPopup(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // simulate payment success then call booking API
                  // close popup first for fast UI response
                  setShowPaymentPopup(false);
                  handleBooking();
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup for COD */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to book this service?
            </h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmPopup(false);
                  handleBooking();
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Services;
