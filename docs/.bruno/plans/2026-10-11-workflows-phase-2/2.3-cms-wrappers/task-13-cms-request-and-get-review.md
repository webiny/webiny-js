### Task 13: CMS review guard, request and get review wrappers

Spec 5.1, 5.3, D77, D133 point 7, R46, R47, R61, R62. One shared guard for every review action of the CMS app, and the first two review wrappers:

- `CmsEntryReviewGuardService.authorize({ reviewId, action })`: viewer (actor, teams, permissions) → review → `cms.*` only (another app's review is not found) → read access to the target, else `Workflows/NotAuthorized` with the action.
- `RequestCmsEntryReviewUseCase`: write access to the target (D77); picks are the engine's (R61).
- `GetCmsEntryReviewUseCase`: the review and the viewer's flags (`getReviewViewerFlags` + `applyTargetAccess`, R62).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/CmsEntryReviewGuardService.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/RequestCmsEntryReviewUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/GetCmsEntryReviewUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeWbPageTargetLoader.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts`

**Interfaces:**
- Consumes: `CurrentReviewViewer` (`get()`, `getActor()`), `GetReviewUseCase`, `RequestReviewUseCase`, `getReviewViewerFlags`, `applyTargetAccess` (1b), `CmsEntryTargetReader`, `CmsEntryAccess` (Task 7), `isCmsNamespace` (Task 7), `ReviewWithViewerFlags` (Task 6).
- Produces:
  - `CmsEntryReviewGuardService.Interface { authorize(params: CmsEntryReviewGuardServiceParams): Promise<Result<AuthorizedCmsEntryReview, CmsEntryReviewGuardService.Error>> }`, `CmsEntryReviewGuardServiceParams { reviewId: string; action: string }`, `AuthorizedCmsEntryReview { review: ReviewData; viewer: ReviewViewer }`; errors `Workflows/NotAuthenticated`, `Workflows/NotAuthorized`, `Workflows/Review/NotFound`, `Workflows/Review/Persistence`.
  - `RequestCmsEntryReviewUseCase.Interface.execute(input: RequestCmsEntryReviewInput): Promise<Result<ReviewData, Error>>`, `RequestCmsEntryReviewInput { model: string; targetId: string; targetRevisionId: string; picks?: ReviewPick[] }`.
  - `GetCmsEntryReviewUseCase.Interface.execute(input: GetCmsEntryReviewInput): Promise<Result<ReviewWithViewerFlags, Error>>`, `GetCmsEntryReviewInput { id: string }`.
  - Guard action texts: `"request a review"` (request), `"view this review"` (get).

- [ ] **Step 1: Write the helper and the failing test**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeWbPageTargetLoader.ts`:

```ts
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ADMIN } from "./identities.js";

/** A stand-in `wb.page` loader, so CMS tests can create a Website Builder review (R46). */
class FakeWbPageTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public canLoad(model: string): boolean {
        return model === "wb.page";
    }

    public async load(): Promise<ReviewTargetLoader.Target | null> {
        return {
            title: "Page 1",
            context: {
                folder: null,
                modelId: "wbyWbPage",
                title: "Page 1",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        };
    }
}

export const FakeWbPageTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: FakeWbPageTargetLoaderImpl,
    dependencies: []
});
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { readEntry, requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { NOBODY, READER, REQUESTER, REVIEWER, toActor } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeWbPageTargetLoader } from "~tests/__helpers/FakeWbPageTargetLoader.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";

