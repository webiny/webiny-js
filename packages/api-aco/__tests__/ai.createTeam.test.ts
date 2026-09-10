import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { CreateTeam } from "@webiny/api-core/features/security/teams/CreateTeam/index.js";
import { ListRolesUseCase } from "@webiny/api-core/features/security/roles/ListRoles/index.js";
import { CreateTeamTool } from "~/features/ai/CreateTeamTool.js";

const roles = [
    { id: "6a11", slug: "full-access", name: "Full Access" },
    { id: "6a22", slug: "content-editor", name: "Content Editor" }
];

interface CreatedTeam {
    roles: string[];
}

/**
 * Captures what the tool hands to `CreateTeam`, which is the only thing that matters here: a team
 * stores role IDs, so a slug that reaches storage resolves to no role and the team silently grants
 * nothing. The tool's own return value would look identical either way.
 */
const resolveTool = () => {
    const captured: { roles?: string[] } = {};
    const container = new Container();

    container.registerInstance(ListRolesUseCase, {
        execute: async () => Result.ok(roles)
    } as unknown as ListRolesUseCase.Interface);

    container.registerInstance(CreateTeam, {
        execute: async (params: { name: string; slug: string; roles: string[] }) => {
            captured.roles = params.roles;
            return Result.ok({ id: "team-1", name: params.name, slug: params.slug });
        }
    } as unknown as CreateTeam.Interface);

    container.register(CreateTeamTool);

    return { tool: container.resolveAll(AiSdkTool)[0], captured };
};

const createWith = async (roleIdentifiers: string[]) => {
    const { tool, captured } = resolveTool();

    const result = (await tool.execute({
        name: "Marketing",
        slug: "marketing",
        roles: roleIdentifiers
    })) as CreatedTeam;

    return { stored: captured.roles, returned: result.roles };
};

describe("createTeam role identifiers", () => {
    it("stores an id as given", async () => {
        const { stored } = await createWith(["6a11"]);
        expect(stored).toEqual(["6a11"]);
    });

    it("resolves a slug to the id a team actually stores", async () => {
        /*
         * The failure this prevents: `listRoles` shows a slug, the model passes it, and `team.roles`
         * ends up holding a value that `id_in` matches against nothing. The team exists, reads
         * correctly in the admin UI, and grants no permissions at all.
         */
        const { stored } = await createWith(["full-access"]);
        expect(stored).toEqual(["6a11"]);
    });

    it("resolves a mixed list", async () => {
        const { stored } = await createWith(["6a11", "content-editor"]);
        expect(stored).toEqual(["6a11", "6a22"]);
    });

    it("reports the ids it stored, not what it was handed", async () => {
        const { returned } = await createWith(["full-access"]);
        expect(returned).toEqual(["6a11"]);
    });

    it("refuses a value that is neither an id nor a slug", async () => {
        const { tool } = resolveTool();

        await expect(
            tool.execute({ name: "Marketing", slug: "marketing", roles: ["editors"] })
        ).rejects.toThrow(/Not a known role id or slug: "editors"/);
    });

    it("names every unknown value at once", async () => {
        const { tool } = resolveTool();

        await expect(
            tool.execute({ name: "Marketing", slug: "marketing", roles: ["6a11", "nope", "gone"] })
        ).rejects.toThrow(/"nope", "gone"/);
    });
});
