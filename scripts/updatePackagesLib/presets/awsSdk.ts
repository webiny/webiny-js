import { createPreset } from "../createPreset";

export const awsSdk = createPreset(() => {
    return {
        name: "aws-sdk",
        matching: /^@aws-sdk\/|^aws\-/,
        exclude: ["aws-elasticsearch-connector"],
        skipResolutions: true
    };
});
