### Task 7: CMS `listCmsEntryBlockingReviews`

Spec 5.1 (trash and delete with a review in progress); R265, R87, R107-style validation (a bad request is an error response, never a throw); D132, D133, D134, D157, D164; A95; Review Focus 9. I read the 8a Global Constraints (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) and the 8b additions, and every file of `ai-context/code-style/`. The CMS bulk trash of all loaded rows runs in a background task that swallows the workflows refusal, so the admin asks first: this query returns the reviews in progress of a list of entry ids, limited to entries the viewer can read, and the admin shows the 8a warning from the answer (Task 19).

Behaviour of the wrapper use case `ListCmsEntryBlockingReviewsUseCase.execute({ modelId, entryIds })`:

- **Signed in only.** `CurrentReviewViewer.getActor()` fails with `Workflows/NotAuthenticated` for an anonymous identity (API keys pass). No `workflows` permission is needed: the answer is limited by read access, like the 8a `BlockDeleteMultipleWhileInReview` hook.
- **At most `BLOCKING_REVIEWS_MAX_IDS` (200) ids**, counted as sent. More is a `ReviewValidationError` (`Workflows/Review/Validation`, message `At most 200 entries can be checked at once.`) before anything is read. Repeated ids are looked up once. No ids returns `[]` before anything is read.
- **Everything the viewer cannot see answers `[]`, never an error that tells.** The model is read through `GetModelUseCase` and its group through `GetGroupUseCase` (both as the viewer, once). A model or group that is missing or not readable (`Cms/Model/NotFound`, `Cms/Model/NotAuthorized`, `Cms/ModelGroup/NotFound`, `Cms/ModelGroup/NotAuthorized`) returns `[]`; so does a private model and a model with no bound workflow (`GetBoundWorkflowUseCase`, the check the delete hooks make first, R54). A viewer with no entry permission at all (`GetLatestEntriesByIdsUseCase` fails `Cms/Entry/NotAuthorized`) gets `[]`.
- **Batches of `BLOCKING_REVIEWS_CONCURRENCY` (10).** Per batch: `ListTargetReviewsUseCase` for every id in parallel, keeping reviews with `state === "inProgress"` (every revision of the entry); then, only if some id in the batch has such a review, one `GetLatestEntriesByIdsUseCase` call for those ids (R265 says "the latest revision of each entry id in the same batches"; loading it only for ids that have a review is the same answer with fewer reads, see Contract notes); then `CmsEntryAccess.canRead({ model, group, entry })` for each loaded entry in parallel (it covers group, model, entry permissions including own-only, and folder-level permissions). An id without a latest revision (missing, trashed) is left out; an unreadable entry is left out.
- **Output** is `toBlockingReview(review)` of every kept review, in the order of the ids, then the order the engine returned the entry's reviews.
- **R87:** a failed `ListTargetReviewsUseCase` returns its `ReviewPersistenceError`, a failed `GetBoundWorkflowUseCase` its `WorkflowPersistenceError` (`Workflows/Workflow/Persistence`), any other failed or thrown dependency (model, group, entry read, access check) a `ReviewPersistenceError`. `getActor()` and the id validation are pure (they read only the identity and the input) and run before the `try`; every dependency call after them runs inside one `try`/`catch`; nothing rejects.

GraphQL: `type CmsEntryBlockingReviewsResponse { data: [WorkflowsBlockingReview!] error: WorkflowsError }`, `CmsQuery.listCmsEntryBlockingReviews(modelId: ID!, entryIds: [ID!]!): CmsEntryBlockingReviewsResponse!`, and the shared SDL type `WorkflowsBlockingReview { reviewId: ID! model: String! targetId: ID! targetRevisionId: ID! title: String! stepPosition: Int! stepCount: Int! stepName: String! }` in the api-workflows shared type definitions (the CMS factory references it by name, R100). The resolver calls the use case inline and returns `ErrorResponse` or `Response`.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/abstractions.ts` (the use case token, its types and the two constants; the package has no constants file, and the folder convention puts feature constants beside the token)
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/ListCmsEntryBlockingReviewsUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/unreadableCodes.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/listBlockingReviews.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsBlockingReviewsSchema.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetLatestEntries.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FailingGetLatestEntries.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetModel.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetGroup.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/ConcurrencyProbeListTargetReviews.ts`

