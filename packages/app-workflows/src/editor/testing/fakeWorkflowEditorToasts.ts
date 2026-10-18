import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IWorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";

export interface FakeWorkflowEditorToasts extends IWorkflowEditorToasts {
    success: Mock<IWorkflowEditorToasts["success"]>;
    error: Mock<IWorkflowEditorToasts["error"]>;
    info: Mock<IWorkflowEditorToasts["info"]>;
}

export const createFakeEditorToasts = (): FakeWorkflowEditorToasts => {
    return { success: vi.fn(), error: vi.fn(), info: vi.fn() };
};
