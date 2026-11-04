import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorGateway } from "~/editor/gateway/abstractions.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorGateway extends WorkflowEditorGateway.Interface {
    listModels: Mock<WorkflowEditorGateway.Interface["listModels"]>;
    getWorkflow: Mock<WorkflowEditorGateway.Interface["getWorkflow"]>;
    storeWorkflow: Mock<WorkflowEditorGateway.Interface["storeWorkflow"]>;
    deleteWorkflow: Mock<WorkflowEditorGateway.Interface["deleteWorkflow"]>;
    inspectRouting: Mock<WorkflowEditorGateway.Interface["inspectRouting"]>;
    folderExists: Mock<WorkflowEditorGateway.Interface["folderExists"]>;
}

/*
 * The editor's area gateway as a test double for the use-case tests (R355): it answers DTOs, as
 * the routing gateway does after unwrapping. Defaults: the default model page, workflow and routing
 * inspection, and `true` for a folder.
 */
export const createFakeEditorGateway = (): FakeWorkflowEditorGateway => {
    const page = createWorkflowModelPageDto();
    const workflow = createEditorWorkflowDto();
    const inspection = createRoutingInspectionDto();
    return {
        listModels: vi.fn().mockResolvedValue(page),
        getWorkflow: vi.fn().mockResolvedValue(workflow),
        storeWorkflow: vi.fn().mockResolvedValue(workflow),
        deleteWorkflow: vi.fn().mockResolvedValue(workflow),
        inspectRouting: vi.fn().mockResolvedValue(inspection),
        folderExists: vi.fn().mockResolvedValue(true)
    };
};
