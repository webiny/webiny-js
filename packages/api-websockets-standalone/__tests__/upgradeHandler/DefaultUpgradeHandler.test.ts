import { describe, it, expect } from "vitest";
import { DefaultUpgradeHandlerImpl } from "~/upgradeHandler/DefaultUpgradeHandler.js";
import type { IncomingMessage } from "node:http";

const requestTo = (url: string): IncomingMessage => {
    const request: Partial<IncomingMessage> = { url };
    return request as IncomingMessage;
};

describe("DefaultUpgradeHandler", () => {
    const handler = new DefaultUpgradeHandlerImpl();

    it("allows an upgrade on /ws, query included", async () => {
        const decision = await handler.shouldUpgrade(requestTo("/ws?token=t&tenant=root"));

        expect(decision).toEqual({ allowed: true });
    });

    it("refuses an upgrade on any other path", async () => {
        for (const url of ["/", "/graphql", "/ws/", "/wsx", "/api/ws"]) {
            const decision = await handler.shouldUpgrade(requestTo(url));

            expect(decision).toEqual({ allowed: false, statusCode: 404, reason: "Not Found" });
        }
    });
});
