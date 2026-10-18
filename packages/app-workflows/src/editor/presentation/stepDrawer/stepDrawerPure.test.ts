import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getFormFieldPath } from "./getFormFieldPath.js";
import { getStepKind } from "./getStepKind.js";

describe("getStepKind (R270)", () => {
    it("maps the three built-in types and treats anything else as unknown", () => {
        expect(getStepKind("review")).toBe("review");
        expect(getStepKind("automation")).toBe("automation");
        expect(getStepKind("ai")).toBe("ai");
        expect(getStepKind("custom-check")).toBe("unknown");
    });
});

describe("getFormFieldPath (R267, R276)", () => {
    it("maps the step fields and the config fields of the three forms", () => {
        expect(getFormFieldPath("title")).toBe("title");
        expect(getFormFieldPath("color")).toBe("color");
        expect(getFormFieldPath("notifications")).toBe("notifications");
        expect(getFormFieldPath("config.teams")).toBe("teams");
        expect(getFormFieldPath("config.automationId")).toBe("automationId");
        expect(getFormFieldPath("config.instructions")).toBe("instructions");
        expect(getFormFieldPath("config.model")).toBe("model");
        expect(getFormFieldPath("config.tools")).toBe("tools");
    });

    it("maps a setting path under settings", () => {
        expect(getFormFieldPath("config.settings.url")).toBe("settings.url");
        expect(getFormFieldPath("config.settings.headers.0.name")).toBe("settings.headers.0.name");
    });

    it("maps a zod path under config.teams to the teams field", () => {
        expect(getFormFieldPath("config.teams.0")).toBe("teams");
    });

    it("is null for a field with no form field in 9a", () => {
        expect(getFormFieldPath(null)).toBeNull();
        expect(getFormFieldPath("")).toBeNull();
        expect(getFormFieldPath("id")).toBeNull();
        expect(getFormFieldPath("type")).toBeNull();
        expect(getFormFieldPath("config.settings")).toBeNull();
        expect(getFormFieldPath("config.assignment.rules")).toBeNull();
        expect(getFormFieldPath("config.somethingElse")).toBeNull();
    });
});
