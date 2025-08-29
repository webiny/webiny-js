import { createPreset } from "../createPreset";

export const ts = createPreset(() => {
    return {
        name: "typescript",
        matching: /typescript/,
        skipResolutions: true,
        caret: false
    };
});
