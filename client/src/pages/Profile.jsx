import React, { useEffect, useState } from 'react';
import { Calendar, Package, Settings, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast, Bounce } from 'react-toastify';
import axios from 'axios';
import Loader from '../components/Loader';

const ITEMS_PER_PAGE = 3;
const API_URL = import.meta.env.VITE_API_URL;

// -------------------- Review Modal --------------------
const ReviewModal = ({ type, itemId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('userToken');

  const apiEndpoints = {
    service: {
      get: `${API_URL}/review/get/service/${itemId}`,
      post: `${API_URL}/review/send/service/${itemId}`,
    },
    package: {
      get: `${API_URL}/review/get/package/${itemId}`,
      post: `${API_URL}/review/send/package/${itemId}`,
    },
  };

  useEffect(() => {
    if (!token) return;
    const fetchReview = async () => {
      try {
        const res = await axios.get(apiEndpoints[type].get, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setRating(res.data.rating || 0);
          setComment(res.data.comment || '');
        }
      } catch (err) {
        console.error('Error fetching review:', err);
      }
    };
    fetchReview();
  }, [itemId, type, token]);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please give a rating!', { transition: Bounce });
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        apiEndpoints[type].post,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review submitted!', { transition: Bounce });
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review', { transition: Bounce });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {type === 'service' ? 'Service Review' : 'Package Review'}
        </h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Rating:</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`cursor-pointer text-3xl transition-transform hover:scale-125 ${
                  star <= rating ? 'text-amber-400' : 'text-gray-300'
                }`}
                onClick={() => setRating(star)}
              >
                <Star className="h-6 w-6" />
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 font-medium">Comment:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400"
            placeholder="Write your comment..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-medium transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {loading ? <Loader size="w-5 h-5" color="border-white" /> : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

// -------------------- Package Modal --------------------
const PackageModal = ({ pkg, onClose }) => {
  if (!pkg) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{pkg.packageTitle}</h2>

        <div className="flex justify-between mb-2 text-gray-700 font-medium">
          <span>Price:</span>
          <span>₹{pkg.price}</span>
        </div>
        <div className="flex justify-between mb-2 text-gray-700 font-medium">
          <span>Order Date:</span>
          <span>{new Date(pkg.orderDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between mb-4 text-gray-700 font-medium">
          <span>Expiry Date:</span>
          <span>{new Date(pkg.expiryDate).toLocaleDateString()}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">Services</h3>
        <ul className="space-y-2">
          {pkg.servicesUsed.map((service, idx) => (
            <li
              key={idx}
              className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                service.used ? 'bg-gray-100 line-through text-gray-500' : 'bg-amber-50 text-gray-800'
              }`}
            >
              <span>{service.serviceName}</span>
              {service.assignedStaff && (
                <span className="text-sm text-gray-600">Staff: {service.assignedStaff.name}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// -------------------- Sign Out Modal --------------------
const SignOutConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full relative">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Sign Out</h2>
      <p className="text-gray-600 mb-6">Are you sure you want to sign out?</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

// -------------------- Profile Component --------------------
const Profile = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const token = localStorage.getItem('userToken');
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('userInfo');
    if (data) setUserData(JSON.parse(data));
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const res = await axios.get(`${API_URL}/booking/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAppointments(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchAppointments();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        const res = await axios.get(`${API_URL}/order/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPackages(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, [token]);

  const handleSignOutClick = () => setShowSignOutModal(true);
  const handleConfirmSignOut = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    toast.success('Signed out successfully!', { transition: Bounce });
    navigate('/login');
  };

  const paginate = (items, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  // No filters applied
  const filteredAppointments = appointments;
  const filteredPackages = packages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-lavender-50 font-sans">
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
          <h1 className="text-5xl md:text-6xl font-light tracking-widest mb-4 uppercase">
            Welcome back, {userData?.username || 'User'}!
          </h1>
          <p className="text-lg md:text-xl font-light max-w-2xl mx-auto">
            Manage your appointments and packages
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-gray-700 border shadow-sm hover:shadow-md'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'packages'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-gray-700 border shadow-sm hover:shadow-md'
            }`}
          >
            <Package className="w-5 h-5" />
            Combos
          </button>
          <button
            onClick={handleSignOutClick}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm hover:shadow-md"
          >
            <Settings className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Active Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {loadingAppointments ? (
              <Loader />
            ) : filteredAppointments.length === 0 ? (
              <p className="text-gray-500 text-center">No appointments found.</p>
            ) : (
              paginate(filteredAppointments, appointmentPage).map((a) => (
                <div
                  key={a._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg border-l-4 border-amber-500 overflow-hidden cursor-pointer transition"
                >
                  <div className="flex flex-col md:flex-row">
                    <img
                      src={`${API_URL}/uploads/${a.service.image}`}
                      alt={a.service.title}
                      className="w-full md:w-48 h-32 object-cover"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{a.service.title}</h4>
                        <p className="text-gray-600 text-sm">{a.service.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {a.service.benefits.map((b, i) => (
                            <span
                              key={i}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center text-sm text-gray-700">
                        <div className="flex gap-4 items-center">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {new Date(a.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {a.assignedStaff?.name || 'N/A'}
                          </span>
                          <span className="font-medium">Price: ₹{a.price}</span>

                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="font-medium">Coupon: {a.couponCode}</span>
                          <span className="font-medium">Discount: ₹{a.discount}</span>
                          <span className="font-medium">Total: ₹{a.finalPrice}</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              a.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : a.status === 'completed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </span>
                          <button
                            onClick={() => setReviewData({ type: 'service', itemId: a._id })}
                            className="px-3 py-1 bg-amber-400 text-white rounded hover:bg-amber-500 transition"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            {loadingPackages ? (
              <Loader />
            ) : filteredPackages.length === 0 ? (
              <p className="text-gray-500 text-center">No packages found.</p>
            ) : (
              paginate(filteredPackages, packagePage).map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => setSelectedPackage(pkg)}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg border-l-4 border-amber-500 overflow-hidden cursor-pointer transition"
                >
                  <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{pkg.packageTitle}</h4>
                      <p className="text-gray-600 text-sm">Order: {new Date(pkg.orderDate).toLocaleDateString()}</p>
                      <p className="text-gray-600 text-sm">Expiry: {new Date(pkg.expiryDate).toLocaleDateString()}</p>
                      <p className="text-gray-600 text-sm">Payment: {pkg.paymentStatus}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-medium">Price: ₹{pkg.price}</span>
                      <span className="font-medium">Coupon: {pkg.couponCode}</span>
                      <span className="font-medium">Discount: ₹{pkg.discount}</span>
                      <span className="font-medium">Total: ₹{pkg.finalPrice}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewData({ type: 'package', itemId: pkg._id });
                        }}
                        className="px-3 py-1 bg-amber-400 text-white rounded hover:bg-amber-500 transition"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPackage && <PackageModal pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />}
      {reviewData && <ReviewModal type={reviewData.type} itemId={reviewData.itemId} onClose={() => setReviewData(null)} />}
      {showSignOutModal && <SignOutConfirmModal onConfirm={handleConfirmSignOut} onCancel={() => setShowSignOutModal(false)} />}
    </div>
  );
};

export default Profile;
