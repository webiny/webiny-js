import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { getAutomationWarnings } from "./getAutomationWarnings.js";

const WEBHOOK = createWebhookAutomation();
const SLACK = createAutomationDefinition({
    id: "post-to-slack",
    name: "Post to Slack",
    models: ["cms.*"],
    settingsSchema: null
});

describe("getAutomationWarnings (R274, QBZ-13)", () => {
    it("has no warning for a step with no automation", () => {
        expect(
            getAutomationWarnings({
                definitions: [WEBHOOK],
                selectedId: null,
                storedSettings: undefined,
                settingsPristine: true
            })
        ).toEqual({ warning: null, settingsWarning: null });
    });

    it("warns when the stored automation is not listed, with the id standing for the name", () => {
        const warnings = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "gone",
            storedSettings: { url: "https://x.test" },
            settingsPristine: true
        });

        expect(warnings).toEqual({
            warning: "The automation “gone” no longer exists.",
            settingsWarning: null
        });
    });

    it("warns that saved settings no longer validate, only while they are unchanged", () => {
        const pristine = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { timeout: 500 },
            settingsPristine: true
        });
        const changed = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { timeout: 500 },
            settingsPristine: false
        });

        expect(pristine.warning).toBeNull();
        expect(pristine.settingsWarning?.startsWith("Saved settings no longer validate: ")).toBe(
            true
        );
        expect(changed.settingsWarning).toBeNull();
    });

    it("has no settings warning when the stored settings are valid or were never filled", () => {
        const valid = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: { url: "https://x.test" },
            settingsPristine: true
        });
        const empty = getAutomationWarnings({
            definitions: [WEBHOOK],
            selectedId: "send-webhook",
            storedSettings: {},
            settingsPristine: true
        });

        expect(valid.settingsWarning).toBeNull();
        expect(empty.settingsWarning).toBeNull();
    });

    it("has no settings warning for a definition with no settings schema", () => {
        const warnings = getAutomationWarnings({
            definitions: [SLACK],
            selectedId: "post-to-slack",
            storedSettings: { anything: "x" },
            settingsPristine: true
        });

        expect(warnings).toEqual({ warning: null, settingsWarning: null });
    });
});
