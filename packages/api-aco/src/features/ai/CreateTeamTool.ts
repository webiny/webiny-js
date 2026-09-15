import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
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

    constructor(private createTeam: CreateTeam.Interface) {}

    async execute(input: Input): Promise<CreatedTeam> {
        /*
         * Roles go through untouched. `CreateTeam` accepts a role id or a slug and resolves either to
         * the id a team stores, so the tool has nothing to add: doing it here too would read the roles
         * a second time and leave two copies of the same rule to keep in step.
         */
        const result = await this.createTeam.execute({
            name: input.name,
            slug: input.slug,
            // An omitted description becomes "", the same mapping the use case applies to its own input.
            description: descriptionOnCreate(input.description),
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
            // From the created team, so the caller sees the resolved ids that were actually stored.
            roles: team.roles
        };
    }
}

export const CreateTeamTool = AiSdkTool.createImplementation({
    implementation: CreateTeamToolImpl,
    dependencies: [CreateTeam]
});
