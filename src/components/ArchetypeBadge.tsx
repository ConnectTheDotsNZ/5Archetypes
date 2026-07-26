import { ARCHETYPES, type Element } from "@/lib/archetypes";

const BADGE_COLOR: Record<Element, string> = {
  Wood: "bg-wood/10 text-wood border-wood/30",
  Fire: "bg-fire/10 text-fire border-fire/30",
  Earth: "bg-earth/10 text-earth border-earth/30",
  Metal: "bg-metal/10 text-metal border-metal/30",
  Water: "bg-water/10 text-water border-water/30",
};

export function ArchetypeBadge({ element }: { element: Element }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold font-body ${BADGE_COLOR[element]}`}
    >
      {element}: {ARCHETYPES[element].nickname}
    </span>
  );
}
