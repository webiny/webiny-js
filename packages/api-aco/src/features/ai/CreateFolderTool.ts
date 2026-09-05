import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";

const inputSchema = z.object({
    title: z.string().describe("Human-readable folder name, e.g. 'Marketing'."),
    slug: z
        .string()
        .describe("URL-safe identifier, e.g. 'marketing'. Lowercase, hyphens instead of spaces."),
    type: z
        .string()
        .describe(
            "Folder namespace: 'FmFile' for File Manager, or 'cms:<modelId>' for a content model's folders."
        ),
    parentId: z
        .string()
        .optional()
        .describe("Id of the parent folder. Omit to create at the root of that namespace.")
});

type Input = z.infer<typeof inputSchema>;

interface CreatedFolder {
    id: string;
    title: string;
    slug: string;
    path: string;
    type: string;
}

/**
 * Creates a folder.
 *
 * Additive and reversible, so it is not flagged destructive — but it still changes the project, so it
 * is not read-only either and therefore needs the user to approve the exact arguments.
 */
class CreateFolderToolImpl implements IAiSdkTool<Input> {
    readonly name = "createFolder";
    readonly title = "Create folder";
    readonly description =
        "Creates a folder in the File Manager ('FmFile') or under a content model ('cms:<modelId>'). Call listFolders first to pick a parent, or omit parentId for the root. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };

    constructor(private createFolder: CreateFolderUseCase.Interface) {}

    async execute(input: Input): Promise<CreatedFolder> {
        const params: {
            title: string;
            slug: string;
            type: string;
            parentId: string | null;
        } = {
            title: input.title,
            slug: input.slug,
            type: input.type,
            parentId: null
        };

        if (input.parentId) {
            params.parentId = input.parentId;
        }

        const result = await this.createFolder.execute(params);

        if (result.isFail()) {
            throw new Error(`Could not create the folder: ${result.error.message}`);
        }

        const folder = result.value;

        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            path: folder.path,
            type: folder.type
        };
    }
}

export const CreateFolderTool = AiSdkTool.createImplementation({
    implementation: CreateFolderToolImpl,
    dependencies: [CreateFolderUseCase]
});
