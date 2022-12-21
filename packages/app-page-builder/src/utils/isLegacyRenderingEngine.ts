import { featureFlags } from "@webiny/feature-flags";

export const isLegacyRenderingEngine = featureFlags.pbLegacyRenderingEngine === true;
