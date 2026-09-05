import { z } from "zod";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import type { IAiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";

const inputSchema = z.object({});

interface RoleSummary {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

/**
 * Resolves role names to the slugs `createTeam` takes. Separate from the write, so the user approves
 * a team with roles that were looked up rather than guessed.
 */
class ListRolesToolImpl implements IAiSdkTool<Record<string, never>> {
    readonly name = "listRoles";
    readonly title = "List roles";
    readonly description =
        "Lists the security roles in this project with their slugs. Call this to resolve role names before creating a team.";
    readonly inputSchema = inputSchema;
    readonly annotations = { readOnlyHint: true, idempotentHint: true };

    constructor(private listRoles: ListRolesUseCase.Interface) {}

    async execute(): Promise<RoleSummary[]> {
        const result = await this.listRoles.execute();

        if (result.isFail()) {
            throw new Error(`Could not list roles: ${result.error.message}`);
        }

        return result.value.map(role => {
            const summary: RoleSummary = {
                id: role.id,
                name: role.name,
                slug: role.slug
            };

            if (role.description) {
                summary.description = role.description;
            }

            return summary;
        });
    }
}

export const ListRolesTool = AiSdkTool.createImplementation({
    implementation: ListRolesToolImpl,
    dependencies: [ListRolesUseCase]
});
