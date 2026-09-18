import { describe, it, expect } from "vitest";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import type { IncomingMessage } from "node:http";

describe("DefaultUpgradeHandler", () => {
    it("should allow all connections", async () => {
        const handler = new DefaultUpgradeHandlerImpl();
        const request = {} as IncomingMessage;

        const decision = await handler.shouldUpgrade(request);

        expect(decision).toEqual({ allowed: true });
    });
});
