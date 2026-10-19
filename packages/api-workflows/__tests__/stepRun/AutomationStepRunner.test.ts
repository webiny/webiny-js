import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID,
    type TestAutomationDefinition
} from "~tests/__helpers/TestAutomationDefinition.js";
import {
    AUTOMATION_STEP_ID,
    automationActor,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import { requester, toSaveData } from "~tests/__helpers/fixtures.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
import type { ReviewStep } from "~/domain/review/types.js";

interface SetupParams {
    maxIterations?: number;
    none?: boolean;
}

const setup = async (params: SetupParams = {}) => {
    let registered: TestAutomationDefinition | null = null;
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            if (!params.none) {
                registered = registerTestAutomation(container, {
                    maxIterations: params.maxIterations
                });
            }
        }
    });
    const runner = context.container.resolve(StepRunnerRegistryService).get("automation");
    if (!runner) {
        throw new Error("The automation runner is not registered.");
    }
    const bypass = context.container.resolve(WorkflowBypassService);

    /** Run parameters for the one automation step, with the stored config replaced by `config`. */
    const buildParams = (
        config: Record<string, unknown>,
        overrides: Partial<StepRunner.Params> = {}
    ): StepRunner.Params => {
        const review = toSaveData(createRunningAutomationReview("task-1"));
        review.steps[0].config = config;
        return {
            review,
            step: review.steps[0],
            requester,
            task: { id: "task-1", createdById: requester.id },
            iteration: 1,
            state: null,
            signal: new AbortController().signal,
            ...overrides
        };
    };

    return {
        runner,
        bypass,
        definition: registered as TestAutomationDefinition | null,
        buildParams
    };
};

const configFor = (settings: Record<string, unknown>) => {
    return { automationId: TEST_AUTOMATION_ID, settings };
};

const expectFailure = async (promise: Promise<unknown>, reason: string | RegExp) => {
    const error = await promise.then(
        () => null,
        thrown => thrown
    );
    expect(error).toBeInstanceOf(StepRunFailure);
    if (typeof reason === "string") {
        expect((error as StepRunFailure).reason).toBe(reason);
    } else {
        expect((error as StepRunFailure).reason).toMatch(reason);
    }
};

