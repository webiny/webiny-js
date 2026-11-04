import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createAiStep } from "~/editor/testing/draftFixtures.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { WorkflowDraft } from "./WorkflowDraft.js";

const loaded = (): WorkflowDraft => {
    const draft = new WorkflowDraft();
    const workflow = createEditorWorkflow({
        steps: [createReviewStep(), createAutomationStep(), createAiStep()]
    });
    draft.reset(workflow);
    return draft;
};

describe("WorkflowDraft: lifecycle", () => {
    it("starts closed and clean", () => {
        const draft = new WorkflowDraft();

        expect(draft.isOpen).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.isNew).toBe(false);
        expect(draft.steps).toEqual([]);
        expect(draft.savedOn).toBeNull();
    });

    it("loads a workflow clean and keeps the loaded savedOn string unchanged (Review Focus 1)", () => {
        const draft = new WorkflowDraft();

        draft.reset(createEditorWorkflow({ savedOn: "2026-10-02T10:30:00.123Z" }));

        expect(draft.isOpen).toBe(true);
        expect(draft.isNew).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.id).toBe("workflow-1");
        expect(draft.name).toBe("Article review");
        expect(draft.models).toEqual(["cms.article"]);
        expect(draft.savedOn).toBe("2026-10-02T10:30:00.123Z");
    });

    it("opens a new draft that is dirty from the start with no savedOn (R276)", () => {
        const draft = new WorkflowDraft();

        draft.startNew({ id: "workflow-new", name: "Article review", models: ["cms.article"] });

        expect(draft.isOpen).toBe(true);
        expect(draft.isNew).toBe(true);
        expect(draft.isDirty).toBe(true);
        expect(draft.savedOn).toBeNull();
        expect(draft.steps).toEqual([]);
        expect(draft.id).toBe("workflow-new");
    });

    it("closes with reset(null): empty, clean, nothing open", () => {
        const draft = loaded();
        draft.setName("Changed");

        draft.reset(null);

        expect(draft.isOpen).toBe(false);
        expect(draft.isDirty).toBe(false);
        expect(draft.name).toBe("");
        expect(draft.steps).toEqual([]);
        expect(draft.savedOn).toBeNull();
    });

    it("keeps the content but drops the baseline on detachBaseline (Save as new)", () => {
        const draft = loaded();

        draft.detachBaseline();

        expect(draft.isNew).toBe(true);
        expect(draft.isDirty).toBe(true);
        expect(draft.savedOn).toBeNull();
        expect(draft.id).toBe("workflow-1");
        expect(draft.steps).toHaveLength(3);
    });

    it("copies the loaded steps, so editing the draft never changes the loaded workflow", () => {
        const draft = new WorkflowDraft();
        const workflow = createEditorWorkflow({ steps: [createReviewStep()] });
        draft.reset(workflow);

        draft.updateStep("step-1", { title: "Changed" });

        expect(workflow.steps[0].title).toBe("Legal sign-off");
    });
});

describe("WorkflowDraft: dirty tracking", () => {
    it("is dirty after a rename and clean again when the name is set back", () => {
        const draft = loaded();

        draft.setName("Changed");
        expect(draft.isDirty).toBe(true);

        draft.setName("Article review");
        expect(draft.isDirty).toBe(false);
    });

    it("is dirty after a step edit and clean again when the value is set back", () => {
        const draft = loaded();

        draft.updateStep("step-1", { title: "Changed" });
        expect(draft.isDirty).toBe(true);

        draft.updateStep("step-1", { title: "Legal sign-off" });
        expect(draft.isDirty).toBe(false);
    });

    it("is not dirty when a config is replaced by an equal one with another key order", () => {
        const draft = loaded();

        draft.updateStep("step-2", {
            config: { settings: { url: "https://example.com/hook" }, automationId: "send-webhook" }
        });

        expect(draft.isDirty).toBe(false);
    });

    it("is dirty after add, remove and move", () => {
        const added = loaded();
        added.addStep(0, createReviewStep({ id: "step-9" }));
        expect(added.isDirty).toBe(true);

        const removed = loaded();
        removed.removeStep("step-1");
        expect(removed.isDirty).toBe(true);

        const moved = loaded();
        moved.moveStep(0, 1);
        expect(moved.isDirty).toBe(true);
    });

    it("is clean again when a moved step is moved back", () => {
        const draft = loaded();

        draft.moveStep(0, 2);
        draft.moveStep(2, 0);

        expect(draft.isDirty).toBe(false);
    });
});

