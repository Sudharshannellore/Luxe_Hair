import React, { useEffect, useState } from 'react';
import { Star, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';


const Home = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState('');

  const [services, setServices] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const [serviceRes, comboRes] = await Promise.all([
        axios.get(`${API_URL}/service/get`),
        axios.get(`${API_URL}/package/get`)
      ]);

      const serviceData = serviceRes.data || [];
      setServices(serviceData);

      const comboData = comboRes.data || [];
      setCombos(comboData);

    } catch (error) {
      console.error("fetchData error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

if (loading) return <Loader/>

  // Testimonials
  const testimonials = [
    { id: 1, name: 'Sarah Mitchell', text: 'Absolutely stunning results! The attention to detail and luxurious atmosphere made my visit unforgettable.', rating: 5 },
    { id: 2, name: 'Emma Thompson', text: 'Best hair salon experience ever. The stylists truly understand hair and the treatments are worth every penny.', rating: 5 },
    { id: 3, name: 'Jessica Chen', text: 'From the moment I walked in, I felt pampered. My hair has never looked or felt better.', rating: 5 },
  ];

  // Stylists
  const stylists = [
    { id: 1, name: 'Alexandra Sterling', title: 'Master Stylist', image: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=400', specialties: ['Color Expert', 'Balayage'] },
    { id: 2, name: 'Victoria Laurent', title: 'Senior Stylist', image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400', specialties: ['Bridal', 'Extensions'] },
    { id: 3, name: 'Isabella Rose', title: 'Hair Treatment Specialist', image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400', specialties: ['Keratin', 'Hair Spa'] },
  ];

  // Instagram
  const instagramImages = [
    'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3065210/pexels-photo-3065210.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3992870/pexels-photo-3992870.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=400',
  ];

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1920)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide mb-4">
            LUXE HAIR
          </h1>
          <p className="text-lg md:text-xl font-light max-w-2xl mx-auto italic mb-4">
            "Your hair is the crown you never take off — treat it like royalty."
          </p>
          <p className="text-md md:text-lg font-light max-w-2xl mx-auto">
            Experience elegance and care — where every detail matters.
          </p>
        </div>
      </section>


      {/* Services Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-light tracking-wider mb-4">SIGNATURE SERVICES</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">Discover our curated collection of premium hair treatments designed to transform and rejuvenate</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.slice(0,3).map((s, idx) => (
            <div key={idx} className="bg-white rounded-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <img src={`${API_URL}/uploads/${s.image}`} alt={s.title} className="w-full h-64 object-cover rounded-t-sm" />
              <div className="p-6">
                <p className="text-xs text-amber-600 font-medium tracking-wider mb-2">{s.category}</p>
                <h3 className="text-lg font-medium mb-2">{s.title}</h3>
                <p className="text-stone-600 text-sm mb-2">{s.duration} | ₹{s.price}</p>
                <p className="text-stone-700 text-sm mb-2">{s.description}</p>
                <ul className="list-disc list-inside text-stone-600 text-sm">
                  {s.benefits.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button 
          onClick={()=>navigate('/services')}          
          className="uppercase flex gap-2 px-8 py-4 text-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm hover:shadow-md rounded-full transition-all duration-300">
            View Services
            <ArrowRight/>
          </button>
        </div>
      </section>

      {/* Combos Section */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-light tracking-wider mb-4">EXCLUSIVE COMBOS</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">Choose your perfect beauty experience package</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {combos.slice(0,3).map((combo, idx) => (
            <div key={idx} className="bg-white rounded-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <img src={`${API_URL}/uploads/${combo.image}`} alt={combo.title} className="w-full h-64 object-cover rounded-t-sm" />
              <div className="p-6 text-center">
                <h3 className="text-2xl font-semibold mb-2">{combo.title}</h3>
                <p className="text-stone-600 mb-2">{combo.subtitle}</p>
                <ul className="text-stone-700 text-sm mb-4 space-y-1">
                  {combo.services.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
                <ul className="text-stone-700 text-xs mb-4 space-y-1">
                  {combo.features.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
                <div className="text-3xl font-light mb-4">₹{combo.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button 
          onClick={()=>navigate('/combos')}
          className="uppercase flex gap-2 px-8 py-4 text-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm hover:shadow-md rounded-full transition-all duration-300">
            View Combos
            <ArrowRight/>
          </button>
        </div>
      </section>


      {/* Testimonials Marquee */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-light tracking-wider mb-4">CLIENT EXPERIENCES</h2>
          <p className="text-stone-600">Hear from those who trust us with their hair</p>
        </div>
        <div className="overflow-hidden relative">
          <div className="flex animate-scroll space-x-8">
            {testimonials.concat(testimonials).map((t, idx) => (
              <div key={idx} className="bg-white rounded-sm shadow-sm p-6 min-w-[300px]">
                <div className="flex justify-center mb-2">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-600 text-amber-600" />)}
                </div>
                <p className="text-center italic text-stone-700 mb-2">"{t.text}"</p>
                <p className="text-center font-medium">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stylists Section */}
      <section className="py-20 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-light tracking-wider mb-4">EXPERT STYLISTS</h2>
          <p className="text-stone-600 max-w-2xl mx-auto">Meet our talented team of certified professionals</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stylists.map(s => (
            <div key={s.id} className="bg-white rounded-sm shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="overflow-hidden">
                <img src={s.image} alt={s.name} className="w-full h-80 object-cover transition-transform duration-500 hover:scale-110" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-medium mb-1">{s.name}</h3>
                <p className="text-amber-600 text-sm mb-4">{s.title}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {s.specialties.map((sp, i) => <span key={i} className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-full">{sp}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-light tracking-wider mb-4">FOLLOW OUR JOURNEY</h2>
          <p className="text-stone-600">@luxehair</p>
        </div>
        <div className="overflow-hidden relative">
          <div className="flex animate-scroll space-x-4">
            {instagramImages.concat(instagramImages).map((img, i) => (
              <div key={i} className="aspect-square min-w-[150px] overflow-hidden cursor-pointer group">
                <img src={img} alt={`Instagram ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 bg-amber-600 text-center">
        <Sparkles className="h-12 w-12 text-white mx-auto mb-6" />
        <h2 className="text-4xl font-light tracking-wider mb-4 text-white">STAY INSPIRED</h2>
        <p className="text-white/90 mb-8">Subscribe to receive exclusive offers, beauty tips, and early access to new services</p>
        <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto shadow-2xs rounded-full border-2 border-amber-100">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-6 py-4 focus:outline-none focus:ring-0 " required />
          <button type="submit" className="px-6 py-3 text-base bg-stone-100 hover:bg-stone-200 text-stone-900 font-medium rounded-full transition-all duration-300">
            Subscribe
          </button>
        </form>
      </section>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll { animation: scroll 20s linear infinite; }
      `}</style>

    </div>
  );
};

export default Home;
