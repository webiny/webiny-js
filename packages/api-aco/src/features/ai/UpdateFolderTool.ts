import { z } from "zod";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import type { UpdateFolderParams } from "~/folder/folder.types.js";

const inputSchema = z.object({
    folderId: z.string().describe("Folder id as returned by listFolders."),
    currentTitle: z
        .string()
        .describe(
            "The folder's current title, exactly as listFolders returned it. The update is refused if it does not match."
        ),
    title: z.string().optional().describe("New title. Omit it to keep the current one."),
    slug: z
        .string()
        .optional()
        .describe(
            "New URL-safe identifier, lowercase with hyphens. It is part of the folder's path. Omit it to keep the current one; a new title does not change it."
        ),
    parentId: z
        .string()
        .nullable()
        .optional()
        .describe(
            "Id of the folder to move this one into, from listFolders and of the same type. null moves it to the root. Omit it to leave the folder where it is."
        )
});

type Input = z.infer<typeof inputSchema>;

interface UpdatedFolder {
    id: string;
    title: string;
    slug: string;
    path: string;
    parentId: string | null;
    type: string;
}

/*
 * The current title is part of the input for the same reason as in deleteFolder: the approval then
 * names the folder that changes, and the handler checks that name against the stored folder.
 *
 * Only the fields the model passed are sent. Access rules are left out, so the update keeps the
 * stored ones, and `UpdateFolderUseCase` refuses a move into the folder itself or its subtree.
 *
 * A move under a folder of another type is refused here only. The folder feature accepts a parent
 * of another type on create and on update, but the admin lists each type's folders separately, so a
 * File Manager folder moved under a content model's folder disappears from both trees.
 */
class UpdateFolderToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private updateFolder: UpdateFolderUseCase.Interface
    ) {}

    async execute(input: Input): Promise<UpdatedFolder> {
        if (input.title === undefined && input.slug === undefined && input.parentId === undefined) {
            throw new Error(
                "Nothing to update: pass a new title, a new slug or a parentId to move the folder."
            );
        }

        const found = await this.getFolder.execute(input.folderId);

        if (found.isFail()) {
            throw new Error(
                `Folder "${input.folderId}" not found: ${found.error.message}. Call listFolders for valid ids.`
            );
        }

        const folder = found.value;

        if (folder.title !== input.currentTitle) {
            throw new Error(
                `Folder "${input.folderId}" is titled "${folder.title}", not "${input.currentTitle}", so nothing was updated. Check the folder with listFolders.`
            );
        }

        if (input.parentId) {
            await this.ensureSameType(folder, input.parentId);
        }

        const params: UpdateFolderParams = {};

        if (input.title !== undefined) {
            params.title = input.title;
        }

        if (input.slug !== undefined) {
            params.slug = input.slug;
        }

        if (input.parentId !== undefined) {
            params.parentId = input.parentId;
        }

        const result = await this.updateFolder.execute(folder.id, params);

        if (result.isFail()) {
            throw new Error(`Could not update the folder: ${result.error.message}`);
        }

        const updated = result.value;

        return {
            id: updated.id,
            title: updated.title,
            slug: updated.slug,
            path: updated.path,
            parentId: updated.parentId ?? null,
            type: updated.type
        };
    }

    private async ensureSameType(folder: { type: string }, parentId: string): Promise<void> {
        const parentResult = await this.getFolder.execute(parentId);

        if (parentResult.isFail()) {
            throw new Error(
                `Parent folder "${parentId}" not found: ${parentResult.error.message}. Call listFolders for valid ids.`
            );
        }

        const parent = parentResult.value;

        if (parent.type !== folder.type) {
            throw new Error(
                `Folder "${parent.title}" is of type "${parent.type}", and this folder is "${folder.type}". A folder can only move within its own type.`
            );
        }
    }
}

const UpdateFolderToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UpdateFolderToolHandlerImpl,
    dependencies: [GetFolderUseCase, UpdateFolderUseCase]
});

/**
 * Renames or moves one folder.
 *
 * Not destructive: the old title, slug and parent can be set again. A new slug or parent changes the
 * folder's path and its subfolders' paths, and with them which code-defined access rules apply, so
 * it still waits for the user to approve the exact arguments.
 */
class UpdateFolderToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "updateFolder";
    readonly title = "Update folder";
    readonly description =
        "Renames a folder, changes its slug, or moves it under another folder of the same type (parentId null moves it to the root). Call listFolders first for the id, the exact current title and the new parent. Access rules are changed with grantFolderAccess and revokeFolderAccess, not here. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };
    readonly handler = UpdateFolderToolHandler;
}

export const UpdateFolderTool = AiSdkToolDefinition.createImplementation({
    implementation: UpdateFolderToolImpl,
    dependencies: []
});
