import React from 'react';
import { useRescue } from '../context/RescueContext';
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Heart,
  ShieldCheck,
  TrendingUp,
  Users,
  Compass,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export const ImpactPage: React.FC = () => {
  const { navigateTo, analytics, cases } = useRescue();

  const totalReports = analytics?.totalReports ?? cases.length;
  const completedCases = analytics?.completedCases ?? cases.filter((c) => c.status === 'Closed').length;
  const activeRescues = analytics?.activeRescues ?? cases.filter((c) => c.status !== 'Closed' && c.status !== 'Reported').length;
  const verifiedRescuers = analytics?.verifiedRescuers ?? 0;
  const avgResponseTime = analytics?.averageResponseTimeMinutes;
  const closureRate = analytics?.caseClosureRate;

  // Real charts or fallback
  const monthlyTrends = analytics?.monthlyTrends && analytics.monthlyTrends.length > 0
    ? analytics.monthlyTrends
    : [
        { month: 'Current Period', rescues: totalReports },
      ];

  const speciesData = analytics?.speciesDistribution && analytics.speciesDistribution.length > 0
    ? analytics.speciesDistribution
    : [
        { name: 'Dog', count: cases.filter((c) => c.animalType === 'Dog').length },
        { name: 'Cat', count: cases.filter((c) => c.animalType === 'Cat').length },
        { name: 'Cow', count: cases.filter((c) => c.animalType === 'Cow').length },
        { name: 'Bird', count: cases.filter((c) => c.animalType === 'Bird').length },
        { name: 'Other', count: cases.filter((c) => c.animalType === 'Other').length },
      ].filter((x) => x.count > 0);

  const urgencyData = analytics?.urgencyDistribution && analytics.urgencyDistribution.length > 0
    ? analytics.urgencyDistribution
    : [
        { name: 'Critical', count: cases.filter((c) => c.urgency === 'Critical').length },
        { name: 'High', count: cases.filter((c) => c.urgency === 'High').length },
        { name: 'Moderate', count: cases.filter((c) => c.urgency === 'Moderate').length },
      ].filter((x) => x.count > 0);

  const SPECIES_COLORS = ['#145C4A', '#20A67A', '#F2B84B', '#E65353', '#64748B'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-[#145C4A]">
          <Activity className="w-3.5 h-3.5 text-[#20A67A]" />
          <span>Real Database Analytics & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172B26] font-heading">
          Public Impact & Rescue Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Aggregated performance indicators derived dynamically from live PostgreSQL database records.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Total Reports</span>
          <div className="text-2xl font-extrabold text-[#145C4A] font-heading mt-0.5 tabular-nums">
            {totalReports}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Recorded SOS alerts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Active Rescues</span>
          <div className="text-2xl font-extrabold text-[#F2B84B] font-heading mt-0.5 tabular-nums">
            {activeRescues}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">In transit / care</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Completed Cases</span>
          <div className="text-2xl font-extrabold text-[#20A67A] font-heading mt-0.5 tabular-nums">
            {completedCases}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Full recovery closures</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Case Closure Rate</span>
          <div className="text-2xl font-extrabold text-[#20A67A] font-heading mt-0.5 tabular-nums">
            {closureRate !== null && closureRate !== undefined ? `${closureRate}%` : 'Not available yet'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Resolution efficiency</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Verified Rescuers</span>
          <div className="text-2xl font-extrabold text-[#145C4A] font-heading mt-0.5 tabular-nums">
            {verifiedRescuers}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Authenticated staff</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block">Avg Response Time</span>
          <div className="text-2xl font-extrabold text-slate-900 font-heading mt-0.5 tabular-nums">
            {avgResponseTime !== null && avgResponseTime !== undefined ? `${avgResponseTime} min` : 'Not available yet'}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Dispatch to arrival</span>
        </div>
      </div>

      {/* Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Monthly Rescue Intake Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Calculated from actual database reports</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#20A67A]" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="rescuesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#20A67A" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#20A67A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="rescues"
                  stroke="#145C4A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rescuesGrad)"
                  name="Reports Logged"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-1">
              Species Case Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown across reported street animals</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {speciesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={speciesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {speciesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SPECIES_COLORS[index % SPECIES_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No report records available yet</div>
            )}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {speciesData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: SPECIES_COLORS[idx % SPECIES_COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate max-w-[190px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trauma Case Frequency by Urgency */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Emergency Frequency by Urgency
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Critical trauma triage prioritization</p>
          </div>
        </div>

        <div className="h-60 w-full">
          {urgencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#145C4A" radius={[0, 4, 4, 0]} name="Cases Logged" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Not available yet. No emergency reports logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
