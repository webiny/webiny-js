import { describe, expect, it } from "vitest";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";

describe("getConfigIssueField (R267)", () => {
    it("joins the zod issue path under config", () => {
        expect(getConfigIssueField(["teams"])).toBe("config.teams");
        expect(getConfigIssueField(["assignment", "strategy"])).toBe("config.assignment.strategy");
    });

    it("writes array indexes as path parts", () => {
        expect(getConfigIssueField(["teams", 0])).toBe("config.teams.0");
        expect(getConfigIssueField(["assignment", "rules", 2, "target", "id"])).toBe(
            "config.assignment.rules.2.target.id"
        );
    });

    it("is just config for an issue with no path", () => {
        expect(getConfigIssueField([])).toBe("config");
    });
});
