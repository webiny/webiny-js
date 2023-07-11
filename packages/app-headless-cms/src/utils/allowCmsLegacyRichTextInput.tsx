import { featureFlags } from "@webiny/feature-flags";

// @deprecation-warning pb-legacy-rendering-engine
export const allowCmsLegacyRichTextInput = featureFlags.allowCmsLegacyRichTextInput === true;
