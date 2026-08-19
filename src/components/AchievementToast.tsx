import { useEffect, useRef } from "react";
import { useOS } from "../state/os";
import { ACHIEVEMENTS } from "../lib/gamification/achievements";
import { toast } from "../state/toasts";

export function AchievementToast() {
  const { gamification } = useOS();
  const shown = useRef<Set<string>>(new Set(gamification.achievements));

  useEffect(() => {
    for (const id of gamification.achievements) {
      if (!shown.current.has(id)) {
        shown.current.add(id);
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) toast(`🏆 Achievement: ${a.name} — ${a.description}`, "ok");
      }
    }
  }, [gamification.achievements]);

  return null;
}
