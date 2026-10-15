import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";

type ReachResult = Awaited<ReturnType<StepRunReachService.Interface["reach"]>>;

/**
 * Registers a `StepRunReachService` that records what it was asked to reach and answers `result`
 * (ok by default). The real service is Task 2's and is tested there; these tests only pin what the
 * AI step type hands to it.
 */
export const registerFakeStepRunReachService = (
    container: Container,
    result: ReachResult = Result.ok()
) => {
    const calls: StepRunReachService.Params[] = [];
    container.registerInstance(StepRunReachService, {
        reach: async (params: StepRunReachService.Params) => {
            calls.push(params);
            return result;
        }
    });
    return { calls };
};
