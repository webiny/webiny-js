import { createFeature } from "@webiny/feature/api";
import { AiFeature } from "@webiny/api-core/features/ai/index.js";
import { AiImageTaggingFeature } from "~/features/ai/AiImageTaggingFeature.js";

/**
 * Registers the AI image tagging feature together with the Ai service.
 * Intended for use as an API extension entry point.
 */
export const AiImageTaggingApiFeature = createFeature({
  name: "FileManagerAi/AiImageTaggingApiFeature",
  register(container) {
    AiFeature.register(container);
    AiImageTaggingFeature.register(container);
  },
});
