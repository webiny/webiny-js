import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { extractTenantId } from "~/auth/extractTenantId.js";

describe("extractTenantId", () => {
    it("reads x-tenant whatever casing the transport delivers", () => {
        expect(extractTenantId({ "x-tenant": "acme" })).toBe("acme");
        expect(extractTenantId({ "X-Tenant": "acme" })).toBe("acme");
    });

    it("treats a missing or empty header as no tenant", () => {
        expect(extractTenantId({})).toBeNull();
        expect(extractTenantId({ "x-tenant": "" })).toBeNull();
        expect(extractTenantId(undefined)).toBeNull();
    });
});
