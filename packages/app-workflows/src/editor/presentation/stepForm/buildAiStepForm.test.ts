import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildAiStepForm } from "./buildAiStepForm.js";
import { getAiFormData } from "./getAiFormData.js";
import { getAiStepPatch } from "./getAiStepPatch.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";

const createForm = (readOnly = false) => {
    return createTestFormModelFactory().create(buildAiStepForm({ readOnly }));
};

// Task 8's AI step with the title and Notify via the common-field assertions below expect.
const aiStep = (
    config: unknown = {
        instructions: "Check tone",
        model: "anthropic/claude-balanced",
        tools: ["read-fields"]
    }
) => {
    return createAiStep({
        id: "step-1",
        title: "Legal sign-off",
        notificationIds: ["e-mail"],
        config
    });
};

describe("buildAiStepForm (R270, R275)", () => {
    it("has the common fields, instructions, model, tools and Notify via, in order, with no tabs", () => {
        const form = createForm();
        const names = form.vm.layout.flatMap(node => {
            return node.type === "row" ? node.fields.map(field => field.name) : [node.type];
        });

        expect(names).toEqual([
            "title",
            "color",
            "description",
            "instructions",
            "model",
            "tools",
            "notifications"
        ]);
    });

    it("uses the AI description placeholder", () => {
        expect(createForm().field("description").vm.placeholder).toBe(
            "What this AI check is for. Shown to the requester and reviewers."
        );
    });

    it("describes Instructions (research2-admin.md 5)", () => {
        const instructions = createForm().field("instructions").vm;

        expect(instructions.label).toBe("Instructions");
        expect(instructions.placeholder).toBe("Check tone of voice, flag any personal data…");
        expect(instructions.description).toBe(
            "The AI reviews the revision against these instructions, then approves or rejects it and lists the issues it found."
        );
        expect(instructions.renderer).toBe("textarea");
    });

    it("describes Model and Tools", () => {
        const form = createForm();

        expect(form.field("model").vm.label).toBe("Model");
        expect(form.field("model").vm.description).toBe("Models available through AI Power-Ups.");
        expect(form.field("model").vm.renderer).toBe(STEP_FORM_RENDERER.aiModel);
        expect(form.field("tools").vm.label).toBe("Tools");
        expect(form.field("tools").vm.renderer).toBe(STEP_FORM_RENDERER.aiTools);
        expect(form.field("tools").vm.isList).toBe(true);
    });

    it("requires instructions and a model with the design messages (QBZ-12)", async () => {
        const form = createForm();

        expect(await form.field("instructions").validate({ force: true })).toBe(false);
        expect(form.field("instructions").vm.validation.message).toBe(
            "Enter instructions for the AI."
        );
        expect(await form.field("model").validate({ force: true })).toBe(false);
        expect(form.field("model").vm.validation.message).toBe("Choose an AI model.");

        form.field("instructions").setValue("Check tone");
        form.field("model").setValue("anthropic/claude-balanced");

        expect(await form.field("instructions").validate({ force: true })).toBe(true);
        expect(await form.field("model").validate({ force: true })).toBe(true);
    });

    it("starts a new step with no model (QBZ-89)", () => {
        expect(createForm().field("model").getValue()).toBeNull();
    });

    it("validates instructions and model after each edit (QBZ-13)", async () => {
        const form = createForm();

        form.field("model").vm.onChange("anthropic/claude-balanced");
        form.field("model").vm.onChange(null);

        await vi.waitFor(() => {
            expect(form.field("model").vm.validation.message).toBe("Choose an AI model.");
        });
    });

    it("disables every field when read-only (QBZ-47)", () => {
        const readOnly = createForm(true);

        [
            "title",
            "color",
            "description",
            "instructions",
            "model",
            "tools",
            "notifications"
        ].forEach(name => {
            expect(readOnly.field(name).vm.disabled).toBe(true);
        });
        expect(createForm(false).field("instructions").vm.disabled).toBe(false);
    });

    it("loads a step without becoming dirty", () => {
        const form = createForm();

        form.setData(getAiFormData(aiStep()), { dirty: false });

        expect(form.isDirty).toBe(false);
        expect(form.getData()).toMatchObject({
            instructions: "Check tone",
            model: "anthropic/claude-balanced",
            tools: ["read-fields"]
        });
    });
});

describe("getAiFormData", () => {
    it("reads the stored config, treating a missing model as none", () => {
        const data = getAiFormData(aiStep({ instructions: "Check tone", tools: [] }));

        expect(data.instructions).toBe("Check tone");
        expect(data.model).toBeNull();
        expect(data.tools).toEqual([]);
    });

    it("keeps every stored tool name and ignores what is not a string", () => {
        const data = getAiFormData(
            aiStep({ instructions: "", model: "m/x", tools: ["a", 1, "gone"] })
        );

        expect(data.tools).toEqual(["a", "gone"]);
    });

    it("reads an empty config as empty values", () => {
        const data = getAiFormData(aiStep({}));

        expect(data.instructions).toBe("");
        expect(data.model).toBeNull();
        expect(data.tools).toEqual([]);
    });
});

describe("getAiStepPatch (R270, Review Focus 3)", () => {
    it("writes exactly the AI config keys: instructions, model and tools", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(Object.keys(patch.config ?? {}).sort()).toEqual(["instructions", "model", "tools"]);
        expect(patch.config).toEqual({
            instructions: "Check tone",
            model: "anthropic/claude-balanced",
            tools: ["read-fields"]
        });
    });

    it("writes the edited values and keeps tool names the list no longer offers", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, {
            ...getAiFormData(step),
            instructions: "Check tone and links",
            model: "openai/gpt-fast",
            tools: ["gone", "check-links"]
        });

        expect(patch.config).toEqual({
            instructions: "Check tone and links",
            model: "openai/gpt-fast",
            tools: ["gone", "check-links"]
        });
    });

    it("writes an empty model for a step with none, so the server names the field", () => {
        const step = aiStep({});

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(patch.config).toEqual({ instructions: "", model: "", tools: [] });
    });

    it("includes the common fields", () => {
        const step = aiStep();

        const patch = getAiStepPatch(step, getAiFormData(step));

        expect(patch.title).toBe("Legal sign-off");
        expect(patch.notificationIds).toEqual(["e-mail"]);
    });
});
