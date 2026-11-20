import { describe, expect, it } from "vitest";
import { useWebsockets as publicUseWebsockets } from "~/exports/admin/websockets.js";
import { useWebsockets } from "~/hooks/index.js";

describe("public websockets exports", () => {
    it("export useWebsockets as its source symbol", () => {
        expect(publicUseWebsockets).toBe(useWebsockets);
    });
});
