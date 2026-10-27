import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createOptionList } from "./optionLists.js";
import { toOptionList } from "./optionLists.js";

describe("optionLists (R284)", () => {
    it("creates an empty list in a state", () => {
        expect(createOptionList("loading")).toEqual({ status: "loading", items: [] });
        expect(createOptionList("ready")).toEqual({ status: "ready", items: [] });
    });

    it("turns a fulfilled lookup into a ready list, also an empty one", () => {
        expect(toOptionList({ status: "fulfilled", value: ["a", "b"] })).toEqual({
            status: "ready",
            items: ["a", "b"]
        });
        expect(toOptionList({ status: "fulfilled", value: [] })).toEqual({
            status: "ready",
            items: []
        });
    });

    it("turns a rejected lookup into a failed list with no items", () => {
        expect(toOptionList<string>({ status: "rejected", reason: new Error("down") })).toEqual({
            status: "failed",
            items: []
        });
    });
});
