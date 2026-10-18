import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/IWorkflowEditorUseCases.js";

export const CmsWorkflowEditorUseCases = createAbstraction<IWorkflowEditorUseCases>(
    "Cms/Workflows/WorkflowEditorUseCases"
);

export namespace CmsWorkflowEditorUseCases {
    export type Interface = IWorkflowEditorUseCases;
}
