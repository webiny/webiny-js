import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import type { FolderPermission } from "~/types.js";
import { loadFolderPermissions } from "./loadFolderPermissions.js";
import { assertTargetIsUsable } from "./assertTargetIsUsable.js";

const ACCESS_LEVELS = ["owner", "editor", "viewer", "public", "no-access"] as const;

const inputSchema = z.object({
    folderId: z.string().describe("Folder id as returned by listFolders."),
    target: z
        .string()
        .describe(
            "Who to grant access to. A team is 'team:<slug>' — the SLUG, not the id. A user is 'admin:<userId>'. Resolve with listTeams first."
        ),
    level: z
        .enum(ACCESS_LEVELS)
        .describe(
            "owner = full control including permissions; editor = change content; viewer = read only; no-access = explicitly denied."
        )
});

type Input = z.infer<typeof inputSchema>;

interface GrantResult {
    folderId: string;
    title: string;
    path: string;
    /** Every direct rule on the folder afterwards, read back from storage. */
    permissions: { target: string; level: string }[];
    /** True when the target already had a direct rule and its level was changed. */
    replacedExistingLevel?: string;
}

/**
 * Grants one target access to one folder, leaving every other rule alone.
 *
 * Additive by design. The earlier tool took the complete permission set and replaced it, which meant
 * approving a change showed what would be SET and said nothing about what would be removed — a rule
 * the model omitted disappeared silently. One target per call keeps the approval honest: what the user
 * sees in the plan is the whole change.
 */
class GrantFolderAccessToolImpl implements IAiSdkTool<Input> {
    readonly name = "grantFolderAccess";
    readonly title = "Grant folder access";
    readonly description =
        "Grants one team or user a level of access on one folder, leaving all other permissions untouched. Use listFolders for the folder id and listTeams for a team slug. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private updateFolder: UpdateFolderUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface
    ) {}

    async execute(input: Input): Promise<GrantResult> {
        const loaded = await loadFolderPermissions(this.getFolder, input.folderId);

        await assertTargetIsUsable(this.listTeams, input.target, loaded.inheritedTargets);

        const existing = loaded.direct.find(
            permission => String(permission.target) === input.target
        );

        const permissions: FolderPermission[] = loaded.direct
            .filter(permission => String(permission.target) !== input.target)
            .concat([{ target: input.target, level: input.level } as FolderPermission]);

        const result = await this.updateFolder.execute(input.folderId, { permissions });

        if (result.isFail()) {
            throw new Error(`Could not grant access: ${result.error.message}`);
        }

        const folder = result.value;

        const granted: GrantResult = {
            folderId: folder.id,
            title: folder.title,
            path: folder.path,
            permissions: (folder.permissions ?? [])
                .filter(permission => !permission.inheritedFrom)
                .map(permission => ({ target: String(permission.target), level: permission.level }))
        };

        if (existing) {
            granted.replacedExistingLevel = existing.level;
        }

        return granted;
    }
}

export const GrantFolderAccessTool = AiSdkTool.createImplementation({
    implementation: GrantFolderAccessToolImpl,
    dependencies: [GetFolderUseCase, UpdateFolderUseCase, ListTeamsUseCase]
});
