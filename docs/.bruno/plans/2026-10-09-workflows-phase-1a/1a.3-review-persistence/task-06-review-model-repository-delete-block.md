### Task 6: Review model and repository; block workflow delete while reviews run

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/review/review.model.ts`
- Create: `packages/api-workflows/src/domain/review/abstractions/ReviewModelProvider.ts`
- Create: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/shared/toIsoString.ts`
- Create: `packages/api-workflows/src/features/shared/ActorEntryMapper.ts` (shared with the assignment log, Task 10)
- Create: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Create: `packages/api-workflows/src/features/review/shared/ReviewModelProvider.ts`
- Create: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/review/shared/feature.ts`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts` (append `WorkflowHasActiveReviewsError`)
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`, `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts` (add `toSaveData`)
- Create: `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`
- Create: `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`

**Interfaces:**
- Consumes: `ReviewData` and errors (Task 4), `Review` (Tasks 4-5), CMS entry use cases, `GetModelUseCase`, `ModelFactory`, `StoreWorkflowUseCase`, `DeleteWorkflowUseCase` (Task 3).
- Produces:
  - `REVIEW_MODEL_ID = "wbyWorkflowReview"`; `ReviewModel` (`ModelFactory` implementation).
  - `ReviewModelProvider.Interface { get(): Promise<CmsModel> }`.
  - `ReviewRepository.Interface`:
    - `get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>`
    - `getActiveByTarget(params: { model: string; targetRevisionId: string }): Promise<Result<ReviewData | null, ReviewPersistenceError>>` (lists through the CMS list, which reads OpenSearch on ddb-os, then confirms each hit with a primary-storage `GetEntryByIdUseCase` read before trusting `isActive`, R18)
    - `countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>` (pages through every listed hit and counts only those whose primary-storage read is still `inProgress`, R18)
    - `save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>` (create or update; the only review write path; passes `createdOn: review.createdOn` on create so the stored `createdOn` matches the `requested` fact)
  - `toIsoString(value: unknown): string | null`.
  - `ActorEntryValues { type; id; displayName; identityType: string | null }`, `ActorEntryMapper.toEntry(actor: Actor): ActorEntryValues`, `ActorEntryMapper.fromEntry(value: ActorEntryValues | null | undefined): Actor | null`.
  - `WorkflowHasActiveReviewsError` (`Workflows/Workflow/HasActiveReviews`, data `{ count }`); `DeleteWorkflowUseCase` returns it.

- [ ] **Step 1: Add the fixture helper**

In `packages/api-workflows/__tests__/__helpers/fixtures.ts`, change the type import from `~/domain/review/types.js` to:

```ts
import type {
    Actor,
    ReviewData,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
```

and append at the end of the file:

```ts
/** What the save path persists: prepared for save, facts discarded. */
export const toSaveData = (review: Review): ReviewData => {
    review.prepareForSave();
    review.pullFacts();
    return review.toData();
};
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";

const LATER = "2026-10-09T11:00:00.000Z";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(ReviewRepository);
};

describe("ReviewRepository", () => {
    it("saves a new review and reads it back unchanged", async () => {
        const repository = await createRepository();
        const data = toSaveData(createRequestedReview());

        const saved = await repository.save(data);

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

    it("updates an existing review in place", async () => {
        const repository = await createRepository();
        const saved = await repository.save(toSaveData(createRequestedReview()));
        const review = Review.fromData(saved.value);
        expectOk(
            review.start({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                now: LATER
            })
        );

        const updated = await repository.save(toSaveData(review));

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
        const first = await repository.save(
            toSaveData(createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" }))
        );
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" }))
        );

        const active = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(active.value?.id).toBe("review-1");

        const cancelled = Review.fromData(first.value);
        expectOk(cancelled.cancel({ actor: requester, now: LATER }));
        expectOk(await repository.save(toSaveData(cancelled)));

        const afterCancel = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(afterCancel.value).toBeNull();
    });

    it("counts in-progress reviews of a workflow", async () => {
        const repository = await createRepository();
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" }))
        );
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" }))
        );
        const cancelled = createRequestedReview({
            id: "review-3",
            targetRevisionId: "article-3#0001"
        });
        expectOk(cancelled.cancel({ actor: requester, now: NOW }));
        expectOk(await repository.save(toSaveData(cancelled)));
        await repository.save(
            toSaveData(
                createRequestedReview({
                    id: "review-4",
                    targetRevisionId: "article-4#0001",
                    workflow: createWorkflow({ id: "workflow-2" })
                })
            )
        );

        const count = await repository.countInProgressByWorkflow("workflow-1");

        expect(count.isOk()).toBe(true);
        expect(count.value).toBe(2);
    });

    it("returns NotFound for an unknown review", async () => {
        const repository = await createRepository();

        const result = await repository.get("missing");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(result.error.data).toEqual({ id: "missing" });
    });
});
```

Create `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createRequestedReview,
    createStartedReview,
    createWorkflowValues,
    expectOk,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

