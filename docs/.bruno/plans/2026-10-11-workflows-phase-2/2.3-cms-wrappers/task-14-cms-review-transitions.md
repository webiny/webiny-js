### Task 14: CMS start, take over, approve, reject and cancel wrappers

Spec 5.1 (wrapper column), D25, D54, D133 points 5 and 7, 1b R41, R45, R79. Five wrappers on top of `CmsEntryReviewGuardService` (Task 13): the guard establishes the viewer, the `cms.*` review and read access; the wrapper passes the viewer's actor and team ids to the engine. Cancel additionally needs `canCancelByPermission` (requester or `reassign`); state errors stay the engine's (a finished review fails with `Workflows/Review/InvalidState`, not "not authorized", for the requester and for a `reassign` holder alike). Ends with the API-key end-to-end tests carried from 1b: a real stored API key, authenticated by its token through api-core's `ApiKeyAuthenticator` and authorized by `ApiKeyAuthorizer` (R79, A27).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/StartCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/TakeOverCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/ApproveCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/RejectCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/CancelCmsEntryReviewUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts`

**Interfaces:**
- Consumes: `CmsEntryReviewGuardService` (Task 13), `StartReviewStepUseCase`, `TakeOverReviewStepUseCase`, `ApproveReviewStepUseCase`, `RejectReviewStepUseCase`, `CancelReviewUseCase` (1a), `canCancelByPermission` (1b), `ReviewTargetReadAccess` (Task 6, registration test), `CreateApiKeyUseCase` (`@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js`), `AuthenticationContext` (`@webiny/api-core/features/security/authentication/AuthenticationContext/index.js`), `IdentityContext` (tests).
- Produces:
  - `StartCmsEntryReviewStepUseCase`, `TakeOverCmsEntryReviewStepUseCase`: `execute(input: { reviewId: string; stepId: string }): Promise<Result<ReviewData, Error>>` (`StartCmsEntryReviewStepInput`, `TakeOverCmsEntryReviewStepInput`).
  - `ApproveCmsEntryReviewStepUseCase`, `RejectCmsEntryReviewStepUseCase`: `execute(input: { reviewId: string; stepId: string; comment?: string | null })` (`ApproveCmsEntryReviewStepInput`, `RejectCmsEntryReviewStepInput`).
  - `CancelCmsEntryReviewUseCase`: `execute(input: CancelCmsEntryReviewInput)`, `CancelCmsEntryReviewInput { reviewId: string }`.
  - Action texts: `"start this step"`, `"take over this step"`, `"approve this step"`, `"reject this step"`, `"cancel this review"` (read refused), `"cancel a review requested by someone else"` (permission refused).

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { Result } from "@webiny/feature/api";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticationContext } from "@webiny/api-core/features/security/authentication/AuthenticationContext/index.js";
import { CreateApiKeyUseCase } from "@webiny/api-core/features/security/apiKeys/CreateApiKey/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    readEntry,
    requestEntryReview,
    STEP_ID
} from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import {
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    toActor
} from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeWbPageTargetLoader } from "~tests/__helpers/FakeWbPageTargetLoader.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";

