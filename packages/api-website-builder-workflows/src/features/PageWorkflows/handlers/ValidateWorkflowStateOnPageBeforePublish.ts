import { WebinyError } from "@webiny/error";
import { PageBeforePublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { WB_PAGE_APP } from "~/utils/appName.js";
import { GetTargetWorkflowStateUseCase } from "@webiny/api-workflows/features/workflowState/GetTargetWorkflowState/index.js";

class ValidateWorkflowStateOnPageBeforePublishImpl
    implements PageBeforePublishEventHandler.Interface
{
    constructor(private getTargetState: GetTargetWorkflowStateUseCase.Interface) {}

    async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const stateResult = await this.getTargetState.execute({
            app: WB_PAGE_APP,
            targetRevisionId: page.id
        });

        if (stateResult.isFail()) {
            if (stateResult.error.code === "Workflows/State/NotFound") {
                /**
                 * If page workflows don't have custom states, there is no need to validate anything.
                 */
                return;
            }
        }

        const state = stateResult.value;

        if (state?.done) {
            return;
        }

        throw new WebinyError(
            "Cannot publish page because its workflow state is not completed.",
            "WORKFLOW_STATE_NOT_COMPLETED",
            {
                app: WB_PAGE_APP,
                pageId: page.id,
                state: {
                    ...state
                }
            }
        );
    }
}

export const ValidateWorkflowStateOnPageBeforePublish =
    PageBeforePublishEventHandler.createImplementation({
        implementation: ValidateWorkflowStateOnPageBeforePublishImpl,
        dependencies: [GetTargetWorkflowStateUseCase]
    });
