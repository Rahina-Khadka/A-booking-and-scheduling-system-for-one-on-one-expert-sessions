import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

const NAV_LINKS = {
  user:   [{ to: '/dashboard', label: 'Dashboard' }, { to: '/experts', label: 'Find Experts' }, { to: '/bookings', label: 'My Bookings' }],
  expert: [{ to: '/expert-dashboard', label: 'Dashboard' }, { to: '/bookings', label: 'Sessions' }],
  admin:  [{ to: '/admin', label: 'Admin Panel' }],
};

const ROLE_BADGE = {
  user:   { label: 'Learner', cls: 'bg-stone-100 text-stone-600 border border-stone-200' },
  expert: { label: 'Expert',  cls: 'bg-accent-50 text-accent-700 border border-accent-200' },
  admin:  { label: 'Admin',   cls: 'bg-stone-100 text-stone-600 border border-stone-200' },
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const links = NAV_LINKS[user?.role] || [];
  const badge = ROLE_BADGE[user?.role];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded bg-accent-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs leading-none">E</span>
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-tight">ExpertBook</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {isAuthenticated ? (
              <>
                {links.map(({ to, label }) => {
                  const active = location.pathname === to || location.pathname.startsWith(to + '/');
                  return (
                    <Link key={to} to={to}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        active
                          ? 'bg-accent-50 text-accent-700'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                      }`}>
                      {label}
                    </Link>
                  );
                })}
                <div className="mx-3 h-4 w-px bg-stone-200" />
                <NotificationBell />
                <div className="flex items-center gap-2 ml-1">
                  {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>}
                  <span className="text-sm text-stone-600">{user?.name?.split(' ')[0]}</span>
                </div>
                <button onClick={handleLogout}
                  className="ml-3 text-sm text-stone-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded hover:bg-red-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 rounded hover:bg-stone-50 transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="ml-2 px-4 py-1.5 rounded bg-accent-600 text-white text-sm font-medium hover:bg-accent-700 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <button className="md:hidden p-1.5 rounded hover:bg-stone-100" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="space-y-1.5 w-5">
              {[0,1,2].map(i => <div key={i} className="h-0.5 bg-stone-600 rounded-full" />)}
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-4 py-3 space-y-1">
          {isAuthenticated ? (
            <>
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className="block px-3 py-2 rounded text-sm text-stone-700 hover:bg-stone-50">{label}</Link>
              ))}
              {badge && (
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                  <span className="text-sm text-stone-600">{user?.name}</span>
                </div>
              )}
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 rounded text-sm text-stone-700 hover:bg-stone-50">Sign in</Link>
              <Link to="/register" className="block px-3 py-2 rounded bg-accent-600 text-white text-sm font-medium text-center">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