describe("Delete workflow with reviews", () => {
    it("blocks deleting a workflow while reviews are in progress", async () => {
        const { context } = await createContextHandler();
        const workflow = expectOk(
            await context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues() })
        );
        const repository = context.container.resolve(ReviewRepository);
        const deleteWorkflow = context.container.resolve(DeleteWorkflowUseCase);

        const first = createRequestedReview({ id: "review-1", workflow });
        expectOk(await repository.save(toSaveData(first)));
        const second = createStartedReview({
            id: "review-2",
            targetRevisionId: "article-2#0001",
            workflow
        });
        expectOk(await repository.save(toSaveData(second)));

        // An approved review stays `isActive: true` but is finished, so it never blocks (D81).
        const approved = createStartedReview({
            id: "review-3",
            targetRevisionId: "article-3#0001",
            workflow
        });
        const decide = (stepId: string) => ({
            stepId,
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            comment: null,
            now: LATER
        });
        expectOk(approved.approve(decide("legal")));
        expectOk(approved.reach({ resolution: poolResolution(), actor: reviewer, now: LATER }));
        expectOk(
            approved.start({
                stepId: "editorial",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                now: LATER
            })
        );
        expectOk(approved.approve(decide("editorial")));
        const approvedData = expectOk(await repository.save(toSaveData(approved)));
        expect(approvedData).toMatchObject({ state: "approved", isActive: true });

        const blocked = await deleteWorkflow.execute({ id: workflow.id });

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(blocked.error.data).toEqual({ count: 2 });

        // Finished reviews (cancelled, rejected) do not block the delete (D81).
        expectOk(first.cancel({ actor: requester, now: LATER }));
        expectOk(await repository.save(toSaveData(first)));
        expectOk(
            second.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Not this time.",
                now: LATER
            })
        );
        expectOk(await repository.save(toSaveData(second)));

        const deleted = await deleteWorkflow.execute({ id: workflow.id });

        expect(deleted.isOk()).toBe(true);
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/review/abstractions/ReviewRepository.js`.

- [ ] **Step 4: Add the model id, model and abstractions**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/review/review.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/**
 * Private model for reviews (spec 4.2). Current-step fields are top-level so lists and least-loaded
 * can query them (D19); `targetContext` is an object so lists can filter by folder (phase 3).
 * The requester is stored as `requester` because `createdBy` is a reserved CMS field id.
 */
class ReviewModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: REVIEW_MODEL_ID,
                    name: "Workflow Review"
                })
                .fields(fields => ({
                    workflowId: fields.text().label("Workflow ID"),
                    model: fields.text().label("Model"),
                    targetId: fields.text().label("Target ID"),
                    targetRevisionId: fields.text().label("Target revision ID"),
                    title: fields.text().label("Title"),
                    isActive: fields.boolean().label("Is active"),
                    state: fields.text().label("State"),
                    currentStepId: fields.text().label("Current step ID"),
                    currentStepState: fields.text().label("Current step state"),
                    currentOwnerId: fields.text().label("Current owner ID"),
                    currentCandidateTeamIds: fields
                        .text()
                        .label("Current candidate team IDs")
                        .list(),
                    targetContext: fields
                        .object()
                        .label("Target context")
                        .fields(contextFields => ({
                            folder: contextFields
                                .object()
                                .label("Folder")
                                .fields(folderFields => ({
                                    id: folderFields.text().label("ID"),
                                    type: folderFields.text().label("Type")
                                })),
                            modelId: contextFields.text().label("Model ID"),
                            title: contextFields.text().label("Title"),
                            author: contextFields
                                .object()
                                .label("Author")
                                .fields(authorFields => ({
                                    id: authorFields.text().label("ID"),
                                    displayName: authorFields.text().label("Display name")
                                }))
                        })),
                    workflow: fields
                        .object()
                        .label("Workflow")
                        .fields(workflowFields => ({
                            name: workflowFields.text().label("Name"),
                            models: workflowFields.text().label("Models").list()
                        })),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID"),
                            title: stepFields.text().label("Title"),
                            color: stepFields.text().label("Color"),
                            description: stepFields.longText().label("Description"),
                            type: stepFields.text().label("Type"),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields.text().label("ID")
                                })),
                            config: stepFields.json().label("Config"),
                            state: stepFields.text().label("State"),
                            owner: stepFields
                                .object()
                                .label("Owner")
                                .fields(ownerFields => ({
                                    type: ownerFields.text().label("Type"),
                                    id: ownerFields.text().label("ID"),
                                    displayName: ownerFields.text().label("Display name"),
                                    identityType: ownerFields.text().label("Identity type")
                                })),
                            comment: stepFields.longText().label("Comment"),
                            pickedUserId: stepFields.text().label("Picked user ID"),
                            candidateTeamIds: stepFields.text().label("Candidate team IDs").list(),
                            assignmentSource: stepFields.text().label("Assignment source"),
                            assignment: stepFields
                                .object()
                                .label("Assignment")
                                .fields(assignmentFields => ({
                                    source: assignmentFields.text().label("Source"),
                                    ruleId: assignmentFields.text().label("Rule ID"),
                                    reason: assignmentFields.longText().label("Reason"),
                                    by: assignmentFields
                                        .object()
                                        .label("By")
                                        .fields(byFields => ({
                                            type: byFields.text().label("Type"),
                                            id: byFields.text().label("ID"),
                                            displayName: byFields.text().label("Display name"),
                                            identityType: byFields.text().label("Identity type")
                                        }))
                                })),
                            reachedOn: stepFields.datetime().label("Reached on").withoutTimezone(),
                            startedOn: stepFields.datetime().label("Started on").withoutTimezone(),
                            finishedOn: stepFields.datetime().label("Finished on").withoutTimezone()
                        })),
                    requester: fields
                        .object()
                        .label("Requester")
                        .fields(requesterFields => ({
                            type: requesterFields.text().label("Type"),
                            id: requesterFields.text().label("ID"),
                            displayName: requesterFields.text().label("Display name"),
                            identityType: requesterFields.text().label("Identity type")
                        })),
                    lastChangedOn: fields.datetime().label("Last changed on").withoutTimezone()
                }))
        ];
    }
}

export const ReviewModel = ModelFactory.createImplementation({
    implementation: ReviewModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/review/abstractions/ReviewModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IReviewModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowReview` model on demand. */
