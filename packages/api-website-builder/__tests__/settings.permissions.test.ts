import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { useGraphQlHandler } from "./utils/useGraphQlHandler.js";

const INTEGRATIONS = { data: { someIntegration: { enabled: true } } };

describe("Website Builder integrations permissions", () => {
    it("should not update integrations without the wb.integrations permission", async () => {
        const handler = useGraphQlHandler({
            permissions: [{ name: "wb.page" }, { name: "wb.redirect" }]
        });

        const [response] = await handler.wb.updateIntegrations(INTEGRATIONS);
        expect(response.data.websiteBuilder.updateIntegrations).toMatchObject({
            data: null,
            error: { code: "NOT_AUTHORIZED" }
        });
    });

    it("should update integrations with the wb.integrations permission", async () => {
        const handler = useGraphQlHandler({
            permissions: [{ name: "wb.integrations" }]
        });

        const [response] = await handler.wb.updateIntegrations(INTEGRATIONS);
        expect(response.data.websiteBuilder.updateIntegrations).toEqual({
            data: true,
            error: null
        });
    });
});
