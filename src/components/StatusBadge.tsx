interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'disabled';
}

const statusConfig = {
  active: {
    label: 'ACTIVE',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  inactive: {
    label: 'INACTIVE',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  disabled: {
    label: 'DISABLED',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-emerald-400' : 
        status === 'disabled' ? 'bg-red-400' : 'bg-amber-400'
      }`} />
      {config.label}
    </span>
  );
}
