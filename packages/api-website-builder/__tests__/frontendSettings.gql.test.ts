import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

describe("Frontend Settings GraphQL", () => {
    let handler: ReturnType<typeof useGraphQlHandler>;

    beforeEach(async () => {
        handler = useGraphQlHandler({});
    });

    const seedKeyValueStore = async (values: Record<string, unknown>) => {
        const { container } = await handler.getContext();
        const kvStore = container.resolve(KeyValueStore);
        for (const [key, value] of Object.entries(values)) {
            await kvStore.set(key, value);
        }
    };

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
        await seedKeyValueStore({
            "WebsiteBuilder/Settings": { previewDomain: "https://legacy.example.com" }
        });

        const [response] = await handler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.error).toBeNull();
        expect(response.data.frontend.getSettings.data).toMatchObject({
            domain: "https://legacy.example.com"
        });
    });

    it("should prefer FrontendSettings domain over legacy domain", async () => {
        await seedKeyValueStore({
            "WebsiteBuilder/Settings": { previewDomain: "https://legacy.example.com" },
            "FrontendSettings/Settings": { domain: "https://new.example.com" }
        });

        const [response] = await handler.wb.getFrontendSettings({});
        expect(response.data.frontend.getSettings.error).toBeNull();
        expect(response.data.frontend.getSettings.data).toMatchObject({
            domain: "https://new.example.com"
        });
    });

    describe("permissions", () => {
        // Can edit pages, but can't manage frontend settings.
        const editorPermissions = [{ name: "wb.page" }, { name: "cms.*" }];

        it("should let a user without the frontend settings permission read the domain, without starter kits", async () => {
            const editor = useGraphQlHandler({ permissions: editorPermissions });

            const [response] = await editor.wb.getFrontendSettings({});
            expect(response.data.frontend.getSettings.error).toBeNull();
            expect(response.data.frontend.getSettings.data).toEqual({
                domain: "http://localhost:3000",
                starterKits: []
            });
        });

        it("should not let a user without the frontend settings permission update settings", async () => {
            const editor = useGraphQlHandler({ permissions: editorPermissions });

            const [response] = await editor.wb.updateFrontendSettings({
                data: { domain: "https://example.com" }
            });
            expect(response.data.frontend.updateSettings.data).toBeNull();
            expect(response.data.frontend.updateSettings.error).toMatchObject({
                code: "NOT_AUTHORIZED"
            });

            const [getResponse] = await editor.wb.getFrontendSettings({});
            expect(getResponse.data.frontend.getSettings.data.domain).toBe("http://localhost:3000");
        });

        // The Admin shows the Frontend Settings menu to both of these.
        it.each(["dev-tools.frontend-settings.*", "dev-tools.*"])(
            "should give starter kits and updates to a user with %s",
            async permission => {
                const manager = useGraphQlHandler({
                    permissions: [{ name: permission }]
                });

                const [getResponse] = await manager.wb.getFrontendSettings({});
                expect(getResponse.data.frontend.getSettings.error).toBeNull();
                expect(
                    getResponse.data.frontend.getSettings.data.starterKits.map((kit: any) => kit.id)
                ).toEqual(["nextjs", "nuxt"]);

                const [updateResponse] = await manager.wb.updateFrontendSettings({
                    data: { domain: "https://example.com" }
                });
                expect(updateResponse.data.frontend.updateSettings).toEqual({
                    data: true,
                    error: null
                });
            }
        );
    });
});
