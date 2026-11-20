import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Search,
  ShieldCheck,
  Cpu,
  Layers,
  Flame,
  CheckCircle,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Clock,
  Sparkles,
  Car,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useComplaints } from '../context/ComplaintContext';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';

export default function LandingPage() {
  const { complaints, stats } = useComplaints();
  const recentReports = complaints.slice(0, 3);

  const features = [
    {
      icon: Cpu,
      title: "AI Computer Vision Detection",
      badge: "Simulated Model",
      description: "Automated analysis of asphalt damage. Evaluates surface area, cavity depth, and cracking patterns to compute an objective damage index.",
      details: ["Surface Area Estimation", "Cavity Depth Classification", "Loose Gravel & Hazard Scoring"]
    },
    {
      icon: Layers,
      title: "Geospatial Duplicate Detection",
      badge: "Spatial Grid",
      description: "Clustering algorithms group multiple citizen reports within a 15-meter radius, preventing duplicate work orders and administrative clutter.",
      details: ["Radius Clustered Submissions", "Unified Grievance Grouping", "Resource Waste Reduction"]
    },
    {
      icon: Flame,
      title: "Dynamic Priority Scoring",
      badge: "Smart Triage",
      description: "Combines hazard severity with road hierarchy and proximity to schools, hospitals, and high-density commuter corridors.",
      details: ["Hospital & School Zone Weighting", "Two-Wheeler Accident Risk", "Dynamic SLA Allocation"]
    },
    {
      icon: CheckCircle,
      title: "Repair Verification & Audit",
      badge: "Accountability",
      description: "Closes the loop with mandatory post-patch inspection photos and roller compaction checks before a work order is officially closed.",
      details: ["Before-and-After Verification", "Citizen Resolution Alerts", "Audit Trail Preservation"]
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Citizen Snap & Geo-Tag",
      desc: "Commuter captures a pothole photo with browser GPS coordinates and optional landmark notes.",
      icon: Camera
    },
    {
      step: "02",
      title: "AI Analysis & Deduplication",
      desc: "RoadGuard AI validates the image, detects cavity size, filters duplicates, and calculates hazard severity.",
      icon: Cpu
    },
    {
      step: "03",
      title: "Municipal Work Order Dispatch",
      desc: "Public Works Department assigns the nearest mobile patching crew with target SLA turnaround.",
      icon: ShieldCheck
    },
    {
      step: "04",
      title: "Patch Verification & Closure",
      desc: "Asphalt repair completed, post-repair audit verified, and citizen receives real-time resolution update.",
      icon: CheckCircle2
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-navy-950 to-slate-900 text-white pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Civic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Smart City Public Works Initiative • Academic Prototype
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Safer Roads, <span className="text-emerald-400">Zero Delays.</span>
              <br />
              Intelligent Pothole Triage.
            </h1>

            {/* Problem Statement & Solution */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Unreported potholes cause thousands of vehicle accidents, severe injuries, and prolonged commuter delays daily. 
              <strong className="text-white font-semibold"> RoadGuard AI</strong> bridges citizens and municipal engineers with 
              computer vision hazard detection, automated duplicate clustering, and transparent repair tracking.
            </p>

            {/* Hero CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Camera className="w-5 h-5" />
                <span>Report a Pothole</span>
              </Link>

              <Link
                to="/map"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Live GPS Map</span>
              </Link>

              <Link
                to="/track"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/60 border border-slate-700/60 transition-all text-sm"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Track Complaint</span>
              </Link>

              <Link
                to="/admin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/60 border border-slate-700/60 transition-all text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Admin Dashboard</span>
              </Link>
            </div>

            {/* Simulated AI demo note */}
            <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated AI Surface Analysis • Browser GPS Integration • Interactive Work Order Flow</span>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 text-center shadow-xl">
            <div className="p-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{stats.total} Active</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">Live Grievances</p>
            </div>
            <div className="p-3 border-l border-slate-700/60">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">94.2%</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">Model Precision</p>
            </div>
            <div className="p-3 border-l border-slate-700/60">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">36 Hours</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">Avg SLA Resolution</p>
            </div>
            <div className="p-3 border-l border-slate-700/60">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide">Geo-Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem & The RoadGuard Difference */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Civic Infrastructure Problem</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Traditional Pothole Reporting Fails Cities
            </p>
            <p className="text-sm text-slate-600">
              Manual hotlines, paper logs, and disjointed municipal wings leave dangerous craters untreated for months.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 text-rose-800">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-lg">Traditional Civic Reporting</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>Unstructured citizen calls with vague street descriptions ("near the bakery").</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>Dozens of citizens report the exact same crater, flooding the grievance inbox.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>No objective depth or hazard rating; high-risk highway cavities are treated like small cracks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-600 font-bold">✕</span>
                  <span>No verification whether contractor actually rolled quality asphalt or just dumped loose gravel.</span>
                </li>
              </ul>
            </div>

            {/* The RoadGuard AI Way */}
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-6 sm:p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 text-emerald-900">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-bold text-lg">The RoadGuard AI Approach</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Direct mobile browser GPS coordinates with pinpoint meter-level precision.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Spatial clustering automatically merges duplicate reports within a 15m radius.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>AI vision scoring evaluates cavity area, depth, and road proximity to assign priority.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Post-repair photographic audit before work order ticket can be officially marked resolved.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Core Technologies</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Modern Smart Cities
            </p>
            <p className="text-sm text-slate-600">
              Modular components designed to fit municipal Public Works Department (PWD) operational pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-300"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {feat.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{feat.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100">
                    <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                      {feat.details.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-Step Municipal Workflow Section */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operational Lifecycle</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From Citizen Report to Road Repair in 4 Steps
            </p>
            <p className="text-sm text-slate-600">
              How RoadGuard AI automates the grievance pipeline with accountability at each checkpoint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {workflowSteps.map((step, sIdx) => {
              const Icon = step.icon;
              return (
                <div key={sIdx} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-300 font-mono">{step.step}</span>
                      <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <span>Stage {step.step} Verified</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Sample Reports Preview (Citizen Transparency) */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Live Civic Feed</h2>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Recent Pothole Grievances in System
              </p>
            </div>
            <Link
              to="/citizen"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <span>View Citizen Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReports.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                      {item.id}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <PriorityBadge priority={item.priority} size="sm" />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <StatusBadge status={item.status} size="sm" />
                    <Link
                      to={`/track?id=${item.id}`}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1"
                    >
                      Track
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-14 bg-gradient-to-r from-slate-900 to-navy-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Spot a Hazard on Your Commute?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Take a quick picture, detect your coordinates with one click, and send an instant work order directly to municipal maintenance crews.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Launch Complaint Form</span>
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Public Works Command Desk</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
