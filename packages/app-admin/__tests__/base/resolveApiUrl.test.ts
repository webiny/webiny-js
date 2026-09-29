import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveApiUrl, resolveGraphqlUrl, resolveWebsocketUrl } from "~/base/resolveApiUrl.js";

const VARS = ["WEBINY_ADMIN_API_URL", "WEBINY_ADMIN_WS_API_URL", "REACT_APP_WEBSOCKET_URL"];

/** jsdom serves the page from here, which is what a relative API URL resolves against. */
const ORIGIN = "http://localhost:3000";

describe("resolveApiUrl", () => {
    let original: Record<string, string | undefined>;

    beforeEach(() => {
        original = Object.fromEntries(VARS.map(name => [name, process.env[name]]));
        for (const name of VARS) {
            delete process.env[name];
        }
    });

    afterEach(() => {
        for (const [name, value] of Object.entries(original)) {
            if (value === undefined) {
                delete process.env[name];
            } else {
                process.env[name] = value;
            }
        }
    });

    it("resolves a relative API URL against the page origin", () => {
        // This is what the dev proxy bakes in. Keeping it relative is what lets one build run on
        // localhost, on a portless domain, and behind a reverse proxy without being rebuilt.
        process.env.WEBINY_ADMIN_API_URL = "/api";

        expect(resolveApiUrl()).toBe(`${ORIGIN}/api`);
        expect(resolveGraphqlUrl()).toBe(`${ORIGIN}/api/graphql`);
    });

    it("leaves an absolute API URL alone, trailing slash aside", () => {
        process.env.WEBINY_ADMIN_API_URL = "https://api.example.com";
        expect(resolveApiUrl()).toBe("https://api.example.com");

        process.env.WEBINY_ADMIN_API_URL = "https://api.example.com/";
        expect(resolveApiUrl()).toBe("https://api.example.com");
    });

    it("falls back to same-origin when nothing is configured", () => {
        expect(resolveApiUrl()).toBe(ORIGIN);
        expect(resolveApiUrl()).not.toContain("undefined");

        process.env.WEBINY_ADMIN_API_URL = "undefined";
        expect(resolveApiUrl()).toBe(ORIGIN);
    });

    describe("websocket URL", () => {
        it("derives ws from a relative API URL instead of passing it through unchanged", () => {
            process.env.WEBINY_ADMIN_API_URL = "/api";

            // A plain `replace(/^http/, "ws")` would leave "/api" as-is, which is not a URL anything
            // can connect to.
            expect(resolveWebsocketUrl()).toBe("ws://localhost:3000/api");
        });

        it("derives ws from an absolute API URL", () => {
            process.env.WEBINY_ADMIN_API_URL = "https://api.example.com";
            expect(resolveWebsocketUrl()).toBe("wss://api.example.com");
        });

        it("prefers an explicitly configured websocket URL", () => {
            process.env.WEBINY_ADMIN_API_URL = "/api";
            process.env.WEBINY_ADMIN_WS_API_URL = "wss://ws.example.com";
            expect(resolveWebsocketUrl()).toBe("wss://ws.example.com");

            process.env.REACT_APP_WEBSOCKET_URL = "wss://aws.example.com";
            expect(resolveWebsocketUrl()).toBe("wss://aws.example.com");
        });

        it("resolves an explicit websocket URL that is relative", () => {
            // `<Admin.WebsocketsUrl>` wins over the API URL, so the dev proxy has to set it too. It
            // sets the same relative value, which is no use unless this branch resolves it as well.
            process.env.WEBINY_ADMIN_WS_API_URL = "/api";

            expect(resolveWebsocketUrl()).toBe("ws://localhost:3000/api");
        });

        it("is empty when there is nothing to derive from", () => {
            expect(resolveWebsocketUrl()).toBe("");
        });
    });
});
