### Task 5c: Store and expose who cancelled a review (`WorkflowsReview.cancelledBy`)

Spec 13.1 (cancelled reviews in the drawer); user answer Q23 (1) (`../00-answers.md`); R252, A91, D75, D134, Review Focus 20. A cancelled review shows who cancelled it ("{Name} cancelled this review at {time}.", Task 18), but the review stores no such fact: `cancel` pushes a transient `cancelled` fact (with the actor) that the saver publishes as an event and discards. This task stores the cancelling actor on the review as the optional data field `cancelledBy` and exposes `WorkflowsReview.cancelledBy: WorkflowsActor`. It is the one stored addition of 8a.1.

- `ReviewData.cancelledBy?: Actor | null`, an optional object field `cancelledBy` of the private review model (`type`, `id`, `displayName`, `identityType`, written like the `requester` object, the same shape as a step's `owner`), set by `Review.cancel` in the same transition and save as the state change (`data.cancelledBy = { ...params.actor }`, next to the transient cancelled fact), mapped by `ReviewEntryMapper` both ways (an entry without the field, or with `null`, reads `null`).
- The actor is whoever cancels: the requester, a user with `reassign`, or the caller of the delete-time cancel (`CancelTargetReviewsUseCase` goes through `CancelReviewUseCase`, so `cancelForDelete` records the caller; the reason text keeps living on the transient fact only). A cancelled review is terminal (D75), so the value is written once and never changes; a re-save of the read data round-trips it through the mapper.
- GraphQL: `WorkflowsReview.cancelledBy: WorkflowsActor` (nullable; `null` for a review that is not cancelled and for a review cancelled before this field existed). The CMS and WB wrappers return the review data as is, so both expose it without a wrapper change (proved end to end below). No read-time lookup: the name is the actor's stored `displayName`, like every `WorkflowsActor` (`createdBy`, `owner`).
- **Storage (A91), verified at plan time; re-verify in Step 1 and stop if any line fails.** The review is an entry of the private CMS model `wbyWorkflowReview` (`review.model.ts`), mapped by `ReviewEntryMapper`; the model fields are code, so there is no stored schema to alter. An optional field is additive on every storage: DDB and DDB-ES keys are built from tenant, entry id and version only (`packages/api-headless-cms-ddb-es/src/operations/entry/keys.ts`, `createPartitionKey`, `createRevisionSortKey`), never from `values`; the OpenSearch index uses dynamic templates with `rawValues` disabled (`packages/api-opensearch/src/indexConfiguration/base.ts`); the SQL CMS stores the whole entry in one JSON `data` column (`packages/api-headless-cms-sql/src/operations/entry/mappers.ts`, `entryToRow`/`rowToEntry`), unreleased anyway. The precedent is `823d9214d9` (`currentStepType`; also `afb6185cdf` for `taskId`/`runs` and `a7a5b352b7` for `issues`): a model field, a type field and a mapper line, with a test that an entry stored without the field reads as `null`, no key or migration. `cancelledBy` is not a reserved CMS field id (`fieldSystemFields` in `packages/api-headless-cms/src/crud/contentModel/validation.ts` lists `createdBy`, `modifiedBy`, `savedBy`, `deletedBy`, `restoredBy`, `firstPublishedBy`, `lastPublishedBy` and the `revision...` ones, not `cancelledBy`), and it lives under `values`, where the entry-level `...By` meta handling (`isIdentityEntryMetaField`, SQL `mergeEntryLevelMeta`) does not look.
- **Stop rule (binding):** if Step 1 or any storage run shows that the field needs a key, a migration, an index mapping change or any non-additive change, **stop**, do not implement a design, and write the open question at the top of this file (what the storage needs, the storage it concerns, the options) for the user.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/types.ts` (`ReviewData`)
- Modify: `packages/api-workflows/src/domain/review/review.model.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts` (`cancel`, and `cancelledBy: null` in the `Review.request` data literal)
- Modify: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` (the file as Tasks 1 and 5b left it)
- Create: `packages/api-workflows/__tests__/review/ReviewCancelledBy.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (it asserts the exact fields of `WorkflowsReview`)
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCancelledBy.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageReviewCancelledBy.test.ts`
- Existing, must stay green: `packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts`, `CancelDeleteAbortTask.test.ts`, `CurrentStepType.test.ts`, `RequestReview.test.ts`, `ReviewRepository.test.ts`, `ReviewSaver.test.ts`, `ReviewTransitions.test.ts` (all in that folder), `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`, `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`

**Interfaces:**
- Consumes (existing, verified with codegraph): `Review.cancel` and `ReviewCancelParams { actor; now; reason? }` (`~/domain/review/Review.ts`), the transient cancelled fact (`~/domain/review/facts.ts`), `Actor` (`~/domain/review/types.ts`), `CancelReviewUseCase` (`~/features/review/CancelReview/CancelReviewUseCase.ts`, passes `actor: input.actor`), `CancelTargetReviewsUseCase` (calls `CancelReviewUseCase` per review with `actor: input.actor`), `ActorEntryMapper.toEntry`/`fromEntry` (`~/features/shared/ActorEntryMapper.ts`; `fromEntry` returns `null` for a missing value or an empty id), `ReviewEntryMapper` and `ReviewEntryValues` (`~/features/review/shared/ReviewEntryMapper.ts`), `ReviewRepository` (`~/domain/review/abstractions/ReviewRepository.ts`; `save` maps through `ReviewEntryMapper.toValues` and returns `ReviewEntryMapper.fromEntry` of the stored entry), `ReviewModelProvider`, the `WorkflowsActor` type (`type WorkflowsActor { type: String! id: ID! displayName: String! identityType: String }`), test fixtures `createRequestedReview`, `createStartedReview`, `toSaveData`, `expectOk`, `requester`, `reviewer`, `otherReviewer`, `ARTICLE_MODEL`, `createContextHandler`; CMS: `createUserContext`, `createGraphQLClient`, `storeWorkflow`, `createAuthorEntry`, `requestEntryReview`, `REQUESTER`, `REVIEWER`, `REASSIGNER`, `ADMIN`, `CMS_READER`, `CMS_WRITER`, `WORKFLOWS_REASSIGN`; WB: `createUserContext`, `asGraphQLUser`, `storeWbWorkflow`, `createPage`, `requestPageReview`, `REQUESTER`, `REVIEWER`, `REASSIGNER`, `ADMIN`, `WB_READER`, `WB_WRITER`, `WB_DELETER`, `WORKFLOWS_REASSIGN`.
- Produces: `ReviewData.cancelledBy?: Actor | null` and `ReviewEntryValues.cancelledBy?: ActorEntryValues | null`; GraphQL `WorkflowsReview.cancelledBy: WorkflowsActor`. Consumed by Task 8 (`ReviewDto.cancelledBy`, the `REVIEW_FIELDS` selection `cancelledBy { id displayName }`, `Review.cancelledBy: ReviewActor | null`) and Task 18 (the cancelled text and the "Cancelled by" line).

- [ ] **Step 1: Verify A91, then write the failing tests**

Verification (read-only, nothing to commit). Every command must confirm the line in the "Storage" bullet above; if one does not, stop under the stop rule.

```bash
git show --stat 823d9214d9 | tail -12
grep -n "cancelledBy" packages/api-headless-cms/src/crud/contentModel/validation.ts packages/api-headless-cms/src/constants.ts
grep -n "createPartitionKey\|createRevisionSortKey" packages/api-headless-cms-ddb-es/src/operations/entry/keys.ts
grep -n "rawValues\|dynamic_templates" packages/api-opensearch/src/indexConfiguration/base.ts
grep -n "data: JSON.stringify(entry)" packages/api-headless-cms-sql/src/operations/entry/mappers.ts
```

Expected: the precedent commit touches only `Review.ts`, `review.model.ts`, `types.ts`, `ReviewEntryMapper.ts` and one test; no output for the first `grep` (the field id is free); the key builders take only tenant, id and version; `rawValues` is disabled and the templates are dynamic; the SQL row keeps the whole entry as JSON. The new tests below then prove the behaviour on DDB and on DDB-ES/OpenSearch (`yarn test` and `yarn test:os`).

Create `packages/api-workflows/__tests__/review/ReviewCancelledBy.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL } from "~tests/__helpers/fixtures.js";
import { createRequestedReview } from "~tests/__helpers/fixtures.js";
import { createStartedReview } from "~tests/__helpers/fixtures.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { otherReviewer } from "~tests/__helpers/fixtures.js";
import { REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { requester } from "~tests/__helpers/fixtures.js";
import { reviewer } from "~tests/__helpers/fixtures.js";
import { toSaveData } from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewEntryMapper } from "~/features/review/shared/ReviewEntryMapper.js";
import type { ReviewEntryValues } from "~/features/review/shared/ReviewEntryMapper.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { CancelTargetReviewsUseCase } from "~/features/review/CancelTargetReviews/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface ObjectFieldSettings {
    fields: { fieldId: string }[];
}

describe("Review.cancel stores who cancelled (R252)", () => {
    it("sets cancelledBy to a copy of the cancelling actor", () => {
        const review = createStartedReview();

        expectOk(review.cancel({ actor: otherReviewer, now: LATER }));

        const data = review.toData();
        expect(data.state).toBe("cancelled");
        expect(data.cancelledBy).toEqual(otherReviewer);
        expect(data.cancelledBy).not.toBe(otherReviewer);
    });

    it("leaves cancelledBy null for a review that is in progress, approved or rejected", () => {
        const inProgress = createStartedReview();
        const rejected = createStartedReview();
        expectOk(
            rejected.reject({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: "Needs another pass.",
                now: LATER
            })
        );

        const approved = createStartedReview();
        expectOk(
            approved.approve({
                stepId: "legal",
                actor: reviewer,
                actorTeamIds: [REVIEW_TEAM_ID],
                comment: null,
                now: LATER
            })
        );

        expect(inProgress.toData().cancelledBy).toBeNull();
        expect(approved.toData().cancelledBy).toBeNull();
        expect(rejected.toData().cancelledBy).toBeNull();
    });

    it("keeps the first actor when a second cancel is refused (a cancelled review is terminal, D75)", () => {
        const review = createStartedReview();
        expectOk(review.cancel({ actor: requester, now: LATER }));

        const second = review.cancel({ actor: otherReviewer, now: LATER });

        expect(second.isFail()).toBe(true);
        expect(review.toData().cancelledBy).toEqual(requester);
    });
});

describe("the review model and cancelledBy (A91)", () => {
    it("has an optional object field written like the requester object", async () => {
        const { context } = await createContextHandler();
        const model = await context.container.resolve(ReviewModelProvider).get();

        const field = model.fields.find(candidate => candidate.fieldId === "cancelledBy");
        const requesterField = model.fields.find(candidate => candidate.fieldId === "requester");

        expect(field?.type).toBe("object");
        const settings = field?.settings as ObjectFieldSettings | undefined;
        const requesterSettings = requesterField?.settings as ObjectFieldSettings | undefined;
        expect(settings?.fields.map(child => child.fieldId)).toEqual([
            "type",
            "id",
            "displayName",
            "identityType"
        ]);
        expect(settings?.fields.map(child => child.fieldId)).toEqual(
            requesterSettings?.fields.map(child => child.fieldId)
        );
        // Optional: it carries the same validation as the (optional-by-default) requester object.
        expect(field?.validation).toEqual(requesterField?.validation);
    });
});

describe("cancelledBy through the use cases and the storage (R252, A91)", () => {
    const setup = async () => {
        const { context } = await createContextHandler();
        const repository = context.container.resolve(ReviewRepository);
        return {
            context,
            repository,
            cancelReview: context.container.resolve(CancelReviewUseCase),
            cancelTargetReviews: context.container.resolve(CancelTargetReviewsUseCase),
            getReview: context.container.resolve(GetReviewUseCase)
        };
    };

    it("stores the requester's cancel, reads it back and keeps it through a re-save", async () => {
        const { repository, cancelReview, getReview } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        const cancelled = expectOk(
            await cancelReview.execute({ reviewId: "review-1", actor: requester })
        );
        const read = expectOk(await getReview.execute({ id: "review-1" }));
        expectOk(await repository.save(read));
        const resaved = expectOk(await repository.get("review-1"));

        expect(cancelled.state).toBe("cancelled");
        expect(cancelled.cancelledBy).toEqual(requester);
        expect(read.cancelledBy).toEqual(requester);
        expect(resaved.cancelledBy).toEqual(requester);
    });

    it("records another user, such as one with reassign, who cancels a review they did not request", async () => {
        const { repository, cancelReview, getReview } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        expectOk(await cancelReview.execute({ reviewId: "review-1", actor: otherReviewer }));

        const read = expectOk(await getReview.execute({ id: "review-1" }));
        expect(read.cancelledBy).toEqual(otherReviewer);
        expect(read.createdBy.id).toBe(requester.id);
    });

    it("records the caller of the delete-time cancel and stores no reason on the review", async () => {
        const { repository, cancelTargetReviews } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));

        const cancelled = expectOk(
            await cancelTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                actor: otherReviewer,
                reason: "content trashed"
            })
        );

        expect(cancelled.map(review => review.id)).toEqual(["review-1"]);
        const read = expectOk(await repository.get("review-1"));
        expect(read.cancelledBy).toEqual(otherReviewer);
        expect(Object.keys(read.cancelledBy ?? {}).sort()).toEqual([
            "displayName",
            "id",
            "type"
        ]);
        expect(JSON.stringify(read)).not.toContain("content trashed");
    });

    it("reads null for an in-progress review and for a cancelled review stored before the field existed", async () => {
        const { context, repository } = await setup();
        expectOk(await repository.save(toSaveData(createRequestedReview({ id: "review-1" }))));
        const model = await context.container.resolve(ReviewModelProvider).get();
        const legacy: Partial<ReviewEntryValues> = {
            ...ReviewEntryMapper.toValues(toSaveData(createRequestedReview({ id: "review-2" }))),
            state: "cancelled",
            isActive: false
        };
        delete legacy.cancelledBy;
        expectOk(
            await context.container
                .resolve(CreateEntryUseCase)
                .execute(model, { id: "review-legacy", values: legacy })
        );

        const inProgress = expectOk(await repository.get("review-1"));
        const legacyRead = expectOk(await repository.get("review-legacy"));

        expect(inProgress.state).toBe("inProgress");
        expect(inProgress.cancelledBy).toBeNull();
        expect(legacyRead.state).toBe("cancelled");
        expect(legacyRead.cancelledBy).toBeNull();
    });
});
```

Modify `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`. The import:

```diff
 import { createAiIssue } from "~tests/__helpers/fixtures.js";
 import { createRequestedReview } from "~tests/__helpers/fixtures.js";
 import { NOW } from "~tests/__helpers/fixtures.js";
+import { otherReviewer } from "~tests/__helpers/fixtures.js";
+import { requester } from "~tests/__helpers/fixtures.js";
 import { toSaveData } from "~tests/__helpers/fixtures.js";
```

and a new `describe` appended at the end of the file:

```ts
describe("ReviewEntryMapper cancelledBy (R252, A91)", () => {
    it("maps the cancelling actor both ways, with and without an identity type", () => {
        const withIdentityType = toSaveData(createRequestedReview());
        withIdentityType.state = "cancelled";
        withIdentityType.cancelledBy = requester;
        const withoutIdentityType = toSaveData(createRequestedReview());
        withoutIdentityType.state = "cancelled";
        withoutIdentityType.cancelledBy = otherReviewer;

        const first = ReviewEntryMapper.toValues(withIdentityType);
        const second = ReviewEntryMapper.toValues(withoutIdentityType);

        expect(first.cancelledBy).toEqual({
            type: "user",
            id: "user-requester",
            displayName: "Rita Requester",
            identityType: "admin"
        });
        expect(second.cancelledBy).toEqual({
            type: "user",
            id: "user-other-reviewer",
            displayName: "Olga Reviewer",
            identityType: null
        });
        expect(ReviewEntryMapper.fromEntry(toEntry(first)).cancelledBy).toEqual(requester);
        expect(ReviewEntryMapper.fromEntry(toEntry(second)).cancelledBy).toEqual(otherReviewer);
    });

    it("writes null for a review that is not cancelled", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));

        expect(values.cancelledBy).toBeNull();
        expect(ReviewEntryMapper.fromEntry(toEntry(values)).cancelledBy).toBeNull();
    });

    it("reads an entry stored without the field, or with an empty actor, as null (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const absent: ReviewEntryValues = { ...values };
        delete absent.cancelledBy;
        const empty: ReviewEntryValues = {
            ...values,
            cancelledBy: { type: "", id: "", displayName: "", identityType: null }
        };

        expect(ReviewEntryMapper.fromEntry(toEntry(absent)).cancelledBy).toBeNull();
        expect(ReviewEntryMapper.fromEntry(toEntry(empty)).cancelledBy).toBeNull();
    });

    it("does not share the actor object with the review data", () => {
        const data = toSaveData(createRequestedReview());
        data.state = "cancelled";
        data.cancelledBy = { ...requester };

        const values = ReviewEntryMapper.toValues(data);
        data.cancelledBy.displayName = "Changed after mapping.";

        expect(values.cancelledBy?.displayName).toBe("Rita Requester");
    });
});
```

Update the exact fields of `WorkflowsReview` in `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (the new field sits right after `createdBy` in the schema):

```diff
             "steps",
             "createdBy",
+            "cancelledBy",
             "createdOn",
             "savedOn",
             "lastChangedOn"
         ]);
