export interface StepColour {
    label: string;
    value: string;
}

/*
 * The ten step colour presets (R273, UI-2), stored as the prototype's CSS variable strings so they
 * follow the theme (the review UI renders `step.color` as a CSS background, 8a). The labels are the
 * prototype's (`Workflow Editor.dc.html:505`).
 */
export const STEP_COLOURS: StepColour[] = [
    { label: "Orange", value: "var(--color-primary-500)" },
    { label: "Rust", value: "var(--color-primary-800)" },
    { label: "Amber", value: "var(--color-warning-600)" },
    { label: "Olive", value: "var(--color-warning-800)" },
    { label: "Teal", value: "var(--color-success-500)" },
    { label: "Green", value: "var(--color-success-800)" },
    { label: "Red", value: "var(--color-destructive-500)" },
    { label: "Maroon", value: "var(--color-destructive-700)" },
    { label: "Gray", value: "var(--color-neutral-500)" },
    { label: "Ink", value: "var(--color-neutral-900)" }
];

// A new step takes Orange.
export const DEFAULT_STEP_COLOUR = "var(--color-primary-500)";

// What a step with an empty stored colour is drawn with (the server stores "" by default).
export const FALLBACK_STEP_COLOUR = "var(--color-neutral-500)";

export const HEX_COLOUR_MESSAGE = "Enter a hex colour, e.g. #3B6FD4.";
