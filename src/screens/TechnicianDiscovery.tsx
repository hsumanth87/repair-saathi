import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { filterTechnicians } from '../utils/repairLogic';
import type { DeviceCategory, Review, Technician } from '../types/repair';

// 10. Nearby Technicians Screen
export const NearbyTechniciansScreen: React.FC = () => {
  const { technicians, setSelectedTechId, navigate } = useApp();

  const [category, setCategory] = useState<DeviceCategory | 'All'>('All');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(25);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(500);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedTechId, setFocusedTechId] = useState<string>('tech-1');

  const filtered = useMemo(
    () =>
      filterTechnicians(technicians, {
        category,
        maxDistanceKm,
        minRating,
        maxInspectionFee: maxFee,
        verifiedOnly,
        searchQuery,
        userLat: 12.9716,
        userLng: 77.5946,
      }),
    [technicians, category, maxDistanceKm, minRating, maxFee, verifiedOnly, searchQuery]
  );

  // Project Bengaluru lat/lng onto clean SVG map coordinates
  const projectPoint = (lat: number, lng: number) => {
    const minLat = 12.92;
    const maxLat = 13.0;
    const minLng = 77.56;
    const maxLng = 77.77;
    const x = ((lng - minLng) / (maxLng - minLng)) * 520 + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 220 + 30;
    return {
      x: Math.max(30, Math.min(570, x)),
      y: Math.max(25, Math.min(255, y)),
    };
  };

  const userOrigin = projectPoint(12.9716, 77.5946);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Nearby Repair Technicians
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            PostGIS proximity search around Indiranagar, Bengaluru · Filter by category, distance, rating &amp; fee.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
          {filtered.length} workshops matched
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Search technicians or workshops"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workshop, area, or specialist..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DeviceCategory | 'All')}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          >
            <option value="All">All Categories</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Laptop">Laptop</option>
            <option value="Tablet">Tablet</option>
            <option value="Audio">Audio</option>
            <option value="Appliance">Appliance</option>
            <option value="Smartwatch">Smartwatch</option>
          </select>

          <select
            aria-label="Maximum distance"
            value={maxDistanceKm}
            onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
          </select>

          <select
            aria-label="Minimum rating"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          >
            <option value={0}>Any Rating</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={4.8}>4.8+ Stars</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Verified Identity &amp; Workshop Docs Only
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400">
              Max Checkup Fee: <strong className="font-mono tabular-nums">₹{maxFee}</strong>
            </span>
            <input
              type="range"
              aria-label="Maximum inspection fee"
              min={150}
              max={500}
              step={50}
              value={maxFee}
              onChange={(e) => setMaxFee(Number(e.target.value))}
              className="accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Interactive Proximity Corridor Map */}
      <div className="bg-[#0B132B] text-white rounded-2xl border border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 p-4">
          <svg
            viewBox="0 0 600 280"
            role="img"
            aria-label="Bengaluru technician proximity map"
            className="w-full h-56 sm:h-64 rounded-xl bg-slate-900/90"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(148,163,184,0.12)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="600" height="280" fill="url(#grid)" />

            {/* Radius ring around user */}
            <circle
              cx={userOrigin.x}
              cy={userOrigin.y}
              r={Math.min(180, maxDistanceKm * 6)}
              fill="rgba(16,185,129,0.08)"
              stroke="rgba(16,185,129,0.45)"
              strokeDasharray="4 4"
            />

            {/* User pin */}
            <circle cx={userOrigin.x} cy={userOrigin.y} r="6" fill="#38bdf8" />
            <text
              x={userOrigin.x - 10}
              y={userOrigin.y - 12}
              fill="#e2e8f0"
              fontSize="11"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Your Area (BLR)
            </text>

            {/* Technician pins */}
            {filtered.map((tech) => {
              const pt = projectPoint(tech.lat, tech.lng);
              const active = focusedTechId === tech.id;
              return (
                <g
                  key={tech.id}
                  onClick={() => setFocusedTechId(tech.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={active ? 10 : 7}
                    fill={tech.verified ? '#10b981' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x + 12}
                    y={pt.y + 4}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight={active ? '700' : '500'}
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {tech.area} ({tech.distanceKm} km)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="lg:col-span-4 p-5 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between space-y-4">
          {(() => {
            const focused = filtered.find((t) => t.id === focusedTechId) ?? filtered[0];
            if (!focused) {
              return (
                <p className="text-sm text-slate-300">
                  No workshops match the current filters. Try expanding your radius or fee cap.
                </p>
              );
            }
            return (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-emerald-400 font-medium">
                    Selected Map Pin · {focused.distanceKm} km away
                  </p>
                  <h2 className="font-display text-lg font-bold">{focused.workshopName}</h2>
                  <p className="text-xs text-slate-300">
                    Lead Tech: {focused.name} · Rating {focused.rating.toFixed(1)} ({focused.reviewCount})
                  </p>
                  <p className="text-xs text-slate-400">{focused.bio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechId(focused.id);
                      navigate('tech-profile');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Open Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechId(focused.id);
                      navigate('booking');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-xs font-semibold cursor-pointer"
                  >
                    Book Now
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Technician Directory Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            No technicians found within {maxDistanceKm} km for these criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('All');
              setMaxDistanceKm(25);
              setMinRating(0);
              setMaxFee(500);
              setVerifiedOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((tech) => (
            <div
              key={tech.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={tech.avatarUrl}
                  alt={tech.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-slate-950 dark:text-white truncate">
                      {tech.workshopName}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {tech.distanceKm} km
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span>{tech.name}</span>
                    <span aria-hidden="true">·</span>
                    {tech.verified ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Verification Pending</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 pt-1">
                    {tech.bio}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Rating</span>
                  <span className="font-semibold tabular-nums flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {tech.rating.toFixed(1)} ({tech.reviewCount})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Checkup Fee</span>
                  <span className="font-mono font-semibold tabular-nums mt-0.5 block">
                    ₹{tech.inspectionFeeInr}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Response</span>
                  <span className="font-mono font-semibold tabular-nums mt-0.5 block">
                    ~{tech.responseMinutes} min
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {tech.categories.join(' · ')}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechId(tech.id);
                      navigate('tech-profile');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechId(tech.id);
                      navigate('booking');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 11. Technician Profile Screen
export const TechnicianProfileScreen: React.FC = () => {
  const { selectedTechId, technicians, navigate } = useApp();
  const [techDetail, setTechDetail] = useState<Technician | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fallbackTech = technicians.find((t) => t.id === selectedTechId) ?? technicians[0];
  const tech = techDetail ?? fallbackTech;

  useEffect(() => {
    const targetId = selectedTechId ?? fallbackTech?.id;
    if (!targetId) return;
    fetch(`/api/technicians/${targetId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.technician) {
          setTechDetail(data.technician);
          setReviews(data.reviews ?? []);
        }
      })
      .catch(() => {});
  }, [selectedTechId, fallbackTech?.id]);

  if (!tech) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('nearby-techs')}
        className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        ← Back to Nearby Technicians
      </button>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={tech.avatarUrl}
              alt={tech.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                  {tech.workshopName}
                </h1>
                {tech.verified && (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" aria-label="Verified workshop" />
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Lead Specialist: {tech.name} · {tech.area}, {tech.city}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specialties: {tech.categories.join(' · ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('booking')}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer shrink-0"
          >
            Book Inspection (₹{tech.inspectionFeeInr})
          </button>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{tech.bio}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-800 text-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Customer Rating</span>
            <span className="font-mono font-bold tabular-nums">
              {tech.rating.toFixed(1)} / 5.0 ({tech.reviewCount})
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Completed Jobs</span>
            <span className="font-mono font-bold tabular-nums">{tech.completedRepairs}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Service Radius</span>
            <span className="font-mono font-bold tabular-nums">{tech.serviceRadiusKm} km</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Avg Response</span>
            <span className="font-mono font-bold tabular-nums flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {tech.responseMinutes} mins
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-base font-bold">Verified Credentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tech.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{doc.docType}</p>
                  <p className="font-mono text-slate-500 mt-0.5">{doc.docNumberMasked}</p>
                </div>
                <span
                  className={`font-semibold capitalize ${
                    doc.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h2 className="font-display text-base font-bold">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No reviews submitted for this workshop yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {rev.customerName}
                    </span>
                    <span className="font-mono text-amber-600 tabular-nums">
                      {rev.rating}.0 / 5.0
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
