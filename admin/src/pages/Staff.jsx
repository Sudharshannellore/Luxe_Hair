import React, { useState, useEffect } from "react";
import { getAllStaff, createStaff, updateStaff, deleteStaff } from "../apis/staffApi";
import { Pen, Trash } from "lucide-react";
import Loader from "../components/Loader";
const Staff = () => {

  const API_URL = import.meta.env.VITE_API_URL

  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    address: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);

  // Fetch staff
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllStaff();
        setStaffList(data || []);
      } catch (err) {
        console.error("Error fetching staff:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Open modal for Add
  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "",
      experience: "",
      address: "",
      image: null,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      specialization: staff.specialization || "",
      experience: staff.experience || "",
      address: staff.address || "",
      image: null,
    });
    setIsModalOpen(true);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData({ ...formData, [name]: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = { ...formData };
      let savedStaff;
      if (editingStaff) {
        savedStaff = await updateStaff(editingStaff._id, dataToSend);
        setStaffList((prev) =>
          prev.map((s) => (s._id === editingStaff._id ? savedStaff : s))
        );
      } else {
        savedStaff = await createStaff(dataToSend);
        setStaffList((prev) => [savedStaff, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete staff
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteStaff(id);
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Error deleting staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff by search
  const filteredStaff = staffList.filter(
    (staff) =>
      (staff.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.specialization?.join(" ") || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg relative">
      {/* Loader */}
      {loading && <Loader />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={handleAdd}
          className="mt-2 sm:mt-0 px-4 py-2 bg-amber-700 text-white rounded-lg "
        >
          Add Staff
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search staff..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg"
      />

      {/* Staff Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Image</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Specialization</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Experience</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Address</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.map((staff) => (
              <tr key={staff._id}>
                <td className="px-4 py-2">
                  <img
                    src={`${API_URL}/uploads/${staff.image}`}
                    alt={staff.name}
                    className="w-12 h-12 object-cover rounded-xl"
                  />
                </td>
                <td className="px-4 py-2">{staff.name}</td>
                <td className="px-4 py-2">{staff.email}</td>
                <td className="px-4 py-2">{staff.phone}</td>
                <td className="px-4 py-2">{staff.specialization}</td>
                <td className="px-4 py-2">{staff.experience}</td>
                <td className="px-4 py-2">{staff.address}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded-full text-sm font-semibold ${
                      staff.status?.toLowerCase() === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {staff.status}
                  </span>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(staff)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Pen className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(staff._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash className="w-4 h-4 text-white" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  No staff found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold mb-4">
              {editingStaff ? "Edit Staff" : "Add Staff"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="specialization"
                placeholder="Specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="experience"
                placeholder="Experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="file"
                name="image"
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg"
                >
                  {editingStaff ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
