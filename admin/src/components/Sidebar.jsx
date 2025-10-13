import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  TrendingUp,
  Scissors,
  Package,
  UserCheck,
  X,
  Star,
  Send,
  Settings,
  Book,
  LogOut
} from 'lucide-react';

// Hide scrollbar styles
const scrollbarHide = {
  msOverflowStyle: 'none', // IE & Edge
  scrollbarWidth: 'none',  // Firefox
};

const scrollbarHideWebkit = {
  overflowY: 'auto',
};

const menuItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Services', href: '/services', icon: Scissors },
  { name: 'Combos', href: '/combos', icon: Package },
  { name: 'Combos Orders', href: '/orders', icon: TrendingUp },
  { name: 'Staff', href: '/staff', icon: UserCheck },
  { name: 'Reviews', href: '/review', icon: Star },
  { name: 'Messages', href: '/message', icon: Send },
  { name: 'Articles', href: '/article', icon: Book },
  { name: 'Settings', href: '/setting', icon: Settings },
];

const Sidebar = ({ isOpen, setIsOpen, onLogout }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-amber-800 text-white transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}
      >
        {/* Logo / Branding */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/20">
          <div className="flex items-center space-x-3 cursor-pointer mt-5">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl text-white uppercase">Luxe Hair</span>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-white hover:bg-white/20 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav
          className="flex-1 px-4 py-6 space-y-2 overflow-y-auto"
          style={{ ...scrollbarHide, ...scrollbarHideWebkit }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className={`text-xl ${isActive ? 'text-white' : 'text-white/70'}`} />
                <span className="tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-white/20">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 cursor-pointer text-white py-2 rounded-md transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