/** Admin stores the workflow; REQUESTER's reviews on an entry in the root and in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    return {
        admin,
        entry,
        review: await requestEntryReview(admin, entry),
        lockedReview: await requestEntryReview(admin, lockedEntry)
    };
};

const asUser = (identity: IdentityData, permissions: SecurityPermission[]) => {
    return createUserContext({ identity, permissions });
};

const start = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(StartCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const takeOver = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(TakeOverCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const approve = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ApproveCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Looks good." });
};

const reject = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(RejectCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, comment: "Needs another pass." });
};

const cancel = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(CancelCmsEntryReviewUseCase).execute({ reviewId });
};

const view = (context: CmsContext, reviewId: string) => {
    return context.container.resolve(GetCmsEntryReviewUseCase).execute({ id: reviewId });
};

interface RefusalCase {
    name: string;
    identity: IdentityData;
    permissions: SecurityPermission[];
    action: string;
    run: (context: CmsContext, reviewId: string) => Promise<Result<any, any>>;
}

const REFUSALS: RefusalCase[] = [
    { name: "start", identity: REVIEWER, permissions: CMS_READER, action: "start this step", run: start },
    {
        name: "take over",
        identity: REVIEWER,
        permissions: CMS_READER,
        action: "take over this step",
        run: takeOver
    },
    {
        name: "approve",
        identity: REVIEWER,
        permissions: CMS_READER,
        action: "approve this step",
        run: approve
    },
    {
        name: "reject",
        identity: REVIEWER,
        permissions: CMS_READER,
        action: "reject this step",
        run: reject
    },
    {
        name: "cancel",
        identity: REQUESTER,
        permissions: CMS_WRITER,
        action: "cancel this review",
        run: cancel
    },
    {
        name: "get review",
        identity: REVIEWER,
        permissions: CMS_READER,
        action: "view this review",
        run: view
    }
];

describe("CMS review transition wrappers", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("lets reviewers start, take over and approve a step", async () => {
        const { admin, entry, review } = await createScenario();
        const reviewer = await asUser(REVIEWER, CMS_READER);
        const other = await asUser(OTHER_REVIEWER, CMS_READER);

        const started = expectOk(await start(reviewer, review.id));
        const takenOver = expectOk(await takeOver(other, review.id));
        const approved = expectOk(await approve(other, review.id));

        expect(started.steps[0].owner).toEqual(toActor(REVIEWER));
        expect(takenOver.steps[0].owner).toEqual(toActor(OTHER_REVIEWER));
        expect(approved.state).toBe("approved");
        expect((await readEntry(admin, entry.id)).system?.workflow?.reviewState).toBe("approved");
    });

    it("lets the owner reject a step", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, CMS_READER);
        expectOk(await start(reviewer, review.id));

        const rejected = expectOk(await reject(reviewer, review.id));

        expect(rejected.state).toBe("rejected");
        expect(rejected.steps[0].comment).toBe("Needs another pass.");
    });

    it.each(REFUSALS)("refuses $name without read access to the target", async refusal => {
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
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await cancel(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel a review requested by someone else" });
    });

    it("lets the requester cancel their own review", async () => {
        const { review } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const cancelled = expectOk(await cancel(requester, review.id));

        expect(cancelled.state).toBe("cancelled");
    });

    it("lets a reassigner with read access cancel, but not without it", async () => {
        const { review, lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...CMS_READER]);

        const cancelled = expectOk(await cancel(reassigner, review.id));
        const denied = await cancel(reassigner, lockedReview.id);

        expect(cancelled.state).toBe("cancelled");
        expect(denied.error.code).toBe("Workflows/NotAuthorized");
        expect(denied.error.data).toEqual({ action: "cancel this review" });
    });

    it("reports a state error, not a permission error, for a finished review (1b R41)", async () => {
        const { admin, review } = await createScenario();
        await approveEntryReview(admin, review);
        const requester = await asUser(REQUESTER, CMS_WRITER);
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...CMS_READER]);

        const byRequester = await cancel(requester, review.id);
        const byReassigner = await cancel(reassigner, review.id);

        expect(byRequester.error.code).toBe("Workflows/Review/InvalidState");
        expect(byReassigner.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("takes the actor's teams from the identity", async () => {
        const { review } = await createScenario();
        const reader = await asUser(READER, CMS_READER);

        const result = await start(reader, review.id);

        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
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
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await start(reviewer, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});

/**
 * A stored API key (created by the admin) and a request context authenticated by its token through
 * api-core's real `AuthenticationContext` → `ApiKeyAuthenticator`; its permissions come from
 * `ApiKeyAuthorizer` (R79). The context starts anonymous, so the test harness serves no
 * permissions of its own.
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

describe("API keys in CMS reviews (D133 point 5, R79)", () => {
    it("lets an API key request, read and cancel its own review", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const { context: key, keyId } = await createApiKeyContext(CMS_WRITER);

        const review = expectOk(
            await key.container.resolve(RequestCmsEntryReviewUseCase).execute({
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            })
        );
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
        expectOk(await storeWorkflow(admin));
        // Requested by REQUESTER, so the key is not the requester (that check comes first).
        const review = await requestEntryReview(admin, await createAuthorEntry(admin, { name: "Ann" }));
        const { context: key } = await createApiKeyContext(CMS_READER);

        const started = await start(key, review.id);

        expect(started.error.code).toBe("Workflows/Review/NotCandidate");
    });

    it("lets an API key with reassign cancel another user's review", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const review = await requestEntryReview(admin, await createAuthorEntry(admin, { name: "Ann" }));
        const { context: key } = await createApiKeyContext([WORKFLOWS_REASSIGN, ...CMS_READER]);

        const cancelled = expectOk(await cancel(key, review.id));

        expect(cancelled.state).toBe("cancelled");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/StartCmsEntryReviewStep/index.js`.

- [ ] **Step 3: StartCmsEntryReviewStep**

Create `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface StartCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IStartCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    start: StartReviewStepUseCase.Error;
}

type UseCaseError =
    IStartCmsEntryReviewStepUseCaseErrors[keyof IStartCmsEntryReviewStepUseCaseErrors];

export interface IStartCmsEntryReviewStepUseCase {
    execute(input: StartCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Take an awaiting CMS review step from the pool (spec 5.1): read access to the target here, team
 * membership and "not the requester" in the engine.
 */
