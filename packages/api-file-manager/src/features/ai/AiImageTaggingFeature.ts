import { createFeature } from "@webiny/feature/api";
import { AiTagAfterCreateHandler } from "./AiTagAfterCreateHandler.js";
import { AiImageTaggingTask } from "~/tasks/AiImageTaggingTask.js";

export const AiImageTaggingFeature = createFeature({
  name: "FileManagerAi/AiImageTagging",
  register(container) {
    container.register(AiTagAfterCreateHandler);
    container.register(AiImageTaggingTask);
  },
});