/** Admin stores the workflow and creates an entry in the root and one in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    return { admin, entry, lockedEntry };
};

const request = (context: CmsContext, entry: CmsEntry) => {
    return context.container.resolve(RequestCmsEntryReviewUseCase).execute({
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id
    });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetCmsEntryReviewUseCase).execute({ id });
};

describe("CMS request and get review wrappers", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("requests a review for a user with write access, as that user", async () => {
        const { admin, entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await request(requester, entry));

        expect(review.createdBy).toEqual(toActor(REQUESTER));
        expect((await readEntry(admin, entry.id)).system?.workflow?.reviewState).toBe(
            "inProgress"
        );
    });

    it("refuses a request without write access (D77)", async () => {
        const { entry } = await createScenario();
        const reader = await createUserContext({ identity: READER, permissions: CMS_READER });

        const result = await request(reader, entry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "request a review" });
    });

    it("refuses a request without folder write access", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await request(requester, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
    });

    it("reports a target the user cannot see or of another app as not found (R46)", async () => {
        const { entry } = await createScenario();
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const hidden = await request(nobody, entry);
        const otherApp = await requester.container.resolve(RequestCmsEntryReviewUseCase).execute({
            model: "wb.page",
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(hidden.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("rejects a pick on a step without manual picks (R61)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await requester.container.resolve(RequestCmsEntryReviewUseCase).execute({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            picks: [{ stepId: STEP_ID, userId: REVIEWER.id }]
        });

        expect(result.error.code).toBe("Workflows/Review/Validation");
    });

    it("returns the review with the viewer's flags (spec 5.3)", async () => {
        const { admin, entry } = await createScenario();
        const review = await requestEntryReview(admin, entry);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const asReviewer = expectOk(await getReview(reviewer, review.id));
        const asRequester = expectOk(await getReview(requester, review.id));

        expect(asReviewer.review.id).toBe(review.id);
        expect(asReviewer.flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(asRequester.flags).toMatchObject({ canStart: false, canCancel: true });
    });

    it("refuses get review without read access to the target", async () => {
        const { admin, lockedEntry } = await createScenario();
        const review = await requestEntryReview(admin, lockedEntry);
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });

        const folderDenied = await getReview(reviewer, review.id);
        const modelDenied = await getReview(nobody, review.id);

        expect(folderDenied.error.code).toBe("Workflows/NotAuthorized");
        expect(folderDenied.error.data).toEqual({ action: "view this review" });
        expect(modelDenied.error.code).toBe("Workflows/NotAuthorized");
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const admin = await createUserContext({
            legacyPlugins: [
                (container: Container) => {
                    container.register(FakeWbPageTargetLoader);
                }
            ]
        });
        expectOk(
            await storeWorkflow(admin, { ...createWorkflowValues(["wb.page"]), id: "wb-workflow" })
        );
        const wbReview = expectOk(
            await admin.container.resolve(RequestReviewUseCase).execute({
                model: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                actor: toActor(REQUESTER)
            })
        );
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = await getReview(reviewer, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/RequestCmsEntryReview/index.js`.

- [ ] **Step 3: The review guard**

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/abstractions.ts`:

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

export interface CmsEntryReviewGuardServiceParams {
    reviewId: string;
    /** What the caller tries to do, e.g. "start this step"; named in `Workflows/NotAuthorized`. */
    action: string;
}

export interface AuthorizedCmsEntryReview {
    review: ReviewData;
    viewer: ReviewViewer;
}

export interface ICmsEntryReviewGuardServiceErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type GuardError = ICmsEntryReviewGuardServiceErrors[keyof ICmsEntryReviewGuardServiceErrors];

export interface ICmsEntryReviewGuardService {
    authorize(
        params: CmsEntryReviewGuardServiceParams
    ): Promise<Result<AuthorizedCmsEntryReview, GuardError>>;
}

/**
 * The checks every CMS review action shares (spec 5.1, D133 point 7): a signed-in viewer, a review
 * of a `cms.*` namespace (another app's review is not found, R46) and read access to its target
 * with the CMS's own logic (R47). Permission rules per action (cancel) stay in the wrapper.
 */
export const CmsEntryReviewGuardService = createAbstraction<ICmsEntryReviewGuardService>("CmsEntryReviewGuardService");

export namespace CmsEntryReviewGuardService {
    export type Interface = ICmsEntryReviewGuardService;
    export type Params = CmsEntryReviewGuardServiceParams;
    export type Authorized = AuthorizedCmsEntryReview;
    export type Error = GuardError;
    export type Return = Promise<Result<AuthorizedCmsEntryReview, GuardError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/CmsEntryReviewGuardService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryReviewGuardService as Abstraction } from "./abstractions.js";

