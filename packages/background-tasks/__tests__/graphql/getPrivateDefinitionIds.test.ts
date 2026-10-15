import { describe, expect, it } from "vitest";
import { getPrivateDefinitionIds } from "~/api/graphql/getPrivateDefinitionIds";

describe("getPrivateDefinitionIds (R180)", () => {
    it("returns the ids of the private definitions only", () => {
        const ids = getPrivateDefinitionIds([
            { id: "publicTask", isPrivate: false },
            { id: "privateTask", isPrivate: true },
            { id: "unsetTask" },
            { id: "anotherPrivateTask", isPrivate: true }
        ]);

        expect(ids).toEqual(["privateTask", "anotherPrivateTask"]);
    });

    it("returns an empty list when nothing is private", () => {
        expect(getPrivateDefinitionIds([{ id: "publicTask", isPrivate: false }])).toEqual([]);
        expect(getPrivateDefinitionIds([])).toEqual([]);
    });
});
