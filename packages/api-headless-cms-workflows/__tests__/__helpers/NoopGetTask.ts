import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Result } from "@webiny/feature/api";
import { TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";

/**
 * `GetTaskUseCase` for contexts that register the workflows feature but no background-tasks
 * feature: single review reads resolve it for stuck detection (R152). It answers not found, which is
 * only acted on for an in-review automation step; the CMS tests that build one (Task 16) register
 * a package-local `FakeGetTask` over it.
 */
export const NoopGetTask: GetTaskUseCase.Interface = {
    execute: async () => Result.fail(new TaskNotFoundError())
};
