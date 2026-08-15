/**
 * The one status vocabulary for the W9 screens (spec §1). Every surface that shows a stage or run status —
 * the extractions list pips and tags, the stage rail, stage headers, run history — maps through here, so
 * the six states read identically everywhere.
 *
 * `DisplayStatus` is the vocabulary the UI renders. It is derived from the ledger's raw stage status
 * (pending/running/done/stale/failed) plus a little run context (whether this stage is the gate the run is
 * paused at), by `toDisplayStatus`.
 */

export type DisplayStatus = "complete" | "running" | "paused" | "failed" | "stale" | "not-started";

/** The admin-ui Tag variants this vocabulary uses — a subset, aliased to the design's tag families. */
export type StatusTagVariant = "success-light" | "accent-light" | "neutral-light" | "warning";

/** The glyph a status dot carries; "number" means the dot shows the stage number instead of an icon. */
export type StatusGlyph = "check" | "autorenew" | "pause" | "error" | "history" | "number";

export interface StatusConfig {
    label: string;
    tagVariant: StatusTagVariant;
    /** Tailwind classes for the dot's fill and border. */
    dot: string;
    /** Tailwind fill/text class for the dot's glyph or number. */
    glyphColor: string;
    glyph: StatusGlyph;
    /** Whether the dot pulses (the running state, spec §1: 1.4s pulse). */
    pulse: boolean;
    /** Tailwind background class for the nine-pip progress strip's bar in this state. */
    pip: string;
}

/**
 * The status → (dot, tag) mapping from spec §1. The dot carries the colour signal; the tag its family.
 * Values are design-system tokens only (success/primary/destructive/warning/neutral), no raw colours.
 */
export const STATUS_CONFIG: Record<DisplayStatus, StatusConfig> = {
    complete: {
        label: "Complete",
        tagVariant: "success-light",
        dot: "bg-success border border-transparent",
        glyphColor: "[&_svg]:fill-neutral-light",
        glyph: "check",
        pulse: false,
        pip: "bg-success"
    },
    running: {
        label: "Running",
        tagVariant: "accent-light",
        dot: "bg-primary border border-transparent",
        glyphColor: "[&_svg]:fill-neutral-light",
        glyph: "autorenew",
        pulse: true,
        pip: "bg-primary"
    },
    paused: {
        label: "Paused",
        tagVariant: "accent-light",
        dot: "bg-primary-subtle border border-primary",
        glyphColor: "[&_svg]:fill-primary",
        glyph: "pause",
        pulse: false,
        pip: "bg-primary-subtle"
    },
    failed: {
        label: "Failed",
        tagVariant: "neutral-light",
        dot: "bg-destructive border border-transparent",
        glyphColor: "[&_svg]:fill-neutral-light",
        glyph: "error",
        pulse: false,
        pip: "bg-destructive"
    },
    stale: {
        label: "Stale",
        // Spec §1 maps stale to the review tag family; the amber signal lives in the dot.
        tagVariant: "accent-light",
        dot: "bg-warning-muted border border-warning",
        glyphColor: "[&_svg]:fill-neutral-primary",
        glyph: "history",
        pulse: false,
        pip: "bg-warning-muted"
    },
    "not-started": {
        label: "Not started",
        tagVariant: "neutral-light",
        dot: "bg-neutral-base border border-neutral-muted",
        glyphColor: "text-neutral-strong",
        glyph: "number",
        pulse: false,
        pip: "bg-neutral-muted"
    }
};

/**
 * Map a ledger stage status (plus optional run context) to the display vocabulary.
 *
 * `pausedGate` is set by the caller when this stage is the gate the run is currently waiting at — a
 * not-yet-run stage whose predecessor is done and where the run has stopped for the operator. That is a UI
 * derivation, not a ledger status, so it is passed in rather than inferred here.
 */
export const toDisplayStatus = (
    ledgerStatus: string | undefined,
    opts?: { pausedGate?: boolean }
): DisplayStatus => {
    switch (ledgerStatus) {
        case "done":
            return "complete";
        case "starting":
        case "running":
            return "running";
        case "failed":
            return "failed";
        case "stale":
            return "stale";
        case "pending":
        default:
            return opts?.pausedGate ? "paused" : "not-started";
    }
};
