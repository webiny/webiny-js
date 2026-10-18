import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EDITOR_AI_MODEL_FIELDS } from "./editorFields.js";
import { EDITOR_AI_TOOL_FIELDS } from "./editorFields.js";
import { EDITOR_AUTOMATION_DEFINITION_FIELDS } from "./editorFields.js";
import { EDITOR_NOTIFICATION_TRANSPORT_FIELDS } from "./editorFields.js";
import { EDITOR_STEP_TYPE_FIELDS } from "./editorFields.js";
import { EDITOR_TEAM_LIST_FIELDS } from "./editorFields.js";
import { EDITOR_WORKFLOW_FIELDS } from "./editorFields.js";

const isBalanced = (selection: string): boolean => {
    let depth = 0;
    for (const char of selection) {
        if (char === "{") {
            depth++;
        }
        if (char === "}") {
            depth--;
        }
        if (depth < 0) {
            return false;
        }
    }
    return depth === 0;
};

const words = (selection: string): string[] => {
    return selection.split(/\s+/).filter(Boolean);
};

describe("editorFields", () => {
    it("keeps every selection balanced", () => {
        const selections = [
            EDITOR_WORKFLOW_FIELDS,
            EDITOR_STEP_TYPE_FIELDS,
            EDITOR_AUTOMATION_DEFINITION_FIELDS,
            EDITOR_NOTIFICATION_TRANSPORT_FIELDS,
            EDITOR_TEAM_LIST_FIELDS,
            EDITOR_AI_MODEL_FIELDS,
            EDITOR_AI_TOOL_FIELDS
        ];

        for (const selection of selections) {
            expect(isBalanced(selection)).toBe(true);
        }
    });

    it("selects the workflow with its models, steps, notification ids and the save stamps (D131)", () => {
        const selection = words(EDITOR_WORKFLOW_FIELDS);

        expect(selection).toContain("models");
        expect(selection).toContain("createdOn");
        expect(selection).toContain("savedOn");
        expect(selection).toContain("config");
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/notifications\s*\{\s*id\s*\}/);
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/createdBy\s*\{\s*id\s+displayName\s*\}/);
        expect(EDITOR_WORKFLOW_FIELDS).toMatch(/savedBy\s*\{\s*id\s+displayName\s*\}/);
    });

    it("selects the step type, automation, transport, AI model and AI tool fields the mappers read", () => {
        expect(words(EDITOR_STEP_TYPE_FIELDS)).toEqual([
            "type",
            "title",
            "available",
            "unavailableReason",
            "configSchema"
        ]);
        expect(words(EDITOR_AUTOMATION_DEFINITION_FIELDS)).toEqual([
            "id",
            "name",
            "models",
            "settingsSchema"
        ]);
        expect(words(EDITOR_NOTIFICATION_TRANSPORT_FIELDS)).toEqual(["id", "title", "description"]);
        expect(words(EDITOR_AI_MODEL_FIELDS)).toEqual(["id", "name", "providerId", "providerName"]);
        expect(words(EDITOR_AI_TOOL_FIELDS)).toEqual([
            "name",
            "title",
            "description",
            "changesContent"
        ]);
    });

    it("selects exactly id, name and memberCount of a team and the missing ids (R268)", () => {
        expect(EDITOR_TEAM_LIST_FIELDS).toMatch(/teams\s*\{\s*id\s+name\s+memberCount\s*\}/);
        expect(words(EDITOR_TEAM_LIST_FIELDS)).toContain("missingIds");
    });
});
