import { createPreset } from "../createPreset";

export const lexical = createPreset(() => {
    return {
        name: "lexical",
        matching: /^@lexical\/|^lexical/,
        skipResolutions: false,
        caret: false
    };
});
