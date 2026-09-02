import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";

const inputSchema = z.object({
    name: z.string().describe("Human-readable team name, e.g. 'Marketing'."),
    slug: z
        .string()
        .describe("URL-safe identifier, e.g. 'marketing'. Lowercase, hyphens instead of spaces."),
    description: z.string().describe("What the team is for. Shown in the admin UI."),
    roles: z
        .array(z.string())
        .describe(
            "Slugs of the roles this team grants. Resolve them with listRoles first — a team with no roles grants nothing."
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
        "Creates a team with a set of roles. Call listRoles first to resolve role slugs — do not guess them. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false };

    constructor(private createTeam: CreateTeam.Interface) {}

    async execute(input: Input): Promise<CreatedTeam> {
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
    dependencies: [CreateTeam]
});
