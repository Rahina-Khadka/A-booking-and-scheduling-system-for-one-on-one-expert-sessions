import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

/**
 * Home Page Component
 * Landing page with system overview
 */
const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Connect with Expert Mentors
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Book one-on-one sessions with industry experts and accelerate your learning journey
          </p>
          {!isAuthenticated && (
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="bg-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="bg-white text-primary border-2 border-primary px-8 py-3 rounded-lg text-lg hover:bg-gray-50"
              >
                Login
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="bg-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 inline-block"
            >
              Go to Dashboard
            </Link>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-semibold mb-2">Expert Mentors</h3>
            <p className="text-gray-600">
              Connect with experienced professionals in various fields
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Easy Scheduling</h3>
            <p className="text-gray-600">
              Book sessions at your convenience with flexible time slots
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
            <p className="text-gray-600">
              Get expert suggestions based on your interests and goals
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Create Profile</h4>
              <p className="text-sm text-gray-600">Sign up and set your interests</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Browse Experts</h4>
              <p className="text-sm text-gray-600">Find mentors in your field</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Book Session</h4>
              <p className="text-sm text-gray-600">Schedule a convenient time</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Learn & Grow</h4>
              <p className="text-sm text-gray-600">Attend your mentoring session</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
