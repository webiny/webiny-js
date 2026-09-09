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
 * Resolves role names to the IDs `createTeam` takes. Separate from the write, so the user approves a
 * team with roles that were looked up rather than guessed.
 *
 * Returns the slug too, because it is what a human recognises and what the admin UI shows, but `id`
 * is the field a team stores. The two are easy to confuse and nothing at the type level separates
 * them, so both the description and `createTeam` name the distinction explicitly.
 */
class ListRolesToolImpl implements IAiSdkTool<Record<string, never>> {
    readonly name = "listRoles";
    readonly title = "List roles";
    readonly description =
        "Lists the security roles in this project. Call this before createTeam and pass the `id` of each role you want, NOT the `slug`. A team stores role IDs, and a slug silently grants nothing.";
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
