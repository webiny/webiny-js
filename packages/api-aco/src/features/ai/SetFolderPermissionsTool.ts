import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import type { FolderPermission } from "~/types.js";

const ACCESS_LEVELS = ["owner", "editor", "viewer", "public", "no-access"] as const;

const permissionSchema = z.object({
    target: z
        .string()
        .describe(
            "Who the rule applies to: 'team:<teamId>' or 'admin:<userId>'. Resolve ids with listTeams first — do not guess."
        ),
    level: z
        .enum(ACCESS_LEVELS)
        .describe(
            "owner = full control including permissions; editor = change content; viewer = read only; no-access = explicitly denied."
        )
});

const inputSchema = z.object({
    folderId: z.string().describe("Folder id as returned by listFolders."),
    permissions: z
        .array(permissionSchema)
        .describe(
            "The COMPLETE set of direct permissions for this folder. This REPLACES the folder's existing direct permissions — include every rule that should remain, or it will be removed."
        )
});

type Input = z.infer<typeof inputSchema>;

interface SetFolderPermissionsResult {
    folderId: string;
    title: string;
    path: string;
    permissions: { target: string; level: string }[];
}

/**
 * Replaces a folder's direct access rules.
 *
 * NOT read-only, and deliberately not annotated as such: it requires human approval before it runs.
 * It is also marked destructive because the semantics are replace-not-merge — omitting an existing
 * rule revokes it, which can lock people (including the caller) out of a folder.
 *
 * Inherited rules are filtered out before writing: they belong to an ancestor folder, and persisting
 * a copy here would silently detach this folder from that inheritance.
 */
class SetFolderPermissionsToolImpl implements IAiSdkTool<Input> {
    readonly name = "setFolderPermissions";
    readonly title = "Set folder permissions";
    readonly description =
        "Replaces the direct access permissions on a folder. Pass the complete desired set — any existing direct rule you omit is removed. Call listFolders to see current permissions and listTeams to resolve team ids first. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private updateFolder: UpdateFolderUseCase.Interface
    ) {}

    async execute(input: Input): Promise<SetFolderPermissionsResult> {
        const existing = await this.getFolder.execute(input.folderId);

        if (existing.isFail()) {
            throw new Error(
                `Folder "${input.folderId}" not found: ${existing.error.message}. Call listFolders for valid ids.`
            );
        }

        const permissions = input.permissions.map(
            permission =>
                ({
                    target: permission.target,
                    level: permission.level
                }) as FolderPermission
        );

        const result = await this.updateFolder.execute(input.folderId, { permissions });

        if (result.isFail()) {
            throw new Error(`Could not update folder permissions: ${result.error.message}`);
        }

        const folder = result.value;

        return {
            folderId: folder.id,
            title: folder.title,
            path: folder.path,
            permissions: (folder.permissions ?? [])
                .filter(permission => !permission.inheritedFrom)
                .map(permission => ({ target: permission.target, level: permission.level }))
        };
    }
}

export const SetFolderPermissionsTool = AiSdkTool.createImplementation({
    implementation: SetFolderPermissionsToolImpl,
    dependencies: [GetFolderUseCase, UpdateFolderUseCase]
});
