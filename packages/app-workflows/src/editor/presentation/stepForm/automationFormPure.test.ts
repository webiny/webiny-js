import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "@webiny/app-admin";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { getAutomationCards } from "./getAutomationCards.js";
import { getAutomationEmptyText } from "./getAutomationEmptyText.js";
import { buildSwitchConfirmation } from "./buildSwitchConfirmation.js";
import { hasTeamSetting } from "./hasTeamSetting.js";
import { getSchemaDescription } from "./getSchemaDescription.js";

const WEBHOOK = createWebhookAutomation();
const SLACK = createAutomationDefinition({
    id: "post-to-slack",
    name: "Post to Slack",
    models: ["cms.*"],
    settingsSchema: null
});
const PAGES_ONLY = createAutomationDefinition({
    id: "translate-page",
    name: "Translate page",
    models: ["wb.page"],
    settingsSchema: null
});

describe("getSchemaDescription (R274)", () => {
    it("reads the top-level description", () => {
        expect(getSchemaDescription(WEBHOOK.settingsSchema)).toBe(
            "Sends the review and content to a URL when this step is reached."
        );
    });

    it("is null for no schema, no description or a blank one", () => {
        expect(getSchemaDescription(null)).toBeNull();
        expect(getSchemaDescription({ type: "object" })).toBeNull();
        expect(getSchemaDescription({ type: "object", description: "" })).toBeNull();
    });
});

describe("hasTeamSetting (R271, R284)", () => {
    it("is true when a top-level setting carries the team ui hint", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: { owner: { type: "string", ui: "team" }, url: { type: "string" } }
        };

        expect(hasTeamSetting(schema)).toBe(true);
    });

    it("is false for a schema without it, no schema or an odd schema", () => {
        expect(hasTeamSetting(createWebhookAutomation().settingsSchema)).toBe(false);
        expect(hasTeamSetting(null)).toBe(false);
        expect(hasTeamSetting({ type: "string" })).toBe(false);
    });
});

describe("getAutomationCards (D35, R274)", () => {
    it("lists the definitions covering the model, with the schema description", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, SLACK, PAGES_ONLY],
            namespace: "cms.article",
            selectedId: null
        });

        expect(cards).toEqual([
            {
                id: "send-webhook",
                name: "Send webhook",
                description: "Sends the review and content to a URL when this step is reached."
            },
            { id: "post-to-slack", name: "Post to Slack", description: null }
        ]);
    });

    it("also lists the stored definition when it does not cover the model", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, PAGES_ONLY],
            namespace: "cms.article",
            selectedId: "translate-page"
        });

        expect(cards.map(card => card.id)).toEqual(["send-webhook", "translate-page"]);
    });

    it("is empty when nothing covers the model", () => {
        expect(
            getAutomationCards({
                definitions: [PAGES_ONLY],
                namespace: "cms.article",
                selectedId: null
            })
        ).toEqual([]);
    });
});

describe("a null namespace (R284)", () => {
    it("covers nothing, except the stored definition, and words the empty text for the model", () => {
        const cards = getAutomationCards({
            definitions: [WEBHOOK, SLACK],
            namespace: null,
            selectedId: "post-to-slack"
        });

        expect(cards.map(card => card.id)).toEqual(["post-to-slack"]);
        expect(getAutomationEmptyText(null)).toBe("No automations are available for this model.");
    });
});

describe("getAutomationEmptyText (R269)", () => {
    it("names the model in the CMS and pages in the Website Builder", () => {
        expect(getAutomationEmptyText("cms.article")).toBe(
            "No automations are available for this model."
        );
        expect(getAutomationEmptyText("wb.page")).toBe("No automations are available for pages.");
    });
});

describe("buildSwitchConfirmation (QBZ-14)", () => {
    it("builds the design texts", () => {
        expect(
            buildSwitchConfirmation({ nextName: "Post to Slack", currentName: "Send webhook" })
        ).toEqual({
            title: "Switch to “Post to Slack”?",
            body: "The settings for Send webhook are cleared. The change applies when you save the workflow.",
            cancelLabel: "Cancel",
            confirmLabel: "Switch automation"
        });
    });
});
