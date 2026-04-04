import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08, ease: 'easeOut' } }),
};

const experts = [
  { name: 'Rahina Johnson', role: 'Product Manager',   skills: ['Strategy', 'Agile', 'UX'],    rating: 4.9, reviews: 128, bg: 'bg-stone-700' },
  { name: 'utsukta Chen',    role: 'Full-Stack Engineer', skills: ['React', 'Node.js', 'AWS'],   rating: 4.8, reviews: 94,  bg: 'bg-accent-700' },
  { name: 'Samikshya Patel',   role: 'Data Scientist',     skills: ['ML', 'Python', 'Analytics'],  rating: 4.9, reviews: 76,  bg: 'bg-stone-600' },
];

const steps = [
  { n: '1', title: 'Create Your Profile',    desc: 'Sign up and tell us your goals and skill level.' },
  { n: '2', title: 'Get Matched',            desc: 'Our system recommends the best mentors for you.' },
  { n: '3', title: 'Book a Session',         desc: 'Pick a time that works with flexible scheduling.' },
  { n: '4', title: 'Learn & Grow',           desc: 'Attend your session and accelerate your growth.' },
];

const testimonials = [
  { name: 'Marcus Lee',   role: 'Junior Developer',  text: 'ExpertBook helped me land my first dev job. My mentor gave me real-world advice that no bootcamp could.', bg: 'bg-stone-700' },
  { name: 'Priya Sharma', role: 'Product Designer',  text: 'The recommendations were spot-on. I found a mentor who had the exact experience I was looking for.',      bg: 'bg-accent-700' },
  { name: 'James Okafor', role: 'Data Analyst',      text: 'Three sessions in and I already got a promotion. The quality of mentors here is unmatched.',              bg: 'bg-stone-600' },
];

const stats = [
  { value: '2,400+',  label: 'Expert Mentors' },
  { value: '18,000+', label: 'Sessions Booked' },
  { value: '4.9',     label: 'Avg. Rating' },
  { value: '95%',     label: 'Success Rate' },
];

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen font-sans bg-white">
      <Navbar />

      {/* -- HERO -- warm cream */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 border-b border-stone-200" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="section-label mb-4">
              Professional Mentorship Platform
            </motion.p>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl sm:text-5xl font-extrabold text-stone-900 leading-[1.1] tracking-tight mb-5">
              Find the Right Expert<br />
              <span className="text-accent-600">for Your Career</span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-base text-stone-500 mb-8 leading-relaxed max-w-md">
              Connect with verified professionals, get personalized guidance, and grow with 1-on-1 mentorship sessions matched to your goals.
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-3 mb-12">
              <Link to={isAuthenticated ? '/experts' : '/register'}
                className="btn-primary btn-lg">
                {isAuthenticated ? 'Find Mentors' : 'Get Started Free'}
              </Link>
              <Link to="/experts" className="btn-outline btn-lg">
                Browse Experts
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-stone-200">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-stone-900">{s.value}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mentor preview cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:flex flex-col gap-3">
            {experts.map((e, i) => (
              <div key={e.name} className="card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded ${e.bg} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-stone-900 text-sm font-medium truncate">{e.name}</p>
                  <p className="text-stone-400 text-xs truncate">{e.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-500 text-xs font-semibold">? {e.rating}</p>
                  <p className="text-stone-400 text-xs">{e.reviews} reviews</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* -- FEATURED EXPERTS -- soft sage green tint */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-200" style={{ backgroundColor: '#F0FDF4' }}>
        <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
          <p className="section-label mb-1.5">Top Mentors</p>
          <h2 className="text-2xl font-bold text-stone-900">Meet Our Featured Experts</h2>
          <p className="text-stone-500 mt-1.5 text-sm">Hand-picked professionals ready to guide your next career milestone.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((e, i) => (
            <motion.div key={e.name}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className="card card-hover p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded ${e.bg} flex items-center justify-center text-white font-semibold text-xs`}>
                  {e.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm">{e.name}</h3>
                  <p className="text-xs text-stone-500">{e.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {e.skills.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 text-sm">?</span>
                  <span className="text-sm font-semibold text-stone-700">{e.rating}</span>
                  <span className="text-xs text-stone-400">({e.reviews})</span>
                </div>
                <Link to="/experts" className="btn-primary btn-sm">Book Session</Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mt-7 text-center">
          <Link to="/experts" className="btn-outline">Browse All Experts →</Link>
        </motion.div>
        </div>
      </section>

      {/* -- HOW IT WORKS -- warm amber tint */}
      <section className="py-16 border-y border-stone-200" style={{ backgroundColor: '#FFF7ED' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-10 text-center">
            <p className="section-label mb-1.5">Simple Process</p>
            <h2 className="text-2xl font-bold text-stone-900">How It Works</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.n}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                <div className="w-8 h-8 rounded bg-accent-600 flex items-center justify-center text-white text-sm font-bold mb-3">
                  {step.n}
                </div>
                <h4 className="font-semibold text-stone-900 text-sm mb-1.5">{step.title}</h4>
                <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -- TESTIMONIALS -- cool lavender tint */}
      <section className="py-16 border-b border-stone-200" style={{ backgroundColor: '#F5F3FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mb-8 text-center">
          <p className="section-label mb-1.5">Success Stories</p>
          <h2 className="text-2xl font-bold text-stone-900">What Our Users Say</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className="card card-hover p-5">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, s) => <span key={s} className="text-amber-500 text-sm">?</span>)}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                <div className={`w-8 h-8 rounded-full ${t.bg} flex items-center justify-center text-white text-xs font-semibold`}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </section>

      {/* -- CTA -- deep warm green */}
      <section className="py-16" style={{ backgroundColor: '#ECFDF5' }}>
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Ready to Accelerate Your Career?</h2>
          <p className="text-stone-500 text-sm mb-7">Join thousands of professionals who found their perfect mentor on ExpertBook.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary btn-lg">Get Started Free</Link>
            <Link to="/experts" className="btn-outline btn-lg">Browse Mentors</Link>
          </div>
        </div>
      </section>

      {/* -- FOOTER -- */}
      <footer className="bg-stone-900 border-t border-stone-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <span className="text-white font-semibold text-sm">ExpertBook</span>
          </div>
          <p className="text-stone-500 text-xs">� {new Date().getFullYear()} ExpertBook. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-stone-500">
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
