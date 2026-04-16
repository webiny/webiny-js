import { createPreset } from "../createPreset";

export const oxfmt = createPreset(() => {
    return {
        name: "oxfmt",
        matching: /oxfmt/,
        skipResolutions: true,
        caret: true
    };
});
