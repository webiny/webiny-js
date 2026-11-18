import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toSortOption } from "./sortOption.js";
import { fromSortOption } from "./sortOption.js";

describe("sortOption", () => {
    it("writes a sort as an option value and reads it back", () => {
        const option = toSortOption({ field: "createdOn", direction: "DESC" });

        expect(option).toBe("createdOn_DESC");
        expect(fromSortOption(option)).toEqual({ field: "createdOn", direction: "DESC" });
    });

    it("keeps underscores in the field name", () => {
        expect(fromSortOption("created_on_ASC")).toEqual({ field: "created_on", direction: "ASC" });
    });

    it("gives an empty value for an unsorted list", () => {
        expect(toSortOption(null)).toBe("");
    });
});
