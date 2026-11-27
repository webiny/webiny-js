import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { extractTenantId } from "~/auth/extractTenantId.js";

describe("extractTenantId", () => {
    it("reads x-tenant whatever casing the transport delivers", () => {
        expect(extractTenantId({ headers: { "x-tenant": "acme" } })).toBe("acme");
        expect(extractTenantId({ headers: { "X-Tenant": "acme" } })).toBe("acme");
    });

    it("treats a missing or empty header as no tenant", () => {
        expect(extractTenantId({ headers: {} })).toBeNull();
        expect(extractTenantId({ headers: { "x-tenant": "" } })).toBeNull();
    });
});
