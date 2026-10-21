import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    createWorkflowValues,
    editor,
    expectOk,
    NOW,
    poolOutcomeRecord,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import { readableUsers, throwingReadChecks } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { folderChainFaults } from "~tests/__helpers/FakeReviewTargetFolderChain.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import { Review } from "~/domain/review/Review.js";
import type { Actor, ReviewData, ReviewPick } from "~/domain/review/types.js";
import type {
    ReviewStepAssignmentConfig,
    Workflow,
    WorkflowStep,
    WorkflowValues
} from "~/domain/workflow/types.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { ROUTING_FAILED_REASON } from "~/domain/routing/reasons.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { ROUTING_NO_CANDIDATE_REASON } from "~/domain/routing/reasons.js";

interface ReadFaults {
    assignmentList: boolean;
    reviewOwners: boolean;
    workflowList: boolean;
}

const readFaults: ReadFaults = { assignmentList: false, reviewOwners: false, workflowList: false };

class FaultyAssignmentReadsImpl implements AssignmentRepository.Interface {
    public constructor(private decoratee: AssignmentRepository.Interface) {}

    public create(
        values: Parameters<AssignmentRepository.Interface["create"]>[0]
    ): ReturnType<AssignmentRepository.Interface["create"]> {
        return this.decoratee.create(values);
    }

    public async list(
        params: AssignmentRepository.ListParams
    ): ReturnType<AssignmentRepository.Interface["list"]> {
        if (readFaults.assignmentList) {
            return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.list(params);
    }

    public delete(id: string): ReturnType<AssignmentRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

class FaultyReviewReadsImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public countInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["countInProgressByWorkflow"]> {
        return this.decoratee.countInProgressByWorkflow(workflowId);
    }

    public listInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["listInProgressByWorkflow"]> {
        return this.decoratee.listInProgressByWorkflow(workflowId);
    }

    public listByTarget(
        params: ReviewRepository.ByTargetParams
    ): ReturnType<ReviewRepository.Interface["listByTarget"]> {
        return this.decoratee.listByTarget(params);
    }

    public list(
        params: ReviewRepository.ListParams
    ): ReturnType<ReviewRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public async listInReviewByOwners(
        ownerIds: string[]
    ): ReturnType<ReviewRepository.Interface["listInReviewByOwners"]> {
        if (readFaults.reviewOwners) {
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.listInReviewByOwners(ownerIds);
    }

    public create(review: ReviewData): ReturnType<ReviewRepository.Interface["create"]> {
        return this.decoratee.create(review);
    }

    public update(review: ReviewData): ReturnType<ReviewRepository.Interface["update"]> {
        return this.decoratee.update(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

class FaultyWorkflowReadsImpl implements WorkflowRepository.Interface {
    public constructor(private decoratee: WorkflowRepository.Interface) {}

    public get(id: string): ReturnType<WorkflowRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public async list(
        params: WorkflowRepository.ListParams
    ): ReturnType<WorkflowRepository.Interface["list"]> {
        if (readFaults.workflowList) {
            return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.list(params);
    }

    public create(values: WorkflowValues): ReturnType<WorkflowRepository.Interface["create"]> {
        return this.decoratee.create(values);
    }

    public update(values: WorkflowValues): ReturnType<WorkflowRepository.Interface["update"]> {
        return this.decoratee.update(values);
    }

    public delete(id: string): ReturnType<WorkflowRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };

const adminActor = (user: typeof BOB): Actor => {
    return { type: "user", id: user.id, displayName: user.displayName, identityType: "admin" };
};

const legalStep = (assignment: Partial<ReviewStepAssignmentConfig>): WorkflowStep => {
    return {
        ...createReviewStep({ id: "legal", title: "Legal review" }),
        config: {
            teams: [REVIEW_TEAM_ID],
            assignment: { strategy: "none", allowManualPick: true, rules: [], ...assignment }
        }
    };
};

/** The resolver's params for the first step of a review requested with `workflow`. */
const reachParams = (workflow: Workflow, picks: ReviewPick[] = []) => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks,
            requester,
            now: NOW
        })
    );
    const step = review.getStepToReach();
    if (!step) {
        throw new Error("The first step must be pending.");
    }
    return { review: review.toData(), step, now: new Date(NOW) };
};

const createResolverContext = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingEventPublisher);
            container.registerDecorator(
                AssignmentRepository.createDecorator({
                    decorator: FaultyAssignmentReadsImpl,
                    dependencies: []
                })
            );
            container.registerDecorator(
                ReviewRepository.createDecorator({
                    decorator: FaultyReviewReadsImpl,
                    dependencies: []
                })
            );
            container.registerDecorator(
                WorkflowRepository.createDecorator({
                    decorator: FaultyWorkflowReadsImpl,
                    dependencies: []
                })
            );
        }
    });
    return {
        ...routing,
        resolver: routing.context.container.resolve(StepAssignmentResolver)
    };
};