```

Create the CMS end-to-end test, `packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCancelledBy.test.ts`. It cancels as the requester, as a user with `reassign` and through the delete-time cancel, and reads the review back as someone else:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { REASSIGNER } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { CMS_WRITER } from "~tests/__helpers/permissions.js";
import { WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";

const ERROR = "error { code message data }";
const REVIEW = "id state isActive cancelledBy { id displayName }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        cms {
            cancelCmsEntryReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete(
        $modelId: ID!
        $entryId: ID!
        $action: WorkflowsReviewsForDeleteAction!
    ) {
        cms {
            cancelCmsEntryReviewsForDelete(modelId: $modelId, entryId: $entryId, action: $action) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];

/** Admin stores the workflow; REQUESTER has a review of "Ann". */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    return { entry, review };
};

describe("CMS review cancelledBy (R252, Q23)", () => {
    it("reads null while the review is in progress", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });

        const body = await reviewer(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.review).toMatchObject({ state: "inProgress", cancelledBy: null });
    });

    it("returns the requester as cancelledBy of their own cancel, and on a later read by someone else", async () => {
        const { review } = await createScenario();
        const requester = createGraphQLClient({ identity: REQUESTER, permissions: CMS_WRITER });
        const reviewer = createGraphQLClient({ identity: REVIEWER, permissions: CMS_READER });
        const expected = { id: REQUESTER.id, displayName: REQUESTER.displayName };

        const cancelled = await requester(CANCEL_REVIEW, { reviewId: review.id });
        const read = await reviewer(GET_REVIEW, { id: review.id });

        expect(cancelled.errors).toBeUndefined();
        const cancelResult = cancelled.data.cms.cancelCmsEntryReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({
            state: "cancelled",
            isActive: false,
            cancelledBy: expected
        });
        expect(read.errors).toBeUndefined();
        expect(read.data.cms.getCmsEntryReview.data.review.cancelledBy).toEqual(expected);
    });

    it("returns the user with reassign who cancels a review requested by someone else", async () => {
        const { review } = await createScenario();
        const reassigner = createGraphQLClient({
            identity: REASSIGNER,
            permissions: REASSIGNER_PERMISSIONS
        });

        const cancelled = await reassigner(CANCEL_REVIEW, { reviewId: review.id });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.cms.cancelCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.cancelledBy).toEqual({
            id: REASSIGNER.id,
            displayName: REASSIGNER.displayName
        });
    });

    it("returns the caller of the delete-time cancel", async () => {
        const { entry, review } = await createScenario();
        const admin = createGraphQLClient();

        const cancelled = await admin(CANCEL_REVIEWS_FOR_DELETE, {
            modelId: "author",
            entryId: entry.entryId,
            action: "trash"
        });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.cms.cancelCmsEntryReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            {
                id: review.id,
                state: "cancelled",
                isActive: false,
                cancelledBy: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        ]);
    });
});
```

