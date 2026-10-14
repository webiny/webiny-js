import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";

/**
 * `GetTaskUseCase` for contexts that register the workflows feature but no background-tasks
 * feature: single review reads resolve it for stuck detection (R152). It answers `null`, which is
 * only acted on for an in-review automation step; the CMS tests that build one (Task 16) register
 * a package-local `FakeGetTask` over it.
 */
export const NoopGetTask: GetTaskUseCase.Interface = {
    execute: async () => null
};
