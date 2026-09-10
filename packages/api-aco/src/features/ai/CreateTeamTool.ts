import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import { descriptionOnCreate } from "@webiny/api-core/features/security/shared/index.js";

const inputSchema = z.object({
    name: z.string().describe("Human-readable team name, e.g. 'Marketing'."),
    slug: z
        .string()
        .describe("URL-safe identifier, e.g. 'marketing'. Lowercase, hyphens instead of spaces."),
    /*
     * Optional and capped, mirroring the use case's own schema. Requiring it made the model invent a
     * description for every team; `CreateTeam` treats an absent one as empty via `descriptionOnCreate`.
     */
    description: z
        .string()
        .max(500)
        .optional()
        .describe("What the team is for. Shown in the admin UI. Omit it if the user did not say."),
    roles: z
        .array(z.string())
        .describe(
            "Roles from listRoles. Prefer the `id`; a `slug` is accepted and resolved for you. Resolve them with listRoles first, since an unknown value is rejected rather than stored."
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
        "Creates a team with a set of roles. Call listRoles first and pass what it returns; do not guess role identifiers. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };

    constructor(
        private createTeam: CreateTeam.Interface,
        private listRoles: ListRolesUseCase.Interface
    ) {}

    async execute(input: Input): Promise<CreatedTeam> {
        /*
         * `team.roles` stores role IDs, and only IDs: GetPermissionsFromIdentity resolves them with
         * `id_in` against the roles repository. Elsewhere in the same area a team is identified by
         * SLUG (folder permission targets are `team:<slug>`), so which identifier a given field wants
         * is not guessable, and `z.array(z.string())` accepts either. A slug stored here resolves to
         * no role at all: the team exists, looks right in the UI, and grants nothing.
         *
         * So resolve rather than refuse. Both forms map to the ID the field needs, and only a value
         * that is neither is an error, which is the one case the caller genuinely has to fix.
         */
        const rolesResult = await this.listRoles.execute();

        if (rolesResult.isFail()) {
            throw new Error(`Could not verify the roles: ${rolesResult.error.message}`);
        }

        const byId = new Map(rolesResult.value.map(role => [role.id, role.id]));
        const bySlug = new Map(rolesResult.value.map(role => [role.slug, role.id]));

        const unknown: string[] = [];

        // Id first, so a slug that happens to equal some other role's id cannot hijack it.
        const roleIds = input.roles.map(role => {
            const resolved = byId.get(role) ?? bySlug.get(role);

            if (!resolved) {
                unknown.push(role);
                return role;
            }

            return resolved;
        });

        if (unknown.length > 0) {
            const names = unknown.map(role => `"${role}"`).join(", ");
            throw new Error(`Not a known role id or slug: ${names}. Call listRoles first.`);
        }

        const result = await this.createTeam.execute({
            name: input.name,
            slug: input.slug,
            // An omitted description becomes "", the same mapping the use case applies to its own input.
            description: descriptionOnCreate(input.description),
            roles: roleIds
        });

        if (result.isFail()) {
            throw new Error(`Could not create the team: ${result.error.message}`);
        }

        const team = result.value;

        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            // The resolved IDs, so the caller sees what was actually stored.
            roles: roleIds
        };
    }
}

export const CreateTeamTool = AiSdkTool.createImplementation({
    implementation: CreateTeamToolImpl,
    dependencies: [CreateTeam, ListRolesUseCase]
});