describe("WorkflowDraft: step operations", () => {
    it("inserts a step at the index and clamps an index out of range", () => {
        const draft = loaded();

        draft.addStep(1, createReviewStep({ id: "inserted" }));
        draft.addStep(99, createReviewStep({ id: "last" }));
        draft.addStep(-5, createReviewStep({ id: "first" }));

        expect(draft.steps.map(step => step.id)).toEqual([
            "first",
            "step-1",
            "inserted",
            "step-2",
            "step-3",
            "last"
        ]);
    });

    it("updates a step by id and never changes its id or type (D91)", () => {
        const draft = loaded();

        draft.updateStep("step-2", { title: "Renamed", color: "#3B6FD4", description: "About" });

        const step = draft.steps[1];
        expect(step.title).toBe("Renamed");
        expect(step.color).toBe("#3B6FD4");
        expect(step.description).toBe("About");
        expect(step.id).toBe("step-2");
        expect(step.type).toBe("automation");
    });

    it("ignores an update for an unknown step", () => {
        const draft = loaded();

        draft.updateStep("missing", { title: "Nope" });

        expect(draft.isDirty).toBe(false);
    });

    it("moves a step to another position", () => {
        const draft = loaded();

        draft.moveStep(0, 2);

        expect(draft.steps.map(step => step.id)).toEqual(["step-2", "step-3", "step-1"]);
    });

    it("ignores a move that is equal or out of range", () => {
        const draft = loaded();

        draft.moveStep(1, 1);
        draft.moveStep(-1, 0);
        draft.moveStep(0, 3);
        draft.moveStep(5, 0);

        expect(draft.steps.map(step => step.id)).toEqual(["step-1", "step-2", "step-3"]);
        expect(draft.isDirty).toBe(false);
    });

    it("removes a step by id", () => {
        const draft = loaded();

        draft.removeStep("step-2");

        expect(draft.steps.map(step => step.id)).toEqual(["step-1", "step-3"]);
    });

    it("finds the baseline step by id, null for an added step", () => {
        const draft = loaded();
        draft.updateStep("step-1", { title: "Changed" });
        draft.addStep(0, createReviewStep({ id: "added" }));

        expect(draft.getBaselineStep("step-1")?.title).toBe("Legal sign-off");
        expect(draft.getBaselineStep("added")).toBeNull();
    });

    it("has no baseline step for a new draft", () => {
        const draft = new WorkflowDraft();
        draft.startNew({ id: "workflow-new", name: "New", models: ["cms.article"] });
        draft.addStep(0, createReviewStep());

        expect(draft.getBaselineStep("step-1")).toBeNull();
    });
});

describe("WorkflowDraft.toInput", () => {
    it("emits the id, name, models and the steps as server input", () => {
        const draft = loaded();

        const input = draft.toInput();

        expect(input.id).toBe("workflow-1");
        expect(input.name).toBe("Article review");
        expect(input.models).toEqual(["cms.article"]);
        expect(input.steps.map(step => step.id)).toEqual(["step-1", "step-2", "step-3"]);
        expect(input.steps[0].notifications).toEqual([{ id: "e-mail" }]);
    });

    it("emits a new draft with no steps as an empty step list", () => {
        const draft = new WorkflowDraft();
        draft.startNew({ id: "workflow-new", name: "Article review", models: ["cms.article"] });

        expect(draft.toInput().steps).toEqual([]);
    });
});
