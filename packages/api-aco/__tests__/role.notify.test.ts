import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import type { Container } from "@webiny/di";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { useHandler } from "~tests/utils/useHandler";
import { ROLE_CREATED_WEBSOCKET_ACTION } from "@webiny/api-core/features/security/roles/NotifyRoleChange/index.js";
import { ROLE_DELETED_WEBSOCKET_ACTION } from "@webiny/api-core/features/security/roles/NotifyRoleChange/index.js";
import { ROLE_UPDATED_WEBSOCKET_ACTION } from "@webiny/api-core/features/security/roles/NotifyRoleChange/index.js";

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
 * The admin caches the roles list, and a change the assistant makes never passes through that cache,
 * so each role write tells the user's open tabs which role to read back or drop. Runs the real tools
 * and use cases, so the delete guards are checked against stored teams too.
 */
describe("role tools and change notifications", () => {
    const { handler, websocketMessages } = useHandler();

    // A tool handler returns `unknown`, so the result has to be cast; an annotation does not compile.
    const createRole = async (container: Container, slug: string) => {
        const created = await getTool(container, "createRole").execute({
            name: `Role ${slug}`,
            slug
        });

        return created as { id: string; name: string; slug: string };
    };

    it("should tell the user's tabs which role the tool created", async () => {
        const context = await handler();
        websocketMessages.length = 0;

        const created = await createRole(context.container, "notify-create");

        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: ROLE_CREATED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });

    it("should tell the user's tabs which role the tool updated", async () => {
        const context = await handler();
        const created = await createRole(context.container, "notify-update");
        websocketMessages.length = 0;

        const updated = await getTool(context.container, "updateRole").execute({
            roleId: created.id,
            name: "Renamed role"
        });

        expect(updated).toMatchObject({
            id: created.id,
            name: "Renamed role",
            slug: "notify-update"
        });
        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: ROLE_UPDATED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });

    it("should tell the user's tabs which role the tool deleted", async () => {
        const context = await handler();
        const created = await createRole(context.container, "notify-delete");
        websocketMessages.length = 0;

        await getTool(context.container, "deleteRole").execute({
            roleId: created.id,
            name: created.name
        });

        expect(websocketMessages).toEqual([
            {
                identityId: expect.any(String),
                action: ROLE_DELETED_WEBSOCKET_ACTION,
                data: { id: created.id }
            }
        ]);
    });

    it("should refuse to delete a role a team still has, and send nothing", async () => {
        const context = await handler();
        const created = await createRole(context.container, "in-use");
        await getTool(context.container, "createTeam").execute({
            name: "Holders",
            slug: "holders",
            roles: [created.id]
        });
        websocketMessages.length = 0;

        await expect(
            getTool(context.container, "deleteRole").execute({
                roleId: created.id,
                name: created.name
            })
        ).rejects.toThrow('is still given to team "Holders"');
        expect(websocketMessages).toEqual([]);
    });
});
