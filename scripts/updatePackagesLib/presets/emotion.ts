import { createPreset } from "../createPreset";

export const emotion = createPreset(() => {
    return {
        name: "emotion",
        matching: /emotion/,
        skipResolutions: true,
        caret: true
    };
});
