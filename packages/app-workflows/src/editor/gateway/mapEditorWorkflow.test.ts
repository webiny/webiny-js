import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapEditorWorkflow } from "./mapEditorWorkflow.js";
import { EDITOR_CREATED_ON } from "~/editor/testing/editorFixtures.js";
import { EDITOR_SAVED_ON } from "~/editor/testing/editorFixtures.js";
import { createEditorActorDto } from "~/editor/testing/editorFixtures.js";
import { createEditorStepDto } from "~/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";

describe("mapEditorWorkflow", () => {
    it("maps every field of a workflow", () => {
        const dto = createEditorWorkflowDto({
            id: "workflow-7",
            name: "Page review",
            models: ["wb.page"],
            steps: [
                createEditorStepDto({
                    id: "step-a",
                    title: "Legal",
                    color: "#3B6FD4",
                    description: "Check the claims.",
                    type: "review",
                    notifications: [{ id: "e-mail" }, { id: "slack" }],
                    config: { teams: ["team-9"] }
                })
            ],
            createdBy: createEditorActorDto({ id: "user-5", displayName: "Maja Kos" }),
            savedBy: createEditorActorDto({ id: "user-6", displayName: "Luka Peric" })
        });

        const workflow = mapEditorWorkflow(dto);

        expect(workflow).toEqual({
            id: "workflow-7",
            name: "Page review",
            models: ["wb.page"],
            steps: [
                {
                    id: "step-a",
                    title: "Legal",
                    color: "#3B6FD4",
                    description: "Check the claims.",
                    type: "review",
                    notificationIds: ["e-mail", "slack"],
                    config: { teams: ["team-9"] }
                }
            ],
            createdOn: EDITOR_CREATED_ON,
            savedOn: EDITOR_SAVED_ON,
            createdBy: { id: "user-5", displayName: "Maja Kos" },
            savedBy: { id: "user-6", displayName: "Luka Peric" }
        });
    });

    it("keeps savedOn and createdOn as the identical strings (D131, Review Focus 1)", () => {
        const dto = createEditorWorkflowDto({
            createdOn: "2026-10-17T08:00:00.000Z",
            savedOn: "2026-10-18T09:15:30.123Z"
        });

        const workflow = mapEditorWorkflow(dto);

        expect(workflow.savedOn).toBe("2026-10-18T09:15:30.123Z");
        expect(workflow.createdOn).toBe("2026-10-17T08:00:00.000Z");
        expect(typeof workflow.savedOn).toBe("string");
    });

    it("keeps a savedOn string without milliseconds untouched", () => {
        const dto = createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30Z" });

        expect(mapEditorWorkflow(dto).savedOn).toBe("2026-10-18T09:15:30Z");
    });

    it("maps a missing description to null", () => {
        const step = createEditorStepDto();
        Reflect.deleteProperty(step, "description");
        const dto = createEditorWorkflowDto({ steps: [step] });

        expect(mapEditorWorkflow(dto).steps[0].description).toBeNull();
    });

    it("maps a step without notifications to an empty id list", () => {
        const dto = createEditorWorkflowDto({
            steps: [createEditorStepDto({ notifications: [] })]
        });

        expect(mapEditorWorkflow(dto).steps[0].notificationIds).toEqual([]);
    });

    it("keeps a step of an unknown type and a config of any shape as they are", () => {
        const config = { anything: [1, { nested: true }], other: null };
        const dto = createEditorWorkflowDto({
            steps: [createEditorStepDto({ type: "future", config })]
        });

        const step = mapEditorWorkflow(dto).steps[0];

        expect(step.type).toBe("future");
        expect(step.config).toBe(config);
    });

    it("keeps the order of the steps and an empty workflow", () => {
        const dto = createEditorWorkflowDto({
            steps: [
                createEditorStepDto({ id: "step-2" }),
                createEditorStepDto({ id: "step-1" }),
                createEditorStepDto({ id: "step-3" })
            ]
        });

        expect(mapEditorWorkflow(dto).steps.map(step => step.id)).toEqual([
            "step-2",
            "step-1",
            "step-3"
        ]);
        expect(mapEditorWorkflow(createEditorWorkflowDto({ steps: [] })).steps).toEqual([]);
    });

    it("does not change the DTO", () => {
        const dto = createEditorWorkflowDto();
        const before = JSON.stringify(dto);

        mapEditorWorkflow(dto);

        expect(JSON.stringify(dto)).toBe(before);
    });
});
