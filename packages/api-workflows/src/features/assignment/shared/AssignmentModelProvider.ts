import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AssignmentModelProvider as Abstraction } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class AssignmentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(ASSIGNMENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const AssignmentModelProvider = Abstraction.createImplementation({
    implementation: AssignmentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
