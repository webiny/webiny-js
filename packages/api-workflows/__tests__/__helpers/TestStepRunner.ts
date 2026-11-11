import type { Container } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { AUTOMATION_STEP_ID } from "./stepRunReviews.js";
import { createAutomationStep } from "./TestAutomationDefinition.js";
import {
    ARTICLE_MODEL,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext,
    toSaveData
} from "./fixtures.js";

export const FAKE_STEP_TYPE = "fake-runner";

/** The owner of a fake step: the requester's id and name with type `ai`. */
export const fakeActor: Actor = {
    type: "ai",
    id: requester.id,
    displayName: requester.displayName
};

export interface TestStepRunnerOptions {
    type?: string;
    singleRun?: boolean;
    failureReasons?: Partial<StepRunner.FailureReasons>;
    maxIterations?: number;
}

/**
 * A `StepRunner` for tests. Every `run` call is recorded in `runCalls`; replace `runImpl` to
 * change what it answers or does (default: approve with the comment `Looks good.`). Register it
 * with `registerTestStepRunner` in a `setup` callback of `createContextHandler`.
 */
export class TestStepRunner implements StepRunner.Interface {
    public readonly type: string;
    public readonly singleRun: boolean;
    public readonly failureReasons: StepRunner.FailureReasons;
    public readonly runCalls: StepRunner.Params[] = [];
    public runImpl: (params: StepRunner.Params) => Promise<StepRunner.Outcome> = async () => {
        return { type: "approved", comment: "Looks good." };
    };
    private readonly maxIterations: number;

    public constructor(options: TestStepRunnerOptions = {}) {
        this.type = options.type ?? FAKE_STEP_TYPE;
        this.singleRun = options.singleRun ?? false;
        this.maxIterations = options.maxIterations ?? 3;
        this.failureReasons = {
            error: "The fake step failed.",
            aborted: "The fake step was aborted.",
            stuck: "The fake step ended without a result.",
            ...options.failureReasons
        };
    }

    public maxIterationsReason(step: ReviewStep): string {
        return `The fake step "${step.id}" did not finish in ${this.maxIterations} iterations.`;
    }

    public getActor(): Actor {
        return fakeActor;
    }

    public async run(params: StepRunner.Params): Promise<StepRunner.Outcome> {
        this.runCalls.push(params);
        return this.runImpl(params);
    }
}

export const registerTestStepRunner = (container: Container, runner: TestStepRunner): void => {
    container.registerInstance(StepRunner, runner as StepRunner.Interface);
};

/**
 * Review "review-1" built from a ONE-step workflow (the step "automation"), so approving the step
 * finishes the review: it is `approved` and the review does not move on to a second step. The
 * step is reached with `taskId`, `inReview`, owned by `fakeActor`, with its type replaced by
 * `type`. Save it with `ReviewRepository.save`. (Do not build it on `createPendingAutomationReview`:
 * that one has a second review step "editorial", which an approve would reach.)
 */
export const createFakeStepReview = (
    taskId: string | null = "task-1",
    type: string = FAKE_STEP_TYPE
): ReviewData => {
    const workflow = createWorkflow({
        steps: [createAutomationStep({ id: AUTOMATION_STEP_ID, title: "Check links" })]
    });
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        })
    );
    expectOk(review.reachRun({ actor: requester, owner: fakeActor, taskId, now: NOW }));
    const data = toSaveData(review);
    data.steps[0].type = type;
    data.steps[0].config = {};
    data.currentStepType = type;
    return data;
};
