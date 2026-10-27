import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import type { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiStepRunner } from "~/api/features/WorkflowReview/AiStepRunner/AiStepRunner.js";
import { ScriptedAi } from "./ScriptedAi.js";
import { AI_MODEL, AI_STEP_ID, requester } from "./aiStepFixtures.js";
import {
    createResolvedCapability,
    registerFakeResolveAiCapability
} from "./FakeResolveAiCapability.js";
import { AI_TASK, createRunningAiReview } from "./aiRunReviews.js";
import { registerRecordingLogger } from "./RecordingLogger.js";
import { ScriptedEditorService } from "./ScriptedEditorService.js";
import { StoredReviewStaleCheck } from "./StoredReviewStaleCheck.js";
import type { StoredReview } from "./StoredReviewStaleCheck.js";
import { registerFakeWorkflowAiTools } from "./FakeWorkflowAiToolRegistry.js";

/** The guidance of the capability the fake resolver answers (Task 17's fixture). */
export const GUIDANCE = createResolvedCapability(AI_MODEL).guidance;

/**
 * What the shared fake resolver (Task 17's `registerFakeResolveAiCapability`) answers: `result`
 * by default, a throw when `failure` is set. `calls` is the fake's own record.
 */
interface ScriptedCapabilityResolver {
    calls: ReturnType<typeof registerFakeResolveAiCapability>["calls"];
    result: Result<ResolveAiCapabilityUseCase.Resolution, Error>;
    failure: Error | null;
}

export interface AiStepRunnerHarnessOptions {
    review?: ReviewData;
    tools?: WorkflowAiTool.Interface[];
}

export interface AiStepRunOverrides {
    iteration?: number;
    signal?: AbortSignal;
}

export const createAiStepRunnerHarness = (options: AiStepRunnerHarnessOptions = {}) => {
    const store: StoredReview = { review: options.review ?? createRunningAiReview() };
    const ai = new ScriptedAi();
    const editor = new ScriptedEditorService();
    const staleCheck = new StoredReviewStaleCheck(store);

    const container = new Container();
    container.registerInstance(Ai, ai);
    const resolver: ScriptedCapabilityResolver = {
        calls: [],
        result: Result.ok(createResolvedCapability(AI_MODEL)),
        failure: null
    };
    const fakeResolve = registerFakeResolveAiCapability(container, async () => {
        if (resolver.failure) {
            throw resolver.failure;
        }
        return resolver.result;
    });
    resolver.calls = fakeResolve.calls;
    container.registerInstance(ReviewTargetEditorService, editor);
    registerFakeWorkflowAiTools(container, options.tools ?? []);
    container.registerInstance(StepRunStaleCheckService, staleCheck);
    const logger = registerRecordingLogger(container);
    container.register(AiStepRunner);
    const runner = container.resolveAll(StepRunner)[0];

    const run = (overrides: AiStepRunOverrides = {}) => {
        // The run gets the snapshot the handler read at its start; flips go to `store.review`.
        const review = structuredClone(store.review);
        const step = review.steps.find(item => item.id === AI_STEP_ID) as ReviewStep;
        return runner.run({
            review,
            step,
            requester,
            task: AI_TASK,
            iteration: overrides.iteration ?? 1,
            state: null,
            signal: overrides.signal ?? new AbortController().signal
        });
    };

    return { runner, run, store, ai, resolver, editor, staleCheck, logger };
};
