import { describe, expect, it } from "vitest";
import { siteTenantId } from "./BuildSiteTask.js";

describe("siteTenantId", () => {
    it("is the job's name, made unique by its entry id rather than its revision", () => {
        expect(siteTenantId("Park city Palace", "6ab119a704782f0002001bd6#0001")).toBe(
            "parkcitypalace1bd6"
        );
        // Two jobs with the same name get different tenants.
        expect(siteTenantId("2424 Tulane", "6ab26b4838a369000286400d#0001")).not.toBe(
            siteTenantId("2424 Tulane", "6ab26b4838a3690002864aaa#0001")
        );
    });

    it("falls back to a word when the name has no letters or digits", () => {
        expect(siteTenantId("— — —", "6ab0fe976fd9a4000281fca1#0001")).toBe("sitefca1");
    });
});
