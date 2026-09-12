import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { CreateTeamTool } from "~/features/ai/CreateTeamTool.js";

interface CreatedTeam {
    roles: string[];
}

/**
 * Captures what the tool hands to `CreateTeam`.
 *
 * Role identifiers are resolved by the use case, not here: it accepts an id or a slug and maps
 * either onto the id a team stores. So what these assert is that the tool stays out of the way and
 * reports what was stored, rather than re-implementing the mapping and reading the roles twice.
 */
const resolveTool = (createTeamResult?: ReturnType<typeof Result.fail>) => {
    const captured: { roles?: string[] } = {};
    const container = new Container();

    container.registerInstance(CreateTeam, {
        execute: async (params: { name: string; slug: string; roles: string[] }) => {
            captured.roles = params.roles;

            if (createTeamResult) {
                return createTeamResult;
            }

            // The use case answers with the resolved ids, which is what a real create returns.
            return Result.ok({
                id: "team-1",
                name: params.name,
                slug: params.slug,
                roles: params.roles.map(role => (role === "full-access" ? "6a11" : role))
            });
        }
    } as unknown as CreateTeam.Interface);

    container.register(CreateTeamTool);

    return { tool: container.resolveAll(AiSdkTool)[0], captured };
};

const createWith = async (roles: string[]) => {
    const { tool, captured } = resolveTool();

    const result = (await tool.execute({
        name: "Marketing",
        slug: "marketing",
        roles
    })) as CreatedTeam;

    return { sent: captured.roles, returned: result.roles };
};

describe("createTeam role identifiers", () => {
    it("passes role identifiers through untouched", async () => {
        // No second read and no second copy of the mapping rule; the use case owns it.
        const { sent } = await createWith(["full-access"]);
        expect(sent).toEqual(["full-access"]);
    });

    it("reports the ids the use case stored, not what it was handed", async () => {
        const { returned } = await createWith(["full-access"]);
        expect(returned).toEqual(["6a11"]);
    });

    it("surfaces an unknown identifier reported by the use case", async () => {
        const { tool } = resolveTool(
            Result.fail(new Error('Not a known role id or slug: "editors".'))
        );

        await expect(
            tool.execute({ name: "Marketing", slug: "marketing", roles: ["editors"] })
        ).rejects.toThrow(/Not a known role id or slug: "editors"/);
    });
});
