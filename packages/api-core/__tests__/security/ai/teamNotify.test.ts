import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "~/features/ai/index.js";
import { useToolHandler } from "./useToolHandler";
import { TEAM_CREATED_WEBSOCKET_ACTION } from "~/features/security/teams/NotifyTeamChange/index.js";
import { TEAM_DELETED_WEBSOCKET_ACTION } from "~/features/security/teams/NotifyTeamChange/index.js";
import { TEAM_UPDATED_WEBSOCKET_ACTION } from "~/features/security/teams/NotifyTeamChange/index.js";

const getTool = (container: Container, name: string) => {
    const tool = container
        .resolveAll(AiSdkToolDefinition)
        .find(candidate => candidate.name === name);

    if (!tool) {
        throw new Error(`Tool "${name}" is not registered.`);
    }

    return container.resolveImplementation(tool.handler);
};

/*
 * The admin caches the teams list, and a change the assistant makes never passes through that cache,
 * so each team write tells the user's open tabs which team to read back or drop.
 */
describe("team change notifications", () => {
    const { handler, websocketMessages } = useToolHandler();

    // A tool handler returns `unknown`, so the result has to be cast; an annotation does not compile.
    const createTeam = async (container: Container, slug: string) => {
        return (await getTool(container, "createTeam").execute({
            name: `Team ${slug}`,
            slug,
            roles: []
        })) as { id: string; name: string };
    };

    it("should tell the user's tabs which team the tool created", async () => {
        const context = await handler();
        websocketMessages.length = 0;

        const created = await createTeam(context.container, "notify-create");

        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: TEAM_CREATED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });

    it("should tell the user's tabs which team the tool updated", async () => {
        const context = await handler();
        const created = await createTeam(context.container, "notify-update");
        websocketMessages.length = 0;

        const updated = (await getTool(context.container, "updateTeam").execute({
            teamId: created.id,
            name: "Renamed team"
        })) as { id: string; name: string; slug: string };

        expect(updated).toMatchObject({
            id: created.id,
            name: "Renamed team",
            slug: "notify-update"
        });
        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: TEAM_UPDATED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });

    it("should tell the user's tabs which team the tool deleted", async () => {
        const context = await handler();
        const created = await createTeam(context.container, "notify-delete");
        websocketMessages.length = 0;

        await getTool(context.container, "deleteTeam").execute({
            teamId: created.id,
            name: created.name
        });

        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: TEAM_DELETED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });
});
