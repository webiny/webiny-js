import { type IWorkflowValues, WorkflowMapper as MapperAbstraction } from "./abstractions.js";
import type { IWorkflow } from "./abstractions.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowInput } from "~/features/shared/abstractions.js";

class WorkflowMapperImpl implements MapperAbstraction.Interface {
    fromCmsEntry(entry: CmsEntry<IWorkflowValues>): IWorkflow {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            app: entry.values.app,
            name: entry.values.name,
            steps: entry.values.steps
        };
    }

    toCmsEntry(workflow: IWorkflowInput): IWorkflow {
        return {
            id: workflow.id,
            app: workflow.app,
            name: workflow.name,
            steps: workflow.steps
        };
    }
}

export const WorkflowMapper = MapperAbstraction.createImplementation({
    implementation: WorkflowMapperImpl,
    dependencies: []
});
