import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import Loader from "../components/Loader";

const Reviews = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("service"); // service | package
  const [ratingFilter, setRatingFilter] = useState(null); // 5-1 or null

  const [servicePage, setServicePage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/review/all-reviews`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setServicePage(1);
    setPackagePage(1);
  }, [activeTab, ratingFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center mt-10 text-red-600">
        Failed to load reviews.
      </div>
    );
  }

  const {
    totalServiceBookingReviews,
    totalPackageOrderReviews,
    serviceBookingReviews,
    packageOrderReviews,
  } = data;

  const allRatings = [
    ...serviceBookingReviews.map((r) => r.rating),
    ...packageOrderReviews.map((r) => r.rating),
  ];
  const avgRating =
    allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
      : 0;

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const Card = ({ title, username, userImage, rating, comment, date }) => (
    <div className="bg-white/90 rounded-2xl border border-gray-100 shadow hover:shadow-lg transition-all duration-300 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <img
          src={`${API_URL}/uploads/${userImage}`}
          alt={username}
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
        <div>
          <p className="text-gray-900 font-semibold">{username}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <p className="text-gray-800 font-medium">{title}</p>
      <div className="flex items-center gap-1">
        <Star size={16} className="text-yellow-400 fill-yellow-400" />
        <span className="text-gray-900 font-medium">{rating}</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{comment}</p>
    </div>
  );

  const filteredServiceReviews = ratingFilter
    ? serviceBookingReviews.filter((r) => r.rating === ratingFilter)
    : serviceBookingReviews;
  const filteredPackageReviews = ratingFilter
    ? packageOrderReviews.filter((r) => r.rating === ratingFilter)
    : packageOrderReviews;

  const paginatedServiceReviews = filteredServiceReviews.slice(
    (servicePage - 1) * perPage,
    servicePage * perPage
  );
  const paginatedPackageReviews = filteredPackageReviews.slice(
    (packagePage - 1) * perPage,
    packagePage * perPage
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* top summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-amber-50 rounded-2xl p-5 text-center shadow-md text-white">
          <h2 className="text-lg font-bold text-amber-700">Average Rating</h2>
          <p className="flex items-center justify-center gap-1 text-3xl font-extrabold text-amber-700">
            {avgRating}
            <Star size={24} className="fill-yellow-300 text-yellow-300" />
          </p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 text-center shadow hover:shadow-md">
          <h2 className="text-amber-700 text-lg font-bold">Service Reviews</h2>
          <p className="text-3xl font-extrabold text-amber-700">
            {totalServiceBookingReviews}
          </p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 text-center shadow hover:shadow-md">
          <h2 className="text-amber-700 text-lg font-bold ">Combos Reviews</h2>
          <p className="text-3xl font-extrabold text-amber-700">
            {totalPackageOrderReviews}
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("service")}
          className={`px-5 py-2 rounded-full font-medium transition ${
            activeTab === "service"
              ? "bg-amber-700 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Service Booking Reviews
        </button>
        <button
          onClick={() => setActiveTab("package")}
          className={`px-5 py-2 rounded-full font-medium transition ${
            activeTab === "package"
              ? "bg-amber-700 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Package Order Reviews
        </button>
      </div>

      {/* rating filter */}
      <div className="flex items-center gap-2">
        <span className="text-gray-900 font-medium">Filter by rating:</span>
        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => setRatingFilter((prev) => (prev === r ? null : r))}
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              ratingFilter === r
                ? "bg-amber-700 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* service tab */}
      {activeTab === "service" && (
        <div>
          <h3 className="text-gray-900 text-2xl font-bold mb-4">
            Service Booking Reviews
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedServiceReviews.map((review, idx) => (
              <Card
                key={idx}
                title={review.serviceTitle}
                username={review.username}
                userImage={review.userImage}
                rating={review.rating}
                comment={review.comment}
                date={formatDate(review.createdAt)}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setServicePage((p) => Math.max(1, p - 1))}
              disabled={servicePage === 1}
              className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-gray-700">
              Page {servicePage} of{" "}
              {Math.ceil(filteredServiceReviews.length / perPage) || 1}
            </span>
            <button
              onClick={() =>
                setServicePage((p) =>
                  p < Math.ceil(filteredServiceReviews.length / perPage)
                    ? p + 1
                    : p
                )
              }
              disabled={
                servicePage >=
                Math.ceil(filteredServiceReviews.length / perPage)
              }
              className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* package tab */}
      {activeTab === "package" && (
        <div>
          <h3 className="text-gray-900 text-2xl font-bold mb-4">
            Package Order Reviews
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPackageReviews.map((review, idx) => (
              <Card
                key={idx}
                title={review.packageTitle}
                username={review.username}
                userImage={review.userImage}
                rating={review.rating}
                comment={review.comment}
                date={formatDate(review.createdAt)}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPackagePage((p) => Math.max(1, p - 1))}
              disabled={packagePage === 1}
              className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-1 text-gray-700">
              Page {packagePage} of{" "}
              {Math.ceil(filteredPackageReviews.length / perPage) || 1}
            </span>
            <button
              onClick={() =>
                setPackagePage((p) =>
                  p < Math.ceil(filteredPackageReviews.length / perPage)
                    ? p + 1
                    : p
                )
              }
              disabled={
                packagePage >=
                Math.ceil(filteredPackageReviews.length / perPage)
              }
              className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
