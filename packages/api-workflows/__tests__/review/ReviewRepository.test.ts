import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createAiIssue,
    createRequestedReview,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";

const LATER = "2026-10-09T11:00:00.000Z";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(ReviewRepository);
};

type ListArgs = Parameters<ListLatestEntriesUseCase.Interface["execute"]>;
type ListResult = Awaited<ReturnType<ListLatestEntriesUseCase.Interface["execute"]>>;
type ListOverride = (
    args: ListArgs,
    decoratee: ListLatestEntriesUseCase.Interface
) => Promise<ListResult>;

/** Repository whose CMS list call can be replaced per test, to simulate OpenSearch lag (R18). */
const createStubbedRepository = async () => {
    let override: ListOverride | null = null;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(
                ListLatestEntriesUseCase.createDecorator({
                    decorator: class {
                        constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}
                        async execute(...args: ListArgs) {
                            if (override) {
                                return override(args, this.decoratee);
                            }
                            return this.decoratee.execute(...args);
                        }
                    },
                    dependencies: []
                })
            );
        }
    });
    return {
        repository: context.container.resolve(ReviewRepository),
        stub: (value: ListOverride | null) => {
            override = value;
        }
    };
};

describe("ReviewRepository", () => {
    it("saves a new review and reads it back unchanged", async () => {
        const repository = await createRepository();
        const data = toSaveData(createRequestedReview());

        const saved = await repository.create(data);

        expect(saved.isOk()).toBe(true);
        // `createdOn` is passed on create, so it equals the aggregate's `now` (A5).
        expect(saved.value).toEqual({
            ...data,
            savedOn: saved.value.savedOn
        });
        expect(saved.value.createdOn).toBe(NOW);
        const read = await repository.get(data.id);
        expect(read.value).toEqual(saved.value);
    });

    it("round-trips every field, including nullables, owners and assignments", async () => {
        const repository = await createRepository();
        const base = toSaveData(createRequestedReview({ picks: [] }));
        const aiOwner = { ...reviewer, id: "ai-1", type: "ai" as const, identityType: "agent" };
        const data = {
            ...base,
            targetContext: {
                ...base.targetContext,
                folder: { id: "folder-1", type: "cms" }
            },
            steps: base.steps.map((step, index) =>
                index === 0
                    ? {
                          ...step,
                          description: "Legal check",
                          owner: aiOwner,
                          comment: "Looks fine",
                          pickedUserId: "user-picked",
                          assignmentSource: "rule" as const,
                          assignment: {
                              source: "rule" as const,
                              ruleId: "rule-1",
                              reason: "Matched",
                              by: reviewer
                          },
                          startedOn: LATER,
                          finishedOn: LATER
                      }
                    : step
            )
        };

        const saved = await repository.create(data);
        const read = await repository.get(data.id);

        expect(saved.value).toEqual({ ...data, savedOn: saved.value.savedOn });
        expect(read.value).toEqual(saved.value);
        // The untouched second step keeps its nulls.
        expect(read.value.steps[1]).toEqual(data.steps[1]);
    });

    it("round-trips the task id and the earlier runs of a step", async () => {
        const repository = await createRepository();
        const base = toSaveData(createRequestedReview());
        const runs = [
            {
                taskId: "task-1",
                startedOn: NOW,
                finishedOn: LATER,
                outcome: "failed" as const,
                reason: "The automation failed: boom."
            },
            {
                taskId: null,
                startedOn: LATER,
                finishedOn: LATER,
                outcome: "failed" as const,
                reason: 'The automation "test-automation" is not available.'
            },
            {
                taskId: "task-2",
                startedOn: LATER,
                finishedOn: null,
                outcome: null,
                reason: null
            }
        ];
        const data = {
            ...base,
            steps: base.steps.map((step, index) =>
                index === 0 ? { ...step, taskId: "task-3", runs } : step
            )
        };

        const saved = await repository.create(data);
        const read = await repository.get(data.id);

        expect(saved.value.steps[0].taskId).toBe("task-3");
        expect(saved.value.steps[0].runs).toEqual(runs);
        expect(read.value.steps[0].taskId).toBe("task-3");
        expect(read.value.steps[0].runs).toEqual(runs);
        // The untouched second step keeps no task and no runs.
        expect(read.value.steps[1]).toMatchObject({ taskId: null, runs: [] });
    });

    it("round-trips the issues of a step and reads other steps as no issues (R171)", async () => {
        const repository = await createRepository();
        const base = toSaveData(createRequestedReview());
        const issues = [
            createAiIssue(),
            createAiIssue({
                fieldPath: null,
                severity: "error",
                message: "The page has no content.",
                suggestion: null
            }),
            createAiIssue({ fieldPath: "fields.body.0.text", severity: "info" })
        ];
        const data = {
            ...base,
            steps: base.steps.map((step, index) => (index === 0 ? { ...step, issues } : step))
        };

        const saved = await repository.create(data);
        const read = await repository.get(data.id);

        expect(saved.value.steps[0].issues).toEqual(issues);
        expect(read.value.steps[0].issues).toEqual(issues);
        expect(read.value.steps[1].issues).toEqual([]);
    });

    it("updates an existing review in place", async () => {
        const repository = await createRepository();
        const saved = await repository.create(toSaveData(createRequestedReview()));
        const review = Review.fromData(saved.value);
        expectOk(
            review.start({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                now: LATER
            })
        );

        const updated = await repository.update(toSaveData(review));

        expect(updated.isOk()).toBe(true);
        const read = await repository.get(saved.value.id);
        expect(read.value).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: reviewer.id,
            lastChangedOn: LATER
        });
        expect(read.value.steps[0].owner).toEqual(reviewer);
    });

    it("finds the active review of a target revision", async () => {
        const repository = await createRepository();
        const first = await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" })
            )
        );
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" })
            )
        );

        const active = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(active.value?.id).toBe("review-1");

        const cancelled = Review.fromData(first.value);
        expectOk(cancelled.cancel({ actor: requester, now: LATER }));
        expectOk(await repository.update(toSaveData(cancelled)));

        const afterCancel = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(afterCancel.value).toBeNull();
    });

    it("lists the in-progress reviews of a workflow", async () => {
        const repository = await createRepository();
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" })
            )
        );
        await repository.create(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" })
            )
        );
        const cancelled = createRequestedReview({
            id: "review-3",
            targetRevisionId: "article-3#0001"
        });
        expectOk(cancelled.cancel({ actor: requester, now: NOW }));
        expectOk(await repository.create(toSaveData(cancelled)));
        await repository.create(
            toSaveData(
                createRequestedReview({
                    id: "review-4",
                    targetRevisionId: "article-4#0001",
                    workflow: createWorkflow({ id: "workflow-2" })
                })
            )
        );

        const listed = await repository.listInProgressByWorkflow("workflow-1");

        expect(listed.isOk()).toBe(true);
        expect(listed.value).toHaveLength(2);
    });

    it("does not re-create a review deleted since it was read", async () => {
        const repository = await createRepository();
        const saved = expectOk(await repository.create(toSaveData(createRequestedReview())));
        expectOk(await repository.deleteMany([saved.id]));

        const updated = await repository.update(saved);

        expect(updated.isFail()).toBe(true);
        expect(updated.error.code).toBe("Workflows/Review/NotFound");
        expect(updated.error.data).toEqual({ id: saved.id });
        const read = await repository.get(saved.id);
        expect(read.error?.code).toBe("Workflows/Review/NotFound");
    });

    it("returns NotFound for an unknown review", async () => {
        const repository = await createRepository();

        const result = await repository.get("missing");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(result.error.data).toEqual({ id: "missing" });
    });

    describe("OpenSearch lag (R18)", () => {
        it("ignores a listed hit whose primary record is no longer active", async () => {
            const { repository, stub } = await createStubbedRepository();
            const saved = expectOk(await repository.create(toSaveData(createRequestedReview())));
            const where = { model: ARTICLE_MODEL, targetRevisionId: "article-1#0001" };

            // The index still lists the review as active, as it does before it catches up.
            let stale: ListResult | null = null;
            stub(async (args, decoratee) => {
                stale = await decoratee.execute(...args);
                return stale;
            });
            expect(expectOk(await repository.getActiveByTarget(where))?.id).toBe(saved.id);
            const staleList = stale as unknown as ListResult;

            const cancelled = Review.fromData(saved);
            expectOk(cancelled.cancel({ actor: requester, now: LATER }));
            expectOk(await repository.update(toSaveData(cancelled)));
            stub(async () => staleList);

            expect(expectOk(await repository.getActiveByTarget(where))).toBeNull();
        });

        it("does not list a hit whose primary record is no longer in progress", async () => {
            const { repository, stub } = await createStubbedRepository();
            const saved = expectOk(await repository.create(toSaveData(createRequestedReview())));

            let stale: ListResult | null = null;
            stub(async (args, decoratee) => {
                stale = await decoratee.execute(...args);
                return stale;
            });
            expect(expectOk(await repository.listInProgressByWorkflow("workflow-1"))).toHaveLength(
                1
            );
            const staleList = stale as unknown as ListResult;

            const cancelled = Review.fromData(saved);
            expectOk(cancelled.cancel({ actor: requester, now: LATER }));
            expectOk(await repository.update(toSaveData(cancelled)));
            stub(async () => staleList);

            expect(expectOk(await repository.listInProgressByWorkflow("workflow-1"))).toEqual([]);
        });

        it("follows the cursor across pages when listing in-progress reviews", async () => {
            const { repository, stub } = await createStubbedRepository();
            for (const index of [1, 2, 3]) {
                expectOk(
                    await repository.create(
                        toSaveData(
                            createRequestedReview({
                                id: `review-${index}`,
                                targetRevisionId: `article-${index}#0001`
                            })
                        )
                    )
                );
            }
            const afters: Array<string | null | undefined> = [];
            stub(async (args, decoratee) => {
                const [model, params] = args;
                afters.push(params?.after);
                const all = expectOk(await decoratee.execute(model, { ...params, after: null }));
                const firstPage = !params?.after;
                return Result.ok({
                    ...all,
                    entries: firstPage ? all.entries.slice(0, 2) : all.entries.slice(2),
                    meta: {
                        ...all.meta,
                        hasMoreItems: firstPage,
                        cursor: firstPage ? "page-2" : null
                    }
                });
            });

            const listed = await repository.listInProgressByWorkflow("workflow-1");

            expect(expectOk(listed)).toHaveLength(3);
            expect(afters).toEqual([null, "page-2"]);
        });
    });
});