export const ReviewModelProvider = createAbstraction<IReviewModelProvider>("ReviewModelProvider");

export namespace ReviewModelProvider {
    export type Interface = IReviewModelProvider;
}
```

Create `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";

export interface ReviewRepositoryActiveByTargetParams {
    model: string;
    targetRevisionId: string;
}

export interface IReviewRepository {
    get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>;
    /** At most one active review per target revision (D23). */
    getActiveByTarget(
        params: ReviewRepositoryActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>>;
    countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>;
    /** Create or update. Only `ReviewSaver` (the single save path) calls this. */
    save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>;
}

/** Reads and writes reviews (entries of the private `wbyWorkflowReview` model, revision 1). */
export const ReviewRepository = createAbstraction<IReviewRepository>("ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
    export type ActiveByTargetParams = ReviewRepositoryActiveByTargetParams;
}
```

- [ ] **Step 5: Add the mapper, provider, repository and shared feature**

Create `packages/api-workflows/src/features/shared/toIsoString.ts`:

```ts
/** CMS returns `datetime` values as `Date` when read from storage and as strings on write. */
export const toIsoString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return null;
};
```

Create `packages/api-workflows/src/features/shared/ActorEntryMapper.ts`:

```ts
import type { Actor, ActorType } from "~/domain/review/types.js";

/** How an `Actor` is stored in an object field of a private model. */
export interface ActorEntryValues {
    type: string;
    id: string;
    displayName: string;
    identityType: string | null;
}

