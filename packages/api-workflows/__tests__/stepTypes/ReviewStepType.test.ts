import { describe, expect, it } from "vitest";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { Review } from "~/domain/review/Review.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    createWorkflowValues,
    expectOk,
    NOW,
    OTHER_TEAM_ID,
    poolResolution,
    REVIEW_TEAM_ID,
    requester,
    targetContext
} from "~tests/__helpers/fixtures.js";

/** Records resolver calls and puts every step in the pool. */
class RecordingStepAssignmentResolver implements StepAssignmentResolver.Interface {
    public readonly calls: StepAssignmentResolver.Params[] = [];

    public async resolve(params: StepAssignmentResolver.Params) {
        this.calls.push(params);
        return poolResolution();
    }
}

const setup = async (
    resolver: StepAssignmentResolver.Interface | null = null,
    teams: TeamsFlagValue = true
) => {
    const { context } = await createContextHandler({
        setup: container => {
            setTeamsFlag(container, teams);
            if (resolver) {
                container.registerInstance(StepAssignmentResolver, resolver);
            }
        }
    });
    const stepType = context.container.resolve(StepTypeRegistryService).get("review");
    if (!stepType) {
        throw new Error("The review step type is not registered.");
    }
    return stepType;
};

const validationError = async (step: WorkflowStep): Promise<WorkflowValidationError> => {
    const stepType = await setup();
    const result = stepType.validate({ step, workflow: createWorkflowValues({ steps: [step] }) });
    if (result.isOk()) {
        throw new Error("Expected the step to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error;
};

const validationMessage = async (step: WorkflowStep): Promise<string> => {
    const error = await validationError(step);
    return error.message;
};

describe("ReviewStepType (R131)", () => {
    it("describes itself", async () => {
        const stepType = await setup();

        expect(stepType.type).toBe("review");
        expect(stepType.title).toBe("Review");
        expect(stepType.configSchema).toBe(reviewStepConfigSchema);
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    it("is unavailable with its reason when teams are off (R290)", async () => {
        const stepType = await setup(null, false);

        expect(await stepType.describeAvailability()).toEqual({
            available: false,
            unavailableReason: "Teams are not enabled."
        });
    });

    it("reads the teams switch on every call, not at registration (R287)", async () => {
        let teamsOn = true;
        const stepType = await setup(null, () => teamsOn);

        const on = await stepType.describeAvailability();
        teamsOn = false;
        const off = await stepType.describeAvailability();

        expect(on.available).toBe(true);
        expect(off).toEqual({ available: false, unavailableReason: "Teams are not enabled." });
    });

    it("still validates and saves a People step config when teams are off", async () => {
        const stepType = await setup(null, false);
        const step = createReviewStep({ id: "legal", title: "Legal review" });

        const result = stepType.validate({
            step,
            workflow: createWorkflowValues({ steps: [step] })
        });

        expect(result.isOk()).toBe(true);
    });

    describe("validate", () => {
        it("returns the step with its parsed config", async () => {
            const stepType = await setup();
            const step = createReviewStep({ id: "legal", title: "Legal review" });

            const result = stepType.validate({
                step,
                workflow: createWorkflowValues({ steps: [step] })
            });

            expect(result.isOk()).toBe(true);
            expect(result.value).toEqual(step);
        });

        it("requires at least one team", async () => {
            const step = createReviewStep({ id: "legal", title: "Legal review", teams: [] });

            expect(await validationMessage(step)).toBe(
                'Step "Legal review" needs at least one team.'
            );
        });

        it("requires a target on every routing rule, naming the rule (R288)", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            });

            const error = await validationError(step);

            expect(error.message).toBe('Every routing rule in step "Legal review" needs a target.');
            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "rule-1"
            });
        });

        it("leaves a rule that is not an object to the schema, which names it by index", async () => {
            const step = createReviewStep({ id: "legal", title: "Legal review", rules: ["nope"] });

            const error = await validationError(step);

            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.0",
                workflowId: null,
                ruleId: null
            });
        });

        it("requires a team target to be one of the step's teams", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    {
                        id: "rule-1",
                        conditions: {},
                        target: { type: "team", id: OTHER_TEAM_ID }
                    }
                ]
            });

            const error = await validationError(step);

            expect(error.message).toBe("The target team is not one of the step's reviewing teams.");
            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "rule-1"
            });
        });

        it("accepts a team target that is one of the step's teams and any user target", async () => {
            const stepType = await setup();
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                teams: [REVIEW_TEAM_ID],
                rules: [
                    { id: "rule-1", conditions: {}, target: { type: "team", id: REVIEW_TEAM_ID } },
                    { id: "rule-2", conditions: {}, target: { type: "user", id: "user-anyone" } }
                ]
            });

            const result = stepType.validate({
                step,
                workflow: createWorkflowValues({ steps: [step] })
            });

            expect(result.isOk()).toBe(true);
        });

        it("rejects an invalid review config", async () => {
            const step: WorkflowStep = {
                ...createReviewStep({ id: "legal", title: "Legal review" }),
                config: {
                    teams: ["team-a"],
                    assignment: { strategy: "random", allowManualPick: false, rules: [] }
                }
            };

            expect(await validationMessage(step)).toMatch(
                /^Step "Legal review" has an invalid configuration: /
            );
        });
    });

    describe("reach", () => {
        it("resolves the step's assignment and reaches it on the review", async () => {
            const resolver = new RecordingStepAssignmentResolver();
            const stepType = await setup(resolver);
            const review = expectOk(
                Review.request({
                    id: "review-1",
                    workflow: createWorkflow(),
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
            const step = review.getStepToReach();
            if (!step) {
                throw new Error("Expected a pending step.");
            }

            const result = await stepType.reach({ review, step, actor: requester, now: NOW });

            expect(result.isOk()).toBe(true);
            expect(resolver.calls).toHaveLength(1);
            expect(resolver.calls[0].step.id).toBe("legal");
            expect(resolver.calls[0].review.id).toBe("review-1");
            expect(resolver.calls[0].now).toEqual(new Date(NOW));
            const data = review.toData();
            expect(data.steps[0].state).toBe("awaiting");
            expect(data.steps[0].reachedOn).toBe(NOW);
        });

        it("fails with the invalid state error when the current step is not pending", async () => {
            const resolver = new RecordingStepAssignmentResolver();
            const stepType = await setup(resolver);
            const review = expectOk(
                Review.request({
                    id: "review-1",
                    workflow: createWorkflow(),
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
            const step = review.getStepToReach();
            if (!step) {
                throw new Error("Expected a pending step.");
            }
            expectOk(await stepType.reach({ review, step, actor: requester, now: NOW }));

            const again = await stepType.reach({ review, step, actor: requester, now: NOW });

            expect(again.error.code).toBe("Workflows/Review/InvalidState");
        });
    });
});
