type CoverageMeterProps = {
  label: string;
  value: number;
};

export function CoverageMeter({ label, value }: CoverageMeterProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <progress
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary"
        aria-label={`${label} source coverage`}
        max={100}
        value={value}
      />
    </div>
  );
}
