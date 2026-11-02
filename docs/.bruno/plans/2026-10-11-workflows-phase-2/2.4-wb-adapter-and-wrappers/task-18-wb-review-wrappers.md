### Task 18: WB review guard and review wrappers

Spec 5.1, 5.3, D25, D77, D133 points 1, 5 and 7, 1b R41, R45-R47, R61, R62, R75, R79. The Website Builder mirror of Tasks 13 and 14: `WbPageReviewGuardService` (viewer → review → `wb.page` only → read access to the page) and seven wrappers. The request wrapper takes no `model` (Website Builder has the one namespace `wb.page`). Like WB's own `UpdatePageUseCase`, it checks the entity-level page write permission (`WbPageAccess.canWriteAnyPage()`) before it loads the page, so a user without page permissions gets `Workflows/NotAuthorized` for a missing and an existing page alike and learns nothing about which pages exist (R75, A25); a user with page permissions gets `Workflows/Review/TargetNotFound` for a missing page. Ends with the API-key end-to-end tests (a real stored key and its token through api-core's `ApiKeyAuthenticator`, R79) and a registration test for the package (Task 18b adds its wrapper to it).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/WbPageReviewGuardService.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/{abstractions.ts,RequestWebsiteBuilderPageReviewUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/{abstractions.ts,GetWebsiteBuilderPageReviewUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/StartWebsiteBuilderPageReviewStep/{abstractions.ts,StartWebsiteBuilderPageReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/{abstractions.ts,TakeOverWebsiteBuilderPageReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ApproveWebsiteBuilderPageReviewStep/{abstractions.ts,ApproveWebsiteBuilderPageReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/RejectWebsiteBuilderPageReviewStep/{abstractions.ts,RejectWebsiteBuilderPageReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReview/{abstractions.ts,CancelWebsiteBuilderPageReviewUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/reviewWrappers.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/registration.test.ts`

(Each `{...}` line is four files, all given in full below.)

**Interfaces:**
- Consumes: `CurrentReviewViewer`, `GetReviewUseCase`, `RequestReviewUseCase`, the five transition use cases, `getReviewViewerFlags`, `applyTargetAccess`, `canCancelByPermission`, `WbPageTargetReader`, `WbPageAccess` incl. `canWriteAnyPage()` (Task 15), `ReviewWithViewerFlags`, `ReviewTargetReadAccess` (Task 6), `CreateApiKeyUseCase`, `AuthenticationContext`, `IdentityContext` (tests).
- Produces:
  - `WbPageReviewGuardService.Interface { authorize(params: WbPageReviewGuardServiceParams): Promise<Result<AuthorizedWbPageReview, WbPageReviewGuardService.Error>> }`, `WbPageReviewGuardServiceParams { reviewId: string; action: string }`, `AuthorizedWbPageReview { review: ReviewData; viewer: ReviewViewer }`.
  - `RequestWebsiteBuilderPageReviewUseCase` (`RequestWebsiteBuilderPageReviewInput { targetId: string; targetRevisionId: string; picks?: ReviewPick[] }`), `GetWebsiteBuilderPageReviewUseCase` (`GetWebsiteBuilderPageReviewInput { id: string }` → `ReviewWithViewerFlags`), `StartWebsiteBuilderPageReviewStepUseCase`, `TakeOverWebsiteBuilderPageReviewStepUseCase` (`{ reviewId; stepId }`), `ApproveWebsiteBuilderPageReviewStepUseCase`, `RejectWebsiteBuilderPageReviewStepUseCase` (`{ reviewId; stepId; comment?: string | null }`), `CancelWebsiteBuilderPageReviewUseCase` (`{ reviewId }`).
  - Action texts as in Task 14.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/wrappers/reviewWrappers.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Result } from "@webiny/feature/api";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { CreateApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    createWbWorkflowValues,
    readPage,
    requestPageReview,
    STEP_ID,
    storeWbWorkflow,
    WB_ADMIN_ACTOR
} from "~tests/__helpers/engine.js";
import { ARTICLE_NAMESPACE } from "~tests/__helpers/cmsModel.js";
import {
    NOBODY,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    toActor,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";

/** Admin stores the pages workflow; REQUESTER's reviews on a page in the root and in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    return {
        admin,
        page,
        review: await requestPageReview(admin, page),
        lockedReview: await requestPageReview(admin, lockedPage)
    };
};

const asUser = (identity: IdentityData, permissions: SecurityPermission[]) => {
    return createUserContext({ identity, permissions });
};

const request = (context: CmsContext, page: WbPage) => {
    return context.container
        .resolve(RequestWebsiteBuilderPageReviewUseCase)
        .execute({ targetId: page.entryId, targetRevisionId: page.id });
};

const start = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(StartWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const takeOver = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(TakeOverWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const approve = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ApproveWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Looks good." });
};

const reject = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(RejectWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Needs another pass." });
};

const cancel = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(CancelWebsiteBuilderPageReviewUseCase).execute({ reviewId });
};

const view = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(GetWebsiteBuilderPageReviewUseCase).execute({ id: reviewId });
};

interface RefusalCase {
    name: string;
    identity: IdentityData;
    permissions: SecurityPermission[];
    action: string;
    run: (context: CmsContext, reviewId: string) => Promise<Result<any, any>>;
}

const REFUSALS: RefusalCase[] = [
    { name: "start", identity: REVIEWER, permissions: WB_READER, action: "start this step", run: start },
    {
        name: "take over",
        identity: REVIEWER,
        permissions: WB_READER,
        action: "take over this step",
        run: takeOver
    },
    {
        name: "approve",
        identity: REVIEWER,
        permissions: WB_READER,
        action: "approve this step",
        run: approve
    },
    {
        name: "reject",
        identity: REVIEWER,
        permissions: WB_READER,
        action: "reject this step",
        run: reject
    },
    {
        name: "cancel",
        identity: REQUESTER,
        permissions: WB_WRITER,
        action: "cancel this review",
        run: cancel
    },
    {
        name: "get review",
        identity: REVIEWER,
        permissions: WB_READER,
        action: "view this review",
        run: view
    }
];

describe("WB review wrappers", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("requests a review for a user with write access, as that user", async () => {
        const { admin } = await createScenario();
        const fresh = await createPage(admin, { title: "Fresh" });
        const requester = await asUser(REQUESTER, WB_WRITER);

        const review = expectOk(await request(requester, fresh));

        expect(review.model).toBe("wb.page");
        expect(review.createdBy).toEqual(toActor(REQUESTER));
        expect((await readPage(admin, fresh.id)).system?.workflow?.reviewState).toBe(
            "inProgress"
        );
    });

    it("refuses a request without write access (D77) and reports a missing page", async () => {
        const { admin } = await createScenario();
        const fresh = await createPage(admin, { title: "Fresh" });
        const reader = await asUser(READER, WB_READER);
        const nobody = await asUser(NOBODY, []);
        const requester = await asUser(REQUESTER, WB_WRITER);

        const readOnly = await request(reader, fresh);
        const noPermissions = await request(nobody, fresh);
        const missing = await requester.container
            .resolve(RequestWebsiteBuilderPageReviewUseCase)
            .execute({ targetId: fresh.entryId, targetRevisionId: `${fresh.entryId}#0009` });

        expect(readOnly.error.code).toBe("Workflows/NotAuthorized");
        expect(readOnly.error.data).toEqual({ action: "request a review" });
        expect(noPermissions.error.code).toBe("Workflows/NotAuthorized");
        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("refuses a user without page permissions before loading the page (R75)", async () => {
        const { admin } = await createScenario();
        const fresh = await createPage(admin, { title: "Fresh" });
        const nobody = await asUser(NOBODY, []);
        const requestReview = nobody.container.resolve(RequestWebsiteBuilderPageReviewUseCase);

        const existing = await requestReview.execute({
            targetId: fresh.entryId,
            targetRevisionId: fresh.id
        });
        const missing = await requestReview.execute({
            targetId: fresh.entryId,
            targetRevisionId: `${fresh.entryId}#0009`
        });

        expect(existing.error.code).toBe("Workflows/NotAuthorized");
        expect(missing.error.code).toBe("Workflows/NotAuthorized");
    });

    it("rejects a pick on a step without manual picks (R61)", async () => {
        const { admin } = await createScenario();
        const fresh = await createPage(admin, { title: "Fresh" });
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await requester.container
            .resolve(RequestWebsiteBuilderPageReviewUseCase)
            .execute({
                targetId: fresh.entryId,
                targetRevisionId: fresh.id,
                picks: [{ stepId: STEP_ID, userId: REVIEWER.id }]
            });

        expect(result.error.code).toBe("Workflows/Review/Validation");
    });

    it("returns the review with the viewer's flags (spec 5.3)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const read = expectOk(await view(reviewer, review.id));

        expect(read.review.id).toBe(review.id);
        expect(read.flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
    });

    it("lets reviewers start, take over, approve and the owner reject", async () => {
        const { admin, page, review } = await createScenario();
        const second = await requestPageReview(admin, await createPage(admin, { title: "Second" }));
        const reviewer = await asUser(REVIEWER, WB_READER);
        const other = await asUser(OTHER_REVIEWER, WB_READER);

        expectOk(await start(reviewer, review.id));
        expectOk(await takeOver(other, review.id));
        const approved = expectOk(await approve(other, review.id));
        expectOk(await start(reviewer, second.id));
        const rejected = expectOk(await reject(reviewer, second.id));

        expect(approved.state).toBe("approved");
        expect((await readPage(admin, page.id)).system?.workflow?.reviewState).toBe("approved");
        expect(rejected.state).toBe("rejected");
    });

    it.each(REFUSALS)("refuses $name without read access to the page", async refusal => {
        const { lockedReview } = await createScenario();
        folderLevels.set(
            "folder-locked",
            new Map([
                [REVIEWER.id, "no-access"],
                [REQUESTER.id, "no-access"]
            ])
        );
        const context = await asUser(refusal.identity, refusal.permissions);

        const result = await refusal.run(context, lockedReview.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: refusal.action });
    });

    it("refuses cancel by a non-requester without reassign", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await cancel(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel a review requested by someone else" });
    });

    it("lets the requester and a reassigner with read access cancel", async () => {
        const { admin, review } = await createScenario();
        const second = await requestPageReview(admin, await createPage(admin, { title: "Second" }));
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...WB_READER]);

        const byRequester = expectOk(await cancel(requester, review.id));
        const byReassigner = expectOk(await cancel(reassigner, second.id));

        expect(byRequester.state).toBe("cancelled");
        expect(byReassigner.state).toBe("cancelled");
    });

    it("reports a state error, not a permission error, for a finished review (1b R41)", async () => {
        const { admin, review } = await createScenario();
        await approvePageReview(admin, review);
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...WB_READER]);

        const byRequester = await cancel(requester, review.id);
        const byReassigner = await cancel(reassigner, review.id);

        expect(byRequester.error.code).toBe("Workflows/Review/InvalidState");
        expect(byReassigner.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const admin = await createUserContext();
        expectOk(
            await admin.container.resolve(StoreWorkflowUseCase).execute({
                workflow: { ...createWbWorkflowValues(), id: "cms-workflow", models: [ARTICLE_NAMESPACE] },
                actor: WB_ADMIN_ACTOR
            })
        );
        const articleModel = expectOk(
            await admin.container.resolve(GetModelUseCase).execute("article")
        );
        const article = expectOk(
            await admin.container
                .resolve(CreateEntryUseCase)
                .execute(articleModel, { values: { title: "Article 1" } })
        );
        const cmsReview = expectOk(
            await admin.container.resolve(RequestReviewUseCase).execute({
                model: ARTICLE_NAMESPACE,
                targetId: article.entryId,
                targetRevisionId: article.id,
                actor: toActor(REQUESTER)
            })
        );
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await view(reviewer, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});

/**
 * A stored API key (created by the admin) and a request context authenticated by its token through
 * api-core's real `AuthenticationContext` → `ApiKeyAuthenticator`; its permissions come from
 * `ApiKeyAuthorizer` (R79).
 */
const createApiKeyContext = async (permissions: SecurityPermission[]) => {
    const admin = await createUserContext();
    const key = expectOk(
        await admin.container.resolve(CreateApiKeyUseCase).execute({
            name: "CI key",
            slug: "ci-key",
            description: "Workflows API-key test",
            permissions
        })
    );
    const context = await createUserContext({ identity: null, permissions: [] });
    const identity = await context.container
        .resolve(AuthenticationContext)
        .authenticate(key.token);
    context.container.resolve(IdentityContext).setIdentity(identity);
    return { context, keyId: key.id };
};

describe("API keys in page reviews (D133 point 5, R79)", () => {
    it("lets an API key request, read and cancel its own review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        const { context: key, keyId } = await createApiKeyContext(WB_WRITER);

        const review = expectOk(await request(key, page));
        const read = expectOk(await view(key, review.id));
        const cancelled = expectOk(await cancel(key, review.id));

        expect(review.createdBy).toEqual({
            type: "user",
            id: keyId,
            displayName: "CI key",
            identityType: "api-key"
        });
        expect(read.flags).toMatchObject({ canStart: false, canCancel: true });
        expect(cancelled.state).toBe("cancelled");
    });

    it("does not let an API key start a pool step: a key belongs to no team", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        // Requested by REQUESTER, so the key is not the requester (that check comes first).
        const review = await requestPageReview(admin, await createPage(admin, { title: "Page A" }));
        const { context: key } = await createApiKeyContext(WB_READER);

        const started = await start(key, review.id);

        expect(started.error.code).toBe("Workflows/Review/NotCandidate");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/registration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CmsEntryReviewNamespace } from "@webiny/api-headless-cms-workflows/features/target/CmsEntryReviewNamespace/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/StoreWebsiteBuilderPageWorkflow/index.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/DeleteWebsiteBuilderPageWorkflow/index.js";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageWorkflows/index.js";
import { GetWebsiteBuilderPageWorkflowUseCase } from "~/features/wrappers/GetWebsiteBuilderPageWorkflow/index.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/StartWebsiteBuilderPageReviewStep/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.js";
import { CancelWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReview/index.js";

describe("WebsiteBuilderWorkflowsFeature registration", () => {
    it("registers one page adapter port of each kind beside the CMS ones, and every wrapper once", async () => {
        const { container } = await createUserContext();

        // One per namespace: `cms.*` from the CMS package, `wb.page` from this one.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(2);
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(2);
        expect(container.resolveAll(ReviewTargetLoader).filter(item => item.canLoad("wb.page"))).toHaveLength(1);
        for (const abstraction of [
            StoreWebsiteBuilderPageWorkflowUseCase,
            DeleteWebsiteBuilderPageWorkflowUseCase,
            ListWebsiteBuilderPageWorkflowsUseCase,
            GetWebsiteBuilderPageWorkflowUseCase,
            RequestWebsiteBuilderPageReviewUseCase,
            GetWebsiteBuilderPageReviewUseCase,
            StartWebsiteBuilderPageReviewStepUseCase,
            TakeOverWebsiteBuilderPageReviewStepUseCase,
            ApproveWebsiteBuilderPageReviewStepUseCase,
            RejectWebsiteBuilderPageReviewStepUseCase,
            CancelWebsiteBuilderPageReviewUseCase
        ]) {
            expect(container.resolveAll(abstraction)).toHaveLength(1);
        }
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/reviewWrappers.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/RequestWebsiteBuilderPageReview/index.js`.

- [ ] **Step 3: The review guard**

Create `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewViewer } from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewNotFoundError,
    ReviewPersistenceError
} from "@webiny/api-workflows/domain/review/errors.js";

export interface WbPageReviewGuardServiceParams {
    reviewId: string;
    /** What the caller tries to do, e.g. "start this step"; named in `Workflows/NotAuthorized`. */
    action: string;
}

export interface AuthorizedWbPageReview {
    review: ReviewData;
    viewer: ReviewViewer;
}

export interface IWbPageReviewGuardServiceErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type GuardError = IWbPageReviewGuardServiceErrors[keyof IWbPageReviewGuardServiceErrors];

export interface IWbPageReviewGuardService {
    authorize(params: WbPageReviewGuardServiceParams): Promise<Result<AuthorizedWbPageReview, GuardError>>;
}

/**
 * The checks every page review action shares (spec 5.1, D133 point 7): a signed-in viewer, a
 * `wb.page` review (another app's review is not found, R46) and read access to the page (R47).
 */
export const WbPageReviewGuardService = createAbstraction<IWbPageReviewGuardService>("WbPageReviewGuardService");

export namespace WbPageReviewGuardService {
    export type Interface = IWbPageReviewGuardService;
    export type Params = WbPageReviewGuardServiceParams;
    export type Authorized = AuthorizedWbPageReview;
    export type Error = GuardError;
    export type Return = Promise<Result<AuthorizedWbPageReview, GuardError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/WbPageReviewGuardService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageReviewGuardService as Abstraction } from "./abstractions.js";

class WbPageReviewGuardServiceImpl implements Abstraction.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getReview: GetReviewUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface
    ) {}

    public async authorize(params: Abstraction.Params): Abstraction.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        const review = await this.getReview.execute({ id: params.reviewId });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (review.value.model !== WB_PAGE_NAMESPACE) {
            return Result.fail(new ReviewNotFoundError({ id: params.reviewId }));
        }

        const target = await this.targets.read({
            model: review.value.model,
            targetRevisionId: review.value.targetRevisionId
        });
        if (!target || !(await this.access.canRead(target))) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: params.action }));
        }

        return Result.ok({ review: review.value, viewer: viewer.value });
    }
}

export const WbPageReviewGuardService = Abstraction.createImplementation({
    implementation: WbPageReviewGuardServiceImpl,
    dependencies: [CurrentReviewViewer, GetReviewUseCase, WbPageTargetReader, WbPageAccess]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/WbPageReviewGuardService/index.ts`:

```ts
export { WbPageReviewGuardService } from "./abstractions.js";
```

- [ ] **Step 4: RequestWebsiteBuilderPageReview**

Create `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import type { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";

export interface RequestWebsiteBuilderPageReviewInput {
    /** The page id. */
    targetId: string;
    /** The page revision id. */
    targetRevisionId: string;
    /** Reviewer picks per step (D22); malformed picks are rejected by the engine (R61). */
    picks?: ReviewPick[];
}

export interface IRequestWebsiteBuilderPageReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    request: RequestReviewUseCase.Error;
}

type UseCaseError =
    IRequestWebsiteBuilderPageReviewUseCaseErrors[keyof IRequestWebsiteBuilderPageReviewUseCaseErrors];

export interface IRequestWebsiteBuilderPageReviewUseCase {
    execute(input: RequestWebsiteBuilderPageReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Request a review of a page revision; needs write access to it (spec 5.1, D77). */
export const RequestWebsiteBuilderPageReviewUseCase =
    createAbstraction<IRequestWebsiteBuilderPageReviewUseCase>(
        "RequestWebsiteBuilderPageReviewUseCase"
    );

export namespace RequestWebsiteBuilderPageReviewUseCase {
    export type Interface = IRequestWebsiteBuilderPageReviewUseCase;
    export type Input = RequestWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/RequestWebsiteBuilderPageReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { RequestWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

class RequestWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private requestReview: RequestReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        // As WB's own UpdatePage: the entity-level permission before loading anything (R75).
        if (!(await this.access.canWriteAnyPage())) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "request a review" }));
        }

        const target = await this.targets.read({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: input.targetRevisionId
        });
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }
        if (!(await this.access.canWrite(target))) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "request a review" }));
        }

        return this.requestReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            picks: input.picks,
            actor: actor.value
        });
    }
}