describe("RoutingStepAssignmentResolver", () => {
    beforeEach(() => {
        resetRoutingFakes();
        loggedErrors.length = 0;
        readFaults.assignmentList = false;
        readFaults.reviewOwners = false;
        readFaults.workflowList = false;
    });

    it("follows the order pick, rule, strategy, pool (R110)", async () => {
        const { resolver } = await createResolverContext();
        readableUsers.add("user-anna");
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        const ruleToCara = {
            id: "rule-cara",
            conditions: {},
            target: { type: "user" as const, id: CARA.id }
        };
        const all = legalStep({ strategy: "roundRobin", rules: [ruleToCara] });

        const picked = await resolver.resolve(
            reachParams(createWorkflow({ steps: [all] }), [{ stepId: "legal", userId: BOB.id }])
        );
        const ruled = await resolver.resolve(reachParams(createWorkflow({ steps: [all] })));
        const strategy = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({ strategy: "roundRobin" })] }))
        );
        const pool = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({})] }))
        );

        expect(picked).toMatchObject({
            owner: adminActor(BOB),
            assignment: { source: "picked" }
        });
        expect(ruled).toMatchObject({
            owner: adminActor(CARA),
            assignment: { source: "rule", ruleId: "rule-cara" }
        });
        expect(strategy).toMatchObject({
            owner: { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" },
            assignment: { source: "roundRobin" }
        });
        expect(pool).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
        expect(loggedErrors).toEqual([]);
    });

    it("runs the strategy over a team target and keeps the rule id (R109)", async () => {
        const { resolver } = await createResolverContext();
        readableUsers.add("user-anna");
        readableUsers.add(CARA.id);
        const toLegal = {
            id: "rule-legal",
            conditions: {},
            target: { type: "team" as const, id: LEGAL_TEAM_ID }
        };

        // Save-time validation needs a team target among the step's teams.
        const toLegalStep: WorkflowStep = {
            ...createReviewStep({ id: "legal", title: "Legal review" }),
            config: {
                teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                assignment: { strategy: "leastLoaded", allowManualPick: true, rules: [toLegal] }
            }
        };

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [toLegalStep] }))
        );

        expect(resolution).toEqual({
            owner: adminActor(CARA),
            candidateTeamIds: [LEGAL_TEAM_ID],
            assignment: { source: "leastLoaded", ruleId: "rule-legal" },
            records: [
                {
                    kind: "outcome",
                    userId: CARA.id,
                    source: "leastLoaded",
                    ruleId: "rule-legal",
                    by: null,
                    reason: null
                }
            ]
        });
    });

    it("gives a requested step its owner and writes the records after the save", async () => {
        const { context } = await createResolverContext();
        readableUsers.add(BOB.id);
        expectOk(
            await context.container.resolve(StoreWorkflowUseCase).execute({
                workflow: createWorkflowValues({ steps: [legalStep({ strategy: "roundRobin" })] }),
                actor: editor
            })
        );

        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );

        expect(review).toMatchObject({ currentStepState: "inReview", currentOwnerId: BOB.id });
        expect(review.steps[0]).toMatchObject({
            state: "inReview",
            owner: adminActor(BOB),
            assignment: { source: "roundRobin" },
            startedOn: review.steps[0].reachedOn
        });
        const records = expectOk(
            await context.container
                .resolve(AssignmentRepository)
                .list({ where: { reviewId: review.id } })
        ).items;
        expect([...records].sort((a, b) => a.kind.localeCompare(b.kind))).toMatchObject([
            { kind: "outcome", userId: BOB.id, source: "roundRobin" },
            {
                kind: "skip",
                userId: "user-anna",
                source: "roundRobin",
                reason: "Cannot read this content."
            }
        ]);
    });

    it("routes the next step when the owner approves (ApproveReviewStep)", async () => {
        const { context } = await createResolverContext();
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        const editorialStep: WorkflowStep = {
            ...createReviewStep({ id: "editorial", title: "Editorial review" }),
            config: {
                teams: [REVIEW_TEAM_ID],
                assignment: {
                    strategy: "roundRobin",
                    allowManualPick: false,
                    rules: [
                        { id: "rule-cara", conditions: {}, target: { type: "user", id: CARA.id } }
                    ]
                }
            }
        };
        expectOk(
            await context.container.resolve(StoreWorkflowUseCase).execute({
                workflow: createWorkflowValues({
                    steps: [legalStep({ strategy: "roundRobin" }), editorialStep]
                }),
                actor: editor
            })
        );
        const requested = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        expect(requested.steps[0].owner).toEqual(adminActor(BOB));
        recordedEvents.length = 0;

        const approved = expectOk(
            await context.container.resolve(ApproveReviewStepUseCase).execute({
                reviewId: requested.id,
                stepId: "legal",
                actor: adminActor(BOB),
                actorTeamIds: [REVIEW_TEAM_ID]
            })
        );

        expect(approved).toMatchObject({
            currentStepId: "editorial",
            currentStepState: "inReview",
            currentOwnerId: CARA.id
        });
        expect(approved.steps[1]).toMatchObject({
            owner: adminActor(CARA),
            assignment: { source: "rule", ruleId: "rule-cara" }
        });
        const records = expectOk(
            await context.container
                .resolve(AssignmentRepository)
                .list({ where: { reviewId: requested.id, stepId: "editorial" } })
        ).items;
        expect(records).toMatchObject([
            { kind: "outcome", stepId: "editorial", userId: CARA.id, source: "rule" }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
    });

    it("leaves the step awaiting in the pool when the requester is the only member (spec 6)", async () => {
        const { context } = await createResolverContext();
        context.container.registerInstance(
            ListUsersUseCase,
            new FakeListUsers([
                { id: requester.id, displayName: requester.displayName, teams: [REVIEW_TEAM_ID] }
            ])
        );
        // Everyone can read: only the membership leaves nobody but the requester.
        readableUsers.add(requester.id);
        readableUsers.add("user-anna");
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        expectOk(
            await context.container.resolve(StoreWorkflowUseCase).execute({
                workflow: createWorkflowValues({ steps: [legalStep({ strategy: "roundRobin" })] }),
                actor: editor
            })
        );

        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );

        expect(review.steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            assignment: { source: "pool", reason: ROUTING_NO_CANDIDATE_REASON }
        });
        expect(review.currentCandidateTeamIds).toEqual([REVIEW_TEAM_ID]);
    });

    const breakUsers = (users: FakeListUsers): void => {
        users.failuresLeft = 1;
    };
    const breakFolderChain = (): void => {
        folderChainFaults.throwNext = true;
    };
    const breakReadCheck = (): void => {
        throwingReadChecks.add("user-anna");
    };
    const breakAssignmentList = (): void => {
        readFaults.assignmentList = true;
    };
    const breakReviewOwners = (): void => {
        readFaults.reviewOwners = true;
    };
    const breakWorkflowList = (): void => {
        readFaults.workflowList = true;
    };

    it.each([
        ["listing users fails", "roundRobin", breakUsers],
        ["reading the folder chain throws", "none", breakFolderChain],
        ["a read check throws", "roundRobin", breakReadCheck],
        ["the round-robin log cannot be read", "roundRobin", breakAssignmentList],
        ["the least-loaded reviews cannot be read", "leastLoaded", breakReviewOwners],
        ["the least-loaded workflows cannot be read", "leastLoaded", breakWorkflowList]
    ] as const)("falls through to the pool when %s (R116)", async (_label, strategy, breakIt) => {
        const { resolver, users } = await createResolverContext();
        readableUsers.add(BOB.id);
        breakIt(users);
        const folderRule = {
            id: "rule-folder",
            conditions: {
                folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
            },
            target: { type: "user" as const, id: BOB.id }
        };
        const step = legalStep({ strategy, rules: strategy === "none" ? [folderRule] : [] });

        const resolution = await resolver.resolve(reachParams(createWorkflow({ steps: [step] })));

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool", reason: ROUTING_FAILED_REASON },
            records: [
                {
                    kind: "outcome",
                    userId: null,
                    source: "pool",
                    ruleId: null,
                    by: null,
                    reason: ROUTING_FAILED_REASON
                }
            ]
        });
        expect(loggedErrors).toEqual([
            {
                message: ROUTING_FAILED_REASON,
                fields: expect.objectContaining({ reviewId: "review-1", stepId: "legal" })
            }
        ]);
    });

    it("falls through to the pool when reading settings fails (R116)", async () => {
        const { resolver, settings } = await createResolverContext();
        settings.failuresLeft = 1;

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({ strategy: "roundRobin" })] }))
        );

        expect(resolution.assignment).toEqual({ source: "pool", reason: ROUTING_FAILED_REASON });
        expect(loggedErrors.map(item => item.message)).toEqual([ROUTING_FAILED_REASON]);
    });

    it("keeps a team target's narrowing and rule when the strategy fails (R116)", async () => {
        const { resolver } = await createResolverContext();
        readableUsers.add(CARA.id);
        readFaults.reviewOwners = true;
        const toLegalStep: WorkflowStep = {
            ...createReviewStep({ id: "legal", title: "Legal review" }),
            config: {
                teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                assignment: {
                    strategy: "leastLoaded",
                    allowManualPick: true,
                    rules: [
                        {
                            id: "rule-legal",
                            conditions: {},
                            target: { type: "team", id: LEGAL_TEAM_ID }
                        }
                    ]
                }
            }
        };

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [toLegalStep] }))
        );

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [LEGAL_TEAM_ID],
            assignment: { source: "pool", ruleId: "rule-legal", reason: ROUTING_FAILED_REASON },
            records: [
                {
                    kind: "outcome",
                    userId: null,
                    source: "pool",
                    ruleId: "rule-legal",
                    by: null,
                    reason: ROUTING_FAILED_REASON
                }
            ]
        });
        expect(loggedErrors.map(item => item.message)).toEqual([ROUTING_FAILED_REASON]);
    });

    it("keeps an invalid pick's skip when the folder port then fails (R116)", async () => {
        const { resolver } = await createResolverContext();
        folderChainFaults.throwNext = true;
        const step = legalStep({
            rules: [
                {
                    id: "rule-folder",
                    conditions: {
                        folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
                    },
                    target: { type: "user", id: BOB.id }
                }
            ]
        });

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [step] }), [
                { stepId: "legal", userId: "user-dan" }
            ])
        );

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool", reason: ROUTING_FAILED_REASON },
            records: [
                {
                    kind: "skip",
                    userId: "user-dan",
                    source: "picked",
                    ruleId: null,
                    by: null,
                    reason: "Not a member of the step's teams."
                },
                {
                    kind: "outcome",
                    userId: null,
                    source: "pool",
                    ruleId: null,
                    by: null,
                    reason: ROUTING_FAILED_REASON
                }
            ]
        });
        expect(loggedErrors.map(item => item.message)).toEqual([ROUTING_FAILED_REASON]);
    });

    it("leaves an empty pool for a step config it cannot parse, without lookups", async () => {
        const { resolver, users } = await createResolverContext();
        const broken = { ...legalStep({}), config: { teams: "not-a-list" } };

        const resolution = await resolver.resolve(reachParams(createWorkflow({ steps: [broken] })));

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [],
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
        expect(users.calls).toEqual([]);
    });
});