**Interfaces:**
- Consumes (all verified in the code):
  - `CurrentReviewViewer` (`@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js`; `getActor(): Result<Actor, WorkflowsNotAuthenticatedError>`).
  - `GetBoundWorkflowUseCase` (`@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js`; `execute({ model }): Result<Workflow | null, WorkflowPersistenceError>`).
  - `ListTargetReviewsUseCase` (`@webiny/api-workflows/features/review/ListTargetReviews/index.js`; `execute({ model, targetId }): Result<ReviewData[], ReviewPersistenceError>`, every revision, active or not).
  - `ReviewPersistenceError`, `ReviewValidationError` (`@webiny/api-workflows/domain/review/errors.js`), `WorkflowPersistenceError` (`@webiny/api-workflows/domain/workflow/errors.js`), `WorkflowsNotAuthenticatedError` (`@webiny/api-workflows/domain/permissions/errors.js`), `toBlockingReview` (`@webiny/api-workflows/domain/review/toBlockingReview.js`), `WorkflowBlockingReview` (`@webiny/api-workflows/domain/workflow/types.js`), `ReviewData` (`@webiny/api-workflows/domain/review/types.js`).
  - `GetModelUseCase` (`@webiny/api-headless-cms/features/contentModel/GetModel/index.js`; `execute(modelId): Result<CmsModel, ...>`), `GetGroupUseCase` (`@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js`; `execute(groupId)`), `GetLatestEntriesByIdsUseCase` (`@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js`; `execute(model, ids): Result<CmsEntry[], EntryNotAuthorizedError | EntryPersistenceError>`, drops trashed entries and entries it does not find).
  - `CmsEntryAccess` (`~/features/target/CmsEntryAccess/index.js`; `canRead(target: CmsEntryTarget)`), `CmsEntryTarget` (`~/features/target/CmsEntryTargetReader/abstractions.js`; `{ model, group, entry }`), `getCmsNamespace` (`~/utils/appName.js`; `null` for a private model).
  - Test helpers (all existing under `packages/api-headless-cms-workflows/__tests__/`): `createUserContext`, `storeWorkflow`, `createAuthorEntry`, `expectOk`, `getAuthorModel`, `AUTHOR_NAMESPACE`, `requestEntryReview`, `approveEntryReview`, `cancelEntryReview`, `seedReviewOnTarget`, `countEngineCalls` and `engineCalls`, `throwOnAccessChecks` and `throwingAccessChecks`, `failListTargetReviews`, `failGetBoundWorkflow`, `folderLevels`, `createExtraModelPlugins` (models `book` bindable and unbound, `secretNote` private), `createGraphQLClient`, the identities `READER` and `WRITER`, and the permission sets `CMS_READER`, `CMS_ENTRY_READER_WITHOUT_MODEL`, `CMS_READER_WITHOUT_GROUP_READ`.
- Produces (matches the contract):
  - `ListCmsEntryBlockingReviewsUseCase.execute(input: ListCmsEntryBlockingReviewsInput): Promise<Result<WorkflowBlockingReview[], ...>>` with `ListCmsEntryBlockingReviewsInput { modelId: string; entryIds: string[] }`, exported with the constants `BLOCKING_REVIEWS_MAX_IDS` and `BLOCKING_REVIEWS_CONCURRENCY` from `~/features/wrappers/ListCmsEntryBlockingReviews/index.js`; `ListCmsEntryBlockingReviewsFeature`.
  - The GraphQL query and types above (Tasks 9 and 19 consume them).
  - Test helpers `latestEntryReads` / `recordLatestEntryReads`, `failGetLatestEntries`, `listTargetReviewsConcurrency` / `probeListTargetReviewsConcurrency` / `resetListTargetReviewsConcurrency`, `modelReads` / `recordModelReads`, `groupReads` / `recordGroupReads`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetLatestEntries.ts`:

```ts
import type { Container } from "@webiny/di";
import type { CmsModel, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";

/** The ids of every latest-entries read, one list per call. Clear it in `beforeEach`. */
export const latestEntryReads: string[][] = [];

class RecordingGetLatestEntries implements GetLatestEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetLatestEntriesByIdsUseCase.Interface) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): GetLatestEntriesByIdsUseCase.Return<T> {
        latestEntryReads.push([...ids]);
        return this.decoratee.execute<T>(model, ids);
    }
}