export const RequestWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: RequestWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [CurrentReviewViewer, WbPageTargetReader, WbPageAccess, RequestReviewUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RequestWebsiteBuilderPageReviewUseCase } from "./RequestWebsiteBuilderPageReviewUseCase.js";

export const RequestWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RequestWebsiteBuilderPageReview",
    register(container) {
        container.register(RequestWebsiteBuilderPageReviewUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/index.ts`:

```ts
export { RequestWebsiteBuilderPageReviewUseCase } from "./abstractions.js";
export type { RequestWebsiteBuilderPageReviewInput } from "./abstractions.js";
```

- [ ] **Step 5: GetWebsiteBuilderPageReview**

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface GetWebsiteBuilderPageReviewInput {
    id: string;
}

export interface IGetWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewUseCaseErrors[keyof IGetWebsiteBuilderPageReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewInput
    ): Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}

/** A page review with the reading user's flags (spec 5.3, R62); needs read access to the page. */
export const GetWebsiteBuilderPageReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewUseCase>("GetWebsiteBuilderPageReviewUseCase");

export namespace GetWebsiteBuilderPageReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewUseCase;
    export type Input = GetWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/GetWebsiteBuilderPageReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { applyTargetAccess } from "@webiny/api-workflows/domain/review/applyTargetAccess.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { GetWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(private guard: WbPageReviewGuardService.Interface) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.id,
            action: "view this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { review, viewer } = authorized.value;
        // The guard established read access; `applyTargetAccess` keeps the flag rule in one place.
        const flags = applyTargetAccess(getReviewViewerFlags(review, viewer), { canRead: true });
        return Result.ok({ review, flags });
    }
}

export const GetWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [WbPageReviewGuardService]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageReviewUseCase } from "./GetWebsiteBuilderPageReviewUseCase.js";

export const GetWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageReview",
    register(container) {
        container.register(GetWebsiteBuilderPageReviewUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/index.ts`:

```ts
export { GetWebsiteBuilderPageReviewUseCase } from "./abstractions.js";
export type { GetWebsiteBuilderPageReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Start and take over**

Create `packages/api-website-builder-workflows/src/features/wrappers/StartWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface StartWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IStartWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    start: StartReviewStepUseCase.Error;
}

type UseCaseError =
    IStartWebsiteBuilderPageReviewStepUseCaseErrors[keyof IStartWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IStartWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: StartWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take an awaiting page review step from the pool (spec 5.1). */
export const StartWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IStartWebsiteBuilderPageReviewStepUseCase>(
        "StartWebsiteBuilderPageReviewStepUseCase"
    );

export namespace StartWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IStartWebsiteBuilderPageReviewStepUseCase;
    export type Input = StartWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StartWebsiteBuilderPageReviewStep/StartWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { StartWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class StartWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private startStep: StartReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "start this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.startStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds
        });
    }
}

