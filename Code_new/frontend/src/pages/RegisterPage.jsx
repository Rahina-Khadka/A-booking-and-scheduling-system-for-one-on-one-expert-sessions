import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import userService from '../services/userService';

const DOC_FIELDS = [
  { key: 'resume', label: 'Resume / CV', required: true, accept: '.pdf,.doc,.docx,image/*' },
  { key: 'certificate', label: 'Degree Certificate', required: true, accept: '.pdf,.doc,.docx,image/*' },
  { key: 'experienceProof', label: 'Experience Proof', required: true, accept: '.pdf,.doc,.docx,image/*' },
  { key: 'governmentId', label: 'Government ID (optional)', required: false, accept: '.pdf,image/*' },
];

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [documents, setDocuments] = useState({ resume: '', certificate: '', experienceProof: '', governmentId: '' });
  const [docNames, setDocNames] = useState({ resume: '', certificate: '', experienceProof: '', governmentId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const fileRefs = useRef({});

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDocUpload = async (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const b64 = await userService.fileToBase64(file);
    setDocuments(prev => ({ ...prev, [key]: b64 }));
    setDocNames(prev => ({ ...prev, [key]: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.role === 'expert') {
      if (!documents.resume || !documents.certificate || !documents.experienceProof) {
        setError('Please upload all required documents (Resume, Certificate, Experience Proof).');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (formData.role === 'expert') payload.documents = documents;
      const userData = await register(payload);
      if (userData.role === 'expert') navigate('/expert-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-bold text-white">ExpertBook</span>
          </Link>
          <p className="text-white/70 mt-2 text-sm">Start your mentorship journey</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition bg-white/80 text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition bg-white/80 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition bg-white/80 text-sm"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">I want to join as</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'user', label: '🎓 Learner', desc: 'Find a mentor' },
                  { value: 'expert', label: '👨‍💼 Expert', desc: 'Become a mentor' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                      formData.role === opt.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-200'
                    }`}
                  >
                    <input type="radio" name="role" value={opt.value} checked={formData.role === opt.value} onChange={handleChange} className="sr-only" />
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Document uploads — only for experts */}
            {formData.role === 'expert' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/50 space-y-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-600 text-lg">📋</span>
                  <p className="text-sm font-semibold text-gray-800">Verification Documents</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Upload your documents so our admin can verify your credentials. Your profile will be visible after approval.
                </p>
                {DOC_FIELDS.map(({ key, label, required, accept }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <div
                      onClick={() => fileRefs.current[key]?.click()}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                        documents[key]
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white hover:border-indigo-300 text-gray-500'
                      }`}
                    >
                      <span className="text-base">{documents[key] ? '✅' : '📎'}</span>
                      <span className="truncate flex-1">{docNames[key] || 'Click to upload'}</span>
                      {documents[key] && <span className="text-xs text-green-600 font-medium flex-shrink-0">Uploaded</span>}
                    </div>
                    <input
                      ref={el => fileRefs.current[key] = el}
                      type="file" accept={accept}
                      onChange={e => handleDocUpload(key, e)}
                      className="hidden"
                    />
                  </div>
                ))}
              </motion.div>
            )}

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center mt-5 text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
