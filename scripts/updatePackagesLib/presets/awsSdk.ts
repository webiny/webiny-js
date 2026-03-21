import { createPreset } from "../createPreset";

export const awsSdk = createPreset(() => {
    return {
        name: "aws-sdk",
        matching: /aws/,
        skipResolutions: true
    };
});
