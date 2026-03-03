import { createPreset } from "../createPreset";

export const reactRelated = createPreset(() => {
    return {
        name: "react and related",
        matching: /react/,
        skipResolutions: false,
        caret: true
    };
});
