// src/components/Packages.jsx
import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, X } from "lucide-react";
import {
  fetchPackagesApi,
  createPackageApi,
  updatePackageApi,
  deletePackageApi,
} from "../apis/packageApi";
import Loader from "../components/Loader";

const Combos = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [packages, setPackages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [price, setPrice] = useState("");
  const [services, setServices] = useState([]);
  const [features, setFeatures] = useState([]);
  const [servicesInput, setServicesInput] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [image, setImage] = useState(null);

  // Fetch packages
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await fetchPackagesApi();
      setPackages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Disable background scroll when modal is open
  useEffect(() => {
    if (isModalOpen || selectedPackage) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isModalOpen, selectedPackage]);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setPrice("");
    setServices([]);
    setFeatures([]);
    setServicesInput("");
    setFeaturesInput("");
    setImage(null);
    setEditingPackage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("price", price);
      formData.append("services", JSON.stringify(services));
      formData.append("features", JSON.stringify(features));
      if (image) formData.append("image", image);

      if (editingPackage) {
        await updatePackageApi(editingPackage._id, formData);
      } else {
        await createPackageApi(formData);
      }

      await fetchPackages();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving package:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deletePackageApi(id);
      setPackages((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Error deleting package:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setTitle(pkg.title);
    setSubtitle(pkg.subtitle);
    setPrice(pkg.price);
    setServices(pkg.services || []);
    setFeatures(pkg.features || []);
    setServicesInput("");
    setFeaturesInput("");
    setImage(null);
    setIsModalOpen(true);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-700 ">Combos</h1>
          <p className="mt-2 text-gray-600">Manage your combos offerings</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Combo
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search combos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtitle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg) => (
                <tr key={pkg._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={`${API_URL}/uploads/${pkg.image}`}
                      alt={pkg.title}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{pkg.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{pkg.subtitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">₹{pkg.price.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      <Eye className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <Trash2 className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">{editingPackage ? "Edit Package" : "Add New Package"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Combo Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" placeholder="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />

              {/* Services & Features Input */}
              <div>
                <label className="block mb-1 text-sm font-medium">Services</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a service"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && servicesInput.trim()) {
                        e.preventDefault();
                        setServices([...services, servicesInput.trim()]);
                        setServicesInput("");
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button type="button" onClick={() => { if (servicesInput.trim()) { setServices([...services, servicesInput.trim()]); setServicesInput(""); } }} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <span key={i} className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
                      {s}
                      <button type="button" onClick={() => setServices(services.filter((_, idx) => idx !== i))} className="ml-1 text-blue-500 hover:text-blue-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a feature"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && featuresInput.trim()) {
                        e.preventDefault();
                        setFeatures([...features, featuresInput.trim()]);
                        setFeaturesInput("");
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button type="button" onClick={() => { if (featuresInput.trim()) { setFeatures([...features, featuresInput.trim()]); setFeaturesInput(""); } }} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span key={i} className="flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm">
                      {f}
                      <button type="button" onClick={() => setFeatures(features.filter((_, idx) => idx !== i))} className="ml-1 text-purple-500 hover:text-purple-700 font-bold">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full" />

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedPackage(null)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
            <img src={`${API_URL}/uploads/${selectedPackage.image}`} alt={selectedPackage.title} className="w-full h-56 object-cover rounded-lg mb-4" />
            <div className="flex justify-between items-center mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPackage.title}</h2>
                <p className="text-gray-600">{selectedPackage.subtitle}</p>
              </div>
              <span className="text-xl font-semibold text-purple-600">₹{selectedPackage.price.toLocaleString("en-IN")}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Created on: {new Date(selectedPackage.createdAt).toLocaleDateString()}</p>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Services</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">{selectedPackage.services.map((s,i)=><li key={i}>{s}</li>)}</ul>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Features</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">{selectedPackage.features.map((f,i)=><li key={i}>{f}</li>)}</ul>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedPackage(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combos;
