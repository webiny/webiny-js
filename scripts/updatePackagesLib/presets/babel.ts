import { createPreset } from "../createPreset";

export const babel = createPreset(() => {
    return {
        name: "babel",
        matching: /^@babel\/|^babel\-/,
        skipResolutions: false,
        caret: true
    };
});
