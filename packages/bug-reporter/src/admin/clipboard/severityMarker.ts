import type { EventSeverity } from "./toEventRows.js";

const MARKERS: Record<EventSeverity, string> = {
    error: "🔴",
    warning: "🟡"
};

/*
 * Makes errors and warnings stand out in a long timeline. Coloured circles rather than ⚠️ or ❌:
 * both are two columns wide in every monospace font, so the plain-text copy stays aligned.
 */
export function severityMarker(severity: EventSeverity): string {
    return MARKERS[severity];
}
