import type { CmsEntry } from "@webiny/api-headless-cms/types/types.js";
import type { IWorkflowsTransformer } from "./abstractions/WorkflowsTransformer.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { IWorkflowInput } from "../abstractions/WorkflowInput.js";
import type { IWorkflow } from "../abstractions/Workflow.js";

export class WorkflowsTransformer implements IWorkflowsTransformer {
    public toCmsEntry(input: IWorkflowInput): IWorkflow {
        return {
            id: input.id,
            app: input.app,
            name: input.name,
            steps: input.steps
        };
    }

    public fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow {
        const { id } = parseIdentifier(input.id);
        return {
            id,
            app: input.values.app,
            name: input.values.name,
            steps: input.values.steps
        };
    }
}
