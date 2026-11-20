import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }) {
  const colorStyles = {
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      accent: 'border-l-emerald-500'
    },
    navy: {
      bgIcon: 'bg-slate-100 text-slate-800 border-slate-200',
      accent: 'border-l-navy-800'
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-200',
      accent: 'border-l-amber-500'
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-600 border-rose-200',
      accent: 'border-l-rose-500'
    },
    sky: {
      bgIcon: 'bg-sky-50 text-sky-600 border-sky-200',
      accent: 'border-l-sky-500'
    }
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-shadow relative overflow-hidden border-l-4 ${style.accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              {trend && (
                <span className="font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                  {trend}
                </span>
              )}
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${style.bgIcon} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