export const StartWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: StartWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, StartReviewStepUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StartWebsiteBuilderPageReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StartWebsiteBuilderPageReviewStepUseCase } from "./StartWebsiteBuilderPageReviewStepUseCase.js";

export const StartWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/StartWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(StartWebsiteBuilderPageReviewStepUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/StartWebsiteBuilderPageReviewStep/index.ts`:

```ts
export { StartWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { StartWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

Create `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface TakeOverWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    takeOver: TakeOverReviewStepUseCase.Error;
}

type UseCaseError =
    ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors[keyof ITakeOverWebsiteBuilderPageReviewStepUseCaseErrors];

export interface ITakeOverWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: TakeOverWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Take over a human page review step held by someone else (spec 5.1, D9, D32). */
export const TakeOverWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<ITakeOverWebsiteBuilderPageReviewStepUseCase>(
        "TakeOverWebsiteBuilderPageReviewStepUseCase"
    );

export namespace TakeOverWebsiteBuilderPageReviewStepUseCase {
    export type Interface = ITakeOverWebsiteBuilderPageReviewStepUseCase;
    export type Input = TakeOverWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/TakeOverWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { TakeOverWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private takeOverStep: TakeOverReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "take over this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.takeOverStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds
        });
    }
}

export const TakeOverWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, TakeOverReviewStepUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "./TakeOverWebsiteBuilderPageReviewStepUseCase.js";

export const TakeOverWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/TakeOverWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(TakeOverWebsiteBuilderPageReviewStepUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/TakeOverWebsiteBuilderPageReviewStep/index.ts`:

```ts
export { TakeOverWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { TakeOverWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 7: Approve and reject**

Create `packages/api-website-builder-workflows/src/features/wrappers/ApproveWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ApproveWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IApproveWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    approve: ApproveReviewStepUseCase.Error;
}

type UseCaseError =
    IApproveWebsiteBuilderPageReviewStepUseCaseErrors[keyof IApproveWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IApproveWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: ApproveWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Approve the page review step the user owns (spec 5.1). */
export const ApproveWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IApproveWebsiteBuilderPageReviewStepUseCase>(
        "ApproveWebsiteBuilderPageReviewStepUseCase"
    );

export namespace ApproveWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IApproveWebsiteBuilderPageReviewStepUseCase;
    export type Input = ApproveWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ApproveWebsiteBuilderPageReviewStep/ApproveWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "approve this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.approveStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds,
            comment: input.comment ?? null
        });
    }
}

