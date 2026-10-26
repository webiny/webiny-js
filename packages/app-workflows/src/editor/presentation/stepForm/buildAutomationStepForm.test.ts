import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAutomationDefinition } from "~/editor/testing/editorFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildAutomationStepForm } from "./buildAutomationStepForm.js";
import { getAutomationFormData } from "./getAutomationFormData.js";
import { getAutomationStepPatch } from "./getAutomationStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const WEBHOOK = createWebhookAutomation();

const createForm = (definition = WEBHOOK) => {
    return createTestFormModelFactory().create(buildAutomationStepForm({ definition }));
};

// Task 8's automation step with the title and Notify via the common-field assertions below expect.
const automationStep = (settings: unknown = { url: "https://x.test", timeout: 30 }) => {
    return createAutomationStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config: { automationId: "send-webhook", settings }
    });
};

describe("buildAutomationStepForm (R270, R274)", () => {
    it("has the common fields, the automation cards, the settings and Notify via, in order", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual([
            "title",
            "color",
            "description",
            "automationId",
            "settings",
            "notifications"
        ]);
    });

    it("describes the automation field and the Automation description placeholder", () => {
        const form = createForm();

        expect(form.field("automationId").vm.label).toBe("Automation");
        expect(form.field("automationId").vm.renderer).toBe(STEP_FORM_RENDERER.automations);
        expect(form.field("description").vm.placeholder).toBe(
            "What this automation does. Shown to the requester and reviewers."
        );
    });

    it("generates the settings from the schema under a Settings heading with its sub line", () => {
        const form = createForm();
        const settings = form.field("settings").vm;
        const rendererSettings = settings.rendererSettings as {
            itemDescription: (data: Record<string, unknown>) => string;
        };

        expect(settings.label).toBe("Settings");
        expect(form.field("settings.url").vm.label).toBe("URL");
        expect(form.field("settings.timeout").vm.label).toBe("Timeout (seconds)");
        expect(rendererSettings.itemDescription({})).toBe("Fields defined by Send webhook.");
    });

    it("has no settings field for a definition with no settings schema, or no definition", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });

        expect(() => createForm(slack).field("settings")).toThrow();
        expect(() => {
            createTestFormModelFactory()
                .create(buildAutomationStepForm({ definition: null }))
                .field("settings");
        }).toThrow();
    });

    it("requires an automation, as the server does", async () => {
        const form = createTestFormModelFactory().create(
            buildAutomationStepForm({ definition: null })
        );
        const automation = form.field("automationId");

        expect(await automation.validate({ force: true })).toBe(false);
        expect(automation.vm.validation.message).toBe("Choose an automation.");

        automation.setValue("post-to-webhook");

        expect(await automation.validate({ force: true })).toBe(true);
    });

    it("requires a setting with the design message {Label} is required. (R276)", async () => {
        const form = createForm();
        const url = form.field("settings.url");

        expect(await url.validate({ force: true })).toBe(false);
        expect(url.vm.validation.message).toBe("URL is required.");

        url.setValue("https://x.test");

        expect(await url.validate({ force: true })).toBe(true);
    });

    it("validates a setting after each edit (QBZ-13)", async () => {
        const form = createForm();

        form.field("settings.url").vm.onChange("https://x.test");
        form.field("settings.url").vm.onChange("");

        await vi.waitFor(() => {
            expect(form.field("settings.url").vm.validation.message).toBe("URL is required.");
        });
    });

    it("loads a step with its settings without becoming dirty", () => {
        const form = createForm();

        form.setData(getAutomationFormData(automationStep(), WEBHOOK), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData().automationId).toBe("send-webhook");
        expect(form.field("settings.url").getValue()).toBe("https://x.test");
    });
});

describe("getAutomationFormData", () => {
    it("reads the stored automation id and turns the settings into form data", () => {
        const data = getAutomationFormData(automationStep(), WEBHOOK);

        expect(data.automationId).toBe("send-webhook");
        expect(data.settings).not.toBeNull();
        expect(data.title).toBe("Legal sign-off");
    });

    it("has no settings form data when there is no schema", () => {
        const slack = createAutomationDefinition({ settingsSchema: null });

        expect(getAutomationFormData(automationStep(), slack).settings).toBeNull();
        expect(getAutomationFormData(automationStep(), null).settings).toBeNull();
    });

    it("reads a step with no automation as null", () => {
        const step = createReviewStep({ type: "automation", config: {} });

        expect(getAutomationFormData(step, null).automationId).toBeNull();
    });
});

describe("getAutomationStepPatch (R270, Review Focus 3)", () => {
    it("writes exactly the Automation config keys: automationId and settings", () => {
        // A stored key the editor does not know is not written back.
        const step = createAutomationStep({
            id: "step-1",
            config: {
                automationId: "send-webhook",
                settings: { url: "https://x.test", timeout: 30 },
                legacy: 1
            }
        });
        const values = getAutomationFormData(step, WEBHOOK);

        const patch = getAutomationStepPatch(step, values, WEBHOOK);

        expect(patch.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://x.test", timeout: 30 }
        });
    });

    it("writes the edited settings", () => {
        const step = automationStep({ url: "https://x.test" });
        const values = getAutomationFormData(step, WEBHOOK);
        const settings = { ...values.settings, url: "https://y.test" };

        const patch = getAutomationStepPatch(step, { ...values, settings }, WEBHOOK);

        expect(patch.config).toEqual({
            automationId: "send-webhook",
            settings: { url: "https://y.test" }
        });
    });

    it("keeps the stored settings of the same automation when the definition has no settings schema", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });
        const step = createReviewStep({
            type: "automation",
            config: { automationId: "post-to-slack", settings: { anything: "kept" } }
        });

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, slack), slack);

        expect(patch.config).toEqual({
            automationId: "post-to-slack",
            settings: { anything: "kept" }
        });
    });

    it("starts a switched step with empty settings (QBZ-14)", () => {
        const slack = createAutomationDefinition({ id: "post-to-slack", settingsSchema: null });
        const step = automationStep({ url: "https://x.test" });

        const patch = getAutomationStepPatch(
            step,
            { ...getAutomationFormData(step, slack), automationId: "post-to-slack" },
            slack
        );

        expect(patch.config).toEqual({ automationId: "post-to-slack", settings: {} });
    });

    it("writes an empty id for a step with no automation, and empty settings when none are stored", () => {
        const step = createReviewStep({ type: "automation", config: {} });

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, null), null);

        expect(patch.config).toEqual({ automationId: "", settings: {} });
    });

    it("includes the common fields", () => {
        const step = automationStep();

        const patch = getAutomationStepPatch(step, getAutomationFormData(step, WEBHOOK), WEBHOOK);

        expect(patch.title).toBe("Legal sign-off");
        expect(patch.notificationIds).toEqual(["e-mail"]);
    });
});