/** Maps actors to and from object fields; used by the review and assignment-log mappers. */
export class ActorEntryMapper {
    public static toEntry(actor: Actor): ActorEntryValues {
        return {
            type: actor.type,
            id: actor.id,
            displayName: actor.displayName,
            identityType: actor.identityType ?? null
        };
    }

    public static fromEntry(value: ActorEntryValues | null | undefined): Actor | null {
        if (!value?.id) {
            return null;
        }
        return {
            type: value.type as ActorType,
            id: value.id,
            displayName: value.displayName ?? "",
            ...(value.identityType ? { identityType: value.identityType } : {})
        };
    }
}
```

Create `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowStepNotification } from "~/domain/workflow/types.js";
import type {
    ReviewData,
    ReviewState,
    ReviewStep,
    ReviewStepAssignment,
    StepState,
    TargetContextAuthor,
    TargetContextFolder
} from "~/domain/review/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";
import { ActorEntryMapper, type ActorEntryValues } from "~/features/shared/ActorEntryMapper.js";

export interface ReviewEntryStepAssignment {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ActorEntryValues | null;
}

export interface ReviewEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
    state: string;
    owner: ActorEntryValues | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[] | null;
    assignmentSource: string | null;
    assignment: ReviewEntryStepAssignment | null;
    reachedOn: string | Date | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
}

export interface ReviewEntryTargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor | null;
}

export interface ReviewEntryWorkflow {
    name: string;
    models: string[] | null;
}

export interface ReviewEntryValues {
    workflowId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: string;
    currentStepId: string | null;
    currentStepState: string | null;
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[] | null;
    targetContext: ReviewEntryTargetContext | null;
    workflow: ReviewEntryWorkflow | null;
    steps: ReviewEntryStep[] | null;
    requester: ActorEntryValues | null;
    lastChangedOn: string | Date | null;
}

/** Maps reviews to and from `wbyWorkflowReview` entries; nulls in storage become absent optionals. */
export class ReviewEntryMapper {
    public static toValues(review: ReviewData): ReviewEntryValues {
        return {
            workflowId: review.workflowId,
            model: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId,
            title: review.title,
            isActive: review.isActive,
            state: review.state,
            currentStepId: review.currentStepId,
            currentStepState: review.currentStepState,
            currentOwnerId: review.currentOwnerId,
            currentCandidateTeamIds: [...review.currentCandidateTeamIds],
            targetContext: {
                folder: review.targetContext.folder ? { ...review.targetContext.folder } : null,
                modelId: review.targetContext.modelId,
                title: review.targetContext.title,
                author: { ...review.targetContext.author }
            },
            workflow: {
                name: review.workflow.name,
                models: [...review.workflow.models]
            },
            steps: review.steps.map(step => ReviewEntryMapper.stepToEntry(step)),
            requester: ActorEntryMapper.toEntry(review.createdBy),
            lastChangedOn: review.lastChangedOn
        };
    }

    public static fromEntry(entry: CmsEntry<ReviewEntryValues>): ReviewData {
        const { id } = parseIdentifier(entry.id);
        const values = entry.values;
        const folder = values.targetContext?.folder;
        return {
            id,
            workflowId: values.workflowId,
            model: values.model,
            targetId: values.targetId,
            targetRevisionId: values.targetRevisionId,
            title: values.title,
            isActive: values.isActive === true,
            state: values.state as ReviewState,
            currentStepId: values.currentStepId ?? null,
            currentStepState: (values.currentStepState ?? null) as StepState | null,
            currentOwnerId: values.currentOwnerId ?? null,
            currentCandidateTeamIds: values.currentCandidateTeamIds ?? [],
            targetContext: {
                folder: folder?.id ? { id: folder.id, type: folder.type } : null,
                modelId: values.targetContext?.modelId ?? "",
                title: values.targetContext?.title ?? "",
                author: {
                    id: values.targetContext?.author?.id ?? "",
                    displayName: values.targetContext?.author?.displayName ?? ""
                }
            },
            workflow: {
                name: values.workflow?.name ?? "",
                models: values.workflow?.models ?? []
            },
            steps: (values.steps ?? []).map(step => ReviewEntryMapper.stepFromEntry(step)),
            createdBy: ActorEntryMapper.fromEntry(values.requester) ?? {
                type: "user",
                id: "",
                displayName: ""
            },
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            lastChangedOn: toIsoString(values.lastChangedOn) ?? entry.savedOn
        };
    }