export const ApproveWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ApproveReviewStepUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ApproveWebsiteBuilderPageReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "./ApproveWebsiteBuilderPageReviewStepUseCase.js";

export const ApproveWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ApproveWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(ApproveWebsiteBuilderPageReviewStepUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ApproveWebsiteBuilderPageReviewStep/index.ts`:

```ts
export { ApproveWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { ApproveWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RejectWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface RejectWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IRejectWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    reject: RejectReviewStepUseCase.Error;
}

type UseCaseError =
    IRejectWebsiteBuilderPageReviewStepUseCaseErrors[keyof IRejectWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IRejectWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: RejectWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/** Reject the page review step the user owns (spec 5.1, D10). */
export const RejectWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IRejectWebsiteBuilderPageReviewStepUseCase>(
        "RejectWebsiteBuilderPageReviewStepUseCase"
    );

export namespace RejectWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IRejectWebsiteBuilderPageReviewStepUseCase;
    export type Input = RejectWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RejectWebsiteBuilderPageReviewStep/RejectWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "reject this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.rejectStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds,
            comment: input.comment ?? null
        });
    }
}

export const RejectWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, RejectReviewStepUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RejectWebsiteBuilderPageReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "./RejectWebsiteBuilderPageReviewStepUseCase.js";

