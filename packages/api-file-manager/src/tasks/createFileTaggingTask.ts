import { createTaskDefinition } from "@webiny/tasks";
import type { FileManagerContext } from "~/types.js";
import { Context as WebsocketsContext } from "@webiny/api-websockets";

export const createFileTaggingTask = () => {
    return createTaskDefinition<FileManagerContext & WebsocketsContext>({
        id: "fmAiImageTagging",
        title: "File Upload Background task",
        isPrivate: true,
        async run(params) {
            const { input, response, context } = params;

            // TODO: Get tag information from AI

            // TODO: Update File Tags
            await context.fileManager.updateFile(input.fileId, {
                // tags: ["tag1", "tag2", "tag3"]
            });

            // TODO: send message to WebSocket

            return response.done(
                "successfully ran the fmAiImageTagging background task",
                input.fileId
            );
        }
    });
};