class CmsEntryReviewGuardServiceImpl implements Abstraction.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getReview: GetReviewUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface
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
        if (!isCmsNamespace(review.value.model)) {
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

export const CmsEntryReviewGuardService = Abstraction.createImplementation({
    implementation: CmsEntryReviewGuardServiceImpl,
    dependencies: [CurrentReviewViewer, GetReviewUseCase, CmsEntryTargetReader, CmsEntryAccess]
});
```

The guard is a shared building block of the CMS wrappers, not a wrapper: its folder has no `feature.ts`, and `CmsWrappersFeature` registers it directly (Step 6). Every review action loads the review twice (here and in the engine use case); both are primary-storage reads, accepted.

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryReviewGuardService/index.ts`:

```ts
export { CmsEntryReviewGuardService } from "./abstractions.js";
```

- [ ] **Step 4: RequestCmsEntryReview**

Create `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData, ReviewPick } from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import type { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";

export interface RequestCmsEntryReviewInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    targetId: string;
    targetRevisionId: string;
    /** Reviewer picks per step (D22); malformed picks are rejected by the engine (R61). */
    picks?: ReviewPick[];
}

export interface IRequestCmsEntryReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    request: RequestReviewUseCase.Error;
}

type UseCaseError = IRequestCmsEntryReviewUseCaseErrors[keyof IRequestCmsEntryReviewUseCaseErrors];

export interface IRequestCmsEntryReviewUseCase {
    execute(input: RequestCmsEntryReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Request a review of a CMS entry revision; needs write access to it (spec 5.1, D77). */
export const RequestCmsEntryReviewUseCase = createAbstraction<IRequestCmsEntryReviewUseCase>(
    "RequestCmsEntryReviewUseCase"
);

export namespace RequestCmsEntryReviewUseCase {
    export type Interface = IRequestCmsEntryReviewUseCase;
    export type Input = RequestCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/RequestCmsEntryReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { RequestCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

/**
 * A target the user cannot see (no model access) or of another app is reported as not found, like
 * the CMS hides it (R46); a visible target without write access is not authorized (D77).
 */
class RequestCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private requestReview: RequestReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const target = isCmsNamespace(input.model)
            ? await this.targets.read({
                  model: input.model,
                  targetRevisionId: input.targetRevisionId
              })
            : null;
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }
        if (!(await this.access.canWrite(target))) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "request a review" }));
        }

        return this.requestReview.execute({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            picks: input.picks,
            actor: actor.value
        });
    }
}

export const RequestCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: RequestCmsEntryReviewUseCaseImpl,
    dependencies: [CurrentReviewViewer, CmsEntryTargetReader, CmsEntryAccess, RequestReviewUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RequestCmsEntryReviewUseCase } from "./RequestCmsEntryReviewUseCase.js";

export const RequestCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/RequestCmsEntryReview",
    register(container) {
        container.register(RequestCmsEntryReviewUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/index.ts`:

```ts
export { RequestCmsEntryReviewUseCase } from "./abstractions.js";
export type { RequestCmsEntryReviewInput } from "./abstractions.js";
```

- [ ] **Step 5: GetCmsEntryReview**

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewInput {
    id: string;
}

export interface IGetCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
}

type UseCaseError = IGetCmsEntryReviewUseCaseErrors[keyof IGetCmsEntryReviewUseCaseErrors];

export interface IGetCmsEntryReviewUseCase {
    execute(input: GetCmsEntryReviewInput): Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}

/**
 * A CMS review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Returns the engine's full review in phase 2. Phase 3 adds the redaction here, in the wrapper and
 * not in the resolver: per-user skip entries and `excludedReason` are stripped for viewers without
 * `editor` / `reassign` (spec 8, D89, D127, D128, D133).
 */
export const GetCmsEntryReviewUseCase =
    createAbstraction<IGetCmsEntryReviewUseCase>("GetCmsEntryReviewUseCase");

export namespace GetCmsEntryReviewUseCase {
    export type Interface = IGetCmsEntryReviewUseCase;
    export type Input = GetCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithViewerFlags, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/GetCmsEntryReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { applyTargetAccess } from "@webiny/api-workflows/domain/review/applyTargetAccess.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { GetCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(private guard: CmsEntryReviewGuardService.Interface) {}

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

export const GetCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryReviewUseCase } from "./GetCmsEntryReviewUseCase.js";

export const GetCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryReview",
    register(container) {
        container.register(GetCmsEntryReviewUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/index.ts`:

```ts
export { GetCmsEntryReviewUseCase } from "./abstractions.js";
export type { GetCmsEntryReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Register**

Replace `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsEntryReviewGuardService } from "./CmsEntryReviewGuardService/CmsEntryReviewGuardService.js";
import { StoreCmsEntryWorkflowFeature } from "./StoreCmsEntryWorkflow/feature.js";
import { DeleteCmsEntryWorkflowFeature } from "./DeleteCmsEntryWorkflow/feature.js";
import { ListCmsEntryWorkflowsFeature } from "./ListCmsEntryWorkflows/feature.js";
import { GetCmsEntryWorkflowFeature } from "./GetCmsEntryWorkflow/feature.js";
import { RequestCmsEntryReviewFeature } from "./RequestCmsEntryReview/feature.js";
import { GetCmsEntryReviewFeature } from "./GetCmsEntryReview/feature.js";

/**
 * The Headless CMS wrapper use cases (D132, D133, R45): identity, `workflows` permission and target
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const CmsWrappersFeature = createFeature({
    name: "CmsWorkflows/Wrappers",
    register(container) {
        container.register(CmsEntryReviewGuardService);

        // Workflows
        StoreCmsEntryWorkflowFeature.register(container);
        DeleteCmsEntryWorkflowFeature.register(container);
        ListCmsEntryWorkflowsFeature.register(container);
        GetCmsEntryWorkflowFeature.register(container);

        // Reviews
        RequestCmsEntryReviewFeature.register(container);
        GetCmsEntryReviewFeature.register(container);
    }
});
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): add the cms review guard and request and get review wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
