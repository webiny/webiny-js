import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "@webiny/api-core/features/ai/index.js";
import { UpdateTeam } from "@webiny/api-core/features/security/teams/UpdateTeam/index.js";
import type { UpdateTeamInput } from "@webiny/api-core/features/security/teams/shared/types.js";

const inputSchema = z.object({
    teamId: z.string().describe("Team id as returned by listTeams."),
    name: z.string().min(3).optional().describe("New team name. Omit it to keep the current one."),
    description: z
        .string()
        .max(500)
        .optional()
        .describe("New description. Omit it to keep the current one; an empty string clears it."),
    roles: z
        .array(z.string())
        .optional()
        .describe(
            "The complete list of roles the team should have afterwards. It REPLACES the stored list, so include the roles to keep. Omit it to leave the roles alone. Resolve values with listRoles first."
        )
});

type Input = z.infer<typeof inputSchema>;

interface UpdatedTeam {
    id: string;
    name: string;
    slug: string;
    description: string;
    roles: string[];
}

class UpdateTeamToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(private updateTeam: UpdateTeam.Interface) {}

    async execute(input: Input): Promise<UpdatedTeam> {
        /*
         * Only the keys the model sent. `UpdateTeam` spreads its validated input onto the stored team,
         * and a key that is present but `undefined` survives validation, so passing `name: undefined`
         * would wipe the stored name.
         */
        const changes: UpdateTeamInput = {};

        if (input.name !== undefined) {
            changes.name = input.name;
        }
        if (input.description !== undefined) {
            changes.description = input.description;
        }
        if (input.roles !== undefined) {
            changes.roles = input.roles;
        }

        const result = await this.updateTeam.execute(input.teamId, changes);

        if (result.isFail()) {
            throw new Error(`Could not update the team: ${result.error.message}`);
        }

        const team = result.value;

        return {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            // From the updated team, so the caller sees the resolved ids that were actually stored.
            roles: team.roles
        };
    }
}

const UpdateTeamToolHandler = AiSdkToolHandler.createImplementation({
    implementation: UpdateTeamToolHandlerImpl,
    dependencies: [UpdateTeam]
});

/**
 * Changes a team's name, description or roles. The slug cannot change: folder permissions refer to
 * teams by slug.
 *
 * Needs approval for the same reason as `createTeam`: the roles decide what the team's members can
 * do. `roles` replaces the stored list, and the approval shows that whole list, so a role the model
 * left out is visible as missing before anything is written.
 */
class UpdateTeamToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "updateTeam";
    readonly title = "Update team";
    readonly description =
        "Changes a team's name, description or roles. Call listTeams first for the id. `roles` replaces the team's whole role list, so pass every role it should keep; call listRoles to resolve them. System teams and teams defined in code cannot be changed. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, idempotentHint: true };
    readonly handler = UpdateTeamToolHandler;
}

export const UpdateTeamTool = AiSdkToolDefinition.createImplementation({
    implementation: UpdateTeamToolImpl,
    dependencies: []
});
