import { describe, it, expect } from "vitest";
import { redactUrl } from "~/admin/capture/collectEnvironment.js";

describe("redactUrl", () => {
    it("keeps the parts that make a URL worth capturing", () => {
        const url = "https://admin.example.com/cms/entries?id=123&folderId=root";

        expect(redactUrl(url)).toBe(url);
    });

    it.each([
        ["token", "https://a.test/x?token=abc"],
        ["access_token", "https://a.test/x?access_token=abc"],
        ["api_key", "https://a.test/x?api_key=abc"],
        ["signature", "https://a.test/x?signature=abc"],
        ["Password", "https://a.test/x?Password=abc"],
        ["code", "https://a.test/x?code=abc"]
    ])("redacts a %s parameter", (name, url) => {
        const redacted = redactUrl(url);

        expect(redacted).toContain(`${name}=%5Bredacted%5D`);
        expect(redacted).not.toContain("abc");
    });

    /* "id" and "folderId" end in something the pattern also matches on its own. */
    it("does not redact identifiers that merely contain a matching word", () => {
        const url = "https://a.test/x?id=1&keyword=blue&encoded=yes";

        expect(redactUrl(url)).toBe(url);
    });

    it("drops the fragment, where an implicit-flow token would land", () => {
        expect(redactUrl("https://a.test/x?id=1#access_token=abc")).toBe("https://a.test/x?id=1");
    });

    it("leaves something that is not a URL alone", () => {
        expect(redactUrl("not a url")).toBe("not a url");
    });
});
