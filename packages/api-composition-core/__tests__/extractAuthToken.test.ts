import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { extractAuthToken } from "~/auth/extractAuthToken.js";

const PRIVATE_FILE = { method: "GET", path: "/private/file.png" };
const GRAPHQL = { method: "POST", path: "/graphql" };

function privateFile(headers: Record<string, string>) {
    return { ...PRIVATE_FILE, headers };
}

function graphql(headers: Record<string, string>) {
    return { ...GRAPHQL, headers };
}

describe("extractAuthToken", () => {
    it("prefers x-webiny-authorization over Authorization", () => {
        const request = graphql({
            "X-Webiny-Authorization": "Bearer from-webiny-header",
            Authorization: "Bearer from-authorization"
        });
        const token = extractAuthToken(request);

        expect(token).toBe("from-webiny-header");
    });

    it("reads the wby-id-token cookie when there is no auth header", () => {
        const request = privateFile({ cookie: "theme=dark; wby-id-token=abc%2Edef" });
        const token = extractAuthToken(request);

        expect(token).toBe("abc.def");
    });

    it("ignores another cookie that is not valid URI encoding", () => {
        const request = privateFile({ cookie: "promo=50%off; wby-id-token=abc" });
        const token = extractAuthToken(request);

        expect(token).toBe("abc");
    });

    it("uses the last wby-id-token when the cookie is sent twice", () => {
        // Same-name cookies with a different Path or Domain arrive together; the parser has always
        // used the last one.
        const request = privateFile({ cookie: "wby-id-token=stale; wby-id-token=valid" });
        const token = extractAuthToken(request);

        expect(token).toBe("valid");
    });

    it("treats a wby-id-token that is not valid URI encoding as no token", () => {
        const request = privateFile({ cookie: "wby-id-token=50%off" });
        const token = extractAuthToken(request);

        expect(token).toBeNull();
    });

    it("ignores the wby-id-token cookie outside private file reads", () => {
        const headers = { cookie: "wby-id-token=abc" };
        const postPrivateFile = { method: "POST", path: "/private/file.png", headers };
        const getPublicFile = { method: "GET", path: "/files/file.png", headers };
        const headPrivateFile = { method: "HEAD", path: "/private/file.png", headers };

        const postGraphql = graphql(headers);

        expect(extractAuthToken(postGraphql)).toBeNull();
        expect(extractAuthToken(postPrivateFile)).toBeNull();
        expect(extractAuthToken(getPublicFile)).toBeNull();
        expect(extractAuthToken(headPrivateFile)).toBe("abc");
    });

    it("still reads the Authorization header on any request", () => {
        const request = graphql({ authorization: "Bearer abc" });

        expect(extractAuthToken(request)).toBe("abc");
    });
});
