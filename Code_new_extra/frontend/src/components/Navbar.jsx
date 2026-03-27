import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const NAV_LINKS = {
  user:   [{ to: '/dashboard', label: 'Dashboard' }, { to: '/experts', label: 'Find Experts' }, { to: '/bookings', label: 'My Bookings' }],
  expert: [{ to: '/expert-dashboard', label: 'Dashboard' }, { to: '/bookings', label: 'Sessions' }],
  admin:  [{ to: '/admin', label: 'Admin Panel' }],
};

const ROLE_BADGE = {
  user:   { label: 'Learner', cls: 'bg-indigo-100 text-indigo-700' },
  expert: { label: 'Expert',  cls: 'bg-green-100 text-green-700' },
  admin:  { label: 'Admin',   cls: 'bg-purple-100 text-purple-700' },
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const isHome = location.pathname === '/';
  const light = !scrolled && isHome;
  const links = NAV_LINKS[user?.role] || [];
  const badge = ROLE_BADGE[user?.role];

  return (
    <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${light ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className={`text-xl font-bold ${light ? 'text-white' : 'text-gray-900'}`}>ExpertBook</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {links.map(({ to, label }) => (
                  <Link key={to} to={to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === to
                        ? (light ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600')
                        : (light ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50')
                    }`}>{label}</Link>
                ))}
                <NotificationBell />
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                  {badge && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
                  <span className={`text-sm font-medium ${light ? 'text-white/80' : 'text-gray-600'}`}>{user?.name?.split(' ')[0]}</span>
                </div>
                <button onClick={handleLogout} className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${light ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-indigo-600'}`}>Login</Link>
                <Link to="/register" className="ml-2 px-5 py-2 rounded-xl text-sm font-semibold bg-white text-indigo-600 hover:bg-indigo-50 shadow-md transition-all">Get Started</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
            {[0,1,2].map(i => <div key={i} className={`w-5 h-0.5 ${i < 2 ? 'mb-1' : ''} ${light ? 'bg-white' : 'bg-gray-700'}`} />)}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
            {isAuthenticated ? (
              <>
                {links.map(({ to, label }) => (
                  <Link key={to} to={to} className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">{label}</Link>
                ))}
                {badge && <div className="px-4 py-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span><span className="ml-2 text-sm text-gray-600">{user?.name}</span></div>}
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded-lg text-red-600 hover:bg-red-50">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-indigo-50">Login</Link>
                <Link to="/register" className="block px-4 py-2 rounded-lg bg-indigo-600 text-white text-center font-semibold">Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
