import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { extractAuthToken } from "~/auth/extractAuthToken.js";

describe("extractAuthToken", () => {
    it("prefers x-webiny-authorization over Authorization", () => {
        const token = extractAuthToken({
            "X-Webiny-Authorization": "Bearer from-webiny-header",
            Authorization: "Bearer from-authorization"
        });

        expect(token).toBe("from-webiny-header");
    });

    it("reads the wby-id-token cookie when there is no auth header", () => {
        const token = extractAuthToken({ cookie: "theme=dark; wby-id-token=abc%2Edef" });

        expect(token).toBe("abc.def");
    });

    it("ignores another cookie that is not valid URI encoding", () => {
        const token = extractAuthToken({ cookie: "promo=50%off; wby-id-token=abc" });

        expect(token).toBe("abc");
    });

    it("uses the last wby-id-token when the cookie is sent twice", () => {
        // Same-name cookies with a different Path or Domain arrive together; the parser has always
        // used the last one.
        const token = extractAuthToken({ cookie: "wby-id-token=stale; wby-id-token=valid" });

        expect(token).toBe("valid");
    });

    it("treats a wby-id-token that is not valid URI encoding as no token", () => {
        const token = extractAuthToken({ cookie: "wby-id-token=50%off" });

        expect(token).toBeNull();
    });
});