/** Records every latest-entries read in `latestEntryReads` (`legacyPlugins`). */
export const recordLatestEntryReads = (container: Container) => {
    container.registerDecorator(
        GetLatestEntriesByIdsUseCase.createDecorator({
            decorator: RecordingGetLatestEntries,
            dependencies: []
        })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FailingGetLatestEntries.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsEntry, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";
import { EntryPersistenceError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class FailingGetLatestEntries implements GetLatestEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetLatestEntriesByIdsUseCase.Interface) {}

    public async execute<T extends CmsEntryValues>(): Promise<
        Result<CmsEntry<T>[], GetLatestEntriesByIdsUseCase.Error>
    > {
        return Result.fail(new EntryPersistenceError(new Error("Storage is down.")));
    }
}

/** The latest-entries read fails (`legacyPlugins`). */
export const failGetLatestEntries = (container: Container) => {
    container.registerDecorator(
        GetLatestEntriesByIdsUseCase.createDecorator({
            decorator: FailingGetLatestEntries,
            dependencies: []
        })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetModel.ts`:

```ts
import type { Container } from "@webiny/di";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";

/** The model id of every model read. Clear it in `beforeEach`. */
export const modelReads: string[] = [];

class RecordingGetModel implements GetModelUseCase.Interface {
    public constructor(private decoratee: GetModelUseCase.Interface) {}

    public async execute(modelId: string): GetModelUseCase.Return {
        modelReads.push(modelId);
        return this.decoratee.execute(modelId);
    }
}

/** Records every model read in `modelReads` (`legacyPlugins`). */
export const recordModelReads = (container: Container) => {
    container.registerDecorator(
        GetModelUseCase.createDecorator({ decorator: RecordingGetModel, dependencies: [] })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/RecordingGetGroup.ts`:

```ts
import type { Container } from "@webiny/di";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";

/** The group id of every group read. Clear it in `beforeEach`. */
export const groupReads: string[] = [];

class RecordingGetGroup implements GetGroupUseCase.Interface {
    public constructor(private decoratee: GetGroupUseCase.Interface) {}

    public async execute(groupId: string): GetGroupUseCase.Return {
        groupReads.push(groupId);
        return this.decoratee.execute(groupId);
    }
}

/** Records every group read in `groupReads` (`legacyPlugins`). */
export const recordGroupReads = (container: Container) => {
    container.registerDecorator(
        GetGroupUseCase.createDecorator({ decorator: RecordingGetGroup, dependencies: [] })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/ConcurrencyProbeListTargetReviews.ts`:

```ts
import type { Container } from "@webiny/di";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";

export interface ListTargetReviewsConcurrency {
    /** Calls running right now. */
    current: number;
    /** The most calls that ran at the same time. */
    max: number;
}

/** What the probe measured. Reset it in `beforeEach`. */
export const listTargetReviewsConcurrency: ListTargetReviewsConcurrency = { current: 0, max: 0 };

export const resetListTargetReviewsConcurrency = (): void => {
    listTargetReviewsConcurrency.current = 0;
    listTargetReviewsConcurrency.max = 0;
};

class ConcurrencyProbeListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(
        input: ListTargetReviewsUseCase.Input
    ): ListTargetReviewsUseCase.Return {
        listTargetReviewsConcurrency.current += 1;
        listTargetReviewsConcurrency.max = Math.max(
            listTargetReviewsConcurrency.max,
            listTargetReviewsConcurrency.current
        );
        try {
            return await this.decoratee.execute(input);
        } finally {
            listTargetReviewsConcurrency.current -= 1;
        }
    }
}

/** Measures how many target review lists run at once (`legacyPlugins`). */
export const probeListTargetReviewsConcurrency = (container: Container) => {
    container.registerDecorator(
        ListTargetReviewsUseCase.createDecorator({
            decorator: ConcurrencyProbeListTargetReviews,
            dependencies: []
        })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/listBlockingReviews.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { READER, WRITER } from "~tests/__helpers/identities.js";
import {
    CMS_ENTRY_READER_WITHOUT_MODEL,
    CMS_OWN_WRITER,
    CMS_READER,
    CMS_READER_WITHOUT_GROUP_READ
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failGetLatestEntries } from "~tests/__helpers/FailingGetLatestEntries.js";
import {
    latestEntryReads,
    recordLatestEntryReads
} from "~tests/__helpers/RecordingGetLatestEntries.js";
import {
    listTargetReviewsConcurrency,
    probeListTargetReviewsConcurrency,
    resetListTargetReviewsConcurrency
} from "~tests/__helpers/ConcurrencyProbeListTargetReviews.js";
import { modelReads, recordModelReads } from "~tests/__helpers/RecordingGetModel.js";
import { groupReads, recordGroupReads } from "~tests/__helpers/RecordingGetGroup.js";
import { seedReviewOnTarget } from "~tests/__helpers/seeds.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import {
    BLOCKING_REVIEWS_CONCURRENCY,
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase
} from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";

/** Model and group read, but no entry permission at all. */
const CMS_MODEL_READER_WITHOUT_ENTRIES: SecurityPermission[] = [
    { name: "cms.contentModelGroup", rwd: "r" },
    { name: "cms.contentModel", rwd: "r" }
];

/**
 * Admin stores the workflow; REQUESTER asks for a review of "Ann" and of "Bob" (both in the root
 * folder). The test workflow has one step, "Step 1".
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const ann = await createAuthorEntry(admin, { name: "Ann" });
    const bob = await createAuthorEntry(admin, { name: "Bob" });
    const annReview = await requestEntryReview(admin, ann);
    const bobReview = await requestEntryReview(admin, bob);
    return { admin, ann, bob, annReview, bobReview };
};

/**
 * READER (reads every entry, no workflows permission) by default. The context counts the engine's
 * calls, records the latest-entry reads and can throw on access checks; setup contexts do not.
 */
const createViewer = (params: UserContextParams = {}) => {
    return createUserContext({
        identity: READER,
        permissions: CMS_READER,
        ...params,
        legacyPlugins: [
            countEngineCalls,
            recordLatestEntryReads,
            recordModelReads,
            recordGroupReads,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const listBlocking = (context: CmsContext, input: ListCmsEntryBlockingReviewsUseCase.Input) => {
    return context.container.resolve(ListCmsEntryBlockingReviewsUseCase).execute(input);
};

/** The row the query returns for a review of the author model's first revision. */
const toExpectedRow = (
    review: ReviewData,
    entry: CmsEntry,
    title: string
): WorkflowBlockingReview => {
    return {
        reviewId: review.id,
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id,
        title,
        stepPosition: 1,
        stepCount: 1,
        stepName: "Step 1"
    };
};

/** Ids of entries that do not exist, so they have no review. */
const createFillerIds = (count: number): string[] => {
    return Array.from({ length: count }, (_, index) => `filler-${index}`);
};

describe("CMS blocking reviews wrapper (R265)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        latestEntryReads.length = 0;
        modelReads.length = 0;
        groupReads.length = 0;
        resetListTargetReviewsConcurrency();
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists the reviews in progress of the entries, in the order of the ids, for a viewer without a workflows permission", async () => {
        const { ann, bob, annReview, bobReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [bob.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([
            toExpectedRow(bobReview, bob, "Bob"),
            toExpectedRow(annReview, ann, "Ann")
        ]);
    });

    it("lists the reviews of every revision of an entry", async () => {
        const { admin, ann, annReview } = await createScenario();
        const model = await getAuthorModel(admin);
        const second = expectOk(
            await admin.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, ann.id, { values: {} })
        );
        const secondReview = await requestEntryReview(admin, second);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews.map(review => review.reviewId).sort()).toEqual(
            [annReview.id, secondReview.id].sort()
        );
        expect(reviews.map(review => review.targetRevisionId).sort()).toEqual(
            [ann.id, second.id].sort()
        );
    });

    it("leaves out reviews that are approved or cancelled", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const ann = await createAuthorEntry(admin, { name: "Ann" });
        const bob = await createAuthorEntry(admin, { name: "Bob" });
        const cara = await createAuthorEntry(admin, { name: "Cara" });
        await approveEntryReview(admin, await requestEntryReview(admin, ann));
        await cancelEntryReview(admin, await requestEntryReview(admin, bob));
        const caraReview = await requestEntryReview(admin, cara);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, bob.entryId, cara.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(caraReview, cara, "Cara")]);
    });

    it("leaves out a rejected review", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const ann = await createAuthorEntry(admin, { name: "Ann" });
        const bob = await createAuthorEntry(admin, { name: "Bob" });
        await rejectEntryReview(admin, await requestEntryReview(admin, ann));
        const bobReview = await requestEntryReview(admin, bob);
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, bob.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(bobReview, bob, "Bob")]);
    });

    it("reads the model and its group once, however many batches run", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [...createFillerIds(25), ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(modelReads.filter(modelId => modelId === "author")).toHaveLength(1);
        expect(groupReads).toHaveLength(1);
    });

    it("looks a repeated id up once", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, ann.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(engineCalls.filter(call => call === "ListTargetReviews")).toHaveLength(1);
    });

    it("reads the latest entries once per batch, only for the ids that have a review", async () => {
        const { admin, ann, bob } = await createScenario();
        const idle = await createAuthorEntry(admin, { name: "Idle" });
        const viewer = await createViewer();

        expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, idle.entryId, bob.entryId]
            })
        );

        expect(latestEntryReads).toEqual([[ann.entryId, bob.entryId]]);
    });

    it("reads nothing about entries when no id has a review", async () => {
        await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: createFillerIds(3) })
        );

        expect(reviews).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("looks the reviews up in batches of ten", async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [probeListTargetReviewsConcurrency] });

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [...createFillerIds(35), ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(listTargetReviewsConcurrency.max).toBe(BLOCKING_REVIEWS_CONCURRENCY);
        expect(engineCalls.filter(call => call === "ListTargetReviews")).toHaveLength(36);
    });

    it("accepts 200 ids", { timeout: 60000 }, async () => {
        const { ann, annReview } = await createScenario();
        const viewer = await createViewer();
        const entryIds = [ann.entryId, ...createFillerIds(BLOCKING_REVIEWS_MAX_IDS - 1)];

        const reviews = expectOk(await listBlocking(viewer, { modelId: "author", entryIds }));

        expect(entryIds).toHaveLength(200);
        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
    });

    it("refuses 201 ids with a validation error before it reads anything", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer();
        const entryIds = [ann.entryId, ...createFillerIds(BLOCKING_REVIEWS_MAX_IDS)];

        const result = await listBlocking(viewer, { modelId: "author", entryIds });

        expect(entryIds).toHaveLength(201);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("At most 200 entries can be checked at once.");
        expect(engineCalls).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for no ids without reading anything", async () => {
        await createScenario();
        const viewer = await createViewer();

        const reviews = expectOk(await listBlocking(viewer, { modelId: "author", entryIds: [] }));

        expect(reviews).toEqual([]);
        expect(engineCalls).toEqual([]);
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for a model with no bound workflow, without looking up reviews", async () => {
        await createScenario();
        const viewer = await createViewer({ legacyPlugins: createExtraModelPlugins() });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "book", entryIds: ["book-entry-1"] })
        );

        expect(reviews).toEqual([]);
        expect(engineCalls).toEqual(["GetBoundWorkflow"]);
        expect(latestEntryReads).toEqual([]);
    });

    it("returns an empty list for a private model and for a model that does not exist", async () => {
        await createScenario();
        const viewer = await createViewer({ legacyPlugins: createExtraModelPlugins() });

        const privateModel = expectOk(
            await listBlocking(viewer, { modelId: "secretNote", entryIds: ["note-1"] })
        );
        const missingModel = expectOk(
            await listBlocking(viewer, { modelId: "no-such-model", entryIds: ["entry-1"] })
        );

        expect(privateModel).toEqual([]);
        expect(missingModel).toEqual([]);
        expect(engineCalls).toEqual([]);
    });

    it("returns an empty list for a viewer who cannot read the model", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_ENTRY_READER_WITHOUT_MODEL
        });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
        expect(engineCalls).toEqual([]);
    });

    it("returns an empty list for a viewer who cannot read the model's group", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_READER_WITHOUT_GROUP_READ
        });

        // Refused at the group read or at the group check of `CmsEntryAccess.canRead`; either way
        // nothing is listed.
        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
    });

    it("returns an empty list for a viewer with no entry permission", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({
            identity: WRITER,
            permissions: CMS_MODEL_READER_WITHOUT_ENTRIES
        });

        const reviews = expectOk(
            await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] })
        );

        expect(reviews).toEqual([]);
    });

    it("leaves out an entry in a folder the viewer cannot read", async () => {
        const { admin, ann, annReview } = await createScenario();
        const locked = await createAuthorEntry(admin, { name: "Locked", folderId: "folder-locked" });
        await requestEntryReview(admin, locked);
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [locked.entryId, ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
    });

    it("leaves out an entry the viewer did not create when the permission is own-only", async () => {
        const { ann } = await createScenario();
        const writerContext = await createUserContext({
            identity: WRITER,
            permissions: CMS_OWN_WRITER
        });
        const own = await createAuthorEntry(writerContext, { name: "Own" });
        const admin = await createUserContext();
        const ownReview = await requestEntryReview(admin, own);
        const viewer = await createViewer({ identity: WRITER, permissions: CMS_OWN_WRITER });

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: [ann.entryId, own.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(ownReview, own, "Own")]);
    });

    it("leaves out an id that has a review but no latest revision", async () => {
        const { admin, ann, annReview } = await createScenario();
        await seedReviewOnTarget(admin, annReview, {
            id: "review-ghost",
            model: AUTHOR_NAMESPACE,
            targetId: "ghost-entry",
            targetRevisionId: "ghost-entry#0001"
        });
        const viewer = await createViewer();

        const reviews = expectOk(
            await listBlocking(viewer, {
                modelId: "author",
                entryIds: ["ghost-entry", ann.entryId]
            })
        );

        expect(reviews).toEqual([toExpectedRow(annReview, ann, "Ann")]);
        expect(latestEntryReads).toEqual([["ghost-entry", ann.entryId]]);
    });

    it("refuses an anonymous identity without reading anything", async () => {
        const { ann } = await createScenario();
        const anonymous = await createViewer({ identity: null, permissions: [] });

        const result = await listBlocking(anonymous, {
            modelId: "author",
            entryIds: [ann.entryId]
        });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the review list fails (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failListTargetReviews] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });

    it("fails with a persistence error when the binding lookup fails (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failGetBoundWorkflow] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("fails with a persistence error when the latest entries cannot be read (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer({ legacyPlugins: [failGetLatestEntries] });

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });

    it("fails with a persistence error when the entry access check throws (R87)", async () => {
        const { ann } = await createScenario();
        const viewer = await createViewer();
        throwingAccessChecks.add("canRead");

        const result = await listBlocking(viewer, { modelId: "author", entryIds: [ann.entryId] });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsBlockingReviewsSchema.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { READER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createGraphQLClient, type GraphQLClient } from "~tests/__helpers/graphql.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { BLOCKING_REVIEWS_MAX_IDS } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";

const LIST_BLOCKING_REVIEWS = /* GraphQL */ `
    query ListBlockingReviews($modelId: ID!, $entryIds: [ID!]!) {
        cms {
            listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds) {
                data {
                    reviewId
                    model
                    targetId
                    targetRevisionId
                    title
                    stepPosition
                    stepCount
                    stepName
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** A `/graphql` client as the identity, with the extra models and the engine call counter. */
const clientFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createGraphQLClient({
        identity,
        permissions,
        legacyPlugins: [...createExtraModelPlugins(), countEngineCalls]
    });
};

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

describe("CMS blocking reviews GraphQL (R265)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("returns every field of the reviews in progress of the entries", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const review = await requestEntryReview(admin, entry);
        const viewer = clientFor(READER, CMS_READER);

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, {
            modelId: "author",
            entryIds: [entry.entryId]
        });

        expect(result.listCmsEntryBlockingReviews.error).toBeNull();
        expect(result.listCmsEntryBlockingReviews.data).toEqual([
            {
                reviewId: review.id,
                model: "cms.author",
                targetId: entry.entryId,
                targetRevisionId: entry.id,
                title: "Ann",
                stepPosition: 1,
                stepCount: 1,
                stepName: "Step 1"
            }
        ]);
    });

    it("returns an empty list, not null, for a model with no bound workflow", async () => {
        const viewer = clientFor(READER, CMS_READER);

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, {
            modelId: "book",
            entryIds: ["book-entry-1"]
        });

        expect(result.listCmsEntryBlockingReviews).toEqual({ data: [], error: null });
    });

    it("returns the validation error with its code for more than 200 ids", async () => {
        const viewer = clientFor(READER, CMS_READER);
        const entryIds = Array.from({ length: BLOCKING_REVIEWS_MAX_IDS + 1 }, (_, index) => {
            return `entry-${index}`;
        });

        const result = await run(viewer, LIST_BLOCKING_REVIEWS, { modelId: "author", entryIds });

        expect(result.listCmsEntryBlockingReviews.data).toBeNull();
        expect(result.listCmsEntryBlockingReviews.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: "At most 200 entries can be checked at once."
        });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const anonymous = clientFor(null, []);

        const result = await run(anonymous, LIST_BLOCKING_REVIEWS, {
            modelId: "author",
            entryIds: ["entry-1"]
        });

        expect(result.listCmsEntryBlockingReviews.data).toBeNull();
        expect(result.listCmsEntryBlockingReviews.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });
});
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`. In the test `exposes the shared types the app schemas reuse (R100)`, after the `WorkflowsReviewWithFlags` expectation add the new one.

Before:

```ts
        expect(memberNames(types, "WorkflowsReviewWithFlags")).toEqual(["review", "flags"]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsReviewWithFlags")).toEqual(["review", "flags"]);
        expect(memberNames(types, "WorkflowsBlockingReview")).toEqual([
            "reviewId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "stepPosition",
            "stepCount",
            "stepName"
        ]);
```

Modify `packages/api-headless-cms-workflows/__tests__/registration.test.ts`. Add the import after the `CmsEntryFolderExistsUseCase` import:

```ts
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";
import { ListCmsEntryBlockingReviewsUseCase } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";
```

and the entry in `WRAPPERS`, after `ListCmsEntryReviewsUseCase`:

```ts
    ListCmsEntryReviewsUseCase,
    ListCmsEntryBlockingReviewsUseCase,
    StartCmsEntryReviewStepUseCase,
```

(The existing "registers ... every wrapper once" test then asserts one registration with the license, and "registers no wrapper ... without the advancedPublishingWorkflow license" asserts none.)

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL in `exposes the shared types the app schemas reuse (R100)`: `expected [] to deeply equal [ 'reviewId', 'model', ... ]` (the type does not exist yet).

`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listBlockingReviews.test.ts 2>&1 | tail -50`
Expected: FAIL to load: `Failed to resolve import "~/features/wrappers/ListCmsEntryBlockingReviews/index.js"`.

`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsBlockingReviewsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL to load with the same unresolved import.

`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL to load with the same unresolved import.

- [ ] **Step 3: Implement**

3-0. Share the unreadable-model list instead of copying it. Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/unreadableCodes.ts`:

```ts
/*
 * The error codes of a model or group the identity cannot read, or that does not exist. Shared by
 * `CmsEntryAccess` and the wrapper use cases that read a model and its group themselves.
 */
export const UNREADABLE_CODES = [
    "Cms/Model/NotFound",
    "Cms/Model/NotAuthorized",
    "Cms/ModelGroup/NotFound",
    "Cms/ModelGroup/NotAuthorized"
];
```

Modify `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`. Before:

```ts
import { CmsEntryAccess as Abstraction } from "./abstractions.js";

const UNREADABLE_CODES = [
    "Cms/Model/NotFound",
    "Cms/Model/NotAuthorized",
    "Cms/ModelGroup/NotFound",
    "Cms/ModelGroup/NotAuthorized"
];
```

After:

```ts
import { CmsEntryAccess as Abstraction } from "./abstractions.js";
import { UNREADABLE_CODES } from "./unreadableCodes.js";
```

Modify `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/index.ts`. Before:

```ts
export { CmsEntryAccess } from "./abstractions.js";
```

After:

```ts
export { CmsEntryAccess } from "./abstractions.js";
export { UNREADABLE_CODES } from "./unreadableCodes.js";
```

3a. Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`: add the shared type after `WorkflowsReviewWithFlags`.

Before:

```ts
    type WorkflowsReviewWithFlags {
        review: WorkflowsReview!
        flags: WorkflowsViewerFlags!
    }

    enum WorkflowsReviewListKind {
```

After:

```ts
    type WorkflowsReviewWithFlags {
        review: WorkflowsReview!
        flags: WorkflowsViewerFlags!
    }

    "A review in progress that blocks trashing or deleting its content (D115, D134): the content reference, its title and where the review stands. Nothing else of the review."
    type WorkflowsBlockingReview {
        reviewId: ID!
        "Namespace id, e.g. cms.article."
        model: String!
        targetId: ID!
        targetRevisionId: ID!
        title: String!
        "1-based position of the current step."
        stepPosition: Int!
        stepCount: Int!
        stepName: String!
    }

    enum WorkflowsReviewListKind {
```

3b. Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type {
    ReviewPersistenceError,
    ReviewValidationError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";

/** The most entry ids one call checks (R265); the admin sends chunks of this size. */
export const BLOCKING_REVIEWS_MAX_IDS = 200;

/** How many entries are looked up at once (R265). */
export const BLOCKING_REVIEWS_CONCURRENCY = 10;

export interface ListCmsEntryBlockingReviewsInput {
    /** The model id, without the `cms.` prefix. */
    modelId: string;
    /** Entry ids, not revision ids. At most `BLOCKING_REVIEWS_MAX_IDS`. */
    entryIds: string[];
}

export interface IListCmsEntryBlockingReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    validation: ReviewValidationError;
    persistence: ReviewPersistenceError;
    bindingPersistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListCmsEntryBlockingReviewsUseCaseErrors[keyof IListCmsEntryBlockingReviewsUseCaseErrors];

export interface IListCmsEntryBlockingReviewsUseCase {
    execute(
        input: ListCmsEntryBlockingReviewsInput
    ): Promise<Result<WorkflowBlockingReview[], UseCaseError>>;
}

/**
 * The reviews in progress of a list of entries, for the admin's bulk trash of all loaded rows
 * (R265, D164): only entries the viewer can read are considered, so the answer never names a
 * review of content the viewer cannot see. Everything unreadable or unbound answers an empty list.
 */
export const ListCmsEntryBlockingReviewsUseCase =
    createAbstraction<IListCmsEntryBlockingReviewsUseCase>("ListCmsEntryBlockingReviewsUseCase");

export namespace ListCmsEntryBlockingReviewsUseCase {
    export type Interface = IListCmsEntryBlockingReviewsUseCase;
    export type Input = ListCmsEntryBlockingReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowBlockingReview[], UseCaseError>>;
}
```

3c. Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/ListCmsEntryBlockingReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import {
    ReviewPersistenceError,
    ReviewValidationError
} from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { CmsEntryAccess, UNREADABLE_CODES } from "~/features/target/CmsEntryAccess/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import {
    BLOCKING_REVIEWS_CONCURRENCY,
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase as UseCase
} from "./abstractions.js";

/** The viewer has no entry permission at all, so no entry is readable. */
const ENTRIES_NOT_AUTHORIZED = "Cms/Entry/NotAuthorized";

class ListCmsEntryBlockingReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private getLatestEntries: GetLatestEntriesByIdsUseCase.Interface,
        private access: CmsEntryAccess.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (input.entryIds.length > BLOCKING_REVIEWS_MAX_IDS) {
            return Result.fail(
                new ReviewValidationError(
                    `At most ${BLOCKING_REVIEWS_MAX_IDS} entries can be checked at once.`
                )
            );
        }
        const entryIds = Array.from(new Set(input.entryIds));
        if (entryIds.length === 0) {
            return Result.ok([]);
        }

        // Every dependency failure and throw below is a failed Result (R87).
        try {
            const model = await this.getModel.execute(input.modelId);
            if (model.isFail()) {
                if (UNREADABLE_CODES.includes(model.error.code)) {
                    return Result.ok([]);
                }
                return Result.fail(new ReviewPersistenceError(model.error));
            }
            // `null` for a private model.
            const namespace = getCmsNamespace(model.value);
            if (!namespace) {
                return Result.ok([]);
            }
            const group = await this.getGroup.execute(model.value.group);
            if (group.isFail()) {
                if (UNREADABLE_CODES.includes(group.error.code)) {
                    return Result.ok([]);
                }
                return Result.fail(new ReviewPersistenceError(group.error));
            }

            const bound = await this.getBoundWorkflow.execute({ model: namespace });
            if (bound.isFail()) {
                return Result.fail(bound.error);
            }
            if (!bound.value) {
                return Result.ok([]);
            }

            const blocking: WorkflowBlockingReview[] = [];
            for (let start = 0; start < entryIds.length; start += BLOCKING_REVIEWS_CONCURRENCY) {
                const batch = entryIds.slice(start, start + BLOCKING_REVIEWS_CONCURRENCY);

                const lookups = await Promise.all(
                    batch.map(entryId => {
                        return this.listTargetReviews.execute({
                            model: namespace,
                            targetId: entryId
                        });
                    })
                );
                const inProgress = new Map<string, ReviewData[]>();
                for (let index = 0; index < batch.length; index++) {
                    const lookup = lookups[index];
                    if (lookup.isFail()) {
                        return Result.fail(lookup.error);
                    }
                    const reviews = lookup.value.filter(review => review.state === "inProgress");
                    if (reviews.length > 0) {
                        inProgress.set(batch[index], reviews);
                    }
                }
                if (inProgress.size === 0) {
                    continue;
                }

                // The entry permissions (own) and the folder are entry-level, so the latest
                // revision answers for every revision of the entry.
                const idsWithReviews = Array.from(inProgress.keys());
                const latest = await this.getLatestEntries.execute(model.value, idsWithReviews);
                if (latest.isFail()) {
                    if (latest.error.code === ENTRIES_NOT_AUTHORIZED) {
                        return Result.ok([]);
                    }
                    return Result.fail(new ReviewPersistenceError(latest.error));
                }
                const readable = await Promise.all(
                    latest.value.map(entry => {
                        return this.access.canRead({
                            model: model.value,
                            group: group.value,
                            entry
                        });
                    })
                );
                const readableIds = new Set<string>();
                for (let index = 0; index < latest.value.length; index++) {
                    if (readable[index]) {
                        readableIds.add(latest.value[index].entryId);
                    }
                }

                for (const entryId of batch) {
                    if (!readableIds.has(entryId)) {
                        continue;
                    }
                    const reviews = inProgress.get(entryId) ?? [];
                    for (const review of reviews) {
                        blocking.push(toBlockingReview(review));
                    }
                }
            }
            return Result.ok(blocking);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new ReviewPersistenceError(cause));
        }
    }
}

export const ListCmsEntryBlockingReviewsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryBlockingReviewsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        GetModelUseCase,
        GetGroupUseCase,
        GetBoundWorkflowUseCase,
        ListTargetReviewsUseCase,
        GetLatestEntriesByIdsUseCase,
        CmsEntryAccess
    ]
});
```

3d. Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryBlockingReviewsUseCase } from "./ListCmsEntryBlockingReviewsUseCase.js";

export const ListCmsEntryBlockingReviewsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryBlockingReviews",
    register(container) {
        container.register(ListCmsEntryBlockingReviewsUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryBlockingReviews/index.ts`:

```ts
export {
    BLOCKING_REVIEWS_CONCURRENCY,
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase
} from "./abstractions.js";
export type { ListCmsEntryBlockingReviewsInput } from "./abstractions.js";
```

3e. Modify `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`.

Before:

```ts
import { ListCmsEntryReviewsFeature } from "./ListCmsEntryReviews/feature.js";
import { StartCmsEntryReviewStepFeature } from "./StartCmsEntryReviewStep/feature.js";
```

After:

```ts
import { ListCmsEntryReviewsFeature } from "./ListCmsEntryReviews/feature.js";
import { ListCmsEntryBlockingReviewsFeature } from "./ListCmsEntryBlockingReviews/feature.js";
import { StartCmsEntryReviewStepFeature } from "./StartCmsEntryReviewStep/feature.js";
```

Before:

```ts
        ListCmsEntryReviewsFeature.register(container);
        StartCmsEntryReviewStepFeature.register(container);
```

After:

```ts
        ListCmsEntryReviewsFeature.register(container);
        ListCmsEntryBlockingReviewsFeature.register(container);
        StartCmsEntryReviewStepFeature.register(container);
```

3f. Modify `packages/api-headless-cms-workflows/src/graphql/CmsWorkflowsSchemaFactory.ts`.

Import. Before:

```ts
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
```

After:

```ts
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
import { ListCmsEntryBlockingReviewsUseCase } from "~/features/wrappers/ListCmsEntryBlockingReviews/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
```

Envelope type. Before:

```ts
    type CmsEntryReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }
```

After:

```ts
    type CmsEntryReviewListResponse {
        data: [WorkflowsReviewWithFlags!]
        meta: WorkflowsListMeta
        error: WorkflowsError
    }

    type CmsEntryBlockingReviewsResponse {
        data: [WorkflowsBlockingReview!]
        error: WorkflowsError
    }
```

Query field. Before:

```ts
        ): CmsEntryReviewListResponse!
        listCmsEntryWorkflowModels(
```

After:

```ts
        ): CmsEntryReviewListResponse!
        listCmsEntryBlockingReviews(
            modelId: ID!
            entryIds: [ID!]!
        ): CmsEntryBlockingReviewsResponse!
        listCmsEntryWorkflowModels(
```

Resolver, placed before the "Review actions" block. Before:

```ts
        // Review actions
        builder.addResolver<RequestCmsEntryReviewArgs>({
```

After:

```ts
        builder.addResolver<ListCmsEntryBlockingReviewsUseCase.Input>({
            path: "CmsQuery.listCmsEntryBlockingReviews",
            dependencies: [ListCmsEntryBlockingReviewsUseCase],
            resolver: (listBlockingReviews: ListCmsEntryBlockingReviewsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listBlockingReviews.execute({
                        modelId: args.modelId,
                        entryIds: args.entryIds
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        // Review actions
        builder.addResolver<RequestCmsEntryReviewArgs>({
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listBlockingReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsBlockingReviewsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same four with `yarn test:os` (one at a time, parallel runs clash on port 8001).
Expected: PASS.

If the "looks the reviews up in batches of ten" case reports a `max` below 10, the engine's `ListTargetReviews` returned before the next id started: that cannot happen with `Promise.all` over a synchronous `map`, so a lower value means the loop is not parallel; fix the use case, not the test.

- [ ] **Step 5: Run the existing tests covering the changed code**

The wrapper feature, the schema factory and the shared SDL are shared by every wrapper test, so run the neighbours that exercise them, each on its own, with `yarn test` and then `yarn test:os`:
`yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryAccess.test.ts 2>&1 | tail -50` (the constant moved out of `CmsEntryAccess.ts`)
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listReviews.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50`
Expected: PASS (nothing existing changes).

Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40`
Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages. (If the generic `execute<T>` of a decorator in `RecordingGetLatestEntries.ts` is flagged against `GetLatestEntriesByIdsUseCase.Interface`, copy the signature from `GetLatestEntriesByIdsNotDeletedDecorator.ts` in `api-headless-cms`.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` (the 8a chain, unchanged) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows --no-cache 2>&1 | tail -30`, `git add .`; then restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-headless-cms-workflows): list the blocking reviews of entry ids" -m "Adds the cms.listCmsEntryBlockingReviews query for the bulk trash pre-check (R265). It lists the reviews in progress of up to 200 entry ids, limited to entries the viewer can read." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes**

- **Latest revision read (A95).** The task reads the latest revision with `GetLatestEntriesByIdsUseCase`, one call per batch, only for ids with an in-progress review, as R265 now says; the test "reads the latest entries once per batch, only for the ids that have a review" pins it.
- **Access check.** R265 and the 8a `BlockDeleteMultipleWhileInReview` hook differ in the check: the hook uses `AccessControl.canAccessEntry`, the contract names `CmsEntryAccess.canRead`. The task follows the contract: `canRead` adds group, model and folder-level permissions on top, so it is the stricter (and the one the other wrappers use). The delete itself still goes through the 8a hooks, so a review the query hides because of a folder permission would still block the trash inside the background task; accepted, since the viewer cannot see that content.
- **Error union.** The contract's `Result<WorkflowBlockingReview[], ...>` is `WorkflowsNotAuthenticatedError | ReviewValidationError | ReviewPersistenceError | WorkflowPersistenceError`; the last is what `GetBoundWorkflowUseCase` fails with (`Workflows/Workflow/Persistence`).
- **Unreadable entries as a whole.** `GetLatestEntriesByIdsUseCase` fails with `Cms/Entry/NotAuthorized` when the viewer has no entry permission for the model at all; the task answers `[]` for that, not an error (R265: nothing about content the viewer cannot see).
- **Counting.** The 200-id limit counts the ids as sent; repeated ids are removed afterwards. 201 identical ids are refused.
- **SDL ownership.** `WorkflowsBlockingReview` lives in the shared factory `WorkflowsSchemaFactory.ts`, which Task 4 also edits (`WorkflowsStepRunInfo`); the anchors above are different hunks. Admin documents (Task 9) select exactly the eight fields.
- **Seeding a review without an entry:** `ReviewRepository.save` does no target check, and `listReviews.test.ts` seeds a review on another target the same way, so `seedReviewOnTarget` works for the ghost-entry test.
- **Shared constant:** `UNREADABLE_CODES` moves from `CmsEntryAccess.ts` into its own file `CmsEntryAccess/unreadableCodes.ts` and is exported from the folder's `index.ts` (step 3-0), so the use case imports it instead of keeping a copy (consistency pass). A model or group that is missing or unreadable answers `[]`. `getCmsNamespace` is the existing helper and is imported.
