import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { matchesAutomationScope } from "./matchesAutomationScope.js";

describe("matchesAutomationScope (D35, R269)", () => {
    it("`*` covers every model", () => {
        expect(matchesAutomationScope(["*"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["*"], ["wb.page"])).toBe(true);
    });

    it("`<app>.*` covers the namespace ids of that app only", () => {
        expect(matchesAutomationScope(["cms.*"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["cms.*"], ["wb.page"])).toBe(false);
        expect(matchesAutomationScope(["wb.*"], ["wb.page"])).toBe(true);
    });

    it("an exact namespace id covers only that model", () => {
        expect(matchesAutomationScope(["cms.article"], ["cms.article"])).toBe(true);
        expect(matchesAutomationScope(["cms.article"], ["cms.press"])).toBe(false);
    });

    it("any one scope of the list is enough", () => {
        expect(matchesAutomationScope(["cms.press", "cms.article"], ["cms.article"])).toBe(true);
    });

    it("`cms.*` does not cover the bare prefix and an empty list covers nothing", () => {
        expect(matchesAutomationScope(["cms.*"], ["cms."])).toBe(false);
        expect(matchesAutomationScope([], ["cms.article"])).toBe(false);
    });

    it("a workflow without models is never covered", () => {
        expect(matchesAutomationScope(["*"], [])).toBe(false);
    });
});
