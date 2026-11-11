import { describe, it, expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { TEAM_CREATED_WEBSOCKET_ACTION } from "~/features/team/NotifyTeamCreated/index.js";

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
 * The admin caches the teams list, and a team the assistant creates never passes through that cache,
 * so creating one tells the user's open tabs which team to read back.
 */
describe("team created notification", () => {
    const { handler, websocketMessages } = useHandler();

    it("should tell the user's tabs which team the tool created", async () => {
        const context = await handler();
        websocketMessages.length = 0;

        const created = (await getTool(context.container, "createTeam").execute({
            name: "Notify create",
            slug: "notify-create",
            roles: []
        })) as { id: string };

        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: TEAM_CREATED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });
});
