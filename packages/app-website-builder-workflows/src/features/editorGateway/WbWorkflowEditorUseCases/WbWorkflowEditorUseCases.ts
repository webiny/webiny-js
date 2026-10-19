import { WorkflowEditorUseCases } from "@webiny/app-workflows/editor/useCases/WorkflowEditorUseCases.js";
import { WbWorkflowEditorGateway } from "../WbWorkflowEditorGateway/abstractions.js";
import { WbWorkflowEditorUseCases as UseCasesAbstraction } from "./abstractions.js";

/*
 * `createImplementation` stores the abstraction and the dependencies as metadata on the class
 * itself. Both apps bind the one shared `WorkflowEditorUseCases`, so each app binds its own
 * subclass; binding the shared class twice would let the second call overwrite the first.
 */
class WbWorkflowEditorUseCasesImpl
    extends WorkflowEditorUseCases
    implements UseCasesAbstraction.Interface {}

export const WbWorkflowEditorUseCases = UseCasesAbstraction.createImplementation({
    implementation: WbWorkflowEditorUseCasesImpl,
    dependencies: [WbWorkflowEditorGateway]
});
