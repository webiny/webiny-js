import { createPreset } from "../createPreset";

export const oxlint = createPreset(() => {
    return {
        name: "oxlint",
        matching: /oxlint/,
        skipResolutions: true,
        caret: true
    };
});
