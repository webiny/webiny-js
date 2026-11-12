import { z } from "zod";
import { AiSdkToolDefinition, AiSdkToolHandler } from "~/features/ai/index.js";
import { GetTeamUseCase } from "~/features/security/teams/GetTeam/index.js";
import { DeleteTeam } from "~/features/security/teams/DeleteTeam/index.js";

const inputSchema = z.object({
    teamId: z.string().describe("Team id as returned by listTeams."),
    name: z
        .string()
        .describe(
            "The team's current name, exactly as listTeams returned it. The delete is refused if it does not match."
        )
});

type Input = z.infer<typeof inputSchema>;

interface DeletedTeam {
    id: string;
    name: string;
    slug: string;
}

/*
 * The name is part of the input so the approval shows the user which team goes, rather than only an
 * id. The model supplies it, so it is checked against the stored team before anything is deleted:
 * what the user approved by name has to be the team that is removed.
 */
class DeleteTeamToolHandlerImpl implements AiSdkToolHandler.Interface<Input> {
    constructor(
        private getTeam: GetTeamUseCase.Interface,
        private deleteTeam: DeleteTeam.Interface
    ) {}

    async execute(input: Input): Promise<DeletedTeam> {
        const found = await this.getTeam.execute({ id: input.teamId });

        if (found.isFail()) {
            throw new Error(
                `Team "${input.teamId}" not found: ${found.error.message}. Call listTeams for valid ids.`
            );
        }

        const team = found.value;

        if (team.name !== input.name) {
            throw new Error(
                `Team "${input.teamId}" is named "${team.name}", not "${input.name}", so nothing was deleted. Check the team with listTeams.`
            );
        }

        const result = await this.deleteTeam.execute(team.id);

        if (result.isFail()) {
            throw new Error(`Could not delete the team: ${result.error.message}`);
        }

        return { id: team.id, name: team.name, slug: team.slug };
    }
}

const DeleteTeamToolHandler = AiSdkToolHandler.createImplementation({
    implementation: DeleteTeamToolHandlerImpl,
    dependencies: [GetTeamUseCase, DeleteTeam]
});

/**
 * Deletes one team.
 *
 * Destructive, so the approval says it cannot be undone. System teams and teams defined in code are
 * refused by `DeleteTeam`, and that error reaches the model as-is.
 */
class DeleteTeamToolImpl implements AiSdkToolDefinition.Interface<Input> {
    readonly name = "deleteTeam";
    readonly title = "Delete team";
    readonly description =
        "Deletes one team. System teams and teams defined in code are refused. Call listTeams first for the id and exact name. Requires user approval.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: false, destructiveHint: true };
    readonly handler = DeleteTeamToolHandler;
}

export const DeleteTeamTool = AiSdkToolDefinition.createImplementation({
    implementation: DeleteTeamToolImpl,
    dependencies: []
});
