import { describe, test, it, expect } from "vitest";
import { getWebinyVersionHeaders } from "~/index";
import { WBY_VERSION_HEADER } from "~/headers";

describe("webiny headers", () => {
    const notEnabledValues = [
        "true;",
        "false",
        "ok",
        "yes",
        "",
        undefined,
        null,
        1,
        {},
        [],
        new Date()
    ];
    test.each(notEnabledValues)(
        "should not output headers if they are not enabled",
        (value: any) => {
            process.env.WBY_ENABLE_VERSION_HEADER = value;
            const headers = getWebinyVersionHeaders();

            expect(headers).toEqual({});
        }
    );

    it("should output headers", () => {
        process.env.WBY_ENABLE_VERSION_HEADER = "true";
        const headers = getWebinyVersionHeaders();

        expect(headers).toEqual({
            [WBY_VERSION_HEADER]: process.env.WBY_VERSION
        });
    });
});
