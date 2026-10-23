import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getStaleStepRunReason } from "@webiny/api-workflows/domain/review/getStaleStepRunReason.js";
import {
    ReviewPersistenceError,
    ReviewTargetEditorError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiStepRunner } from "~/api/features/WorkflowReview/AiStepRunner/AiStepRunner.js";
import { ScriptedAi } from "./ScriptedAi.js";
import { AI_MODEL, AI_STEP_ID, requester } from "./aiStepFixtures.js";
import {
    createResolvedCapability,
    registerFakeResolveAiCapability
} from "./FakeResolveAiCapability.js";
import { AI_TASK, createRunningAiReview } from "./aiRunReviews.js";

/** The guidance of the capability the fake resolver answers (Task 17's fixture). */
export const GUIDANCE = createResolvedCapability(AI_MODEL).guidance;

export const createTargetContent = (): ReviewTargetContent => {
    return {
        title: "Ann",
        fields: [
            { path: "name", label: "Name", type: "text", value: "Ann", writable: true },
            {
                path: "bio",
                label: "Bio",
                type: "long-text",
                value: "Writes about cats.",
                writable: true
            }
        ]
    };
};

export interface RecordedLog {
    level: "info" | "error";
    message: string;
    fields: Record<string, unknown>;
}

/** Records `info` and `error`; the other levels are dropped. */
class RecordingLogger implements Logger.Interface {
    public readonly logs: RecordedLog[] = [];

    public get errors(): RecordedLog[] {
        return this.logs.filter(log => log.level === "error");
    }

    public get infos(): RecordedLog[] {
        return this.logs.filter(log => log.level === "info");
    }

    public trace(): void {}
    public debug(): void {}
    public warn(): void {}
    public fatal(): void {}
    public log(): void {}

    public info(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "info",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }

    public error(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "error",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }
}

/**
 * What the shared fake resolver (Task 17's `registerFakeResolveAiCapability`) answers: `result`
 * by default, a throw when `failure` is set. `calls` is the fake's own record.
 */
interface ScriptedCapabilityResolver {
    calls: ReturnType<typeof registerFakeResolveAiCapability>["calls"];
    result: Result<ResolveAiCapabilityUseCase.Resolution, Error>;
    failure: Error | null;
}

class ScriptedEditorService implements ReviewTargetEditorService.Interface {
    public readonly readCalls: ReviewTargetEditorReadParams[] = [];
    public content: Result<ReviewTargetContent, ReviewTargetEditorError> =
        Result.ok(createTargetContent());

    public async read(params: ReviewTargetEditorReadParams) {
        this.readCalls.push(params);
        return this.content;
    }

    public async update(): Promise<never> {
        throw new Error("The AI runner never writes: only a tool may.");
    }
}

class FakeToolRegistry implements WorkflowAiToolRegistryService.Interface {
    public constructor(private tools: WorkflowAiTool.Interface[]) {}

    public get(name: string): WorkflowAiTool.Interface | null {
        return this.tools.find(tool => tool.name === name) ?? null;
    }

    public list(): WorkflowAiTool.Interface[] {
        return this.tools;
    }
}

/** The stored review, replaced by the test to cancel or restart it during the model call. */
export interface StoredReview {
    review: ReviewData;
}

/**
 * `StepRunStaleCheckService` over the stored review with the real guard. `calls` records every
 * read; set `failure` to answer a failed Result (the real service is fail-closed and logs its own
 * failures, so the fake logs nothing).
 */
class StoredReviewStaleCheck implements StepRunStaleCheckService.Interface {
    public readonly calls: StepRunStaleCheckService.Params[] = [];
    public failure: ReviewPersistenceError | null = null;
    public throws: Error | null = null;

    public constructor(private store: StoredReview) {}

    public async isStale(
        params: StepRunStaleCheckService.Params
    ): Promise<Result<boolean, ReviewPersistenceError>> {
        this.calls.push(params);
        if (this.throws) {
            throw this.throws;
        }
        if (this.failure) {
            return Result.fail(this.failure);
        }
        const reason = getStaleStepRunReason(this.store.review, params.stepId, params.task);
        return Result.ok(reason !== null);
    }
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
    const registry = new FakeToolRegistry(options.tools ?? []);
    const staleCheck = new StoredReviewStaleCheck(store);
    const logger = new RecordingLogger();

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
    container.registerInstance(WorkflowAiToolRegistryService, registry);
    container.registerInstance(StepRunStaleCheckService, staleCheck);
    container.registerInstance(Logger, logger);
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

    return { runner, run, store, ai, resolver, editor, registry, staleCheck, logger };
};
