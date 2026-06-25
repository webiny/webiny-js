import { describe, it, expect } from "vitest";
import {
    WebsocketsServerAdapter,
    WebsocketsUpgradeHandler,
    WebsocketsConnectionManager
} from "~/abstractions.js";

describe("abstractions", () => {
    it("WebsocketsServerAdapter should be defined and have createImplementation method", () => {
        expect(WebsocketsServerAdapter).toBeDefined();
        expect(typeof WebsocketsServerAdapter.createImplementation).toBe("function");
    });

    it("WebsocketsUpgradeHandler should be defined and have createImplementation method", () => {
        expect(WebsocketsUpgradeHandler).toBeDefined();
        expect(typeof WebsocketsUpgradeHandler.createImplementation).toBe("function");
    });

    it("WebsocketsConnectionManager should be defined and have createImplementation method", () => {
        expect(WebsocketsConnectionManager).toBeDefined();
        expect(typeof WebsocketsConnectionManager.createImplementation).toBe("function");
    });
});
