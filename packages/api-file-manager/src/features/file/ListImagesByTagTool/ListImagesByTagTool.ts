import { z } from "zod";
import { AiSdkTool, type IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListFilesUseCase } from "~/features/file/ListFiles/index.js";

const inputSchema = z.object({
    tag: z.string().describe("Tag to filter images by")
});

type Input = z.infer<typeof inputSchema>;

interface ImageItem {
    id: string;
    name: string;
    type: string;
    tags: string[];
}

class ListImagesByTagToolImpl implements IAiSdkTool<Input> {
    readonly name = "listImagesByTag";
    readonly description =
        "Lists images from the file manager filtered by a given tag. Returns name, type, and tags for each image.";
    readonly inputSchema = inputSchema;

    constructor(private listFiles: ListFilesUseCase.Interface) {}

    async execute(input: Input): Promise<ImageItem[]> {
        console.log("Call images tool", input);
        const result = await this.listFiles.execute({
            where: {
                type_startsWith: "image/",
                tags_in: [input.tag]
            },
            limit: 50
        });

        if (result.isFail()) {
            return [];
        }

        return result.value.items.map(file => ({
            id: file.id,
            name: file.name,
            type: file.type,
            tags: file.tags
        }));
    }
}

export const ListImagesByTagTool = AiSdkTool.createImplementation({
    implementation: ListImagesByTagToolImpl,
    dependencies: [ListFilesUseCase]
});
