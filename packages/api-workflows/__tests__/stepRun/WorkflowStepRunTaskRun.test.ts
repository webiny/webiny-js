import { beforeEach, describe, expect, it } from "vitest";
import type { TaskHandler } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { FailingReviewSave, reviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import {
    captureLoggedErrors,
    loggedErrors,
    loggedInfos
} from "~tests/__helpers/CapturingLogger.js";
import {
    createFakeTaskController,
    type FakeTaskControllerParams
} from "~tests/__helpers/FakeTaskController.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TestAutomationDefinition,
    type TestAutomationOverrides,
    type TestAutomationSettings
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { AUTOMATION_STEP_ID, automationActor } from "~tests/__helpers/stepRunReviews.js";
import {
    ARTICLE_MODEL,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    targetContext,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { WorkflowStepRunTaskHandler } from "~/features/stepRun/WorkflowStepRunTask/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";

const LATER = "2026-10-09T11:00:00.000Z";

/** The one-step workflow "Check links": approving the step approves the review. */
const createReview = (
    settings: Record<string, unknown> = {},
    taskId: string | null = "task-1"
): Review => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow: createWorkflow({
                steps: [
                    createAutomationStep({
                        id: AUTOMATION_STEP_ID,
                        title: "Check links",
                        settings
                    })
                ]
            }),
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
    expectOk(review.reachRun({ actor: requester, owner: automationActor, taskId, now: NOW }));
    return review;
};

const createCancelledReview = (): Review => {
    const review = createReview();
    review.pullFacts();
    expectOk(review.cancel({ actor: requester, now: LATER }));
    return review;
};

const createApprovedReview = (): Review => {
    const review = createReview();
    expectOk(
        review.approve({
            stepId: AUTOMATION_STEP_ID,
            actor: automationActor,
            actorTeamIds: [],
            comment: null,
            now: LATER
        })
    );
    return review;
};

/** Records whether the bypass was active and who the identity was while the automation ran. */
class RunProbeDefinition extends TestAutomationDefinition {
    public readonly activeDuringRun: boolean[] = [];
    public readonly identityDuringRun: string[] = [];

    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        super();
    }

    public override async run(
        params: AutomationDefinition.RunParams<TestAutomationSettings>
    ): Promise<AutomationDefinition.Outcome> {
        this.activeDuringRun.push(this.bypass.isActive());
        this.identityDuringRun.push(this.identityContext.getIdentity().id);
        return super.run(params);
    }
}

class UnknownOutcomeDefinition extends TestAutomationDefinition {
    public override async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "nonsense" } as unknown as AutomationDefinition.Outcome;
    }
}

/** The identity in force at every `ApproveReviewStepUseCase.execute` call of the handler. */
const approveIdentities: string[] = [];

class ApproveIdentityProbeImpl implements ApproveReviewStepUseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: ApproveReviewStepUseCase.Interface
    ) {}

    public execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        approveIdentities.push(this.identityContext.getIdentity().id);
        return this.decoratee.execute(input);
    }
}

const ApproveIdentityProbe = ApproveReviewStepUseCase.createDecorator({
    decorator: ApproveIdentityProbeImpl,
    dependencies: [IdentityContext]
});

interface SetupParams {
    /** Overrides of the default test automation (`registerTestAutomation`). */
    overrides?: TestAutomationOverrides;
    /** Replaces the default test automation with this one. */
    custom?: (
        bypass: WorkflowBypassService.Interface,
        identityContext: IdentityContext.Interface
    ) => TestAutomationDefinition;
    /** Registers no automation at all. */
    none?: boolean;
}

const DEFINITION = {
    id: "workflowsStepRun",
    title: "Workflow step run",
    isPrivate: true,
    maxIterations: 10000
};

const INPUT: StepRunTaskInput = { reviewId: "review-1", stepId: AUTOMATION_STEP_ID };

