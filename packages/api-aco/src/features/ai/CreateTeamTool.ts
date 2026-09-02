import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";

const inputSchema = z.object({
    name: z.string().describe("Human-readable team name, e.g. 'Marketing'."),
    slug: z
        .string()
        .describe("URL-safe identifier, e.g. 'marketing'. Lowercase, hyphens instead of spaces."),
    description: z.string().describe("What the team is for. Shown in the admin UI."),
    roles: z
        .array(z.string())
        .describe(
            "Role IDs — the `id` field from listRoles, NOT the slug. Resolve them with listRoles first; a team whose roles do not resolve grants nothing."
        )
});

type Input = z.infer<typeof inputSchema>;

interface CreatedTeam {
    id: string;
    name: string;
    slug: string;
    roles: string[];
}

/**
 * Creates a team.
 *
 * Not read-only, so it needs approval: a team is an access-control object, and the roles it carries
 * decide what its members can do. The user should see which roles are being granted before it exists.
 */
class CreateTeamToolImpl implements IAiSdkTool<Input> {
    readonly name = "createTeam";
    readonly title = "Create team";
    readonly description =
        "Creates a team with a set of roles. Call listRoles first and pass the role IDs it returns — do not guess them, and do not pass slugs. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };

    constructor(
        private createTeam: CreateTeam.Interface,
        private listRoles: ListRolesUseCase.Interface
    ) {}

    async execute(input: Input): Promise<CreatedTeam> {
        /*
         * `team.roles` holds role IDs, not slugs — see GetPermissionsFromIdentity, which resolves them
         * against the roles repository. The create schema is `z.array(z.string())`, so a slug is
         * accepted and then silently resolves to nothing: the team exists and grants no permissions.
         * Reject anything that is not a known role ID rather than write a team that looks fine.
         */
        const rolesResult = await this.listRoles.execute();

        if (rolesResult.isFail()) {
            throw new Error(`Could not verify the roles: ${rolesResult.error.message}`);
        }

        const knownIds = new Set(rolesResult.value.map(role => role.id));
        const unknown = input.roles.filter(role => !knownIds.has(role));

        if (unknown.length > 0) {
            const bySlug = new Map(rolesResult.value.map(role => [role.slug, role.id]));
            const hints = unknown.map(role => {
                const id = bySlug.get(role);
                return id
                    ? `"${role}" is a slug; its id is "${id}"`
                    : `"${role}" is not a known role`;
            });

            throw new Error(`Roles must be IDs from listRoles. ${hints.join("; ")}.`);
        }

        const result = await this.createTeam.execute({
            name: input.name,
            slug: input.slug,
            description: input.description,
            roles: input.roles
        });

        if (result.isFail()) {
            throw new Error(`Could not create the team: ${result.error.message}`);
        }

        const team = result.value;

        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            roles: input.roles
        };
    }
}

export const CreateTeamTool = AiSdkTool.createImplementation({
    implementation: CreateTeamToolImpl,
    dependencies: [CreateTeam, ListRolesUseCase]
});