describe("AutomationStepRunner (R168)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("declares the automation texts, the actor and that it never runs single", async () => {
        const { runner } = await setup();

        expect(runner.type).toBe("automation");
        expect(runner.singleRun).toBe(false);
        expect(runner.failureReasons).toEqual({
            error: "The automation failed.",
            aborted: "The automation was aborted.",
            stuck: "The automation task ended without a result."
        });
        expect(runner.getActor(requester)).toEqual(automationActor);
    });

    describe("maxIterationsReason (R145, P4)", () => {
        const stepWith = (config: Record<string, unknown>): ReviewStep => {
            const review = toSaveData(createRunningAutomationReview("task-1"));
            return { ...review.steps[0], config };
        };

        it("names the default of 50 when the definition sets no limit", async () => {
            const { runner } = await setup();

            expect(runner.maxIterationsReason(stepWith(configFor({})))).toBe(
                "The automation did not finish in 50 iterations."
            );
        });

        it("names the definition's own limit", async () => {
            const { runner } = await setup({ maxIterations: 7 });

            expect(runner.maxIterationsReason(stepWith(configFor({})))).toBe(
                "The automation did not finish in 7 iterations."
            );
        });

        it("falls back to the default for an unknown definition or a config that does not parse", async () => {
            const { runner } = await setup({ maxIterations: 7 });

            expect(
                runner.maxIterationsReason(stepWith({ automationId: "other", settings: {} }))
            ).toBe("The automation did not finish in 50 iterations.");
            expect(runner.maxIterationsReason(stepWith({ settings: {} }))).toBe(
                "The automation did not finish in 50 iterations."
            );
        });
    });

    describe("run", () => {
        it("approves with the comment and hands the definition the parsed settings and the run state", async () => {
            const { runner, definition, buildParams } = await setup();
            const params = buildParams(configFor({ comment: "Links are fine." }), {
                iteration: 2,
                state: { page: 1 }
            });

            const outcome = await runner.run(params);

            expect(outcome).toEqual({ type: "approved", comment: "Links are fine." });
            expect(definition!.runCalls).toHaveLength(1);
            expect(definition!.runCalls[0]).toMatchObject({
                settings: { mode: "approve", comment: "Links are fine." },
                iteration: 2,
                state: { page: 1 }
            });
            expect(definition!.runCalls[0].review).toBe(params.review);
            expect(definition!.runCalls[0].step).toBe(params.step);
        });

        it("rejects with the trimmed comment", async () => {
            const { runner, buildParams } = await setup();

            const outcome = await runner.run(
                buildParams(configFor({ mode: "reject", comment: "  The links are broken.  " }))
            );

            expect(outcome).toEqual({ type: "rejected", comment: "The links are broken." });
        });

        it.each([
            { name: "no comment", settings: { mode: "reject" } },
            {
                name: "a comment shorter than 10 characters",
                settings: { mode: "reject", comment: "No." }
            }
        ])("fails when it rejects with $name (D100)", async ({ settings }) => {
            const { runner, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor(settings))),
                "The automation rejected without a comment."
            );
        });

        it("returns a continue outcome as the definition gave it", async () => {
            const { runner, buildParams } = await setup();

            const outcome = await runner.run(
                buildParams(configFor({ mode: "wait" }), { iteration: 3 })
            );

            expect(outcome).toEqual({ type: "continue", wait: 1, state: { iterations: 3 } });
        });

        it("fails with the unknown outcome text", async () => {
            const { runner, definition, buildParams } = await setup();
            definition!.run = async () => ({ type: "nonsense" }) as never;

            await expectFailure(
                runner.run(buildParams(configFor({}))),
                "The automation failed: It returned an unknown outcome."
            );
        });

        it("fails with a fixed reason when the definition throws, and logs the raw error with the identifiers", async () => {
            const { runner, bypass, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor({ mode: "throw" }))),
                "The automation failed."
            );

            expect(bypass.isActive()).toBe(false);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("The automation threw.");
            expect(loggedErrors[0].fields).toEqual({
                err: expect.objectContaining({ message: "The test automation threw." }),
                taskId: "task-1",
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID
            });
        });

        it("fails when the config does not parse, without running the definition", async () => {
            const { runner, definition, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams({ settings: {} })),
                "The automation step configuration is not valid."
            );
            expect(definition!.runCalls).toEqual([]);
        });

        it("fails when the definition is not registered", async () => {
            const { runner, buildParams } = await setup({ none: true });

            await expectFailure(
                runner.run(buildParams(configFor({}))),
                'The automation "test-automation" is not available.'
            );
        });

        it("fails when the settings are not valid, without running the definition", async () => {
            const { runner, definition, buildParams } = await setup();

            await expectFailure(
                runner.run(buildParams(configFor({ mode: "nonsense" }))),
                /^The automation settings are not valid: mode: /
            );
            expect(definition!.runCalls).toEqual([]);
        });

        it("fails past the definition's own limit and past the default of 50", async () => {
            const limited = await setup({ maxIterations: 2 });
            await limited.runner.run(limited.buildParams(configFor({}), { iteration: 2 }));
            await expectFailure(
                limited.runner.run(limited.buildParams(configFor({}), { iteration: 3 })),
                "The automation did not finish in 2 iterations."
            );

            const unlimited = await setup();
            await expectFailure(
                unlimited.runner.run(unlimited.buildParams(configFor({}), { iteration: 51 })),
                "The automation did not finish in 50 iterations."
            );
            expect(unlimited.definition!.runCalls).toEqual([]);
        });

        it("runs the definition inside the bypass and only there (D36, R150)", async () => {
            const { runner, bypass, definition, buildParams } = await setup();
            const active: boolean[] = [];
            const original = definition!.run.bind(definition);
            definition!.run = async params => {
                active.push(bypass.isActive());
                return original(params);
            };

            await runner.run(buildParams(configFor({})));

            expect(active).toEqual([true]);
            expect(bypass.isActive()).toBe(false);
        });

        it("ignores the signal, which only a runner that needs it reads (R175)", async () => {
            const { runner, definition, buildParams } = await setup();
            const aborted = new AbortController();
            aborted.abort();

            const outcome = await runner.run(
                buildParams(configFor({ comment: "Links are fine." }), {
                    signal: aborted.signal
                })
            );

            expect(outcome).toEqual({ type: "approved", comment: "Links are fine." });
            expect(definition!.runCalls).toHaveLength(1);
        });
    });
});
