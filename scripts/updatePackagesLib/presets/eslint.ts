import { createPreset } from "../createPreset";

export const eslint = createPreset(() => {
    return {
        name: "eslint",
        matching: /eslint/,
        skipResolutions: true,
        caret: true
    };
});
