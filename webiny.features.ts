import type { IFeatureFlagsDto } from "@webiny/feature-flags";

export default {
    aiPowerups: false,
    fileManager: {
        threatDetection: false
    },
    recordLocking: false
} satisfies IFeatureFlagsDto;
