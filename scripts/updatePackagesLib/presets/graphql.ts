import { createPreset } from "../createPreset";

export const graphql = createPreset(() => {
    return {
        name: "graphql",
        matching: /graphql/,
        skipResolutions: true,
        caret: true
    };
});
