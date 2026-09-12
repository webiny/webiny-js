import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { loadFolderPermissions } from "./loadFolderPermissions.js";

const inputSchema = z.object({
    folderId: z.string().describe("Folder id as returned by listFolders."),
    target: z
        .string()
        .describe(
            "Whose access to remove: 'team:<slug>' or 'admin:<userId>', exactly as listFolders reports it."
        )
});

type Input = z.infer<typeof inputSchema>;

interface RevokeResult {
    folderId: string;
    title: string;
    path: string;
    removed: { target: string; level: string };
    /**
     * Every direct rule remaining afterwards.
     *
     * This is the set the update was asked to store, not an independent read of it:
     * `UpdateFolderWithFolderLevelPermissions` returns the permissions it derived from the input
     * rather than the ones the repository wrote. Treating it as a verification would let the tool
     * confirm its own request back to itself.
     */
    permissions: { target: string; level: string }[];
}

/**
 * Removes one target's direct access to one folder.
 *
 * Destructive: somebody loses access, and there is no undo. Refuses when the target has no DIRECT rule
 * rather than reporting a removal that changed nothing — an inherited grant cannot be revoked here,
 * only where it is defined, and saying otherwise would leave the user believing access was withdrawn.
 */
class RevokeFolderAccessToolImpl implements IAiSdkTool<Input> {
    readonly name = "revokeFolderAccess";
    readonly title = "Revoke folder access";
    readonly description =
        "Removes one team's or user's direct access to one folder, leaving all other permissions untouched. Cannot remove inherited access. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private updateFolder: UpdateFolderUseCase.Interface
    ) {}

    async execute(input: Input): Promise<RevokeResult> {
        const loaded = await loadFolderPermissions(this.getFolder, input.folderId);

        const existing = loaded.direct.find(
            permission => String(permission.target) === input.target
        );

        if (!existing) {
            if (loaded.inheritedTargets.has(input.target)) {
                throw new Error(
                    `"${input.target}" has inherited access to this folder, not a direct rule, so it cannot be revoked here. Change it where it is defined.`
                );
            }

            throw new Error(
                `"${input.target}" has no direct access to this folder, so there is nothing to revoke.`
            );
        }

        const permissions = loaded.direct.filter(
            permission => String(permission.target) !== input.target
        );

        const result = await this.updateFolder.execute(input.folderId, { permissions });

        if (result.isFail()) {
            throw new Error(`Could not revoke access: ${result.error.message}`);
        }

        const folder = result.value;

        return {
            folderId: folder.id,
            title: folder.title,
            path: folder.path,
            removed: { target: input.target, level: existing.level },
            permissions: (folder.permissions ?? [])
                .filter(permission => !permission.inheritedFrom)
                .map(permission => ({ target: String(permission.target), level: permission.level }))
        };
    }
}

export const RevokeFolderAccessTool = AiSdkTool.createImplementation({
    implementation: RevokeFolderAccessToolImpl,
    dependencies: [GetFolderUseCase, UpdateFolderUseCase]
});
