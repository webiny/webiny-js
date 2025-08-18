import { createPreset } from "../createPreset";

export const jest = createPreset(() => {
    return {
        name: "jest",
        matching: /^@jest\/|^jest|^@types\/jest|jest/,
        skipResolutions: true
    };
});
