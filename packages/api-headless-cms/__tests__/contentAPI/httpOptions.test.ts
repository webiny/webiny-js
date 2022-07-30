import { ContextPlugin } from "@webiny/api";
import { CmsContext } from "~/types";
import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

/**
 * In case version header is enabled via the env vars, add it to expectancy.
 */
const versionHeaders: Record<string, any> = {};
if (process.env.WEBINY_ENABLE_VERSION_HEADER === "true") {
    versionHeaders["x-webiny-version"] = expect.any(String);
}

describe("HTTP Options request", () => {
    const manageOpts = {
        path: "manage/en-US",
        plugins: [
            new ContextPlugin<CmsContext>(async () => {
                throw new Error("This should not register.");
            })
        ]
    };

    test(`http options`, async () => {
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
                    "content-type": "application/json; charset=utf-8",
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
