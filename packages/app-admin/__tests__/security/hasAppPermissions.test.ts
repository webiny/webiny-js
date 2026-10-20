import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Identity } from "~/domain/Identity.js";
import { hasAppPermissions } from "~/features/security/LogIn/hasAppPermissions.js";

const identityWith = (permissions: Array<{ name: string }>) => {
    return Identity.createAuthenticated({
        id: "u1",
        displayName: "User",
        type: "admin",
        roles: [],
        teams: [],
        permissions,
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
};

describe("hasAppPermissions", () => {
    it("accepts an identity with an app permission", () => {
        const identity = identityWith([{ name: "aacl" }, { name: "cms.contentEntry" }]);

        expect(hasAppPermissions(identity)).toBe(true);
    });

    it("refuses an identity that only has aacl", () => {
        const identity = identityWith([{ name: "aacl" }]);

        expect(hasAppPermissions(identity)).toBe(false);
    });

    it("refuses an identity with no permissions", () => {
        const identity = identityWith([]);

        expect(hasAppPermissions(identity)).toBe(false);
    });
});
