import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { UpdateFolderUseCase } from "~/features/folder/UpdateFolder/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { FolderPermission } from "~/types.js";

const ACCESS_LEVELS = ["owner", "editor", "viewer", "public", "no-access"] as const;

const permissionSchema = z.object({
    target: z
        .string()
        .describe(
            "Who the rule applies to. A team is 'team:<slug>' — the team's SLUG, not its id. A user is 'admin:<userId>'. Resolve either with listTeams or listFolderPermissionTargets first; do not guess."
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
            "The COMPLETE set of DIRECT permissions for this folder. This REPLACES the existing direct rules, so include every direct rule that should remain. Do NOT include rules listFolders reported as inherited — those come from an ancestor or a role and are not this folder's to set."
        )
});

type Input = z.infer<typeof inputSchema>;

interface SetFolderPermissionsResult {
    folderId: string;
    title: string;
    path: string;
    /** The folder's direct permissions after the update, read back from storage. */
    permissions: { target: string; level: string }[];
    /** Inherited rules that were passed in and skipped, so the answer can say so. */
    ignoredInheritedTargets?: string[];
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
        "Replaces the direct access permissions on a folder. Pass the complete desired set — any existing direct rule you omit is removed. Targets are 'team:<slug>' or 'admin:<userId>'. Call listFolders to see current permissions and listTeams to resolve team slugs first. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private updateFolder: UpdateFolderUseCase.Interface,
        private listTeams: ListTeamsUseCase.Interface
    ) {}

    async execute(input: Input): Promise<SetFolderPermissionsResult> {
        const existing = await this.getFolder.execute(input.folderId);

        if (existing.isFail()) {
            throw new Error(
                `Folder "${input.folderId}" not found: ${existing.error.message}. Call listFolders for valid ids.`
            );
        }

        /*
         * A folder rule matches a team by SLUG (`team:<slug>`) — see
         * ListFolderLevelPermissionsTargets and GetDefaultPermissionsWithTeams — while a user rule
         * matches by id (`admin:<userId>`). The field is only typed as a template string, so an id
         * where a slug belongs is stored happily and then matches nobody: the permission appears to
         * be set and grants nothing. Verify team slugs rather than write a rule that does nothing.
         */
        const teamsResult = await this.listTeams.execute();

        if (teamsResult.isFail()) {
            throw new Error(`Could not verify the teams: ${teamsResult.error.message}`);
        }

        const slugs = new Set(teamsResult.value.map(team => team.slug));
        const byId = new Map(teamsResult.value.map(team => [team.id, team.slug]));

        for (const permission of input.permissions) {
            if (!permission.target.startsWith("team:")) {
                continue;
            }

            const value = permission.target.slice("team:".length);
            if (slugs.has(value)) {
                continue;
            }

            const slug = byId.get(value);
            if (slug) {
                throw new Error(
                    `"${permission.target}" uses a team id. Use the slug instead: "team:${slug}".`
                );
            }

            throw new Error(`"${permission.target}" is not a known team. Call listTeams first.`);
        }

        /*
         * Inherited rules are not this folder's to set. Re-sending one — which a model will do,
         * because listFolders showed it — would convert an ancestor's or a role's grant into a hard
         * rule on this folder, quietly detaching it from the inheritance it came from. Drop those and
         * report it, rather than writing a change nobody asked for.
         */
        const inherited = new Set<string>(
            (existing.value.permissions ?? [])
                .filter(permission => permission.inheritedFrom)
                .map(permission => String(permission.target))
        );

        const ignored = input.permissions
            .filter(permission => inherited.has(permission.target))
            .map(permission => permission.target);

        const permissions = input.permissions
            .filter(permission => !inherited.has(permission.target))
            .map(
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

        const result_: SetFolderPermissionsResult = {
            folderId: folder.id,
            title: folder.title,
            path: folder.path,
            permissions: (folder.permissions ?? [])
                .filter(permission => !permission.inheritedFrom)
                .map(permission => ({ target: permission.target, level: permission.level }))
        };

        if (ignored.length > 0) {
            result_.ignoredInheritedTargets = ignored;
        }

        return result_;
    }
}

export const SetFolderPermissionsTool = AiSdkTool.createImplementation({
    implementation: SetFolderPermissionsToolImpl,
    dependencies: [GetFolderUseCase, UpdateFolderUseCase, ListTeamsUseCase]
});
