import { describe, expect, it } from "vitest";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { requester } from "~tests/__helpers/fixtures.js";

describe("getAutomationActor (R141)", () => {
    it("carries the requester's id and name with the automation type", () => {
        expect(getAutomationActor(requester)).toEqual({
            type: "automation",
            id: requester.id,
            displayName: requester.displayName
        });
    });

    it("omits the identity type, even when the requester has one", () => {
        expect(requester.identityType).toBe("admin");
        expect(getAutomationActor(requester)).not.toHaveProperty("identityType");
    });

    it("does not change the requester", () => {
        const copy = structuredClone(requester);

        getAutomationActor(requester);

        expect(requester).toEqual(copy);
    });
});
