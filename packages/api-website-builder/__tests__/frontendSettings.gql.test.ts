import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { createContextPlugin } from "@webiny/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

describe("Frontend Settings GraphQL", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    it("should get frontend settings with default domain", async () => {
        const [response] = await handler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.error).toBeNull();
        expect(response.data.frontend.getSettings.data).toMatchObject({
            domain: "http://localhost:3000",
            starterKits: expect.any(Array)
        });
    });

    it("should reject anonymous getSettings request", async () => {
        const anonymousHandler = useGraphQlHandler({ identity: null });

        const [response] = await anonymousHandler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.data).toBeNull();
        expect(response.data.frontend.getSettings.error).toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should update and get frontend settings", async () => {
        const [updateResponse] = await handler.wb.updateFrontendSettings({
            data: { domain: "https://example.com" }
        });
        expect(updateResponse.data.frontend.updateSettings.error).toBeNull();
        expect(updateResponse.data.frontend.updateSettings.data).toBe(true);

        const [getResponse] = await handler.wb.getFrontendSettings({});
        expect(getResponse.data.frontend.getSettings.error).toBeNull();
        expect(getResponse.data.frontend.getSettings.data).toMatchObject({
            domain: "https://example.com"
        });
    });

    it("should reject anonymous updateSettings request", async () => {
        const anonymousHandler = useGraphQlHandler({ identity: null });

        const [response] = await anonymousHandler.wb.updateFrontendSettings({
            data: { domain: "https://example.com" }
        });
        expect(response.data.frontend.updateSettings.data).toBeNull();
        expect(response.data.frontend.updateSettings.error).toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should fall back to legacy WebsiteBuilder/Settings domain", async () => {
        const legacyHandler = useGraphQlHandler({
            plugins: [
                createContextPlugin(async context => {
                    const kvStore = context.container.resolve(KeyValueStore);
                    await kvStore.set("WebsiteBuilder/Settings", {
                        previewDomain: "https://legacy.example.com"
                    });
                })
            ]
        });

        const [response] = await legacyHandler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.error).toBeNull();
        expect(response.data.frontend.getSettings.data).toMatchObject({
            domain: "https://legacy.example.com"
        });
    });

    it("should prefer FrontendSettings domain over legacy domain", async () => {
        const bothHandler = useGraphQlHandler({
            plugins: [
                createContextPlugin(async context => {
                    const kvStore = context.container.resolve(KeyValueStore);
                    await kvStore.set("WebsiteBuilder/Settings", {
                        previewDomain: "https://legacy.example.com"
                    });
                    await kvStore.set("FrontendSettings/Settings", {
                        domain: "https://new.example.com"
                    });
                })
            ]
        });

        const [response] = await bothHandler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.error).toBeNull();
        expect(response.data.frontend.getSettings.data).toMatchObject({
            domain: "https://new.example.com"
        });
    });
});