export const StartCmsEntryReviewStepUseCase = createAbstraction<IStartCmsEntryReviewStepUseCase>(
    "StartCmsEntryReviewStepUseCase"
);

export namespace StartCmsEntryReviewStepUseCase {
    export type Interface = IStartCmsEntryReviewStepUseCase;
    export type Input = StartCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/StartCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { StartCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class StartCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const StartCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: StartCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, StartReviewStepUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StartCmsEntryReviewStepUseCase } from "./StartCmsEntryReviewStepUseCase.js";

export const StartCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/StartCmsEntryReviewStep",
    register(container) {
        container.register(StartCmsEntryReviewStepUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/StartCmsEntryReviewStep/index.ts`:

```ts
export { StartCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { StartCmsEntryReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 4: TakeOverCmsEntryReviewStep**

Create `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface TakeOverCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface ITakeOverCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    takeOver: TakeOverReviewStepUseCase.Error;
}

type UseCaseError =
    ITakeOverCmsEntryReviewStepUseCaseErrors[keyof ITakeOverCmsEntryReviewStepUseCaseErrors];

export interface ITakeOverCmsEntryReviewStepUseCase {
    execute(input: TakeOverCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Take over a human CMS review step held by someone else (spec 5.1, D9, D32): read access to the
 * target here, the step rules in the engine.
 */
export const TakeOverCmsEntryReviewStepUseCase =
    createAbstraction<ITakeOverCmsEntryReviewStepUseCase>("TakeOverCmsEntryReviewStepUseCase");

export namespace TakeOverCmsEntryReviewStepUseCase {
    export type Interface = ITakeOverCmsEntryReviewStepUseCase;
    export type Input = TakeOverCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/TakeOverCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { TakeOverCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const TakeOverCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, TakeOverReviewStepUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { TakeOverCmsEntryReviewStepUseCase } from "./TakeOverCmsEntryReviewStepUseCase.js";

export const TakeOverCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/TakeOverCmsEntryReviewStep",
    register(container) {
        container.register(TakeOverCmsEntryReviewStepUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/TakeOverCmsEntryReviewStep/index.ts`:

```ts
export { TakeOverCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { TakeOverCmsEntryReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 5: ApproveCmsEntryReviewStep and RejectCmsEntryReviewStep**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ApproveCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IApproveCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    approve: ApproveReviewStepUseCase.Error;
}

type UseCaseError =
    IApproveCmsEntryReviewStepUseCaseErrors[keyof IApproveCmsEntryReviewStepUseCaseErrors];

export interface IApproveCmsEntryReviewStepUseCase {
    execute(input: ApproveCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Approve the CMS review step the user owns (spec 5.1): read access here, ownership in the engine. */
export const ApproveCmsEntryReviewStepUseCase =
    createAbstraction<IApproveCmsEntryReviewStepUseCase>("ApproveCmsEntryReviewStepUseCase");

export namespace ApproveCmsEntryReviewStepUseCase {
    export type Interface = IApproveCmsEntryReviewStepUseCase;
    export type Input = ApproveCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/ApproveCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { ApproveCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const ApproveCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ApproveReviewStepUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ApproveCmsEntryReviewStepUseCase } from "./ApproveCmsEntryReviewStepUseCase.js";

export const ApproveCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/ApproveCmsEntryReviewStep",
    register(container) {
        container.register(ApproveCmsEntryReviewStepUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ApproveCmsEntryReviewStep/index.ts`:

```ts
export { ApproveCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { ApproveCmsEntryReviewStepInput } from "./abstractions.js";
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface RejectCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IRejectCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    reject: RejectReviewStepUseCase.Error;
}

type UseCaseError =
    IRejectCmsEntryReviewStepUseCaseErrors[keyof IRejectCmsEntryReviewStepUseCaseErrors];

export interface IRejectCmsEntryReviewStepUseCase {
    execute(input: RejectCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Reject the CMS review step the user owns (spec 5.1, D10): read access here, ownership in the engine. */
export const RejectCmsEntryReviewStepUseCase = createAbstraction<IRejectCmsEntryReviewStepUseCase>(
    "RejectCmsEntryReviewStepUseCase"
);

export namespace RejectCmsEntryReviewStepUseCase {
    export type Interface = IRejectCmsEntryReviewStepUseCase;
    export type Input = RejectCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/RejectCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { RejectCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const RejectCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, RejectReviewStepUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RejectCmsEntryReviewStepUseCase } from "./RejectCmsEntryReviewStepUseCase.js";

export const RejectCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/RejectCmsEntryReviewStep",
    register(container) {
        container.register(RejectCmsEntryReviewStepUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/RejectCmsEntryReviewStep/index.ts`:

```ts
export { RejectCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { RejectCmsEntryReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 6: CancelCmsEntryReview**

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface CancelCmsEntryReviewInput {
    reviewId: string;
}

export interface ICancelCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError = ICancelCmsEntryReviewUseCaseErrors[keyof ICancelCmsEntryReviewUseCaseErrors];

export interface ICancelCmsEntryReviewUseCase {
    execute(input: CancelCmsEntryReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Cancel a CMS review (spec 5.1, D25, D133 point 7): read access to the target and the requester
 * or `workflows.reassign` (`canCancelByPermission`, 1b R41). Finished reviews fail in the engine
 * with `Workflows/Review/InvalidState`.
 */
export const CancelCmsEntryReviewUseCase = createAbstraction<ICancelCmsEntryReviewUseCase>(
    "CancelCmsEntryReviewUseCase"
);

export namespace CancelCmsEntryReviewUseCase {
    export type Interface = ICancelCmsEntryReviewUseCase;
    export type Input = CancelCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/CancelCmsEntryReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { canCancelByPermission } from "@webiny/api-workflows/domain/review/canCancelByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { CancelCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class CancelCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const CancelCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: CancelCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, CancelReviewUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelCmsEntryReviewUseCase } from "./CancelCmsEntryReviewUseCase.js";

export const CancelCmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/CancelCmsEntryReview",
    register(container) {
        container.register(CancelCmsEntryReviewUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReview/index.ts`:

```ts
export { CancelCmsEntryReviewUseCase } from "./abstractions.js";
export type { CancelCmsEntryReviewInput } from "./abstractions.js";
```

- [ ] **Step 7: Register**

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts` import the five features and add after `GetCmsEntryReviewFeature.register(container);`:

```ts
        StartCmsEntryReviewStepFeature.register(container);
        TakeOverCmsEntryReviewStepFeature.register(container);
        ApproveCmsEntryReviewStepFeature.register(container);
        RejectCmsEntryReviewStepFeature.register(container);
        CancelCmsEntryReviewFeature.register(container);
```

with the imports:

```ts
import { StartCmsEntryReviewStepFeature } from "./StartCmsEntryReviewStep/feature.js";
import { TakeOverCmsEntryReviewStepFeature } from "./TakeOverCmsEntryReviewStep/feature.js";
import { ApproveCmsEntryReviewStepFeature } from "./ApproveCmsEntryReviewStep/feature.js";
import { RejectCmsEntryReviewStepFeature } from "./RejectCmsEntryReviewStep/feature.js";
import { CancelCmsEntryReviewFeature } from "./CancelCmsEntryReview/feature.js";
```

- [ ] **Step 8: Pin the wrapper registrations**

Replace `packages/api-headless-cms-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { createContextHandler } from "./__handler/context.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
    });

    it("registers one cms adapter port of each kind and every wrapper once", async () => {
        const { context } = createContextHandler();
        const { container } = await context();

        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(1);
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(1);
        for (const abstraction of [
            StoreCmsEntryWorkflowUseCase,
            DeleteCmsEntryWorkflowUseCase,
            ListCmsEntryWorkflowsUseCase,
            GetCmsEntryWorkflowUseCase,
            RequestCmsEntryReviewUseCase,
            GetCmsEntryReviewUseCase,
            StartCmsEntryReviewStepUseCase,
            TakeOverCmsEntryReviewStepUseCase,
            ApproveCmsEntryReviewStepUseCase,
            RejectCmsEntryReviewStepUseCase,
            CancelCmsEntryReviewUseCase
        ]) {
            expect(container.resolveAll(abstraction)).toHaveLength(1);
        }
    });
});
```

- [ ] **Step 9: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 10: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): add the cms start, take over, approve, reject and cancel wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
