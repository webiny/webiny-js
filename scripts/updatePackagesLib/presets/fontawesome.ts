import { createPreset } from "../createPreset";

export const fontawesome = createPreset(() => {
    return {
        name: "fontawesome",
        matching: /fontawesome|fortawesome/,
        skipResolutions: true,
        caret: true
    };
});
