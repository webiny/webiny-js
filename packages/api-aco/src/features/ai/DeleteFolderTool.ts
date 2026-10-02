import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { DeleteFolderUseCase } from "~/features/folder/DeleteFolder/index.js";
import { NotifyFolderChangeUseCase } from "./NotifyFolderChange/index.js";

const inputSchema = z.object({
    folderId: z.string().describe("Folder id as returned by listFolders."),
    title: z
        .string()
        .describe(
            "The folder's current title, exactly as listFolders returned it. The delete is refused if it does not match."
        )
});

type Input = z.infer<typeof inputSchema>;

interface DeletedFolder {
    id: string;
    title: string;
    path: string;
    type: string;
}

/*
 * The title is part of the input so the approval shows the user which folder goes, rather than only
 * an id. The model supplies it, so it is checked against the stored folder before anything is
 * deleted: what the user approved by name has to be the folder that is removed.
 */
class DeleteFolderToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private deleteFolder: DeleteFolderUseCase.Interface,
        private notifyFolderChange: NotifyFolderChangeUseCase.Interface
    ) {}

    async execute(input: Input): Promise<DeletedFolder> {
        const found = await this.getFolder.execute(input.folderId);

        if (found.isFail()) {
            throw new Error(
                `Folder "${input.folderId}" not found: ${found.error.message}. Call listFolders for valid ids.`
            );
        }

        const folder = found.value;

        if (folder.title !== input.title) {
            throw new Error(
                `Folder "${input.folderId}" is titled "${folder.title}", not "${input.title}", so nothing was deleted. Check the folder with listFolders.`
            );
        }

        const result = await this.deleteFolder.execute(folder.id);

        if (result.isFail()) {
            throw new Error(`Could not delete the folder: ${result.error.message}`);
        }

        await this.notifyFolderChange.execute({ id: folder.id, change: "deleted" });

        return { id: folder.id, title: folder.title, path: folder.path, type: folder.type };
    }
}

const DeleteFolderToolHandler = AiSdkToolHandler.createImplementation({
    implementation: DeleteFolderToolHandlerImpl,
    dependencies: [GetFolderUseCase, DeleteFolderUseCase, NotifyFolderChangeUseCase]
});

/**
 * Deletes one folder.
 *
 * Destructive, so the approval says it cannot be undone. Only an empty folder can go: the folder
 * feature refuses to delete one that still holds subfolders or content, and that error reaches the
 * model as-is.
 */
class DeleteFolderToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "deleteFolder";
    readonly title = "Delete folder";
    readonly description =
        "Deletes one empty folder. Folders that still contain subfolders or content are refused. Call listFolders first for the id and exact title. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };
    readonly handler = DeleteFolderToolHandler;
}

export const DeleteFolderTool = AiSdkToolDefinition.createImplementation({
    implementation: DeleteFolderToolImpl,
    dependencies: []
});
