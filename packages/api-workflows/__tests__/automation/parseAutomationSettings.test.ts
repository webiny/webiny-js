import { describe, expect, it } from "vitest";
import zod from "zod";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { TestAutomationDefinition } from "~tests/__helpers/TestAutomationDefinition.js";

const settingsSchema = new TestAutomationDefinition().settingsSchema;

describe("parseAutomationSettings (R133, R137)", () => {
    it("returns the parsed settings with defaults applied", () => {
        const result = parseAutomationSettings(settingsSchema, {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ mode: "approve" });
    });

    it("keeps valid values", () => {
        const result = parseAutomationSettings(settingsSchema, {
            mode: "reject",
            comment: "Needs a second look."
        });

        expect(result.value).toEqual({ mode: "reject", comment: "Needs a second look." });
    });

    it("fails with the first issue as '<path>: <message>'", () => {
        const result = parseAutomationSettings(settingsSchema, {
            mode: "explode"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/^mode: .+/);
    });

    it("dot-joins a nested path", () => {
        const nested = zod.object({ target: zod.object({ url: zod.url() }) });

        const result = parseAutomationSettings(nested, { target: { url: "nope" } });

        expect(result.error).toMatch(/^target\.url: .+/);
    });

    it("omits the path when the issue has none", () => {
        const result = parseAutomationSettings(zod.string(), 42);

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/expected string/);
        expect(result.error).not.toMatch(/^: /);
    });
});
