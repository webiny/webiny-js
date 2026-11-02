import { describe, it, expect } from "vitest";
import { RequestScope, StaleRequestScopeError } from "~/features/events/RequestScope.js";

describe("RequestScope", () => {
    it("has no request outside a scope", () => {
        expect(RequestScope.getRequestId()).toBeUndefined();
    });

    it("keeps the request id across awaits", async () => {
        const id = await RequestScope.run("request-1", async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            return RequestScope.getRequestId();
        });
        expect(id).toBe("request-1");
    });

    it("keeps concurrent requests apart", async () => {
        const read = (requestId: string) => {
            return RequestScope.run(requestId, async () => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return RequestScope.getRequestId();
            });
        };
        expect(await Promise.all([read("a"), read("b")])).toEqual(["a", "b"]);
    });

    it("allows use by the owning request", () => {
        RequestScope.run("request-1", () => {
            expect(() => RequestScope.assertOwner("Service", "request-1")).not.toThrow();
        });
    });

    it("throws when another request uses the service", () => {
        RequestScope.run("request-2", () => {
            expect(() => RequestScope.assertOwner("Service", "request-1")).toThrow(
                StaleRequestScopeError
            );
        });
    });

    it("does nothing outside a scope or for a service without a request", () => {
        expect(() => RequestScope.assertOwner("Service", "request-1")).not.toThrow();
        RequestScope.run("request-2", () => {
            expect(() => RequestScope.assertOwner("Service", undefined)).not.toThrow();
        });
    });
});
