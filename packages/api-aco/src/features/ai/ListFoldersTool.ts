import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";

const inputSchema = z.object({
    type: z
        .string()
        .describe(
            "Folder namespace, e.g. 'FmFile' for the file manager or 'cms:<modelId>' for a content model's folders."
        )
});

type Input = z.infer<typeof inputSchema>;

interface FolderSummary {
    id: string;
    title: string;
    slug: string;
    path: string;
    parentId?: string | null;
    permissions: { target: string; level: string; inherited: boolean }[];
}

/**
 * Lists folders with their current access rules, so a permission change is proposed against a real
 * folder id and the user can see what the access already is before approving a change to it.
 */
class ListFoldersToolImpl implements IAiSdkTool<Input> {
    readonly name = "listFolders";
    readonly title = "List folders";
    readonly description =
        "Lists folders of a given type with their ids, paths and current access permissions. Call this before changing folder permissions so the change targets a real folder.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };

    constructor(private listFolders: ListFoldersUseCase.Interface) {}

    async execute(input: Input): Promise<FolderSummary[]> {
        const result = await this.listFolders.execute({ where: { type: input.type } });

        if (result.isFail()) {
            throw new Error(`Could not list folders: ${result.error.message}`);
        }

        return result.value.folders.map(folder => ({
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            path: folder.path,
            parentId: folder.parentId,
            permissions: (folder.permissions ?? []).map(permission => ({
                target: permission.target,
                level: permission.level,
                // Inherited rules cannot be edited on this folder — only on the ancestor that set them.
                inherited: Boolean(permission.inheritedFrom)
            }))
        }));
    }
}

export const ListFoldersTool = AiSdkTool.createImplementation({
    implementation: ListFoldersToolImpl,
    dependencies: [ListFoldersUseCase]
});
