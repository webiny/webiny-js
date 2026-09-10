import { describe, expect, it } from "vitest";
import { useCategoryManageHandler } from "../testHelpers/useCategoryManageHandler.js";

/**
 * In case version header is enabled via the env vars, add it to expectancy.
 */
const versionHeaders: Record<string, any> = {};
if (process.env.WEBINY_ENABLE_VERSION_HEADER === "true") {
    versionHeaders["x-webiny-version"] = expect.any(String);
}

describe("HTTP Options request", () => {
    // The tripwire this used to carry — a post-auth initializer that threw if it ran — is gone
    // with RequestContextInitializer itself. SecureHeadersDecorator still short-circuits OPTIONS
    // before the router dispatches, which is what the assertions below check.
    const manageOpts = { path: "manage" };

    it(`http options`, async () => {
        const { invoke } = useCategoryManageHandler(manageOpts);

        const response = await invoke({
            httpMethod: "OPTIONS",
            body: undefined
        });

        const [, httpResponse] = response;
        expect(httpResponse.statusCode).toBe(204);
        expect(httpResponse.headers).toMatchObject({
            "access-control-allow-origin": "*",
            "access-control-max-age": expect.stringMatching(/([0-9]+)/),
            "cache-control": expect.stringMatching(/public, max-age=([0-9]+)/)
        });
    });
});