Create the WB end-to-end test, `packages/api-website-builder-workflows/__tests__/graphql/pageReviewCancelledBy.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { ADMIN } from "~tests/__helpers/identities.js";
import { REASSIGNER } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { WB_READER } from "~tests/__helpers/identities.js";
import { WB_WRITER } from "~tests/__helpers/identities.js";
import { WORKFLOWS_REASSIGN } from "~tests/__helpers/identities.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";

const ERROR = "error { code message data }";
const REVIEW = "id state isActive cancelledBy { id displayName }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEW = /* GraphQL */ `
    mutation CancelReview($reviewId: ID!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReview(reviewId: $reviewId) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const CANCEL_REVIEWS_FOR_DELETE = /* GraphQL */ `
    mutation CancelReviewsForDelete($pageId: ID!, $action: WorkflowsReviewsForDeleteAction!) {
        websiteBuilder {
            cancelWebsiteBuilderPageReviewsForDelete(pageId: $pageId, action: $action) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];

/** Admin stores the pages workflow; REQUESTER has a review of "Page A". */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    return { page, review };
};

describe("WB review cancelledBy (R252, Q23)", () => {
    it("reads null while the review is in progress", async () => {
        const { review } = await createScenario();
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });

        const body = await reviewer.run(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.review).toMatchObject({ state: "inProgress", cancelledBy: null });
    });

    it("returns the requester as cancelledBy of their own cancel, and on a later read by someone else", async () => {
        const { review } = await createScenario();
        const requester = asGraphQLUser({ identity: REQUESTER, permissions: WB_WRITER });
        const reviewer = asGraphQLUser({ identity: REVIEWER, permissions: WB_READER });
        const expected = { id: REQUESTER.id, displayName: REQUESTER.displayName };

        const cancelled = await requester.run(CANCEL_REVIEW, { reviewId: review.id });
        const read = await reviewer.run(GET_REVIEW, { id: review.id });

        expect(cancelled.errors).toBeUndefined();
        const cancelResult = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(cancelResult.error).toBeNull();
        expect(cancelResult.data).toMatchObject({
            state: "cancelled",
            isActive: false,
            cancelledBy: expected
        });
        expect(read.errors).toBeUndefined();
        const readResult = read.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(readResult.data.review.cancelledBy).toEqual(expected);
    });

    it("returns the user with reassign who cancels a review requested by someone else", async () => {
        const { review } = await createScenario();
        const reassigner = asGraphQLUser({
            identity: REASSIGNER,
            permissions: REASSIGNER_PERMISSIONS
        });

        const cancelled = await reassigner.run(CANCEL_REVIEW, { reviewId: review.id });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.cancelledBy).toEqual({
            id: REASSIGNER.id,
            displayName: REASSIGNER.displayName
        });
    });

    it("returns the caller of the delete-time cancel", async () => {
        const { page, review } = await createScenario();
        const admin = asGraphQLUser();

        const cancelled = await admin.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "trash"
        });

        expect(cancelled.errors).toBeUndefined();
        const result = cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
        expect(result.error).toBeNull();
        expect(result.data).toEqual([
            {
                id: review.id,
                state: "cancelled",
                isActive: false,
                cancelledBy: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        ]);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-workflows/__tests__/review/ReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviewCancelledBy.test.ts 2>&1 | tail -50
```

Expected: FAIL. The domain and use-case tests fail on `cancelledBy` being `undefined` (and a TypeScript error on the unknown property, which vitest does not report); the model test finds no `cancelledBy` field; the mapper tests get `undefined` for `values.cancelledBy`; the schema test misses `cancelledBy`; the CMS and WB tests fail with `Cannot query field "cancelledBy" on type "WorkflowsReview"`.

- [ ] **Step 3: Implement**

`packages/api-workflows/src/domain/review/types.ts` (`ReviewData`; the rest of the file is unchanged):

```diff
     steps: ReviewStep[];
     /** The requester. */
     createdBy: Actor;
+    /**
+     * Who cancelled the review (R252): set once by `cancel`, never changed after (D75). Absent on
+     * a review that is not cancelled and on a review cancelled before the field existed; the
+     * mapper reads both as `null`.
+     */
+    cancelledBy?: Actor | null;
     createdOn: string;
     savedOn: string;
```

`packages/api-workflows/src/domain/review/review.model.ts` (a new object field right after `requester`, written like it):

```diff
                     requester: fields
                         .object()
                         .label("Requester")
                         .fields(requesterFields => ({
                             type: requesterFields.text().label("Type"),
                             id: requesterFields.text().label("ID"),
                             displayName: requesterFields.text().label("Display name"),
                             identityType: requesterFields.text().label("Identity type")
                         })),
+                    cancelledBy: fields
+                        .object()
+                        .label("Cancelled by")
+                        .fields(cancelledByFields => ({
+                            type: cancelledByFields.text().label("Type"),
+                            id: cancelledByFields.text().label("ID"),
+                            displayName: cancelledByFields.text().label("Display name"),
+                            identityType: cancelledByFields.text().label("Identity type")
+                        })),
                     lastChangedOn: fields.datetime().label("Last changed on").withoutTimezone()
```

`packages/api-workflows/src/domain/review/Review.ts`. `Review.request` initialises the field, as `823d9214d9` did for `currentStepType`, so in-memory data and read data agree:

```diff
             createdBy: { ...params.requester },
+            cancelledBy: null,
```

and `cancel` (the rest unchanged):

```diff
         const step = guard.value;

         this.data.state = "cancelled";
+        this.data.cancelledBy = { ...params.actor };
         this.facts.push({
             type: "cancelled",
```

`packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`. The values interface:

```diff
     steps: ReviewEntryStep[] | null;
     requester: ActorEntryValues | null;
+    /** Absent on entries stored before the field existed (R252). */
+    cancelledBy?: ActorEntryValues | null;
     lastChangedOn: string | Date | null;
 }
```

`toValues`:

```diff
             requester: ActorEntryMapper.toEntry(review.createdBy),
+            cancelledBy: review.cancelledBy ? ActorEntryMapper.toEntry(review.cancelledBy) : null,
             lastChangedOn: review.lastChangedOn
```

`fromEntry` (an entry without the field, with `null` or with an empty actor reads `null`):

```diff
             createdBy: ActorEntryMapper.fromEntry(values.requester) ?? {
                 type: "user",
                 id: "",
                 displayName: ""
             },
+            // Reviews stored before the field existed, and reviews that are not cancelled, read `null`.
+            cancelledBy: ActorEntryMapper.fromEntry(values.cancelledBy),
             createdOn: entry.createdOn,
```

`packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` (the `WorkflowsReview` type in `SHARED_TYPE_DEFS`; re-read the file, Tasks 1 and 5b changed other parts of it):

```diff
         "The requester."
         createdBy: WorkflowsActor!
+        "Who cancelled the review (R252). Null unless the review is cancelled, and for reviews cancelled before this was recorded."
+        cancelledBy: WorkflowsActor
         createdOn: DateTime!
         savedOn: DateTime!
```

The CMS and WB wrappers return the review data unchanged, so `cancelledBy` reaches both schemas through the shared type with no wrapper edit.

- [ ] **Step 4: Run the new tests on both storages, expect pass**

The CMS and WB tests read api-workflows through its build output, so build it first (`verify:` if a run before the build already sees the new field, the build is harmless). Run one command at a time (parallel `test:os` runs clash on port 8001). The `test:os` runs of the unit file and of the two end-to-end files are the storage proof of A91 on DDB-ES/OpenSearch; if any of them fails on the new field (an index, mapping or null-handling error, not an assertion typo), stop under the stop rule.

```bash
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
yarn test packages/api-workflows/__tests__/review/ReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviewCancelledBy.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviewCancelledBy.test.ts 2>&1 | tail -50
```

Expected: PASS (8, 4, 4 and 4 tests). `ReviewEntryMapper.test.ts` is storage-free, so it has no `test:os` run.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

The first group covers everything that reads or writes a review through the mapper or cancels one. `ReviewRepository.test.ts` (round-trip comparisons `expect(read.value).toEqual(saved.value)`, around lines 78 and 117) is the covering test for the new `null` key and must stay green on both runners; `Review.request` initialising `cancelledBy: null` keeps in-memory and read data equal:

```bash
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/CancelTargetReviews.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/CancelDeleteAbortTask.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/CurrentStepType.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/CurrentStepType.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows,api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-workflows): store and expose who cancelled a review" -m "The review gains the optional data field cancelledBy, written by cancel with the cancelling actor. It is a field of the private review model: no key, no key format, nothing migrated; an entry stored without it reads null." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

- The contract lists the test files "`ReviewEntryMapper.test.ts`, `CancelTargetReviews.test.ts` or a new `ReviewCancelledBy.test.ts`". This task modifies `ReviewEntryMapper.test.ts` and creates `ReviewCancelledBy.test.ts`; the delete-time cancel is proved in `ReviewCancelledBy.test.ts` (it goes through `CancelTargetReviewsUseCase`), and `CancelTargetReviews.test.ts` is only re-run.
- `ReviewData.cancelledBy` stays optional (`cancelledBy?: Actor | null`) so existing `ReviewData` literals need no edit; `Review.request` and the mapper always set `null` or an actor.
- A91 verified at plan time (see "Storage" above) and by the `test:os` runs of Step 4; no key, migration or non-additive change is needed, so no open question is recorded. The precedent commits are `823d9214d9`, `afb6185cdf` and `a7a5b352b7`.
- Tasks 1 and 5b must be applied first (all three edit `WorkflowsSchemaFactory.ts`; the hunk here is independent of theirs).
