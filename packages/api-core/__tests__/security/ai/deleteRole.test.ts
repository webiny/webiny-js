import { describe, it, expect } from "vitest";
import { getTool, useToolHandler } from "./useToolHandler";

/*
 * The change messages themselves are covered by `changeNotifications.test.ts`, through the same use
 * cases the tools call. What only a real store shows is the delete guard: a role still given to a
 * team is refused, and the refusal sends nothing.
 */
describe("deleteRole tool", () => {
    const { handler, websocketMessages } = useToolHandler();

    it("should refuse to delete a role a team still has, and send nothing", async () => {
        const { container } = await handler();
        const created = (await getTool(container, "createRole").execute({
            name: "Role in-use",
            slug: "in-use"
        })) as { id: string; name: string };
        await getTool(container, "createTeam").execute({
            name: "Holders",
            slug: "holders",
            roles: [created.id]
        });
        websocketMessages.length = 0;

        await expect(
            getTool(container, "deleteRole").execute({
                roleId: created.id,
                name: created.name
            })
        ).rejects.toThrow('is still given to team "Holders"');
        expect(websocketMessages).toEqual([]);
    });
});
