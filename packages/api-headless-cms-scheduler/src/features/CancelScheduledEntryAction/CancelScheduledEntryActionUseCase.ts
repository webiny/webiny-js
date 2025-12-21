import { Result } from "@webiny/feature/api";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions";
import { CancelScheduledActionUseCase } from "@webiny/api-scheduler/features/CancelScheduledAction";
import { CancelScheduledEntryActionUseCase as UseCaseAbstraction } from "./abstractions.js";

/**
 * Cancels a scheduled CMS entry action
 */
class CancelScheduledEntryActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        const namespace = `Cms/Entry/${input.modelId}`;

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace,
                targetId: input.targetId
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action.id);
            if (cancelRes.isFail()) {
                return Result.fail(cancelRes.error);
            }
        }

        return Result.ok();
    }
}

export const CancelScheduledEntryActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledEntryActionUseCaseImpl,
    dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
});
