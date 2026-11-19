import React, { useState } from 'react';
import {
  ArrowRight,
  Cpu,
  MapPin,
  Recycle,
  ShieldCheck,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types/repair';

// 1. Splash Screen
export const SplashScreen: React.FC = () => {
  const { navigate, user } = useApp();

  return (
    <div className="min-h-screen bg-[#0B132B] text-white flex flex-col justify-between p-6 lg:p-12">
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <span className="font-display text-xl font-bold tracking-tight">RepairSaathi</span>
        <button
          type="button"
          onClick={() => navigate(user ? 'customer-home' : 'login')}
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          Sign In
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto py-12">
        <div className="lg:col-span-7 space-y-6">
          <p className="text-sm font-medium text-emerald-400">
            AI-Powered Electronics Repair &amp; Reuse Network
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-balance">
            Repair Smart. Save Money. Reduce Waste.
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            Upload a photo for preliminary AI fault diagnostics, compare transparent quotes from
            verified local technicians, track every bench stage, and keep digital warranties in one
            place.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate('onboarding')}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="px-6 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-200 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Sign In to Workspace
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
            <img
              src="/src/assets/images/hero_repair_workbench_1795094465715.jpg"
              alt="Technician inspecting a smartphone logic board at a precision ESD workbench"
              referrerPolicy="no-referrer"
              className="w-full h-72 lg:h-96 object-cover"
            />
            <div className="p-5 flex items-center justify-between text-xs text-slate-300">
              <span>Verified ESD Workshops</span>
              <span aria-hidden="true">·</span>
              <span>Itemized Parts &amp; Labour</span>
              <span aria-hidden="true">·</span>
              <span>90–180 Day Warranty</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-6">
        <span>Bengaluru Launch Corridor · Indiranagar · Koramangala · Whitefield</span>
        <span>Authorised CPCB E-Waste Partners</span>
      </footer>
    </div>
  );
};

// 2. Onboarding Screen
const ONBOARDING_SLIDES = [
  {
    title: 'Preliminary AI Fault Diagnosis',
    body: 'Snap or upload a photo of a cracked screen, scorched port, or hinge defect. Gemini Vision identifies likely root causes, safe precautions, and expected spare-part ranges before you visit a shop.',
    highlight: 'Transparent parts vs labour estimates in INR',
    icon: Cpu,
  },
  {
    title: 'Verified Local Technicians & Quote Bidding',
    body: 'Discover background-verified repair labs sorted by distance and rating. Compare multiple itemized quotations side by side and approve the right specialist.',
    highlight: 'Exact address stays masked until booking acceptance',
    icon: MapPin,
  },
  {
    title: '8-Stage Tracking, Digital Warranty & E-Waste Reuse',
    body: 'Follow your device from Request Submitted to Delivered, verify Razorpay payments securely, store digital invoices & warranties, or schedule certified e-waste collection.',
    highlight: 'Extend device lifespan and cut landfill waste',
    icon: Recycle,
  },
];

