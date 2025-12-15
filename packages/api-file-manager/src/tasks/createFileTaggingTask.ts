import { createTaskDefinition } from "@webiny/tasks";
import type { FileManagerContext } from "~/types.js";
import { Context as WebsocketsContext } from "@webiny/api-websockets";
import OpenAI from "openai";

interface AITaggingResponse {
    tags: string[];
}

async function getTagsFromAI(imageUrl: string): Promise<AITaggingResponse> {
    const apiKey = process.env.WEBINY_API_OPEN_AI_API_KEY;

    if (!apiKey) {
        throw new Error("WEBINY_API_OPEN_AI_API_KEY environment variable is not set");
    }

    const openai = new OpenAI({
        apiKey: apiKey
    });

    const prompt = `You are an AI trained to visually analyze real images (not filenames or metadata) and generate concise, human-friendly metadata for image organization and accessibility.

    Task: Visually Analyze the image from the provided public URL. Do not create or modify any image.

    Given this image URL, return:
      1. Tags (5 maximum) —
        - Single words or short phrases only.
        - Avoid duplicates or overly specific variations.
        - Reflect the main subjects, mood, setting, or concept of the image.
        - Use lowercase words separated by commas.
      2. Alt Text (Caption) —
        - One clear, natural-sounding sentence (under 25 words).
        - Describe what a person would perceive in the image without interpretation or exaggeration.
        - Avoid starting with "Image of" or "Picture of."

    Output Format:
    Tags: [tag1, tag2, tag3, tag4, tag5]
    Alt Text: "Your caption here."`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }
        ],
        max_tokens: 300
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse the response
    const tagsMatch = responseText.match(/Tags:\s*\[(.*?)\]/);

    const tags = tagsMatch
        ? tagsMatch[1]
              .split(",")
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
        : [];

    return {
        tags
    };
}

export const createFileTaggingTask = () => {
    return createTaskDefinition<FileManagerContext & WebsocketsContext>({
        id: "fmAiImageTagging",
        title: "File Upload Background task",
        isPrivate: true,
        async run(params) {
            const { input, response, context } = params;

            // Get the file to access its URL
            const file = await context.fileManager.getFile(input.fileId);

            if (!file) {
                return response.error("File not found");
            }

            // Get tag information from AI
            let tags: string[] = [];

            try {
                const settings = await context.fileManager.getSettings();
                const fileURL = (settings?.srcPrefix || "") + file.key;

                const aiResponse = await getTagsFromAI(fileURL);
                tags = aiResponse.tags;
            } catch (error) {
                console.error("Error getting tags from AI:", error);
                return response.error(`Failed to get tags from AI: ${error.message}`);
            }

            // Update File Tags
            await context.fileManager.updateFile(input.fileId, {
                tags: tags
            });

            // Send message to WebSocket
            const allConnections = await context.websockets.listConnections();

            await context.websockets.sendToConnections(allConnections, {
                action: "fm.file.tags",
                data: {
                    tags,
                    id: input.fileId
                }
            });

            return response.done(
                "successfully ran the fmAiImageTagging background task",
                input.fileId
            );
        }
    });
};
