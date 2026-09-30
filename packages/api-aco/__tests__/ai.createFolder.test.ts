import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/exports/api.js";
import { CreateFolderUseCase } from "~/features/folder/CreateFolder/index.js";
import {
    CreateFolderTool,
    FOLDER_CREATED_WEBSOCKET_ACTION
} from "~/features/ai/CreateFolderTool.js";

interface Sent {
    identityId: string;
    data: { action: string; data: unknown };
}

const input = { title: "Drafts", slug: "drafts", type: "FmFile" };

const resolveTool = (options: {
    createResult?: ReturnType<typeof Result.fail>;
    withWebsockets?: boolean;
    sendResult?: ReturnType<typeof Result.fail>;
}) => {
    const sent: Sent[] = [];
    const container = new Container();

    container.registerInstance(CreateFolderUseCase, {
        execute: async () =>
            options.createResult ??
            Result.ok({
                id: "folder-1",
                title: "Drafts",
                slug: "drafts",
                path: "drafts",
                type: "FmFile"
            })
    } as unknown as CreateFolderUseCase.Interface);

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "user-1" })
    } as unknown as IdentityContext.Interface);

    if (options.withWebsockets !== false) {
        container.registerInstance(WebsocketsSendToIdentityUseCase, {
            execute: async (identity: { id: string }, data: Sent["data"]) => {
                sent.push({ identityId: identity.id, data });
                return options.sendResult ?? Result.ok();
            }
        } as unknown as WebsocketsSendToIdentityUseCase.Interface);
    }

    container.register(CreateFolderTool);

    const tool = container.resolveAll(AiSdkToolDefinition)[0];
    const handler = container.resolveImplementation(tool.handler);

    return { handler, sent };
};

describe("createFolder tool", () => {
    it("tells the user's open tabs which folder was created", async () => {
        const { handler, sent } = resolveTool({});

        await handler.execute(input);

        expect(sent).toEqual([
            {
                identityId: "user-1",
                data: { action: FOLDER_CREATED_WEBSOCKET_ACTION, data: { id: "folder-1" } }
            }
        ]);
    });

    it("sends nothing when the folder could not be created", async () => {
        const { handler, sent } = resolveTool({
            createResult: Result.fail(new Error("Slug taken."))
        });

        await expect(handler.execute(input)).rejects.toThrow("Slug taken.");
        expect(sent).toEqual([]);
    });

    it("still reports the folder when the message could not be sent", async () => {
        const { handler } = resolveTool({ sendResult: Result.fail(new Error("No sockets.")) });

        await expect(handler.execute(input)).resolves.toMatchObject({ id: "folder-1" });
    });

    it("works without websockets registered", async () => {
        const { handler } = resolveTool({ withWebsockets: false });

        await expect(handler.execute(input)).resolves.toMatchObject({ id: "folder-1" });
    });
});