export const OnboardingScreen: React.FC = () => {
  const { navigate } = useApp();
  const [step, setStep] = useState(0);
  const current = ONBOARDING_SLIDES[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-8">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-lg text-slate-950 dark:text-white">
            RepairSaathi
          </span>
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            Skip
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Step 0{step + 1} of 03
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white text-balance">
            {current.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {current.body}
          </p>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 pt-1">
            {current.highlight}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {ONBOARDING_SLIDES.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === step
                    ? 'w-7 bg-emerald-600'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (step < ONBOARDING_SLIDES.length - 1) {
                  setStep(step + 1);
                } else {
                  navigate('login');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-sm font-semibold cursor-pointer"
            >
              {step < ONBOARDING_SLIDES.length - 1 ? 'Next' : 'Continue to Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Login Screen
export const LoginScreen: React.FC = () => {
  const { login, loginDemoRole, navigate, loading, errorMessage } = useApp();
  const [email, setEmail] = useState('ananya@repairsaathi.in');
  const [password, setPassword] = useState('Repair@2026');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch {
      // Handled by context errorMessage
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('splash')}
              className="font-display font-bold text-lg text-slate-950 dark:text-white cursor-pointer"
            >
              RepairSaathi
            </button>
            <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white pt-2">
              Sign in to your account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Access customer bookings, technician workbenches, or admin governance.
            </p>
          </div>

          {(localError || errorMessage) && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
            >
              {localError || errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">New to RepairSaathi?</span>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Instant Role Access Panel */}
        <div className="lg:col-span-5 bg-[#0B132B] text-white rounded-2xl p-8 flex flex-col justify-between space-y-6 border border-slate-800">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-semibold">Instant Role Workspaces</h2>
            <p className="text-sm text-slate-300">
              Sign in directly with seeded demo accounts to inspect Customer, Technician, and
              Administrator workflows.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => loginDemoRole('customer')}
              className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Customer · Ananya Sharma</span>
                <UserIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                AI Diagnosis · Nearby Search · Quote Comparison · Warranties
              </p>
            </button>

            <button
              type="button"
              onClick={() => loginDemoRole('technician')}
              className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Technician · Arjun Nair</span>
                <Wrench className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Accept Requests · Submit Quotes · 8-Stage Progress · Earnings
              </p>
            </button>

            <button
              type="button"
              onClick={() => loginDemoRole('admin')}
              className="w-full text-left p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Administrator · Sumanth H</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verify Technicians · Complaints · Revenue &amp; E-Waste Analytics
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Registration Screen
export const RegisterScreen: React.FC = () => {
  const { register, navigate, loading, errorMessage } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [area, setArea] = useState('Indiranagar');
  const [role, setRole] = useState<UserRole>('customer');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (name.trim().length < 2) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    try {
      await register({ name, email, phone, password, role, city, area });
    } catch {
      // Handled by context
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            Create your RepairSaathi account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register as a device owner or local repair technician.
          </p>
        </div>

        {(localError || errorMessage) && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
          >
            {localError || errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Account Type
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  role === 'customer'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('technician')}
                className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  role === 'technician'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Technician
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Karthik Verma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="reg-phone"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Phone
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-city"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                City
              </label>
              <input
                id="reg-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="reg-area"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Neighborhood / Area
              </label>
              <input
                id="reg-area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Password (min 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-sm cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Role Selection Screen
export const RoleSelectionScreen: React.FC = () => {
  const { loginDemoRole, user, navigate } = useApp();

  const roles: Array<{
    role: UserRole;
    title: string;
    subtitle: string;
    capabilities: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      role: 'customer',
      title: 'Customer Portal',
      subtitle: 'Ananya Sharma · Indiranagar',
      capabilities:
        'Register devices, run Gemini AI damage diagnosis, compare nearby technicians, approve quotations, pay securely, and store digital warranties.',
      icon: UserIcon,
    },
    {
      role: 'technician',
      title: 'Technician Workbench',
      subtitle: 'Arjun Nair · Indiranagar MicroFix Lab',
      capabilities:
        'Accept or decline requests, submit itemized spare-parts & labour quotes, update 8-stage repair progress, upload repair evidence, and track earnings.',
      icon: Wrench,
    },
    {
      role: 'admin',
      title: 'Administrator Console',
      subtitle: 'Sumanth H · Platform Governance',
      capabilities:
        'Review & verify technician KYC documents, monitor bookings & payments, resolve complaints, manage reported accounts, and inspect analytics.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Select Workspace Role
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Currently signed in as {user?.name ?? 'Guest'} ({user?.role ?? 'none'}). Choose a role
            to explore its live API workspace.
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={() =>
              navigate(
                user.role === 'technician'
                  ? 'tech-dashboard'
                  : user.role === 'admin'
                  ? 'admin-dashboard'
                  : 'customer-home'
              )
            }
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium cursor-pointer whitespace-nowrap"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((item) => {
          const Icon = item.icon;
          const active = user?.role === item.role;
          return (
            <div
              key={item.role}
              className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 ${
                active
                  ? 'border-emerald-600'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.capabilities}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loginDemoRole(item.role)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-950 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {active ? 'Open Active Workspace' : `Switch to ${item.title}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
