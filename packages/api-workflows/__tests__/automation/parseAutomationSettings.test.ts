import { describe, expect, it } from "vitest";
import zod from "zod";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { TestAutomationDefinition } from "~tests/__helpers/TestAutomationDefinition.js";

describe("parseAutomationSettings (R133, R137)", () => {
    it("returns the parsed settings with defaults applied", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {});

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ mode: "approve" });
    });

    it("keeps valid values", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {
            mode: "reject",
            comment: "Needs a second look."
        });

        expect(result.value).toEqual({ mode: "reject", comment: "Needs a second look." });
    });

    it("fails with the first issue as '<path>: <message>'", () => {
        const result = parseAutomationSettings(new TestAutomationDefinition(), {
            mode: "explode"
        });

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/^mode: .+/);
    });

    it("dot-joins a nested path", () => {
        const definition = new TestAutomationDefinition();
        const nested = {
            ...definition,
            settingsSchema: zod.object({ target: zod.object({ url: zod.url() }) })
        };

        const result = parseAutomationSettings(nested as never, { target: { url: "nope" } });

        expect(result.error).toMatch(/^target\.url: .+/);
    });

    it("omits the path when the issue has none", () => {
        const definition = new TestAutomationDefinition();
        const text = { ...definition, settingsSchema: zod.string() };

        const result = parseAutomationSettings(text as never, 42);

        expect(result.isFail()).toBe(true);
        expect(result.error).toMatch(/expected string/);
        expect(result.error).not.toMatch(/^: /);
    });
});
