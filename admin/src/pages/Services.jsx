import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Clock, X } from 'lucide-react';
import {
  fetchServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
} from "../apis/serviceApi";
import Loader from "../components/Loader";

const Services = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState([]);
  const [benefitInput, setBenefitInput] = useState(""); 
  const [image, setImage] = useState(null);


  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await fetchServicesApi();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    // Fetch services
  useEffect(() => {
    fetchServices();
  }, []);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setCategory("");
    setPrice("");
    setDuration("");
    setDescription("");
    setBenefits([]);
    setBenefitInput("");
    setImage(null);
    setEditingService(null);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("duration", duration);
    formData.append("description", description);
    formData.append("benefits", JSON.stringify(benefits));
    if (image) formData.append("image", image);

    if (editingService) {
      await updateServiceApi(editingService._id, formData);
    } else {
      await createServiceApi(formData);
    }

    await fetchServices(); // fetch AFTER backend confirms save
    setIsModalOpen(false);
    resetForm();
  } catch (error) {
    console.error("Error saving service:", error);
  } finally {
    setLoading(false);
  }
};


  // Delete service
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteServiceApi(id);
      setServices(services.filter((s) => s._id !== id));
    } catch (error) {
      console.error("Error deleting service:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing
  const handleEdit = (service) => {
    setEditingService(service);
    setTitle(service.title);
    setCategory(service.category);
    setPrice(service.price);
    setDuration(service.duration);
    setDescription(service.description);
    setBenefits(service.benefits);
    setBenefitInput("");
    setImage(null);
    setIsModalOpen(true);
  };

  // Filters
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(services.map((service) => service.category))];

  return (
    <div className="space-y-6 relative">
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <Loader />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-700">Services</h1>
          <p className="mt-2 text-gray-600">Manage your service offerings</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Modern Services Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={`${API_URL}/uploads/${service.image}`}
                      alt={service.title}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{service.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{service.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">₹{service.price.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{service.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center gap-2 mt-3">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      <Eye className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-3 py-1 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(service._id)}
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Service Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">-- Select Category --</option>
                <option value="Hair Spa">Hair Spa</option>
                <option value="Hair Cut">Hair Cut</option>
                <option value="Treatment">Treatment</option>
                <option value="Styling">Styling</option>
              </select>
              <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              <input type="text" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />

              {/* Benefits - Single Input */}
              <div>
                <label className="block mb-1 text-sm font-medium">Benefits</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a benefit"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (benefitInput.trim() !== "") {
                        setBenefits([...benefits, benefitInput.trim()]);
                        setBenefitInput("");
                      }
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {benefits.map((b, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm"
                    >
                      {b}
                      <button
                        type="button"
                        onClick={() =>
                          setBenefits(benefits.filter((_, i) => i !== index))
                        }
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
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
      {selectedService && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setSelectedService(null)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
            <img src={`${API_URL}/uploads/${selectedService.image}`} alt={selectedService.title} className="w-full h-56 object-cover rounded-lg mb-4" />
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedService.title}</h2>
              <span className="text-xl font-semibold text-purple-600">₹{selectedService.price.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {selectedService.duration}</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">{selectedService.category}</span>
            </div>
            <p className="text-gray-700 mb-4">{selectedService.description}</p>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                {selectedService.benefits.map((b, i) => (<li key={i}>{b}</li>))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
