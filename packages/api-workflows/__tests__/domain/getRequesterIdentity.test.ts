import { describe, expect, it } from "vitest";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("getRequesterIdentity (R149, R161)", () => {
    it("carries the requester's id, name and identity type", () => {
        const identity = getRequesterIdentity({ ...requester, identityType: "user" });

        expect(identity.id).toBe(requester.id);
        expect(identity.displayName).toBe(requester.displayName);
        expect(identity.type).toBe("user");
    });

    it("falls back to admin without an identity type", () => {
        const { identityType, ...withoutType } = requester;

        expect(identityType).toBeDefined();
        expect(getRequesterIdentity(withoutType).type).toBe("admin");
    });

    it("can access the tenant", () => {
        expect(getRequesterIdentity(requester).context).toMatchObject({
            canAccessTenant: true
        });
    });

    it("does not change the requester", () => {
        const copy = structuredClone(requester);

        getRequesterIdentity(requester);

        expect(requester).toEqual(copy);
    });
});
