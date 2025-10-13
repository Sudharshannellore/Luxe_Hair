import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Send, ChevronDown, Search, CalendarCheck, CreditCard, UserCog, Sparkles } from 'lucide-react';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../components/Loader';

function Contact() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({ fullname: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/message/save`, formData);
      toast.success(res.data.message, { theme: 'colored', transition: Bounce });
      setFormData({ fullname: '', email: '', phone: '', subject: '', message: '' });
      setShowModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong!', { theme: 'colored', transition: Bounce });
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { question: 'Do I need a consultation before treatment?', answer: 'We recommend a consultation for first-time clients...' },
    { question: 'What should I expect during my first visit?', answer: 'Your first visit includes a skin analysis...' },
    { question: 'How far in advance should I book?', answer: 'We recommend booking 1-2 weeks in advance...' },
    { question: 'What is your cancellation policy?', answer: 'Please provide 24 hours notice for cancellations...' },
  ];

  const quickLinks = [
    { title: 'Appointments', desc: 'Manage bookings, reschedule, or cancel.', href: '#', icon: CalendarCheck },
    { title: 'Payments & Billing', desc: 'Invoices, payment methods, and refunds.', href: '#', icon: CreditCard },
    { title: 'My Account', desc: 'Update your profile and notification settings.', href: '#', icon: UserCog },
    { title: 'Services & Packages', desc: 'Details about our treatments and offers.', href: '#', icon: Sparkles },
  ];

  const ContactForm = () => (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} required
            className="w-full px-6 py-4 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required
            className="w-full px-6 py-4 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 shadow-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
            className="w-full px-6 py-4 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} required
            className="w-full px-6 py-4 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 shadow-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
        <textarea rows={6} name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help you..." required
          className="w-full px-6 py-4 border border-gray-300 rounded-sm focus:ring-2 focus:ring-amber-500 shadow-sm resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className={`w-full px-6 py-4 text-base bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-sm transition-all duration-300 shadow-lg flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-amber-600 hover:to-amber-700 transform hover:scale-105'}`}>
        {loading ? <Loader /> : <><Send className="w-5 h-5 mr-2" /> Send Message</>}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen">
      <ToastContainer />

      {/* Hero */}
      <section className="relative h-96 md:h-[500px] flex items-center justify-center overflow-hidden mb-10">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-light tracking-widest mb-4">GET IN TOUCH</h1>
          <p className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">We are here to help and answer any question you might have</p>
        </div>
      </section>


      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 px-4 max-w-7xl mx-auto bg-amber-50">
        {quickLinks.map(link => (
          <a key={link.title} href={link.href} className="group block text-center bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 border border-gray-100 transition-all duration-300">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 transition-colors duration-300">
              <link.icon className="text-amber-500 group-hover:text-white w-10 h-10 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">{link.title}</h3>
            <p className="text-gray-500 text-sm">{link.desc}</p>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-4xl mx-auto  rounded-3xl shadow-sm p-8 bg-amber-50">
        <h2 className="text-3xl font-light tracking-wider mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="pb-4">
              <button type="button" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800">
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 transform transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && <div className="pt-2 text-gray-600"><p>{faq.answer}</p></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center bg-amber-50 p-10 rounded-3xl shadow-sm max-w-4xl mx-auto mb-20 ">
        <h2 className="text-3xl font-medium text-gray-800 mb-2">Still need help?</h2>
        <p className="text-gray-600 mb-6">Our dedicated support team is here for you.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => setShowModal(true)} className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 transform hover:scale-105 transition font-medium shadow-lg flex items-center justify-center gap-2 text-white">
            <Send className="w-5 h-5" /> Send a Message
          </button>
          <a href="tel:+917890456132" className="w-full sm:w-auto px-8 py-3 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2">
            <Phone className="w-5 h-5" /> Call Us (+91) 7890456132
          </a>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-auto p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-medium text-gray-800 mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>
      )}
    </div>
  );
}

export default Contact;
