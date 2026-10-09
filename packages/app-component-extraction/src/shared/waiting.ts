import type { Stage } from "~/constants.js";
import type { RunDto } from "~/shared/types.js";

/**
 * What each stage is doing while the user waits, in one plain sentence (waiting-screens-plan.md). The
 * stage descriptions say what a stage is for; these say what is happening now.
 */
export const WAITING_SENTENCES: Record<Stage, string> = {
    discover: "Reading the site's sitemap and links to find the pages worth capturing.",
    capture: "Opening each page in a browser and recording its layout, text, colours and images.",
    segment: "Cutting each captured page into its sections.",
    cluster: "Grouping sections that share a design, across pages.",
    classify: "Naming each group and deciding what kind of component it is.",
    plan: "Deciding each component's editable fields and the theme tokens it binds to.",
    generate:
        "Writing a component for each group and checking it renders, keeps the site's text and binds to the theme.",
    assemble: "Rebuilding each captured page from the generated components.",
    promote: "Copying the chosen components into the component library."
};

/** "4 min 12 s", "38 s": how long a stage has been running. No estimate of what is left. */
export const formatElapsed = (seconds: number): string => {
    const whole = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(whole / 60);
    const rest = whole % 60;
    return minutes > 0 ? `${minutes} min ${rest} s` : `${rest} s`;
};

/**
 * Per-item failures in a stage that finished: the reasons are in its activity log, so a degraded stage
 * opens it, as a failed one does. Null when nothing failed, or the artifact is not loaded.
 */
export const degradedSummary = (stage: Stage, artifact: unknown): string | null => {
    const failed = (artifact as { failed?: unknown[] } | null)?.failed;
    const count = Array.isArray(failed) ? failed.length : 0;
    if (count === 0) {
        return null;
    }
    if (stage === "capture") {
        return `${count} page${count === 1 ? "" : "s"} could not be captured.`;
    }
    if (stage === "generate") {
        return `${count} component${count === 1 ? " did not pass its" : "s did not pass their"} checks.`;
    }
    return null;
};

/** What a finished stage produced, from the run's counts, for the step between stages. */
export const finishedSummary = (stage: Stage, counts: RunDto["counts"]): string | null => {
    switch (stage) {
        case "discover":
            return `${counts.pages} page${counts.pages === 1 ? "" : "s"} found to capture.`;
        case "classify":
            return `${counts.clusters} group${counts.clusters === 1 ? "" : "s"} named.`;
        case "assemble":
            return `${counts.pages} page${counts.pages === 1 ? "" : "s"} rebuilt from the components.`;
        case "capture":
            return `${counts.pages} page${counts.pages === 1 ? "" : "s"} captured.`;
        case "segment":
            return `${counts.sections} section${counts.sections === 1 ? "" : "s"} found.`;
        case "cluster":
            return `${counts.clusters} group${counts.clusters === 1 ? "" : "s"} of sections.`;
        case "plan":
        case "generate":
            return `${counts.components} component${counts.components === 1 ? "" : "s"}.`;
        default:
            return null;
    }
};
