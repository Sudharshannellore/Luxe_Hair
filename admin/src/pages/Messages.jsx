import React, { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../components/Loader";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(false);

  const rowsPerPage = 10;
  const API_URL = import.meta.env.VITE_API_URL


  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/message/get`);
      setMessages(res.data);
      setFilteredMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter by date
  useEffect(() => {
    if (!filterDate) {
      setFilteredMessages(messages);
    } else {
      const selectedDate = new Date(filterDate);
      const filtered = messages.filter((msg) => {
        const created = new Date(msg.createdAt);
        return (
          created.getFullYear() === selectedDate.getFullYear() &&
          created.getMonth() === selectedDate.getMonth() &&
          created.getDate() === selectedDate.getDate()
        );
      });
      setFilteredMessages(filtered);
      setCurrentPage(1);
    }
  }, [filterDate, messages]);

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredMessages.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredMessages.length / rowsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Example delete handler:
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/message/${id}`);
      await fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="mr-2 font-medium">Filter by Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="ml-3 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 px-4 py-2">Full Name</th>
                    <th className="border border-gray-200 px-4 py-2">Email</th>
                    <th className="border border-gray-200 px-4 py-2">Phone</th>
                    <th className="border border-gray-200 px-4 py-2">Message</th>
                    <th className="border border-gray-200 px-4 py-2">Date</th>
                    <th className="border border-gray-200 px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((msg) => (
                      <tr key={msg._id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">{msg.fullname}</td>
                        <td className="border border-gray-200 px-4 py-2">{msg.email}</td>
                        <td className="border border-gray-200 px-4 py-2">{msg.phone}</td>
                        <td className="border border-gray-200 px-4 py-2">{msg.message}</td>
                        <td className="border border-gray-200 px-4 py-2">{formatDateTime(msg.createdAt)}</td>
                        <td className="border border-gray-200 px-4 py-2">
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        No messages found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Messages;
