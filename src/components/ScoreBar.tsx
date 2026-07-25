import { ELEMENTS, type ScoreProfile } from "@/lib/archetypes";

const BAR_COLOR: Record<string, string> = {
  Wood: "bg-wood",
  Fire: "bg-fire",
  Earth: "bg-earth",
  Metal: "bg-metal",
  Water: "bg-water",
};

export function ScoreBar({ scores }: { scores: ScoreProfile }) {
  return (
    <div className="flex flex-wrap gap-3 font-body text-sm">
      {ELEMENTS.map((el) => (
        <div key={el} className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${BAR_COLOR[el]}`} />
          <span className="text-muted">{el}</span>
          <span className="font-semibold text-ink">{scores[el].toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