    private static stepToEntry(step: ReviewStep): ReviewEntryStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color,
            description: step.description ?? null,
            type: step.type,
            notifications: step.notifications.map(notification => ({ id: notification.id })),
            config: step.config,
            state: step.state,
            owner: step.owner ? ActorEntryMapper.toEntry(step.owner) : null,
            comment: step.comment,
            pickedUserId: step.pickedUserId,
            candidateTeamIds: [...step.candidateTeamIds],
            assignmentSource: step.assignmentSource,
            assignment: step.assignment
                ? {
                      source: step.assignment.source,
                      ruleId: step.assignment.ruleId ?? null,
                      reason: step.assignment.reason ?? null,
                      by: step.assignment.by ? ActorEntryMapper.toEntry(step.assignment.by) : null
                  }
                : null,
            reachedOn: step.reachedOn,
            startedOn: step.startedOn,
            finishedOn: step.finishedOn
        };
    }

    private static stepFromEntry(step: ReviewEntryStep): ReviewStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null,
            state: step.state as StepState,
            owner: ActorEntryMapper.fromEntry(step.owner),
            comment: step.comment ?? null,
            pickedUserId: step.pickedUserId ?? null,
            candidateTeamIds: step.candidateTeamIds ?? [],
            assignmentSource: step.assignmentSource ?? null,
            assignment: ReviewEntryMapper.assignmentFromEntry(step.assignment),
            reachedOn: toIsoString(step.reachedOn),
            startedOn: toIsoString(step.startedOn),
            finishedOn: toIsoString(step.finishedOn)
        };
    }

    private static assignmentFromEntry(
        value: ReviewEntryStepAssignment | null | undefined
    ): ReviewStepAssignment | null {
        if (!value?.source) {
            return null;
        }
        const by = ActorEntryMapper.fromEntry(value.by);
        return {
            source: value.source,
            ...(value.ruleId ? { ruleId: value.ruleId } : {}),
            ...(value.reason ? { reason: value.reason } : {}),
            ...(by ? { by } : {})
        };
    }
}
```

Create `packages/api-workflows/src/features/review/shared/ReviewModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ReviewModelProvider as Abstraction } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class ReviewModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(REVIEW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ReviewModelProvider = Abstraction.createImplementation({
    implementation: ReviewModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewRepository as Abstraction } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewEntryMapper, type ReviewEntryValues } from "./ReviewEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
/** At most one review per revision is active (D23); a few extra hits cover stale list results. */
const ACTIVE_BY_TARGET_LIMIT = 10;
const COUNT_PAGE_SIZE = 100;

/**
 * Lists go through `ListLatestEntriesUseCase`, which reads OpenSearch on ddb-os. OpenSearch is
 * filled asynchronously, so a listed hit can be stale (a cancelled review still `isActive: true`)
 * and a just-written review can be missing. Every hit is confirmed with a primary-storage read
 * before `isActive` or `state` is trusted (R18). A review written but not yet indexed is still
 * missed: two concurrent requests on one revision can both pass, and a delete can pass while a
 * request is in flight. That race is accepted, like D27 and D15.
 */
class ReviewRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: ReviewModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<ReviewEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new ReviewNotFoundError({ id }));
            }
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(result.value));
    }

    async getActiveByTarget(
        params: Abstraction.ActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: {
                values: {
                    model: params.model,
                    targetRevisionId: params.targetRevisionId,
                    isActive: true
                }
            },
            sort: ["createdOn_DESC"],
            limit: ACTIVE_BY_TARGET_LIMIT
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }

        for (const entry of result.value.entries) {
            const confirmed = await this.readPrimary(model, entry.id);
            if (confirmed.isFail()) {
                return Result.fail(confirmed.error);
            }
            const review = confirmed.value;
            if (
                review &&
                review.isActive &&
                review.model === params.model &&
                review.targetRevisionId === params.targetRevisionId
            ) {
                return Result.ok(review);
            }
        }
        return Result.ok(null);
    }

    async countInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<number, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        let count = 0;
        let after: string | null = null;
        do {
            const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                where: {
                    values: {
                        workflowId,
                        state: "inProgress"
                    }
                },
                sort: ["createdOn_ASC"],
                limit: COUNT_PAGE_SIZE,
                after
            });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                const confirmed = await this.readPrimary(model, entry.id);
                if (confirmed.isFail()) {
                    return Result.fail(confirmed.error);
                }
                const review = confirmed.value;
                if (review && review.workflowId === workflowId && review.state === "inProgress") {
                    count++;
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(count);
    }

    async save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const id = createIdentifier({ id: review.id, version: 1 });
        const values = ReviewEntryMapper.toValues(review);

        const existing = await this.getEntryById.execute<ReviewEntryValues>(model, id);
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new ReviewPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<ReviewEntryValues>(model, id, {
                values
            });
            if (updated.isFail()) {
                return Result.fail(new ReviewPersistenceError(updated.error));
            }
            return Result.ok(ReviewEntryMapper.fromEntry(updated.value));
        }

        const created = await this.createEntry.execute<ReviewEntryValues>(model, {
            id: review.id,
            // The aggregate's `now`, so `createdOn` matches the `requested` fact (A5).
            createdOn: review.createdOn,
            values
        });
        if (created.isFail()) {
            return Result.fail(new ReviewPersistenceError(created.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(created.value));
    }

    /** Primary-storage read of a listed entry; `null` when it was deleted after it was listed. */
    private async readPrimary(
        model: CmsModel,
        entryId: string
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>> {
        const result = await this.getEntryById.execute<ReviewEntryValues>(model, entryId);
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.ok(null);
            }
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(result.value));
    }
}

