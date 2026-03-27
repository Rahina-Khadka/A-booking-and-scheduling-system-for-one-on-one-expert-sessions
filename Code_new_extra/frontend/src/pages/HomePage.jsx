import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

/* ── Reusable fade-in variant ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' },
  }),
};

/* ── Static data ── */
const featuredExperts = [
  { name: 'Sarah Johnson', role: 'Senior Product Manager', expertise: ['Product Strategy', 'Agile', 'UX'], rating: 4.9, reviews: 128, color: 'from-indigo-400 to-purple-500' },
  { name: 'David Chen', role: 'Full-Stack Engineer', expertise: ['React', 'Node.js', 'AWS'], rating: 4.8, reviews: 94, color: 'from-cyan-400 to-blue-500' },
  { name: 'Aisha Patel', role: 'Data Scientist', expertise: ['ML', 'Python', 'TensorFlow'], rating: 4.9, reviews: 76, color: 'from-green-400 to-teal-500' },
];

const steps = [
  { icon: '👤', title: 'Create Your Profile', desc: 'Sign up and tell us your goals, interests, and skill level.' },
  { icon: '🤖', title: 'Get AI Recommendations', desc: 'Our AI matches you with the best mentors for your needs.' },
  { icon: '📅', title: 'Book a Session', desc: 'Pick a time that works for you with flexible scheduling.' },
  { icon: '🚀', title: 'Learn & Grow', desc: 'Attend your session and accelerate your career growth.' },
];

const testimonials = [
  { name: 'Marcus Lee', role: 'Junior Developer', text: 'ExpertBook helped me land my first dev job. My mentor gave me real-world advice that no bootcamp could.', avatar: 'ML', color: 'from-indigo-400 to-purple-500' },
  { name: 'Priya Sharma', role: 'Product Designer', text: 'The AI recommendations were spot-on. I found a mentor who had the exact experience I was looking for.', avatar: 'PS', color: 'from-pink-400 to-rose-500' },
  { name: 'James Okafor', role: 'Data Analyst', text: 'Three sessions in and I already got a promotion. The quality of mentors here is unmatched.', avatar: 'JO', color: 'from-amber-400 to-orange-500' },
];

const stats = [
  { value: '2,400+', label: 'Expert Mentors' },
  { value: '18,000+', label: 'Sessions Booked' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '95%', label: 'Success Rate' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500">
        {/* Background blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
            >
              Find the Right Expert Mentor{' '}
              <span className="text-cyan-300">for Your Career</span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg"
            >
              Connect with industry-leading professionals, get personalized guidance, and accelerate your growth with AI-matched mentorship sessions.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-4"
            >
              {isAuthenticated ? (
                <Link to="/experts" className="px-8 py-3.5 rounded-2xl bg-white text-indigo-600 font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  Find Mentors
                </Link>
              ) : (
                <>
                  <Link to="/experts" className="px-8 py-3.5 rounded-2xl bg-white text-indigo-600 font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    Find Mentors
                  </Link>
                  <Link to="/register" className="px-8 py-3.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold text-base hover:bg-white/25 transition-all">
                    Start Learning
                  </Link>
                </>
              )}
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="mt-10 flex flex-wrap gap-6"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — floating mentor cards */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex flex-col gap-4 items-end"
          >
            {featuredExperts.map((e, i) => (
              <motion.div
                key={e.name}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                className="glass rounded-2xl p-4 flex items-center gap-4 w-72 shadow-xl"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${e.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{e.name}</div>
                  <div className="text-white/70 text-xs truncate">{e.role}</div>
                  <div className="text-amber-300 text-xs mt-0.5">★ {e.rating} · {e.reviews} reviews</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURED EXPERTS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Top Mentors</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Meet Our Featured Experts</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Hand-picked professionals ready to guide you through your next career milestone.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredExperts.map((expert, i) => (
            <motion.div
              key={expert.name}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              whileHover={{ y: -6 }}
              className="glass-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-white/60"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${expert.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {expert.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                  <p className="text-sm text-gray-500">{expert.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {expert.expertise.map((tag) => (
                  <span key={tag} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium border border-indigo-100">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-semibold text-gray-700">{expert.rating}</span>
                  <span className="text-xs text-gray-400">({expert.reviews} reviews)</span>
                </div>
                <Link
                  to="/experts"
                  className="text-sm font-semibold px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-600 hover:to-cyan-600 transition-all shadow-sm"
                >
                  Book Session
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/experts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
          >
            Browse All Experts
            <span>→</span>
          </Link>
        </motion.div>
      </section>

      {/* ── AI RECOMMENDATIONS ── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <span>🤖</span> Powered by AI
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">AI-Powered Mentor Recommendations</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              Our intelligent recommendation engine analyzes your profile, learning goals, and past sessions to surface the mentors most likely to help you succeed — no manual searching required.
            </p>
            <ul className="space-y-3">
              {[
                'Matches based on your skill gaps and career goals',
                'Learns from your session history and feedback',
                'Surfaces mentors with proven results in your field',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/90 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-600 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Try AI Matching →
            </Link>
          </motion.div>

          {/* AI visual card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-6 shadow-2xl"
          >
            <div className="text-white/80 text-sm font-medium mb-4">🎯 Your AI Match Score</div>
            {featuredExperts.map((e, i) => (
              <div key={e.name} className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${e.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-white text-sm font-medium mb-1">
                    <span>{e.name}</span>
                    <span>{[97, 93, 89][i]}%</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${[97, 93, 89][i]}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">How It Works</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">From sign-up to your first session in minutes.</p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-indigo-200 via-cyan-200 to-indigo-200" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="text-center relative"
              >
                <div className="relative inline-flex">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 border-2 border-indigo-100 flex items-center justify-center text-3xl mx-auto shadow-sm"
                  >
                    {step.icon}
                  </motion.div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mt-4 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-indigo-600 font-semibold text-sm uppercase tracking-widest">Success Stories</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">What Our Users Say</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                whileHover={{ y: -4 }}
                className="bg-[#F8FAFC] rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 relative">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-white/80 text-lg mb-8 relative">
            Join thousands of professionals who found their perfect mentor on ExpertBook.
          </p>
          <div className="flex flex-wrap justify-center gap-4 relative">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-2xl bg-white text-indigo-600 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/experts"
              className="px-8 py-3.5 rounded-2xl bg-white/15 border border-white/30 text-white font-semibold hover:bg-white/25 transition-all"
            >
              Browse Mentors
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="text-white font-bold">ExpertBook</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} ExpertBook. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link to="/experts" className="hover:text-white transition-colors">Find Mentors</Link>
            <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
