import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import notificationService from '../services/notificationService';

const TYPE_CONFIG = {
  booking_confirmed:  { icon: '✅', color: 'bg-green-100 text-green-600' },
  booking_cancelled:  { icon: '❌', color: 'bg-red-100 text-red-600' },
  booking_rejected:   { icon: '⛔', color: 'bg-red-100 text-red-600' },
  session_reminder:   { icon: '⏰', color: 'bg-blue-100 text-blue-600' },
  new_review:         { icon: '⭐', color: 'bg-amber-100 text-amber-600' },
  verification_update:{ icon: '🛡️', color: 'bg-purple-100 text-purple-600' },
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    const handleClickOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { clearInterval(interval); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const fetchUnreadCount = async () => {
    try { const data = await notificationService.getUnreadCount(); setUnreadCount(data.count); } catch {}
  };

  const handleToggle = async () => {
    if (!isOpen) {
      setLoading(true);
      try { const data = await notificationService.getNotifications(); setNotifications(data); } catch {} finally { setLoading(false); }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDelete = async (id) => {
    try {
      const n = notifications.find(n => n._id === id);
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (!n?.isRead) setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-gray-900 text-sm">Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">{unreadCount}</span>}</span>
              {unreadCount > 0 && <button onClick={handleMarkAllAsRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" /></div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center"><p className="text-3xl mb-2">🔕</p><p className="text-sm text-gray-400">No notifications yet</p></div>
              ) : notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || { icon: '🔔', color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={n._id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!n.isRead ? 'bg-indigo-50/40' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                        {n.link && <Link to={n.link} onClick={() => { handleMarkAsRead(n._id); setIsOpen(false); }} className="text-xs text-indigo-600 font-medium hover:underline">View →</Link>}
                        {!n.isRead && <button onClick={() => handleMarkAsRead(n._id)} className="text-xs text-gray-400 hover:text-indigo-600">Mark read</button>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(n._id)} className="text-gray-300 hover:text-red-400 text-lg leading-none mt-0.5">×</button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
