import { getWebinyVersionHeaders } from "~/index";
import { WEBINY_VERSION_HEADER } from "~/headers";

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
            process.env.WEBINY_ENABLE_VERSION_HEADER = value;
            const headers = getWebinyVersionHeaders();

            expect(headers).toEqual({});
        }
    );

    it("should output headers", () => {
        process.env.WEBINY_ENABLE_VERSION_HEADER = "true";
        const headers = getWebinyVersionHeaders();

        expect(headers).toEqual({
            [WEBINY_VERSION_HEADER]: process.env.WEBINY_VERSION
        });
    });
});
