import { ContextPlugin } from "@webiny/api";
import { AiImageTaggingFeature } from "./features/AiImageTaggingFeature.js";

export { AI_IMAGE_TAGGING_TASK_ID } from "./tasks/AiImageTaggingTask.js";

const contextPlugin = new ContextPlugin(context => {
    AiImageTaggingFeature.register(context.container);
});

contextPlugin.name = "fileManagerAi.context";

export const createFileManagerAi = () => [contextPlugin];
