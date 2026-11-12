import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { WorkflowAppAccess } from "@webiny/api-workflows/features/workflow/WorkflowAppAccess/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { getReadableModel } from "~/utils/readableModel.js";

/**
 * A `cms.<modelId>` workflow is readable by those who can read the model's entries.
 */
class CmsWorkflowAppAccessImpl implements WorkflowAppAccess.Interface {
    constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private decoratee: WorkflowAppAccess.Interface
    ) {}

    async canRead(app: string): Promise<boolean> {
        const modelId = getModelIdFromAppName(app);
        if (!modelId) {
            return this.decoratee.canRead(app);
        }
        const model = await getReadableModel({
            getModel: this.getModel,
            accessControl: this.accessControl,
            modelId
        });
        return !!model;
    }
}

export const CmsWorkflowAppAccess = WorkflowAppAccess.createDecorator({
    decorator: CmsWorkflowAppAccessImpl,
    dependencies: [GetModelUseCase, AccessControl]
});
