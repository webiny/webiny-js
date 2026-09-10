import type { AspectRatioPreset } from "./types.js";

/**
 * Default aspect ratios shown in the image editor's preview strip.
 * A later phase will let a field lock to one of these (or a custom ratio).
 */
export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
    { id: "square", label: "Square", ratio: 1 },
    { id: "4:3", label: "4:3", ratio: 4 / 3 },
    { id: "16:9", label: "16:9", ratio: 16 / 9 }
];
