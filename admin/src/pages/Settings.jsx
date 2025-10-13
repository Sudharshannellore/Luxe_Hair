import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pen, Trash } from "lucide-react";

const Settings = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState("profile");
  const [payment, setPayment] = useState({ online: false, cod: false });
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newOffer, setNewOffer] = useState({
    name: "",
    code: "",
    discountValue: "",
    validityStart: "",
    validityEnd: "",
    discountType: "PERCENTAGE",
    eligibility: "ALL_USERS",
    usageLimit: "UNLIMITED",
    status: "ACTIVE",
  });

  const [selectedOffer, setSelectedOffer] = useState(null); // null = add, not null = edit

  useEffect(() => {
    axios
      .get(`${API_URL}/payment/get/payment-method`)
      .then((res) => {
        setPayment(res.data.payment || res.data);
      })
      .catch(console.error);

    axios
      .get(`${API_URL}/coupon/get-all`)
      .then((res) => setOffers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    const updatedPayment = { ...payment, [key]: !payment[key] };
    setPayment(updatedPayment);
    axios
      .patch(`${API_URL}/payment/update/payment-setting`, updatedPayment)
      .then(() => console.log("Payment setting updated"))
      .catch(console.error);
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setSelectedOffer(offer);
      setNewOffer({
        name: offer.offerName,
        code: offer.couponCode,
        discountValue: offer.discountValue,
        discountType: offer.discountType,
        eligibility: offer.eligibility,
        usageLimit: offer.usageLimit,
        status: offer.status,
        validityStart: offer.validityStart.slice(0, 10),
        validityEnd: offer.validityEnd.slice(0, 10),
      });
    } else {
      setSelectedOffer(null);
      setNewOffer({
        name: "",
        code: "",
        discountType: "PERCENTAGE",
        eligibility: "ALL_USERS",
        usageLimit: "UNLIMITED",
        status: "ACTIVE",
        validityStart: "",
        validityEnd: "",
      });
    }
    setShowModal(true);
  };

  const handleSaveOffer = () => {
    if (
      !newOffer.name ||
      !newOffer.code ||
      !newOffer.discountValue ||
      !newOffer.validityStart ||
      !newOffer.validityEnd
    )
      return;

    const payload = {
      offerName: newOffer.name,
      couponCode: newOffer.code,
      discountType: newOffer.discountType,
      discountValue: parseInt(newOffer.discountValue),
      validityStart: newOffer.validityStart,
      validityEnd: newOffer.validityEnd,
      eligibility: newOffer.eligibility,
      usageLimit: newOffer.usageLimit,
      status: newOffer.status,
    };

    if (selectedOffer) {
      axios
        .put(`${API_URL}/coupon/update/${selectedOffer._id}`, payload)
        .then((res) => {
          setOffers(
            offers.map((o) => (o._id === selectedOffer._id ? res.data.coupon : o))
          );
          setShowModal(false);
          setSelectedOffer(null);
        })
        .catch(console.error);
    } else {
      axios
        .post(`${API_URL}/coupon/save`, payload)
        .then((res) => {
          setOffers([...offers, res.data.coupon]);
          setShowModal(false);
        })
        .catch(console.error);
    }
  };

  const handleDeleteOffer = (id) => {
    axios
      .delete(`${API_URL}/coupon/delete/${id}`)
      .then(() => setOffers(offers.filter((o) => o._id !== id)))
      .catch(console.error);
  };

  if (loading) return <div className="p-6">Loading payment settings…</div>;

  return (
    <div className="flex flex-col p-6 h-screen ">
      {/* Top Sidebar */}
      <div className=" p-2 flex justify-center  mb-6">
        <button
          className={`flex items-center px-3 py-1 rounded-lg font-semibold text-sm relative transition-colors ${
            activeTab === "profile" ? "bg-amber-100 text-amber-700" : "hover:bg-rose-50"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          {activeTab === "profile" && (
            <span className="absolute bottom-0 left-0 h-1 w-full bg-amber-500 rounded-t transition-all"></span>
          )}
          <span className="ml-3">Payment</span>
        </button>

        <button
          className={`flex items-center px-3 py-1 rounded-lg font-semibold text-sm relative transition-colors ${
            activeTab === "offers" ? "bg-rose-100 text-amber-700" : "hover:bg-rose-50"
          }`}
          onClick={() => setActiveTab("offers")}
        >
          {activeTab === "offers" && (
            <span className="absolute bottom-0 left-0 h-1 w-full bg-amber-500 rounded-t transition-all"></span>
          )}
          <span className="ml-3">Offers</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Payment */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
            <h1 className="text-2xl font-bold mb-4">Payment Settings</h1>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg">Online Payment</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={payment.online}
                  onChange={() => handleToggle("online")}
                />
                <div
                  className={`w-11 h-6 rounded-full ${
                    payment.online ? "bg-green-500" : "bg-gray-300"
                  } relative`}
                >
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      payment.online ? "translate-x-5" : ""
                    }`}
                  ></div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-lg">Cash on Delivery (COD)</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={payment.cod}
                  onChange={() => handleToggle("cod")}
                />
                <div
                  className={`w-11 h-6 rounded-full ${
                    payment.cod ? "bg-green-500" : "bg-gray-300"
                  } relative`}
                >
                  <div
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                      payment.cod ? "translate-x-5" : ""
                    }`}
                  ></div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Offers */}
        {activeTab === "offers" && (
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Offers</h1>
              <button
                className="px-4 py-2 bg-amber-700 text-white rounded-lg transition-colors"
                onClick={() => handleOpenModal()}
              >
                Add Offer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {offers.length > 0 ? (
                    offers.map((offer) => (
                      <tr
                        key={offer._id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">{offer.offerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{offer.couponCode}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {offer.discountType === "PERCENTAGE"
                            ? `${offer.discountValue}%`
                            : `₹${offer.discountValue}`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(offer.validityStart).toLocaleDateString()} -{" "}
                          {new Date(offer.validityEnd).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              offer.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                          <button
                            onClick={() => handleOpenModal(offer)}
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            <Pen className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer._id)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">
                        No offers available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>


            {/* Add/Edit Modal */}
            {showModal && (
              <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl w-96 shadow-lg space-y-4">
                  <h2 className="text-xl font-bold">
                    {selectedOffer ? "Edit Offer" : "Add Offer"}
                  </h2>

                  <input
                    type="text"
                    placeholder="Offer Name"
                    className="border p-2 w-full rounded"
                    value={newOffer.name}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, name: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Offer Code"
                    className="border p-2 w-full rounded"
                    value={newOffer.code}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, code: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Discount Value"
                    className="border p-2 w-full rounded"
                    value={newOffer.discountValue}
                    onChange={(e) =>
                      setNewOffer({
                        ...newOffer,
                        discountValue: e.target.value,
                      })
                    }
                  />

                  <select
                    className="border p-2 w-full rounded"
                    value={newOffer.discountType}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, discountType: e.target.value })
                    }
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat</option>
                  </select>

                  <select
                    className="border p-2 w-full rounded"
                    value={newOffer.eligibility}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, eligibility: e.target.value })
                    }
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="NEW_USERS">New Users</option>
                    <option value="INACTIVE_USERS">Inactive Users</option>
                  </select>

                  <select
                    className="border p-2 w-full rounded"
                    value={newOffer.usageLimit}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, usageLimit: e.target.value })
                    }
                  >
                    <option value="UNLIMITED">Unlimited</option>
                    <option value="ONCE_PER_USER">Once Per User</option>
                  </select>

                  <select
                    className="border p-2 w-full rounded"
                    value={newOffer.status}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="DISABLED">Disabled</option>
                  </select>

                  <label>Validity Start</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded"
                    value={newOffer.validityStart}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, validityStart: e.target.value })
                    }
                  />

                  <label>Validity End</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded"
                    value={newOffer.validityEnd}
                    onChange={(e) =>
                      setNewOffer({ ...newOffer, validityEnd: e.target.value })
                    }
                  />

                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 border rounded hover:bg-gray-100"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-amber-700 text-white rounded"
                      onClick={handleSaveOffer}
                    >
                      {selectedOffer ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
