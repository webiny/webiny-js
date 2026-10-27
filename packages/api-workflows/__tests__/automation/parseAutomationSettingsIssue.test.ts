import { describe, expect, it } from "vitest";
import zod from "zod";
import { parseAutomationSettingsIssue } from "~/domain/automation/parseAutomationSettingsIssue.js";
import { TestAutomationDefinition } from "~tests/__helpers/TestAutomationDefinition.js";

describe("parseAutomationSettingsIssue (R267)", () => {
    it("returns the parsed settings with defaults applied", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ mode: "approve" });
    });

    it("keeps valid values", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, {
            mode: "reject",
            comment: "Needs a second look."
        });

        expect(result.value).toEqual({ mode: "reject", comment: "Needs a second look." });
    });

    it("fails with the first issue as a path and a message", () => {
        const { settingsSchema } = new TestAutomationDefinition();

        const result = parseAutomationSettingsIssue(settingsSchema, { mode: "explode" });

        expect(result.isFail()).toBe(true);
        expect(result.error.path).toBe("mode");
        expect(result.error.message).toMatch(/.+/);
        expect(Object.keys(result.error).sort()).toEqual(["message", "path"]);
    });

    it("dot-joins a nested path", () => {
        const schema = zod.object({ target: zod.object({ url: zod.url() }) });

        const result = parseAutomationSettingsIssue(schema, { target: { url: "nope" } });

        expect(result.error.path).toBe("target.url");
    });

    it("gives an empty path when the issue has none", () => {
        const result = parseAutomationSettingsIssue(zod.string(), 42);

        expect(result.isFail()).toBe(true);
        expect(result.error.path).toBe("");
        expect(result.error.message).toMatch(/expected string/);
    });
});
