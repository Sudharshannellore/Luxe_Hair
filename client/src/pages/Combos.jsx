import React, { useEffect, useState } from 'react';
import { Check, ShoppingCart, Loader2, X, ChevronDownCircle } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../components/Loader';

function Combos() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [packages, setPackages] = useState([]);
  const [loadingPackageId, setLoadingPackageId] = useState(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [showPaymentDashboard, setShowPaymentDashboard] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cod');

  // --- Coupon ---
  const [coupons, setCoupons] = useState([]);
  const [couponData, setCouponData] = useState({ code: '', discount: 0, finalAmount: 0 });
  const [couponError, setCouponError] = useState('');

  // Pagination
  const [visibleCount, setVisibleCount] = useState(3);

  const toastOptions = {
    position: 'top-right',
    autoClose: 2000,
    theme: 'colored',
    transition: Bounce,
  };

  // Fetch Packages & Coupons
  const fetchPackages = async () => {
    try {
      setLoadingFetch(true);
      const res = await axios.get(`${API_URL}/package/get`);
      setPackages(res.data);
    } catch (err) {
      toast.error('Failed to fetch packages', toastOptions);
    } finally {
      setLoadingFetch(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API_URL}/coupon/get-all`);
      setCoupons(res.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchCoupons();
  }, []);

  // Coupon Validation
  const validateCoupon = async (code) => {
    if (!selectedPackage) return;
    const token = localStorage.getItem('userToken');

    try {
      const res = await axios.post(
        `${API_URL}/coupon/apply`,
        { code, orderValue: selectedPackage.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setCouponData({
          code: res.data.code,
          discount: res.data.discount,
          finalAmount: res.data.finalAmount,
        });
        setCouponError('');
        toast.success('Coupon applied successfully!', toastOptions);
      }
    } catch (error) {
      setCouponError(error.response?.data?.error || 'Invalid coupon!');
      setCouponData({ code: '', discount: 0, finalAmount: 0 });
    }
  };

  // Order Submit (COD or Online)
  const handleOrderSubmit = async () => {
    if (!selectedPackage) return;

    const token = localStorage.getItem('userToken');
    const payload = {
      packageId: selectedPackage._id,
      paymentMethod,
      finalAmount: couponData.finalAmount > 0 ? couponData.finalAmount : selectedPackage.price,
    };

    if (couponData.code) {
      payload.couponCode = couponData.code;
      payload.discount = couponData.discount;
    }

    try {
      setLoadingPackageId(selectedPackage._id);

      const response = await axios.post(`${API_URL}/order/place`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(response.data.message || 'Order placed successfully', toastOptions);
      resetSelection();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong!', toastOptions);
    } finally {
      setLoadingPackageId(null);
    }
  };

  const resetSelection = () => {
    setShowFinalConfirm(false);
    setShowConfirmPopup(false);
    setShowPaymentDashboard(false);
    setSelectedPackage(null);
    setCouponData({ code: '', discount: 0, finalAmount: 0 });
    setCouponError('');
    setPaymentMethod('cod');
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
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

      {/* Packages */}
      <section id="combos" className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 mb-6">
            {packages.slice(0, visibleCount).map((pkg) => (
              <div
                key={pkg._id}
                className="group bg-white rounded-sm shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`${API_URL}/uploads/${pkg.image}`}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 font-serif">{pkg.title}</h3>
                  <p className="text-gray-600 text-sm font-serif mb-4">{pkg.subtitle}</p>

                  <div className="text-3xl font-bold text-amber-600 mb-6">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </div>

                  <div className="space-y-2 mb-6 font-serif">
                    {pkg.services.map((s, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Check className="text-green-500" size={16} />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const token = localStorage.getItem('userToken');
                      if (!token) {
                        window.location.href = '/login';
                        return;
                      }
                      setSelectedPackage(pkg);
                      setShowConfirmPopup(true);
                    }}
                    disabled={loadingPackageId === pkg._id}
                    className="cursor-pointer w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-sm 
                    font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingPackageId === pkg._id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        <span>Order Combo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleCount < packages.length && (
            <div className="text-center mt-6">
              <ChevronDownCircle
                className="h-10 w-10 text-amber-900 cursor-pointer"
                onClick={() => setVisibleCount((prev) => prev + 3)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Confirm Popup */}
      {showConfirmPopup && selectedPackage && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order: {selectedPackage.title}</h3>
              <button onClick={() => setShowConfirmPopup(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Coupon Section */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Available Coupons</h4>
              {coupons.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {coupons.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => validateCoupon(c.couponCode)}
                      disabled={!!couponData.code}
                      className={`px-3 py-1 text-sm rounded-full ${
                        couponData.code === c.couponCode
                          ? 'bg-green-200 cursor-not-allowed'
                          : 'bg-amber-100 hover:bg-amber-200'
                      }`}
                    >
                      {c.couponCode}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No coupons available</p>
              )}

              {couponData.discount > 0 && (
                <div className="bg-green-100 p-3 rounded-lg mt-2 text-sm">
                  <p>Discount: ₹{couponData.discount}</p>
                  <p className="font-semibold">Final Amount: ₹{couponData.finalAmount}</p>
                </div>
              )}
            </div>

            {/* Payment Method Dropdown */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Select Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (paymentMethod === 'online') {
                    setShowPaymentDashboard(true);
                    setShowConfirmPopup(false);
                  } else {
                    setShowFinalConfirm(true);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Online Payment Popup */}
      {showPaymentDashboard && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-[80]">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Online Payment</h2>
            <p className="text-gray-600 mb-6">Enter your card details (Dummy Payment)</p>

            <div className="space-y-3 mb-4 text-left">
              <input type="text" placeholder="Card Number" className="w-full border px-3 py-2 rounded" />
              <div className="flex gap-2">
                <input type="text" placeholder="MM/YY" className="w-1/2 border px-3 py-2 rounded" />
                <input type="text" placeholder="CVV" className="w-1/2 border px-3 py-2 rounded" />
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowPaymentDashboard(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleOrderSubmit();
                  setShowPaymentDashboard(false);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Pay ₹
                {couponData.finalAmount > 0 ? couponData.finalAmount : selectedPackage?.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Confirm (COD) */}
      {showFinalConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Confirm your booking for {selectedPackage?.title}?
            </h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowFinalConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleOrderSubmit}
                disabled={loadingPackageId === selectedPackage?._id}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                {loadingPackageId === selectedPackage?._id ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingFetch && <Loader />}
      <ToastContainer />
    </div>
  );
}

export default Combos;