export const ReviewRepository = Abstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [
        ReviewModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/review/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewModelProvider } from "./ReviewModelProvider.js";
import { ReviewRepository } from "./ReviewRepository.js";

export const ReviewSharedFeature = createFeature({
    name: "Workflows/ReviewShared",
    register(container) {
        container.register(ReviewModelProvider);
        container.register(ReviewRepository).inSingletonScope();
    }
});
```

- [ ] **Step 6: Block workflow delete while reviews run**

Append to `packages/api-workflows/src/domain/workflow/errors.ts`:

```ts
export interface WorkflowHasActiveReviewsErrorData {
    count: number;
}

/** D81. Phase 3 adds up to 5 readable blocking reviews to the data (D115). */
export class WorkflowHasActiveReviewsError extends BaseError<WorkflowHasActiveReviewsErrorData> {
    override readonly code = "Workflows/Workflow/HasActiveReviews" as const;

    constructor(data: WorkflowHasActiveReviewsErrorData) {
        super({
            message: `The workflow cannot be deleted while ${data.count} review(s) are in progress.`,
            data
        });
    }
}
```

Replace `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts` with:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowHasActiveReviewsError,
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    hasActiveReviews: WorkflowHasActiveReviewsError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Delete a workflow unless any of its reviews is in progress. No permission check in 1a. */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Replace `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import {
    WorkflowHasActiveReviewsError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "./events.js";
import { DeleteWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existing = await this.repository.get(input.id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        const workflow = existing.value;

        // Finished reviews keep their snapshot and do not block the delete (D81).
        const inProgress = await this.reviewRepository.countInProgressByWorkflow(workflow.id);
        if (inProgress.isFail()) {
            return Result.fail(new WorkflowPersistenceError(inProgress.error));
        }
        if (inProgress.value > 0) {
            return Result.fail(new WorkflowHasActiveReviewsError({ count: inProgress.value }));
        }

        await this.eventPublisher.publish(new WorkflowBeforeDeleteEvent({ workflow }));

        const result = await this.repository.delete(workflow.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterDeleteEvent({ workflow }));
        return Result.ok(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, ReviewRepository, EventPublisher]
});
```

- [ ] **Step 7: Register the review model and repository**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
    }
});
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts 2>&1 | tail -50`
Expected: PASS (6 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS (the list queries in `getActiveByTarget` and `countInProgressByWorkflow` run against OpenSearch here; each hit is re-read from primary storage). Local runs index synchronously, so they cannot reproduce the OpenSearch lag; the primary read is the guard (R18).

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add review model and repository, block deleting workflows with active reviews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