export const RejectWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RejectWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(RejectWebsiteBuilderPageReviewStepUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/RejectWebsiteBuilderPageReviewStep/index.ts`:

```ts
export { RejectWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { RejectWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 8: Cancel**

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface CancelWebsiteBuilderPageReviewInput {
    reviewId: string;
}

export interface ICancelWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError =
    ICancelWebsiteBuilderPageReviewUseCaseErrors[keyof ICancelWebsiteBuilderPageReviewUseCaseErrors];

export interface ICancelWebsiteBuilderPageReviewUseCase {
    execute(input: CancelWebsiteBuilderPageReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Cancel a page review (spec 5.1, D25, D133 point 7): read access to the page and the requester or
 * `workflows.reassign` (`canCancelByPermission`, 1b R41).
 */
export const CancelWebsiteBuilderPageReviewUseCase =
    createAbstraction<ICancelWebsiteBuilderPageReviewUseCase>(
        "CancelWebsiteBuilderPageReviewUseCase"
    );

export namespace CancelWebsiteBuilderPageReviewUseCase {
    export type Interface = ICancelWebsiteBuilderPageReviewUseCase;
    export type Input = CancelWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReview/CancelWebsiteBuilderPageReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { canCancelByPermission } from "@webiny/api-workflows/domain/review/canCancelByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { CancelWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

class CancelWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private cancelReview: CancelReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "cancel this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { review, viewer } = authorized.value;
        // Permission only: the review's state is the engine's to report (1b R41).
        if (!canCancelByPermission(review, viewer)) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({
                    action: "cancel a review requested by someone else"
                })
            );
        }

        return this.cancelReview.execute({ reviewId: input.reviewId, actor: viewer.actor });
    }
}

export const CancelWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: CancelWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [WbPageReviewGuardService, CancelReviewUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelWebsiteBuilderPageReviewUseCase } from "./CancelWebsiteBuilderPageReviewUseCase.js";

export const CancelWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/CancelWebsiteBuilderPageReview",
    register(container) {
        container.register(CancelWebsiteBuilderPageReviewUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReview/index.ts`:

```ts
export { CancelWebsiteBuilderPageReviewUseCase } from "./abstractions.js";
export type { CancelWebsiteBuilderPageReviewInput } from "./abstractions.js";
```

- [ ] **Step 9: Register**

Replace `packages/api-website-builder-workflows/src/features/wrappers/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { WbPageReviewGuardService } from "./WbPageReviewGuardService/WbPageReviewGuardService.js";
import { StoreWebsiteBuilderPageWorkflowFeature } from "./StoreWebsiteBuilderPageWorkflow/feature.js";
import { DeleteWebsiteBuilderPageWorkflowFeature } from "./DeleteWebsiteBuilderPageWorkflow/feature.js";
import { ListWebsiteBuilderPageWorkflowsFeature } from "./ListWebsiteBuilderPageWorkflows/feature.js";
import { GetWebsiteBuilderPageWorkflowFeature } from "./GetWebsiteBuilderPageWorkflow/feature.js";
import { RequestWebsiteBuilderPageReviewFeature } from "./RequestWebsiteBuilderPageReview/feature.js";
import { GetWebsiteBuilderPageReviewFeature } from "./GetWebsiteBuilderPageReview/feature.js";
import { StartWebsiteBuilderPageReviewStepFeature } from "./StartWebsiteBuilderPageReviewStep/feature.js";
import { TakeOverWebsiteBuilderPageReviewStepFeature } from "./TakeOverWebsiteBuilderPageReviewStep/feature.js";
import { ApproveWebsiteBuilderPageReviewStepFeature } from "./ApproveWebsiteBuilderPageReviewStep/feature.js";
import { RejectWebsiteBuilderPageReviewStepFeature } from "./RejectWebsiteBuilderPageReviewStep/feature.js";
import { CancelWebsiteBuilderPageReviewFeature } from "./CancelWebsiteBuilderPageReview/feature.js";

/**
 * The Website Builder wrapper use cases (D132, D133, R45): identity, `workflows` permission and page
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const WbWrappersFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Wrappers",
    register(container) {
        container.register(WbPageReviewGuardService);

        // Workflows
        StoreWebsiteBuilderPageWorkflowFeature.register(container);
        DeleteWebsiteBuilderPageWorkflowFeature.register(container);
        ListWebsiteBuilderPageWorkflowsFeature.register(container);
        GetWebsiteBuilderPageWorkflowFeature.register(container);

        // Reviews
        RequestWebsiteBuilderPageReviewFeature.register(container);
        GetWebsiteBuilderPageReviewFeature.register(container);
        StartWebsiteBuilderPageReviewStepFeature.register(container);
        TakeOverWebsiteBuilderPageReviewStepFeature.register(container);
        ApproveWebsiteBuilderPageReviewStepFeature.register(container);
        RejectWebsiteBuilderPageReviewStepFeature.register(container);
        CancelWebsiteBuilderPageReviewFeature.register(container);
    }
});
```

- [ ] **Step 10: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 11: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): add the page review guard and review wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
