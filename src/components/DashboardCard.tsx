import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: 'violet' | 'emerald' | 'amber' | 'blue' | 'red';
}

const colorMap = {
  violet: {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'shadow-violet-500/5',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/5',
  },
};

export default function DashboardCard({ title, value, icon: Icon, trend, color }: DashboardCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${colors.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-gray-500">{trend}</p>
          )}
        </div>
        <div className={`rounded-xl ${colors.bg} p-3`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
