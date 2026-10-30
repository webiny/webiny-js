import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { WorkflowEditorAppGateway } from "~/editor/appGateway/abstractions.js";
import { createEditorWorkflowDto } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPageDto } from "~/editor/testing/editorFixtures.js";

export interface FakeWorkflowEditorAppGateway extends WorkflowEditorAppGateway.Interface {
    listModels: Mock<WorkflowEditorAppGateway.Interface["listModels"]>;
    getWorkflow: Mock<WorkflowEditorAppGateway.Interface["getWorkflow"]>;
    storeWorkflow: Mock<WorkflowEditorAppGateway.Interface["storeWorkflow"]>;
    deleteWorkflow: Mock<WorkflowEditorAppGateway.Interface["deleteWorkflow"]>;
    inspectRouting: Mock<WorkflowEditorAppGateway.Interface["inspectRouting"]>;
    folderExists: Mock<WorkflowEditorAppGateway.Interface["folderExists"]>;
}

/*
 * One app's editor gateway as a test double. Every method resolves a success envelope: the default
 * model page, the default workflow, the default routing inspection and `true` for a folder.
 * Tests override single methods with `mockResolvedValue` or `mockRejectedValue`.
 */
export const createFakeEditorAppGateway = (app: WorkflowAppKind): FakeWorkflowEditorAppGateway => {
    const page = createWorkflowModelPageDto();
    const workflow = createEditorWorkflowDto();
    const inspection = createRoutingInspectionDto();
    return {
        app,
        listModels: vi.fn().mockResolvedValue({ data: page, error: null }),
        getWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        storeWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        deleteWorkflow: vi.fn().mockResolvedValue({ data: workflow, error: null }),
        inspectRouting: vi.fn().mockResolvedValue({ data: inspection, error: null }),
        folderExists: vi.fn().mockResolvedValue({ data: true, error: null })
    };
};
