import { describe, expect, it } from "vitest";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import type { Container } from "@webiny/di";
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
            // A post-auth initializer that must NOT run for an OPTIONS preflight (which short-
            // circuits before the request context is initialized). If it runs, the test fails.
            (container: Container) => {
                container.registerInstance(RequestContextInitializer, {
                    async init() {
                        throw new Error("This should not register.");
                    }
                });
            }
        ]
    };

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
