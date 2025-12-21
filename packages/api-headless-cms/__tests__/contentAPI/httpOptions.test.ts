import { describe, expect, it } from "vitest";
import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "~/types/index.js";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler.js";

/**
 * In case version header is enabled via the env vars, add it to expectancy.
 */
const versionHeaders: Record<string, any> = {};
if (process.env.WEBINY_ENABLE_VERSION_HEADER === "true") {
    versionHeaders["x-webiny-version"] = expect.any(String);
}

describe("HTTP Options request", () => {
    const manageOpts = {
        path: "manage",
        plugins: [
            new ContextPlugin<CmsContext>(async () => {
                throw new Error("This should not register.");
            })
        ]
    };

    it(`http options`, async () => {
        const { invoke } = useCategoryManageHandler(manageOpts);

        const response = await invoke({
            httpMethod: "OPTIONS",
            body: undefined
        });

        expect(response).toMatchObject([
            {},
            {
                body: "",
                headers: {
                    ...versionHeaders,
                    "access-control-allow-headers": "*",
                    "access-control-allow-methods": ["OPTIONS", "POST"].sort().join(","),
                    "access-control-allow-origin": "*",
                    "access-control-max-age": expect.stringMatching(/([0-9]+)/),
                    "cache-control": expect.stringMatching(/public, max-age=([0-9]+)/),
                    connection: "keep-alive",
                    date: expect.any(String)
                },
                isBase64Encoded: false,
                statusCode: 204
            }
        ]);
    });
});
