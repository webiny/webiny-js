import { createPreset } from "../createPreset";

export const prettier = createPreset(() => {
    return {
        name: "prettier",
        matching: /prettier/,
        skipResolutions: true,
        caret: true
    };
});
