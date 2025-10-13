import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTopOnMount from './ScrollToTopOnMount';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './authentication/Login';
import Register from './authentication/Register';
import Services from './pages/Services';
import Combos from './pages/Combos';
import Offers from './pages/Offers';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Articles from './pages/Articles';

function AppContent() {
  const location = useLocation();

  // Routes where we want to hide header and footer
  const hideHeaderFooterRoutes = [
    '/login',
    '/register',
    ];

  const noHeaderFooter = hideHeaderFooterRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-white/90">
      {!noHeaderFooter && <Navbar />}

      <ScrollToTopOnMount>
        <Routes>
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<Home />} />
          <Route path='/services' element={<Services/>} />
          <Route path='/combos' element={<Combos/>} />
          <Route path='/offers' element={<Offers/>} /> 
          <Route path='/contact' element={<Contact/>} /> 
          <Route path='/profile' element={<Profile/>} />
          <Route path='/articles' element={<Articles/>} />                                
        </Routes>
      </ScrollToTopOnMount>

      {!noHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
