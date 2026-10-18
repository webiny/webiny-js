import { createAbstraction } from "@webiny/feature/admin";
import type { IWorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/IWorkflowEditorUseCases.js";

export const WbWorkflowEditorUseCases = createAbstraction<IWorkflowEditorUseCases>(
    "WebsiteBuilder/Workflows/WorkflowEditorUseCases"
);

export namespace WbWorkflowEditorUseCases {
    export type Interface = IWorkflowEditorUseCases;
}
