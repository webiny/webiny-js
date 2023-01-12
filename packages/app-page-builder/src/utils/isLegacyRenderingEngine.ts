import { featureFlags } from "@webiny/feature-flags";

// @deprecation-warning pb-legacy-rendering-engine
export const isLegacyRenderingEngine = featureFlags.pbLegacyRenderingEngine === true;
