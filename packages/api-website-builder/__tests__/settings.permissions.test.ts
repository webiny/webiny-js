import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";

const SETTINGS = { data: { previewDomain: "http://localhost:4000" } };
const INTEGRATIONS = { data: { someIntegration: { enabled: true } } };

describe("Website Builder settings permissions", () => {
    it("should not update settings or integrations without the wb.settings permission", async () => {
        const handler = useGraphQlHandler({
            permissions: [{ name: "wb.page" }, { name: "wb.redirect" }]
        });

        const [settingsResponse] = await handler.wb.updateSettings(SETTINGS);
        expect(settingsResponse.data.websiteBuilder.updateSettings).toMatchObject({
            data: null,
            error: { code: "NOT_AUTHORIZED" }
        });

        const [integrationsResponse] = await handler.wb.updateIntegrations(INTEGRATIONS);
        expect(integrationsResponse.data.websiteBuilder.updateIntegrations).toMatchObject({
            data: null,
            error: { code: "NOT_AUTHORIZED" }
        });
    });

    it("should update settings and integrations with the wb.settings permission", async () => {
        const handler = useGraphQlHandler({
            permissions: [{ name: "wb.settings" }]
        });

        const [settingsResponse] = await handler.wb.updateSettings(SETTINGS);
        expect(settingsResponse.data.websiteBuilder.updateSettings).toEqual({
            data: true,
            error: null
        });

        const [integrationsResponse] = await handler.wb.updateIntegrations(INTEGRATIONS);
        expect(integrationsResponse.data.websiteBuilder.updateIntegrations).toEqual({
            data: true,
            error: null
        });
    });
});
