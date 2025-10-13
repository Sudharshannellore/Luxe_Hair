import React, { useState, useEffect } from "react";
import { Menu, X, Scissors, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Premium Combos", path: "/combos" },
    { name: "Offers", path: "/offers" },
    { name: "Articles", path: "/articles" },
    { name: "Contact", path: "/contact" },        
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const data = localStorage.getItem("userInfo");
      if (data) setUserData(JSON.parse(data));
    } catch (err) {
      console.error("Error parsing user data:", err);
      setUserData(null);
    }
  }, []);

  const user = userData
    ? { name: userData.username, image: userData.image }
    : null;

  //  Modern Profile Button
  const ProfileButton = ({ isMobile = false }) => {
    const handleClick = () => {
      navigate(user ? "/profile" : "/login");
      if (isMobile) setIsOpen(false);
    };

    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-3 rounded-full transition-all duration-300 
          ${isMobile 
            ? "w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-500 text-white hover:opacity-90" 
            : "px-3 py-1.5 border border-transparent hover:border-amber-400 hover:bg-amber-50/30"
          }`}
      >
        {/* Avatar */}
        {user?.image ? (
          <img
            src={`${API_URL}/uploads/${user.image}`}
            alt={user.name || "User"}
            className={`w-9 h-9 rounded-full object-cover border-2 
              ${isMobile ? "border-white" : "border-amber-400"}
            `}
          />
        ) : (
          <div
            className={`w-9 h-9 flex items-center justify-center rounded-full border-2 
              ${isMobile ? "border-white bg-white/20" : "border-amber-400 bg-amber-50"}
            `}
          >
            <User
              className={`w-5 h-5 ${
                isMobile ? "text-white" : "text-amber-700"
              }`}
            />
          </div>
        )}

        {/* Name / Login text */}
        <span
          className={`text-sm font-medium tracking-wide ${
            isMobile
              ? "text-white"
              : "text-amber-700 group-hover:text-amber-800"
          }`}
        >
          {user?.name || "Login"}
        </span>
      </button>
    );
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/50 shadow-md backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Scissors
              className={`h-7 w-7 transition-colors duration-300 ${
                isScrolled ? "text-amber-600" : "text-white"
              }`}
            />
            <span
              className={`text-2xl font-light tracking-wider transition-colors duration-300 ${
                isScrolled ? "text-stone-900" : "text-white"
              }`}
            >
              LUXE HAIR
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ name, path }) => (
              <button
                key={name}
                onClick={() => navigate(path)}
                className={`text-sm font-medium tracking-wide transition-colors duration-300 cursor-pointer ${
                  isScrolled
                    ? "text-stone-600 hover:text-amber-600"
                    : "text-white hover:text-amber-300"
                }`}
              >
                {name}
              </button>
            ))}

            <ProfileButton />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            className={`md:hidden transition-colors duration-300 ${
              isScrolled
                ? "text-stone-600 hover:text-amber-600"
                : "text-white hover:text-amber-300"
            }`}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={`md:hidden border-t transition-all duration-300 ${
            isScrolled
              ? "border-stone-100 bg-white/95"
              : "border-white bg-black/90"
          }`}
        >
          <div className="px-4 py-4 space-y-3">
            {navItems.map(({ name, path }) => (
              <button
                key={name}
                onClick={() => {
                  navigate(path);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-300 ${
                  isScrolled
                    ? "text-stone-700 hover:bg-stone-50"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {name}
              </button>
            ))}

            {/* Divider + Profile Button */}
            <div className="border-t border-gray-200 pt-3">
              <ProfileButton isMobile />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
