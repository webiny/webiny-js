import { createPreset } from "../createPreset";

export const pino = createPreset(() => {
    return {
        name: "pino",
        matching: /pino/,
        caret: true,
        skipResolutions: true
    };
});
