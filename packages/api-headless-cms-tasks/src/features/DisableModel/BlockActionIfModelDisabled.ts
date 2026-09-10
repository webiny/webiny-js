import { WebinyError } from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { BlockActionIfModelDisabled as Abstraction } from "./abstractions.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";

class BlockActionIfModelDisabledImpl implements Abstraction.Interface {
    constructor(private readonly deleteModelOperations: DeleteModelOperations.Interface) {}

    async execute(model: CmsModel): Promise<void> {
        const isBeingDeleted = await this.deleteModelOperations.isModelBeingDeleted(model.modelId);
        if (!isBeingDeleted) {
            return;
        }

        throw new WebinyError(
            `Model "${model.name}" is being deleted and you cannot create, update or delete any entries of this model.`
        );
    }
}

/**
 * Takes `DeleteModelOperations` itself, not a pre-bound `isModelBeingDeleted`.
 *
 * Binding the method meant the feature had to `container.resolve(DeleteModelOperations)` while
 * registering, which constructs it — and therefore everything it depends on — at register time.
 * `HcmsTasksFeature` registers before `BackgroundTasksFeature`, so the moment the operations class
 * declared its own task use cases that resolve threw "No registration found for
 * Tasks/TriggerTaskUseCase". Depending on the abstraction defers construction to first use.
 */
export const BlockActionIfModelDisabledImplementation = Abstraction.createImplementation({
    implementation: BlockActionIfModelDisabledImpl,
    dependencies: [DeleteModelOperations]
});
