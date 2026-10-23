import { describe, expect, it } from "vitest";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";

describe("matchesAutomationScope (R136)", () => {
    it.each([
        { automation: ["*"], workflow: ["cms.article"], covered: true },
        { automation: ["*"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.*"], workflow: ["cms.article"], covered: true },
        { automation: ["cms.*"], workflow: ["wb.page"], covered: false },
        { automation: ["wb.*"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.article"], workflow: ["cms.article"], covered: true },
        { automation: ["cms.article"], workflow: ["cms.page"], covered: false },
        { automation: ["cms.article", "wb.page"], workflow: ["wb.page"], covered: true },
        { automation: ["cms.*", "wb.page"], workflow: ["wb.page"], covered: true },
        // A prefix is not a namespace: "cms.*" does not cover "cmsx.article".
        { automation: ["cms.*"], workflow: ["cmsx.article"], covered: false },
        // The wildcard needs something after the dot.
        { automation: ["cms.*"], workflow: ["cms."], covered: false }
    ])(
        "automation $automation, workflow $workflow: $covered",
        ({ automation, workflow, covered }) => {
            expect(matchesAutomationScope(automation, workflow)).toBe(covered);
        }
    );

    it("requires every workflow model to be covered", () => {
        expect(matchesAutomationScope(["cms.article"], ["cms.article", "cms.page"])).toBe(false);
        expect(matchesAutomationScope(["cms.*"], ["cms.article", "cms.page"])).toBe(true);
    });

    it("never covers a workflow without models", () => {
        expect(matchesAutomationScope(["*"], [])).toBe(false);
    });

    it("never covers anything when the automation lists no models", () => {
        expect(matchesAutomationScope([], ["cms.article"])).toBe(false);
    });
});