const setup = async (params: SetupParams = {}) => {
    let registered: TestAutomationDefinition | null = null;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FailingReviewSave);
            container.registerDecorator(RecordingEventPublisher);
            container.registerDecorator(ApproveIdentityProbe);
            if (!params.custom && !params.none) {
                registered = registerTestAutomation(container, params.overrides);
            }
        }
    });
    const bypass = context.container.resolve(WorkflowBypassService);
    const identityContext = context.container.resolve(IdentityContext);
    const definition = params.custom ? params.custom(bypass, identityContext) : registered;
    if (params.custom) {
        context.container.registerInstance(AutomationDefinition, definition!);
    }
    const handler = context.container.resolveImplementation(
        WorkflowStepRunTaskHandler
    ) as TaskHandler.Interface<StepRunTaskInput>;
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);

    return {
        bypass,
        identityContext,
        definition: definition as TestAutomationDefinition,
        read: async (): Promise<ReviewData> => expectOk(await repository.get("review-1")),
        seed: async (review: Review): Promise<void> => {
            expectOk(await saver.save(review));
            recordedEvents.length = 0;
        },
        seedData: async (data: ReviewData): Promise<void> => {
            expectOk(await repository.save(data));
        },
        /** Cancels the stored review, as a requester would while the automation runs. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
        },
        run: (controllerParams: FakeTaskControllerParams = {}) => {
            const { controller, task, outputUpdates } = createFakeTaskController(controllerParams);
            return {
                task,
                outputUpdates,
                result: handler.run({ input: task.input, controller, definition: DEFINITION })
            };
        }
    };
};

describe("workflowsStepRun run handler (R142-R146, R148, R161-R163)", () => {
    beforeEach(() => {
        resetFakeTasks();
        loggedErrors.length = 0;
        loggedInfos.length = 0;
        recordedEvents.length = 0;
        approveIdentities.length = 0;
        reviewSaveFaults.failNext = false;
    });

    describe("waits for the review and the step to carry its task id (R143, R163)", () => {
        it.each([
            { name: "the review is not found yet", build: null },
            {
                name: "the step carries another task id",
                build: () => createReview({}, "task-other")
            },
            { name: "the step carries no task id yet", build: () => createReview({}, null) }
        ])(
            "waits for the review and step to carry its task id, at most 3 tries ($name)",
            async ({ build }) => {
                const { run, seed, read, definition } = await setup();
                if (build) {
                    await seed(build());
                }
                const before = build ? await read() : null;

                for (const iterations of [1, 2, 3]) {
                    const waiting = run({ iterations });
                    await expect(waiting.result).resolves.toEqual({
                        status: "continue",
                        input: INPUT,
                        wait: 2
                    });
                    expect(waiting.outputUpdates).toEqual([]);
                }
                const finished = run({ iterations: 4 });

                await expect(finished.result).resolves.toMatchObject({ status: "done" });
                expect(definition.runCalls).toEqual([]);
                expect(workflowEventTypes()).toEqual([]);
                expect(loggedErrors).toEqual([]);
                if (before) {
                    expect(await read()).toEqual(before);
                }
            }
        );

        it.each([
            {
                name: "the review was cancelled",
                build: createCancelledReview,
                createdById: undefined
            },
            {
                name: "the step was already approved",
                build: createApprovedReview,
                createdById: undefined
            },
            {
                name: "the task was not created by the requester",
                build: () => createReview(),
                createdById: "user-intruder"
            }
        ])(
            "ends at once, without a wait, for a guard failure that is not a missing task id ($name, R163)",
            async ({ build, createdById }) => {
                const { run, seed, definition } = await setup();
                await seed(build());

                const { result } = run({ iterations: 1, createdById });

                await expect(result).resolves.toMatchObject({ status: "done" });
                expect(definition.runCalls).toEqual([]);
                expect(workflowEventTypes()).toEqual([]);
            }
        );

        it("runs as soon as the review and step carry its task id, with iteration 1 after the waits (R163)", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ comment: "Links are fine." }));

            const { result } = run({ iterations: 3 });

            await expect(result).resolves.toMatchObject({ status: "done" });
            expect((await read()).state).toBe("approved");
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1]);
        });
    });

    describe("runs the automation and applies the outcome (R135, R141)", () => {
        it("approves as the automation actor with the parsed settings and the comment", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ comment: "Links are fine." }));

            const { result } = run({ iterations: 1 });

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "approved", currentStepState: "approved" });
            expect(stored.steps[0]).toMatchObject({
                state: "approved",
                comment: "Links are fine.",
                owner: automationActor,
                taskId: "task-1"
            });
            expect(definition.runCalls).toHaveLength(1);
            expect(definition.runCalls[0]).toMatchObject({
                settings: { mode: "approve", comment: "Links are fine." },
                iteration: 1,
                state: null
            });
            expect(definition.runCalls[0].review.id).toBe("review-1");
            expect(definition.runCalls[0].step.id).toBe(AUTOMATION_STEP_ID);
            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/StepApproved",
                "Workflows/Review/Approved"
            ]);
            const approved = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepApproved"
            );
            expect(approved?.payload.fact.actor).toEqual(automationActor);
        });

        it("rejects as the automation actor with the comment", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview({ mode: "reject", comment: "The links are broken." }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "rejected", currentStepState: "rejected" });
            expect(stored.steps[0]).toMatchObject({
                state: "rejected",
                comment: "The links are broken.",
                owner: automationActor
            });
            const rejected = recordedEvents.find(
                event => event.eventType === "Workflows/Review/StepRejected"
            );
            expect(rejected?.payload.fact.actor).toEqual(automationActor);
        });

        it.each([
            { name: "no comment", settings: { mode: "reject" } },
            {
                name: "a comment shorter than 10 characters",
                settings: { mode: "reject", comment: "No." }
            }
        ])("fails the step when it rejects with $name (D100)", async ({ settings }) => {
            const { run, seed, read } = await setup();
            await seed(createReview(settings));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({
                state: "failed",
                comment: "The automation rejected without a comment."
            });
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        });

        it("continues with the delay, writes the state and the wait count, and hands the state to the next iteration", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "wait" }));

            // One wait for the task id (task iteration 1), then the first run (task iteration 2).
            const first = run({ iterations: 2 });
            const firstResult = await first.result;
            const second = run({
                iterations: 3,
                output: { idWaits: 1, state: { iterations: 1 } }
            });
            const secondResult = await second.result;

            expect(firstResult).toEqual({ status: "continue", input: INPUT, wait: 1 });
            expect(first.outputUpdates).toEqual([{ idWaits: 1, state: { iterations: 1 } }]);
            expect(secondResult).toEqual({ status: "continue", input: INPUT, wait: 1 });
            expect(second.outputUpdates).toEqual([{ idWaits: 1, state: { iterations: 2 } }]);
            expect(definition.runCalls.map(call => call.state)).toEqual([null, { iterations: 1 }]);
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1, 2]);
            const stored = await read();
            expect(stored.steps[0]).toMatchObject({ state: "inReview", comment: null });
            expect(workflowEventTypes()).toEqual([]);
        });

        it("returns the task error when it cannot write the output, without touching the review", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview({ mode: "wait" }));
            const before = await read();

            const { result } = run({ outputUpdateError: new Error("Output is not writable.") });

            await expect(result).resolves.toEqual({
                status: "error",
                error: { message: "Output is not writable." }
            });
            expect(await read()).toEqual(before);
        });
    });

    describe("fails the step with a fixed reason (D8, R146, Review Focus 4)", () => {
        const expectFailed = async (
            read: () => Promise<ReviewData>,
            reason: string | RegExp
        ): Promise<void> => {
            const stored = await read();
            expect(stored).toMatchObject({ state: "inProgress", currentStepState: "failed" });
            expect(stored.steps[0]).toMatchObject({ state: "failed", owner: automationActor });
            if (typeof reason === "string") {
                expect(stored.steps[0].comment).toBe(reason);
            } else {
                expect(stored.steps[0].comment).toMatch(reason);
            }
            expect(workflowEventTypes()).toEqual(["Workflows/Review/StepFailed"]);
        };

        it("when the automation is missing", async () => {
            const { run, seed, read } = await setup({ none: true });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, 'The automation "test-automation" is not available.');
        });

        it("when the stored settings are not valid, without running the automation", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "nonsense" }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, /^The automation settings are not valid: mode: /);
            expect(definition.runCalls).toEqual([]);
        });

        it("when the step config no longer parses, with its own reason (P3)", async () => {
            const { run, seedData, read, definition } = await setup();
            const data = toSaveData(createReview());
            data.steps[0].config = { settings: {} };
            await seedData(data);

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation step configuration is not valid.");
            expect(definition.runCalls).toEqual([]);
        });

        it("when the automation ran past its own limit, counting runs and not waits (R145, R163, P4, P7)", async () => {
            const { run, seed, read, definition } = await setup({
                overrides: { maxIterations: 2 }
            });
            await seed(createReview({ mode: "wait" }));

            // Three waits for the task id, then three runs: the third run exceeds the limit of 2.
            const first = run({ iterations: 4 });
            await first.result;
            const second = run({ iterations: 5, output: { idWaits: 3, state: { iterations: 1 } } });
            await second.result;
            const exceeded = run({
                iterations: 6,
                output: { idWaits: 3, state: { iterations: 2 } }
            });

            await expect(exceeded.result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation did not finish in 2 iterations.");
            expect(definition.runCalls.map(call => call.iteration)).toEqual([1, 2]);
        });

        it("when the automation ran past the default of 50 runs (R145)", async () => {
            const { run, seed, read, definition } = await setup();
            await seed(createReview({ mode: "wait" }));

            const { result } = run({ iterations: 51, output: { idWaits: 0 } });

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation did not finish in 50 iterations.");
            expect(definition.runCalls).toEqual([]);
        });

        it("when the automation throws, and restores the bypass flag", async () => {
            const { run, seed, read, bypass } = await setup({
                custom: (probe, identity) => new RunProbeDefinition(probe, identity)
            });
            await seed(createReview({ mode: "throw" }));

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed.");
            expect(bypass.isActive()).toBe(false);
            // The raw message is logged, never stored (R146).
            expect(loggedErrors.map(logged => logged.message)).toEqual(["The automation threw."]);
            expect((loggedErrors[0].fields.error as Error).message).toBe(
                "The test automation threw."
            );
        });

        it("when the automation returns an unknown outcome", async () => {
            const { run, seed, read } = await setup({
                custom: () => new UnknownOutcomeDefinition()
            });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed: It returned an unknown outcome.");
        });

        it("when the outcome cannot be saved", async () => {
            const { run, seed, read } = await setup();
            await seed(createReview());
            reviewSaveFaults.failNext = true;

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            await expectFailed(read, "The automation failed.");
            expect(loggedErrors.map(logged => logged.message)).toContain(
                "Applying the automation outcome failed."
            );
        });

        it("never puts a raw error message into the step, however long", async () => {
            const { run, seed, read } = await setup({
                custom: () => {
                    const definition = new TestAutomationDefinition();
                    definition.run = async () => {
                        throw new Error("x".repeat(600));
                    };
                    return definition;
                }
            });
            await seed(createReview());

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.steps[0].comment).toBe("The automation failed.");
            expect(JSON.stringify(stored)).not.toContain("xxxxx");
            expect((loggedErrors[0].fields.error as Error).message).toBe("x".repeat(600));
        });

        it("writes nothing when the review was cancelled while the automation ran", async () => {
            const { run, seed, read, cancel, definition } = await setup();
            await seed(createReview());
            // The cancel lands after the guard passed and before the failure would be written.
            definition.run = async () => {
                await cancel();
                throw new Error("The automation failed after the cancel.");
            };

            const { result } = run();

            await expect(result).resolves.toMatchObject({ status: "done" });
            const stored = await read();
            expect(stored.state).toBe("cancelled");
            expect(stored.steps[0].state).toBe("inReview");
            expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
            // Only the automation's own error is logged; the discarded failure write is info.
            expect(loggedErrors.map(logged => logged.message)).toEqual(["The automation threw."]);
        });
    });

    describe("a stale task writes nothing after the automation ran (R144)", () => {
        const changes = [
            {
                name: "the review was cancelled during the run",
                change: async (ctx: Awaited<ReturnType<typeof setup>>) => ctx.cancel(),
                state: "cancelled"
            },
            {
                name: "the step was restarted under a new task during the run",
                change: async (ctx: Awaited<ReturnType<typeof setup>>) => {
                    const data = toSaveData(Review.fromData(await ctx.read()));
                    data.steps[0].taskId = "task-new";
                    await ctx.seedData(data);
                },
                state: "inProgress"
            }
        ];
        const outcomes = [
            { type: "approved", mode: "approve" },
            { type: "rejected", mode: "reject" },
            { type: "continue", mode: "wait" }
        ];

        for (const outcome of outcomes) {
            for (const { name, change, state } of changes) {
                it(`ignores a late ${outcome.type} outcome when ${name}`, async () => {
                    const ctx = await setup();
                    await ctx.seed(
                        createReview({ mode: outcome.mode, comment: "Links are fine." })
                    );
                    const original = ctx.definition.run.bind(ctx.definition);
                    ctx.definition.run = async params => {
                        const result = await original(params);
                        await change(ctx);
                        return result;
                    };
                    const events = workflowEventTypes().length;
                    const { result, outputUpdates } = ctx.run();
                    await expect(result).resolves.toMatchObject({ status: "done" });
                    const before = await ctx.read();
                    expect(before.state).toBe(state);
                    expect(before.steps[0].state).toBe("inReview");
                    expect(before.steps[0].comment).toBeNull();
                    expect(outputUpdates).toEqual([]);
                    expect(workflowEventTypes().length).toBe(
                        name.startsWith("the review") ? 1 : events
                    );
                    expect(loggedInfos).toContain("Ignored a stale step run outcome.");
                    expect(loggedErrors).toEqual([]);
                });
            }
        }
    });

    describe("runs as the requester (R161, D58, D87)", () => {
        it("lets the automation and the approve call see the requester identity, and restores the outer one", async () => {
            const { run, seed, identityContext, definition } = await setup({
                custom: (bypass, identity) => new RunProbeDefinition(bypass, identity)
            });
            await seed(createReview());
            const outer = identityContext.getIdentity().id;

            const { result } = run();
            await result;

            expect(outer).not.toBe(requester.id);
            expect((definition as RunProbeDefinition).identityDuringRun).toEqual([requester.id]);
            expect(approveIdentities).toEqual([requester.id]);
            expect(identityContext.getIdentity().id).toBe(outer);
        });
    });

    describe("keeps the bypass for the automation call only (D36, R150, Review Focus 3)", () => {
        it("is active while the automation runs and off before and after", async () => {
            const { run, seed, bypass, definition } = await setup({
                custom: (probe, identity) => new RunProbeDefinition(probe, identity)
            });
            await seed(createReview());
            expect(bypass.isActive()).toBe(false);

            const { result } = run();
            await result;

            expect((definition as RunProbeDefinition).activeDuringRun).toEqual([true]);
            expect(bypass.isActive()).toBe(false);
        });
    });

    describe("never trusts its input (R148)", () => {
        it("reads the step's definition and settings from the review, not from the input", async () => {
            const { run, seed, definition } = await setup();
            await seed(createReview({ mode: "approve", comment: "From the review snapshot." }));

            const { result } = run({
                input: { ...INPUT, automationId: "other", settings: { mode: "throw" } } as never
            });
            await result;

            expect(definition.runCalls).toHaveLength(1);
            expect(definition.runCalls[0].settings).toMatchObject({
                mode: "approve",
                comment: "From the review snapshot."
            });
        });
    });
});
