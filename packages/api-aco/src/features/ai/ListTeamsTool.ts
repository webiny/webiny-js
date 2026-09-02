import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";

const inputSchema = z.object({});

type Input = z.infer<typeof inputSchema>;

interface TeamSummary {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

/**
 * Resolves human names ("team A") to the ids folder permissions actually take.
 *
 * Kept separate from setFolderPermissions rather than accepting a team name there: the user approves
 * the arguments of a write, so the id has to be looked up and shown, not guessed inside the write.
 */
class ListTeamsToolImpl implements IAiSdkTool<Input> {
    readonly name = "listTeams";
    readonly title = "List teams";
    readonly description =
        "Lists the teams in this project with their ids, names and slugs. Folder permission targets use the SLUG (`team:<slug>`), not the id.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };

    constructor(private listTeams: ListTeamsUseCase.Interface) {}

    async execute(): Promise<TeamSummary[]> {
        const result = await this.listTeams.execute();

        if (result.isFail()) {
            throw new Error(`Could not list teams: ${result.error.message}`);
        }

        return result.value.map(team => ({
            id: team.id,
            name: team.name,
            slug: team.slug,
            ...(team.description ? { description: team.description } : {})
        }));
    }
}

export const ListTeamsTool = AiSdkTool.createImplementation({
    implementation: ListTeamsToolImpl,
    dependencies: [ListTeamsUseCase]
});
