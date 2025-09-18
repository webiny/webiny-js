import { createPreset } from "../createPreset";

export const react = createPreset(() => {
    return {
        name: "react",
        matching: /^react$|^react-dom$|^@types\/react$|^@types\/react-dom$/,
        skipResolutions: false,
        caret: false
    };
});
