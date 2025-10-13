import React from 'react';
import { Scissors, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom'; // assuming you are using react-router

const Footer = () => {
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Premium Combos", path: "/combos" },
    { name: "Offers", path: "/offers" },
    { name: "Articles", path: "/articles" },
    { name: "Contact", path: "/contact" }, 
  ];

  const services = [
    'Hair Spa',
    'Hair Cut & Styling',
    'Hair Treatments',
    'Coloring',
  ];

  const socialIcons = [
    { icon: <Instagram className="h-5 w-5 cursor-pointer hover:text-amber-600 transition-colors" />, link: 'https://instagram.com' },
    { icon: <Facebook className="h-5 w-5 cursor-pointer hover:text-amber-600 transition-colors" />, link: 'https://facebook.com' },
    { icon: <Twitter className="h-5 w-5 cursor-pointer hover:text-amber-600 transition-colors" />, link: 'https://twitter.com' },
  ];

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Scissors className="h-6 w-6 text-amber-600" />
              <span className="text-xl font-light tracking-wider text-white">LUXE HAIR</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Experience the pinnacle of luxury hair care with our expert stylists and premium treatments.
            </p>
            <div className="flex space-x-4">
              {socialIcons.map((item, index) => (
                <a key={index} href={item.link} target="_blank" rel="noopener noreferrer">
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4 text-sm tracking-wider">QUICK LINKS</h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link, index) => (
                <li key={index} className="hover:text-amber-600 transition-colors">
                  <Link to={link.path}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-medium mb-4 text-sm tracking-wider">SERVICES</h3>
            <ul className="space-y-3 text-sm">
              {services.map((service, index) => (
                <li key={index} className="hover:text-amber-600 transition-colors cursor-pointer">{service}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium mb-4 text-sm tracking-wider">CONTACT</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>123 Luxury Avenue, Beauty District, NY 10001</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <span>hello@luxehair.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-12 pt-8 text-sm text-center">
          <p>© 2025 Luxe Hair. All rights reserved. <Link to="/privacy" className="hover:text-amber-600">Privacy Policy</Link> | <Link to="/terms" className="hover:text-amber-600">Terms of Service</Link></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
