import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, RotateCcw, Award, ExternalLink, Cpu } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';

export default function Footer() {
  const { resetToSampleData } = useComplaints();

  return (
    <footer className="mt-auto bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <ShieldAlert className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                RoadGuard<span className="text-emerald-400">.AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Intelligent Pothole Detection and Smart Road Maintenance System. 
              Bridging citizen reports with computer vision-driven hazard triage and dynamic municipal crew dispatch.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>College Project Capstone • Civil & AI Smart City Initiative</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Citizen & Operations
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Overview & Architecture
                </Link>
              </li>
              <li>
                <Link to="/citizen" className="hover:text-emerald-400 transition-colors">
                  Citizen Grievance Portal
                </Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-emerald-400 transition-colors">
                  Report a Pothole (Demo AI)
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-emerald-400 transition-colors">
                  Track Complaint Progress
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-400 transition-colors">
                  Admin Command Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Prototype Controls & Verification */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Prototype Controls
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              All demo submissions and status modifications update reactive local state in your browser session.
            </p>
            <button
              onClick={resetToSampleData}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reset Sample Complaints</span>
            </button>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/90">
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>Edge Vision Pipeline: Simulated</span>
            </div>
          </div>
        </div>

        {/* Prototype Transparency Notice */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            © 2026 RoadGuard AI Prototype. Academic Demonstration Project. 
            All simulated road data and mock IDs are generated for validation.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Frontend v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
