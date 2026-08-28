export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-navy-700/60 rounded-lg ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3.5 px-4">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
