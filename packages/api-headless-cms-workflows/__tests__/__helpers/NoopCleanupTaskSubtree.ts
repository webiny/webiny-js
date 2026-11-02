import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";

/**
 * `CleanupTaskSubtreeUseCase` for contexts that register the workflows feature but no
 * background-tasks feature: deleting a review cleans up the tasks of its step attempts (R256).
 * There is no task store here, so it does nothing.
 */
export const NoopCleanupTaskSubtree: CleanupTaskSubtreeUseCase.Interface = {
    execute: async () => undefined
};
