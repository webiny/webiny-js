import { WorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/WorkflowEditorUseCases.js";
import { CmsWorkflowEditorGateway } from "../CmsWorkflowEditorGateway/abstractions.js";
import { CmsWorkflowEditorUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `WorkflowEditorUseCases`, so each app binds its own
 * subclass; binding the shared class twice would let the second call overwrite the first.
 */
class CmsWorkflowEditorUseCasesImpl
    extends WorkflowEditorUseCases
    implements UseCasesAbstraction.Interface {}

export const CmsWorkflowEditorUseCases = UseCasesAbstraction.createImplementation({
    implementation: CmsWorkflowEditorUseCasesImpl,
    dependencies: [CmsWorkflowEditorGateway]
});
