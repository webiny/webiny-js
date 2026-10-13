### Task 12: WB reassign, candidates, inspector and folder existence wrappers

Spec 5.1, 6, 8, 10; D25, D33, D45, D69, D89, D97, D104, D118, D128, D132, D133; R46, R47, R75, R87, R119, R120, R121, R125, R127, R128, R129; SEC-66. Five wrappers in `packages/api-website-builder-workflows`, mirroring CMS Task 9 (same action strings, same error mapping) and the phase 2/3 WB wrappers (`CancelWebsiteBuilderPageReviewUseCase`, `RequestWebsiteBuilderPageReviewUseCase`, `StoreWebsiteBuilderPageWorkflowUseCase`) with the guard service:

- `ReassignWebsiteBuilderPageReviewStepUseCase` (R119, R125): `WbPageReviewGuardService` (viewer, `wb.page` review, read access to the page, action `"reassign this step"`), then `canReassignByPermission(viewer)` (refusal action `"reassign this step"`), then the engine's `ReassignReviewStepUseCase` with `viewer.actor`. The chosen user's validity (member, not excluded, not the requester, can read; same owner refused) is the engine's (R112, R119).
- `ListWebsiteBuilderPageStepCandidatesUseCase` (request dialog, R120, R125): write access to the page exactly as `RequestWebsiteBuilderPageReviewUseCase` checks it: entity-level page write first, before anything is read (R75), then the revision read (missing, hidden or another page's revision is `Workflows/Review/TargetNotFound`), then `canWrite`; a refusal is `Workflows/NotAuthorized` with action `"list the step's candidates"`; a throw is `Workflows/Review/Persistence` (R87). Then the workflow's app (R128): `GetWorkflowUseCase` reads it, and a workflow of another app or a missing one is `Workflows/Workflow/NotFound` `{ id }` (`isWbWorkflow`), before the engine. Then the engine's `ListStepCandidatesUseCase` with `model: "wb.page"` and `requesterId` = the viewer.
- `ListWebsiteBuilderPageReviewStepCandidatesUseCase` (reassign dialog): the guard (action `"list the step's candidates"`), then `reassign`, then the engine with `{ reviewId, stepId }`.
- Both candidate wrappers null `excludedReason` unless the viewer has `editor` or `reassign` with the pure `redactStepCandidates` (api-workflows `domain/routing`, 4.2 Task 5) (D89, D97, R120); `excluded` stays visible.
- `InspectWebsiteBuilderPageRoutingUseCase` (R121, R125): `editor` (a throwing permission check is `Workflows/Workflow/Persistence`, refusal action `"inspect routing"`), then the engine's `InspectRoutingUseCase` with `model: "wb.page"`, the folder `{ id: folderId, type: "wb:page" }` (`null`, missing or `"root"` → `null`, the 00-shared R121 update) and `now`.
- `WebsiteBuilderPageFolderExistsUseCase` (D69, R125): `editor` (refusal action `"check folders"`), then Task 11's `WbPageFolderExistsService`; a throw is `Workflows/Workflow/Persistence` (R87). Returns only a boolean; the type is always `wb:page`, so the input is the id only (R124).

Every refusal before the engine is pinned with `engineCalls` (`CountingEngineCalls` gains `ReassignReviewStep`, `ListStepCandidates`, `InspectRouting`). The team directory is Task 11's `registerTestUsers` (REQUESTER, REVIEWER and OTHER_REVIEWER in `team-1`); candidates' page permissions come from `permissionsByIdentity`; OTHER_REVIEWER is excluded with the reason "On holiday." through the engine's `SaveWorkflowSettingsUseCase`.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/ReassignWebsiteBuilderPageReviewStepUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/ListWebsiteBuilderPageStepCandidatesUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/ListWebsiteBuilderPageReviewStepCandidatesUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/InspectWebsiteBuilderPageRoutingUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/WebsiteBuilderPageFolderExistsUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/index.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Test: `packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts`

**Interfaces:**
- Consumes:
  - 4.1 Task 2: `ROUTING_SKIP_REASONS` texts (`"Not a member of the step's teams."`, `"Excluded from reviews."`, `"The requester cannot review."`, `"Cannot read this content."`).
  - 4.2 Task 4: `ReassignReviewStepUseCase` (`@webiny/api-workflows/features/review/ReassignReviewStep/index.js`), `execute(input: ReassignReviewStepUseCase.Input): ReassignReviewStepUseCase.Return`, `Input { reviewId: string; stepId: string; userId: string; actor: Actor }`, value `ReviewData`; `ReviewReassignTargetInvalidError` (`Workflows/Review/ReassignTargetInvalid`, data `ReviewReassignTargetInvalidErrorData { reviewId, stepId, userId, reason }`, `@webiny/api-workflows/domain/review/errors.js`), `ReviewAlreadyOwnerError` (`Workflows/Review/AlreadyOwner`); assignment `{ source: "reassign", by: actor }`.
  - 4.2 Task 5: `ListStepCandidatesUseCase` (`@webiny/api-workflows/features/routing/ListStepCandidates/index.js`), `execute(input: ListStepCandidatesUseCase.Input): ListStepCandidatesUseCase.Return` with `ListRequestStepCandidatesInput { workflowId; stepId; model; targetId; targetRevisionId; requesterId }` / `ListReviewStepCandidatesInput { reviewId; stepId }`, value `StepCandidate[]`; a same-app workflow not bound to the model fails with `ReviewValidationError` `The workflow "<name>" is not bound to the model "<model>".` (another app's workflow never reaches the engine, R128). `InspectRoutingUseCase` (`@webiny/api-workflows/features/routing/InspectRouting/index.js`), `execute(input: { stepConfig: unknown; model: string; requesterId: string; folder: TargetContextFolder | null; now: Date }): Promise<Result<RoutingInspection, InspectRoutingUseCase.Error>>` (invalid config: `Workflows/Workflow/Validation`). `StepCandidate { id; displayName; excluded: boolean; excludedReason: string | null }`, `RoutingInspection { owner: RoutingUser | null; source; ruleId: string | null; strategy; trace: RoutingTraceEntry[]; skipped: RoutingSkippedUser[] }` (`@webiny/api-workflows/domain/routing/types.js`; R129).
  - 4.2 Task 5: `redactStepCandidates(candidates: StepCandidate[], permissions: WorkflowsPermissionSet): StepCandidate[]` (`@webiny/api-workflows/domain/routing/redactStepCandidates.js`, pure; consumed, not created here).
  - Task 11: `WbPageFolderExistsService` (`~/features/target/WbPageFolderExistsService/index.js`), `registerTestUsers` (`~tests/__helpers/FakeListUsers.js`), `registerAco`, `failFolderReads`, `createWbFolder` (`~tests/__helpers/aco.js`).
  - Phase 2/3: `WbPageReviewGuardService`, `CurrentReviewViewer` (`get()`, `getActor()`), `WorkflowsPermissions.canEdit`, `canReassignByPermission`, `WbPageTargetReader`, `WbPageAccess` (`canWriteAnyPage`, `canWrite`), `GetWorkflowUseCase` (`@webiny/api-workflows/features/workflow/GetWorkflow/index.js`), `isWbWorkflow` (`~/features/wrappers/shared/wbWorkflows.js`), `WorkflowNotFoundError`, `WB_PAGE_NAMESPACE`, `WB_PAGE_FOLDER_TYPE`, `ROOT_FOLDER` (`@webiny/api-website-builder/constants.js`), `SaveWorkflowSettingsUseCase` (`@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js`), `WorkflowsNotAuthorizedError`, `ReviewTargetNotFoundError`, `ReviewPersistenceError`, `WorkflowPersistenceError`; test helpers `createCmsReview`, `scriptTargetReads` (`throwingTargetRevisions`, `nullTargetRevisions`, `mismatchedTargetRevisions`), `throwOnAccessChecks`, `throwOnWorkflowsPermissions`, `countEngineCalls`.
- Produces:
  - `ReassignWebsiteBuilderPageReviewStepUseCase.Interface.execute(input: ReassignWebsiteBuilderPageReviewStepInput): Promise<Result<ReviewData, ReassignWebsiteBuilderPageReviewStepUseCase.Error>>`, `ReassignWebsiteBuilderPageReviewStepInput { reviewId: string; stepId: string; userId: string }`. Refusal action `"reassign this step"`.
  - `ListWebsiteBuilderPageStepCandidatesUseCase.Interface.execute(input: ListWebsiteBuilderPageStepCandidatesInput): Promise<Result<StepCandidate[], ListWebsiteBuilderPageStepCandidatesUseCase.Error>>`, `ListWebsiteBuilderPageStepCandidatesInput { workflowId: string; stepId: string; targetId: string; targetRevisionId: string }`. Refusal action `"list the step's candidates"`.
  - `ListWebsiteBuilderPageReviewStepCandidatesUseCase.Interface.execute(input: ListWebsiteBuilderPageReviewStepCandidatesInput): Promise<Result<StepCandidate[], ListWebsiteBuilderPageReviewStepCandidatesUseCase.Error>>`, `ListWebsiteBuilderPageReviewStepCandidatesInput { reviewId: string; stepId: string }`. Refusal action `"list the step's candidates"`.
  - `InspectWebsiteBuilderPageRoutingUseCase.Interface.execute(input: InspectWebsiteBuilderPageRoutingInput): Promise<Result<RoutingInspection, InspectWebsiteBuilderPageRoutingUseCase.Error>>`, `InspectWebsiteBuilderPageRoutingInput { stepConfig: unknown; requesterId: string; folderId?: string | null }`. Refusal action `"inspect routing"`.
  - `WebsiteBuilderPageFolderExistsUseCase.Interface.execute(input: WebsiteBuilderPageFolderExistsInput): Promise<Result<boolean, WebsiteBuilderPageFolderExistsUseCase.Error>>`, `WebsiteBuilderPageFolderExistsInput { id: string }`. Refusal action `"check folders"`.
  - Test helper: `engineCalls` names `"ReassignReviewStep"`, `"ListStepCandidates"`, `"InspectRouting"`.

- [ ] **Step 1: Write the failing tests**

In `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`, add the imports after the `ListReviewAssignmentsUseCase` import:

```ts
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
```

add the classes after `CountingListReviewAssignments`:

```ts
class CountingReassignReviewStep implements ReassignReviewStepUseCase.Interface {
    public constructor(private decoratee: ReassignReviewStepUseCase.Interface) {}

    public async execute(input: ReassignReviewStepUseCase.Input): ReassignReviewStepUseCase.Return {
        engineCalls.push("ReassignReviewStep");
        return this.decoratee.execute(input);
    }
}

class CountingListStepCandidates implements ListStepCandidatesUseCase.Interface {
    public constructor(private decoratee: ListStepCandidatesUseCase.Interface) {}

    public async execute(input: ListStepCandidatesUseCase.Input): ListStepCandidatesUseCase.Return {
        engineCalls.push("ListStepCandidates");
        return this.decoratee.execute(input);
    }
}

class CountingInspectRouting implements InspectRoutingUseCase.Interface {
    public constructor(private decoratee: InspectRoutingUseCase.Interface) {}

    public async execute(input: InspectRoutingUseCase.Input): InspectRoutingUseCase.Return {
        engineCalls.push("InspectRouting");
        return this.decoratee.execute(input);
    }
}
```

and register them at the end of `countEngineCalls`, after the `ListReviewAssignmentsUseCase` decorator:

```ts
    container.registerDecorator(
        ReassignReviewStepUseCase.createDecorator({
            decorator: CountingReassignReviewStep,
            dependencies: []
        })
    );
    container.registerDecorator(
        ListStepCandidatesUseCase.createDecorator({
            decorator: CountingListStepCandidates,
            dependencies: []
        })
    );
    container.registerDecorator(
        InspectRoutingUseCase.createDecorator({
            decorator: CountingInspectRouting,
            dependencies: []
        })
    );
```

In `packages/api-website-builder-workflows/__tests__/registration.test.ts`, add the imports after the `GetWebsiteBuilderPageTargetReviewUseCase` import:

```ts
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";
```

and add to `WRAPPERS`, before `WbPageReviewGuardService`:

```ts
    ReassignWebsiteBuilderPageReviewStepUseCase,
    ListWebsiteBuilderPageStepCandidatesUseCase,
    ListWebsiteBuilderPageReviewStepCandidatesUseCase,
    InspectWebsiteBuilderPageRoutingUseCase,
    WebsiteBuilderPageFolderExistsUseCase,
```

Create `packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewReassignTargetInvalidErrorData } from "@webiny/api-workflows/domain/review/errors.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    toActor,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, failFolderReads, registerAco } from "~tests/__helpers/aco.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";

/** Page permissions of the users routing evaluates as candidates (`CandidateReadAccess`). */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER,
    [OTHER_REVIEWER.id]: WB_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const ON_HOLIDAY = "On holiday.";

/**
 * Admin stores the pages workflow (pool of "team-1": REQUESTER, REVIEWER, OTHER_REVIEWER),
 * excludes OTHER_REVIEWER ("On holiday.") and REQUESTER asks for reviews of "Page A" (root) and
 * "Locked" ("folder-locked"). Both steps wait in the pool.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    await storeWbWorkflow(admin);
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await requestPageReview(admin, page);
    const lockedReview = await requestPageReview(admin, lockedPage);
    return { admin, page, lockedPage, review, lockedReview };
};

/** REVIEWER cannot read "folder-locked"; the requester, the reassigner and OTHER_REVIEWER can. */
const lockFolderForReviewer = () => {
    folderLevels.set(
        "folder-locked",
        new Map([
            [REQUESTER.id, "owner"],
            [REASSIGNER.id, "owner"],
            [EDITOR.id, "owner"],
            [OTHER_REVIEWER.id, "viewer"]
        ])
    );
};

/** A context as the identity with the directory, counting the engine's calls. */
const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

const reassign = (context: CmsContext, reviewId: string, userId: string) => {
    return context.container
        .resolve(ReassignWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, userId });
};

const listRequestCandidates = (context: CmsContext, page: WbPage, workflowId = "wb-workflow") => {
    return context.container.resolve(ListWebsiteBuilderPageStepCandidatesUseCase).execute({
        workflowId,
        stepId: STEP_ID,
        targetId: page.entryId,
        targetRevisionId: page.id
    });
};

const listReviewCandidates = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ListWebsiteBuilderPageReviewStepCandidatesUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const inspect = (context: CmsContext, input: InspectWebsiteBuilderPageRoutingUseCase.Input) => {
    return context.container.resolve(InspectWebsiteBuilderPageRoutingUseCase).execute(input);
};

const folderExists = (context: CmsContext, id: string) => {
    return context.container.resolve(WebsiteBuilderPageFolderExistsUseCase).execute({ id });
};

/** An unsaved step config with one rule: pages under the folder (descendants) go to REVIEWER. */
const folderRuleConfig = (folderId: string) => {
    return {
        teams: [REVIEW_TEAM],
        assignment: {
            strategy: "none",
            allowManualPick: false,
            rules: [
                {
                    id: "rule-campaigns",
                    conditions: {
                        folder: { id: folderId, type: "wb:page", includeDescendants: true }
                    },
                    target: { type: "user", id: REVIEWER.id }
                }
            ]
        }
    };
};

/** Real ACO folders: Marketing > Campaigns > Spring (pages) and Articles (`cms:article`). */
const createFolders = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerAco] });
    const marketing = await createWbFolder(admin, { title: "Marketing", slug: "marketing" });
    const campaigns = await createWbFolder(admin, {
        title: "Campaigns",
        slug: "campaigns",
        parentId: marketing.id
    });
    const spring = await createWbFolder(admin, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    const articles = await createWbFolder(admin, {
        title: "Articles",
        slug: "articles",
        type: "cms:article"
    });
    return { campaigns, spring, articles };
};

describe("WB reassign wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("reassigns a pool step to a team member (R119)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const reassigned = expectOk(await reassign(reassigner, review.id, REVIEWER.id));

        expect(reassigned.currentStepState).toBe("inReview");
        expect(reassigned.currentOwnerId).toBe(REVIEWER.id);
        expect(reassigned.steps[0].assignment).toMatchObject({
            source: "reassign",
            by: toActor(REASSIGNER)
        });
        expect(engineCalls).toContain("ReassignReviewStep");
    });

    it("refuses the current owner in the engine", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);
        expectOk(await reassign(reassigner, review.id, REVIEWER.id));

        const again = await reassign(reassigner, review.id, REVIEWER.id);

        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("refuses a user who cannot review the step, with the fixed reason (R112)", async () => {
        const { review, lockedReview } = await createScenario();
        lockFolderForReviewer();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const notMember = await reassign(reassigner, review.id, READER.id);
        const requester = await reassign(reassigner, review.id, REQUESTER.id);
        const excluded = await reassign(reassigner, review.id, OTHER_REVIEWER.id);
        const cannotRead = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        const reasons = [notMember, requester, excluded, cannotRead].map(result => {
            expect(result.error.code).toBe("Workflows/Review/ReassignTargetInvalid");
            return (result.error.data as ReviewReassignTargetInvalidErrorData).reason;
        });
        expect(reasons).toEqual([
            "Not a member of the step's teams.",
            "The requester cannot review.",
            "Excluded from reviews.",
            "Cannot read this content."
        ]);
    });

    it("refuses a viewer without reassign, before the engine (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await reassign(reviewer, review.id, OTHER_REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses a reassigner without read access to the page, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, cmsReview.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const refused = await reassign(anonymous, review.id, REVIEWER.id);
        throwingAccessChecks.add("canRead");
        engineCalls.length = 0;
        const failed = await reassign(reassigner, review.id, REVIEWER.id);

        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});

describe("WB step candidate wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
        nullTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
    });

    it("lists the team without the requester, by name, without reasons for a plain requester (R120)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const candidates = expectOk(await listRequestCandidates(requester, page));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                excluded: true,
                excludedReason: null
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: false,
                excludedReason: null
            }
        ]);
        expect(engineCalls).toContain("ListStepCandidates");
    });

    it("shows the reasons to a requester with editor, including no read access (D97)", async () => {
        const { lockedPage } = await createScenario();
        lockFolderForReviewer();
        const requester = await asUser(REQUESTER, [WORKFLOWS_EDITOR, ...WB_WRITER]);

        const candidates = expectOk(await listRequestCandidates(requester, lockedPage));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: true,
                excludedReason: "Cannot read this content."
            }
        ]);
    });

    it("refuses a viewer without page write permission before reading the page (R75, R125)", async () => {
        const { page } = await createScenario();
        const reader = await asUser(READER, WB_READER);

        const result = await listRequestCandidates(reader, page);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses a writer without write access to the page's folder, before the engine", async () => {
        const { lockedPage } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await listRequestCandidates(requester, lockedPage);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a missing revision and another page's revision as not found (R46)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        nullTargetRevisions.add(page.id);
        const missing = await listRequestCandidates(requester, page);
        nullTargetRevisions.clear();
        mismatchedTargetRevisions.add(page.id);
        const otherPage = await listRequestCandidates(requester, page);

        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherPage.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the page read or a write check throws (R87)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        throwingTargetRevisions.add(page.id);
        const readFailed = await listRequestCandidates(requester, page);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canWrite");
        const checkFailed = await listRequestCandidates(requester, page);
        throwingAccessChecks.clear();
        throwingAccessChecks.add("canWriteAnyPage");
        const permissionFailed = await listRequestCandidates(requester, page);

        expect(readFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(checkFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(permissionFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a missing workflow and a Headless CMS workflow as not found, before the engine (R46, R128)", async () => {
        const { admin, page } = await createScenario();
        await createCmsReview(admin);
        const requester = await asUser(REQUESTER, WB_WRITER);

        const missing = await listRequestCandidates(requester, page, "workflow-missing");
        const cmsWorkflow = await listRequestCandidates(requester, page, "cms-workflow");

        expect(missing.error.code).toBe("Workflows/Workflow/NotFound");
        expect(cmsWorkflow.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "cms-workflow" }
        });
        expect(JSON.stringify(cmsWorkflow.error)).not.toContain("Pages review");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses an anonymous identity before the engine (R87)", async () => {
        const { page } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await listRequestCandidates(anonymous, page);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists a review step's candidates with reasons for a reassigner", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const candidates = expectOk(await listReviewCandidates(reassigner, review.id));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: false,
                excludedReason: null
            }
        ]);
    });

    it("refuses a review step's candidates without reassign or read access, before the engine", async () => {
        const { review, lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const withoutReassign = await listReviewCandidates(reviewer, review.id);
        const withoutRead = await listReviewCandidates(reassigner, lockedReview.id);

        for (const result of [withoutReassign, withoutRead]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "list the step's candidates" });
        }
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Headless CMS review as not found for its candidates (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await listReviewCandidates(reassigner, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });
});

describe("WB inspector and folder existence wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("inspects an unsaved config for a requester and a page folder (R121)", async () => {
        await createScenario();
        const { campaigns, spring } = await createFolders();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);

        const inSpring = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: spring.id
            })
        );
        const inRoot = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: "root"
            })
        );

        expect(inSpring).toEqual({
            owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
            source: "rule",
            ruleId: "rule-campaigns",
            strategy: "none",
            trace: [{ ruleId: "rule-campaigns", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-campaigns", outcome: "notMatched", reason: null }],
            skipped: []
        });
    });

    it("skips a rule user who cannot read the folder (R121, A47)", async () => {
        await createScenario();
        const { campaigns, spring } = await createFolders();
        folderLevels.set(spring.id, new Map([[REVIEWER.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);

        const inspection = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: spring.id
            })
        );

        expect(inspection.owner).toBeNull();
        expect(inspection.trace).toEqual([
            { ruleId: "rule-campaigns", outcome: "skipped", reason: "Cannot read this content." }
        ]);
        expect(inspection.skipped).toEqual([
            {
                userId: REVIEWER.id,
                displayName: REVIEWER.displayName,
                reason: "Cannot read this content."
            }
        ]);
    });

    it("refuses a non-editor before the engine and returns the engine's validation error (R125)", async () => {
        await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const refused = await inspect(requester, {
            stepConfig: folderRuleConfig("folder-1"),
            requesterId: REQUESTER.id
        });
        expect(engineCalls).not.toContain("InspectRouting");
        const invalid = await inspect(editor, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            requesterId: REQUESTER.id
        });

        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "inspect routing" });
        expect(invalid.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("maps a throwing permission check and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        const throwing = await asUser(EDITOR, EDITOR_PERMISSIONS, [throwOnWorkflowsPermissions]);
        const anonymous = await asUser(null, []);
        const input = { stepConfig: folderRuleConfig("folder-1"), requesterId: REQUESTER.id };

        const failed = await inspect(throwing, input);
        const refused = await inspect(anonymous, input);

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("InspectRouting");
    });

    it("answers page folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const { spring, articles } = await createFolders();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);
        const reader = await asUser(READER, WB_READER, [registerAco]);

        expect(expectOk(await folderExists(editor, spring.id))).toBe(true);
        expect(expectOk(await folderExists(editor, articles.id))).toBe(false);
        expect(expectOk(await folderExists(editor, "folder-missing"))).toBe(false);
        const refused = await folderExists(reader, spring.id);
        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "check folders" });
    });

    it("maps a failed folder read and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco, failFolderReads]);
        const anonymous = await asUser(null, []);

        const failed = await folderExists(editor, "folder-1");
        const refused = await folderExists(anonymous, "folder-1");

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js` (and the other four wrapper modules). Record it as RED.

- [ ] **Step 3: ReassignWebsiteBuilderPageReviewStep**

Create `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ReassignWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
    /** The admin user who gets the step; validated like a pick by the engine (R112). */
    userId: string;
}

export interface IReassignWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    reassign: ReassignReviewStepUseCase.Error;
}

type UseCaseError =
    IReassignWebsiteBuilderPageReviewStepUseCaseErrors[keyof IReassignWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IReassignWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: ReassignWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Give a page review step to another team member (spec 5.1, D25, D33, R119): read access to the
 * page and `reassign` here, the step and the chosen user's rules in the engine.
 */
export const ReassignWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IReassignWebsiteBuilderPageReviewStepUseCase>(
        "ReassignWebsiteBuilderPageReviewStepUseCase"
    );

export namespace ReassignWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IReassignWebsiteBuilderPageReviewStepUseCase;
    export type Input = ReassignWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/ReassignWebsiteBuilderPageReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "reassign this step";

class ReassignWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private reassignStep: ReassignReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        // Permission only: whether the step can be reassigned is the engine's (1b R41).
        if (!canReassignByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.reassignStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            userId: input.userId,
            actor: viewer.actor
        });
    }
}

export const ReassignWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: ReassignWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ReassignReviewStepUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "./ReassignWebsiteBuilderPageReviewStepUseCase.js";

export const ReassignWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ReassignWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(ReassignWebsiteBuilderPageReviewStepUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.ts`:

```ts
export { ReassignWebsiteBuilderPageReviewStepUseCase } from "./abstractions.js";
export type { ReassignWebsiteBuilderPageReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 4: ListWebsiteBuilderPageStepCandidates (request dialog)**

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import type { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface ListWebsiteBuilderPageStepCandidatesInput {
    workflowId: string;
    stepId: string;
    /** The page id. */
    targetId: string;
    /** The page revision id. */
    targetRevisionId: string;
}

export interface IListWebsiteBuilderPageStepCandidatesUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    workflow: GetWorkflowUseCase.Error;
    workflowNotFound: WorkflowNotFoundError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageStepCandidatesUseCaseErrors[keyof IListWebsiteBuilderPageStepCandidatesUseCaseErrors];

export interface IListWebsiteBuilderPageStepCandidatesUseCase {
    execute(
        input: ListWebsiteBuilderPageStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who could take a step of a page review the viewer is about to request (spec 10, D128, R120):
 * write access to the page revision, as for the request itself (D77); a workflow of another app
 * is not found (R46, R128); exclusion reasons only for `editor` / `reassign` (D97).
 */
export const ListWebsiteBuilderPageStepCandidatesUseCase =
    createAbstraction<IListWebsiteBuilderPageStepCandidatesUseCase>(
        "ListWebsiteBuilderPageStepCandidatesUseCase"
    );

export namespace ListWebsiteBuilderPageStepCandidatesUseCase {
    export type Interface = IListWebsiteBuilderPageStepCandidatesUseCase;
    export type Input = ListWebsiteBuilderPageStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/ListWebsiteBuilderPageStepCandidatesUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { redactStepCandidates } from "@webiny/api-workflows/domain/routing/redactStepCandidates.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowNotFoundError } from "@webiny/api-workflows/domain/workflow/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase as UseCase } from "./abstractions.js";

const ACTION = "list the step's candidates";

/**
 * The page checks are `RequestWebsiteBuilderPageReviewUseCase`'s: the entity-level write
 * permission before anything is read (R75), a page the viewer cannot see is not found, a visible
 * page without write access is not authorized. A workflow of another app is not found (R128).
 * The viewer is the requester the engine leaves out of the list.
 */
class ListWebsiteBuilderPageStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private listCandidates: ListStepCandidatesUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        let canWriteAnyPage: boolean;
        try {
            canWriteAnyPage = await this.access.canWriteAnyPage();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWriteAnyPage) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: WB_PAGE_NAMESPACE,
                targetRevisionId: input.targetRevisionId
            });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }
        let canWrite: boolean;
        try {
            canWrite = await this.access.canWrite(target);
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWrite) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        const workflow = await this.getWorkflow.execute({ id: input.workflowId });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        // R128, R46: another app's workflow is not found here; its name never leaks.
        if (!isWbWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflowId }));
        }

        const candidates = await this.listCandidates.execute({
            workflowId: input.workflowId,
            stepId: input.stepId,
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            requesterId: viewer.value.actor.id
        });
        if (candidates.isFail()) {
            return Result.fail(candidates.error);
        }
        return Result.ok(redactStepCandidates(candidates.value, viewer.value.permissions));
    }
}

export const ListWebsiteBuilderPageStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageStepCandidatesUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WbPageTargetReader,
        WbPageAccess,
        GetWorkflowUseCase,
        ListStepCandidatesUseCase
    ]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "./ListWebsiteBuilderPageStepCandidatesUseCase.js";

export const ListWebsiteBuilderPageStepCandidatesFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageStepCandidates",
    register(container) {
        container.register(ListWebsiteBuilderPageStepCandidatesUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.ts`:

```ts
export { ListWebsiteBuilderPageStepCandidatesUseCase } from "./abstractions.js";
export type { ListWebsiteBuilderPageStepCandidatesInput } from "./abstractions.js";
```

- [ ] **Step 5: ListWebsiteBuilderPageReviewStepCandidates (reassign dialog)**

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface ListWebsiteBuilderPageReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export interface IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors[keyof IListWebsiteBuilderPageReviewStepCandidatesUseCaseErrors];

export interface IListWebsiteBuilderPageReviewStepCandidatesUseCase {
    execute(
        input: ListWebsiteBuilderPageReviewStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who a page review step can be reassigned to (spec 10, D128, R120): read access to the page and
 * `reassign`, as for the reassign itself (R125); the step from the review's snapshot.
 */
export const ListWebsiteBuilderPageReviewStepCandidatesUseCase =
    createAbstraction<IListWebsiteBuilderPageReviewStepCandidatesUseCase>(
        "ListWebsiteBuilderPageReviewStepCandidatesUseCase"
    );

export namespace ListWebsiteBuilderPageReviewStepCandidatesUseCase {
    export type Interface = IListWebsiteBuilderPageReviewStepCandidatesUseCase;
    export type Input = ListWebsiteBuilderPageReviewStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/ListWebsiteBuilderPageReviewStepCandidatesUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { redactStepCandidates } from "@webiny/api-workflows/domain/routing/redactStepCandidates.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase as UseCase } from "./abstractions.js";

const ACTION = "list the step's candidates";

class ListWebsiteBuilderPageReviewStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private listCandidates: ListStepCandidatesUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        if (!canReassignByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        const candidates = await this.listCandidates.execute({
            reviewId: input.reviewId,
            stepId: input.stepId
        });
        if (candidates.isFail()) {
            return Result.fail(candidates.error);
        }
        // `reassign` always sees the reasons; redacted the same way as the request list (R120).
        return Result.ok(redactStepCandidates(candidates.value, viewer.permissions));
    }
}

export const ListWebsiteBuilderPageReviewStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageReviewStepCandidatesUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ListStepCandidatesUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "./ListWebsiteBuilderPageReviewStepCandidatesUseCase.js";

export const ListWebsiteBuilderPageReviewStepCandidatesFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageReviewStepCandidates",
    register(container) {
        container.register(ListWebsiteBuilderPageReviewStepCandidatesUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.ts`:

```ts
export { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "./abstractions.js";
export type { ListWebsiteBuilderPageReviewStepCandidatesInput } from "./abstractions.js";
```

- [ ] **Step 6: InspectWebsiteBuilderPageRouting**

Create `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingInspection } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";

export interface InspectWebsiteBuilderPageRoutingInput {
    /** The step config as the editor holds it, unsaved; the engine validates it. */
    stepConfig: unknown;
    requesterId: string;
    /** A page folder; missing, `null` or "root" is the root. */
    folderId?: string | null;
}

export interface IInspectWebsiteBuilderPageRoutingUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    inspect: InspectRoutingUseCase.Error;
}

type UseCaseError =
    IInspectWebsiteBuilderPageRoutingUseCaseErrors[keyof IInspectWebsiteBuilderPageRoutingUseCaseErrors];

export interface IInspectWebsiteBuilderPageRoutingUseCase {
    execute(
        input: InspectWebsiteBuilderPageRoutingInput
    ): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The workflow editor's rule inspector for pages (spec 6, D45, D95, D118, R121): `editor` only
 * (R125); read access at folder level (A47).
 */
export const InspectWebsiteBuilderPageRoutingUseCase =
    createAbstraction<IInspectWebsiteBuilderPageRoutingUseCase>(
        "InspectWebsiteBuilderPageRoutingUseCase"
    );

export namespace InspectWebsiteBuilderPageRoutingUseCase {
    export type Interface = IInspectWebsiteBuilderPageRoutingUseCase;
    export type Input = InspectWebsiteBuilderPageRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/InspectWebsiteBuilderPageRoutingUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { WB_PAGE_FOLDER_TYPE, WB_PAGE_NAMESPACE } from "~/constants.js";
import { InspectWebsiteBuilderPageRoutingUseCase as UseCase } from "./abstractions.js";

/**
 * The folder type is always `wb:page` (R121); the WB folder port refuses a folder of another
 * type, which the engine reports as a routing failure.
 */
class InspectWebsiteBuilderPageRoutingUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private inspectRouting: InspectRoutingUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "inspect routing" }));
        }

        const folderId = input.folderId && input.folderId !== ROOT_FOLDER ? input.folderId : null;

        return this.inspectRouting.execute({
            stepConfig: input.stepConfig,
            model: WB_PAGE_NAMESPACE,
            requesterId: input.requesterId,
            folder: folderId ? { id: folderId, type: WB_PAGE_FOLDER_TYPE } : null,
            now: new Date()
        });
    }
}

export const InspectWebsiteBuilderPageRoutingUseCase = UseCase.createImplementation({
    implementation: InspectWebsiteBuilderPageRoutingUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, InspectRoutingUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { InspectWebsiteBuilderPageRoutingUseCase } from "./InspectWebsiteBuilderPageRoutingUseCase.js";

export const InspectWebsiteBuilderPageRoutingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/InspectWebsiteBuilderPageRouting",
    register(container) {
        container.register(InspectWebsiteBuilderPageRoutingUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/InspectWebsiteBuilderPageRouting/index.ts`:

```ts
export { InspectWebsiteBuilderPageRoutingUseCase } from "./abstractions.js";
export type { InspectWebsiteBuilderPageRoutingInput } from "./abstractions.js";
```

- [ ] **Step 7: WebsiteBuilderPageFolderExists**

Create `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface WebsiteBuilderPageFolderExistsInput {
    /** A page folder id; the type is always `wb:page`. */
    id: string;
}

export interface IWebsiteBuilderPageFolderExistsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IWebsiteBuilderPageFolderExistsUseCaseErrors[keyof IWebsiteBuilderPageFolderExistsUseCaseErrors];

export interface IWebsiteBuilderPageFolderExistsUseCase {
    execute(input: WebsiteBuilderPageFolderExistsInput): Promise<Result<boolean, UseCaseError>>;
}

/**
 * Whether a page folder a rule names still exists (D69, R125): `editor` only, the answer only, for
 * folders the editor may not be able to open.
 */
export const WebsiteBuilderPageFolderExistsUseCase =
    createAbstraction<IWebsiteBuilderPageFolderExistsUseCase>(
        "WebsiteBuilderPageFolderExistsUseCase"
    );

export namespace WebsiteBuilderPageFolderExistsUseCase {
    export type Interface = IWebsiteBuilderPageFolderExistsUseCase;
    export type Input = WebsiteBuilderPageFolderExistsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/WebsiteBuilderPageFolderExistsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";
import { WebsiteBuilderPageFolderExistsUseCase as UseCase } from "./abstractions.js";

class WebsiteBuilderPageFolderExistsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private folders: WbPageFolderExistsService.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "check folders" }));
        }

        try {
            return Result.ok(await this.folders.exists(input.id));
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
    }
}

export const WebsiteBuilderPageFolderExistsUseCase = UseCase.createImplementation({
    implementation: WebsiteBuilderPageFolderExistsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, WbPageFolderExistsService]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WebsiteBuilderPageFolderExistsUseCase } from "./WebsiteBuilderPageFolderExistsUseCase.js";

export const WebsiteBuilderPageFolderExistsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WebsiteBuilderPageFolderExists",
    register(container) {
        container.register(WebsiteBuilderPageFolderExistsUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/WebsiteBuilderPageFolderExists/index.ts`:

```ts
export { WebsiteBuilderPageFolderExistsUseCase } from "./abstractions.js";
export type { WebsiteBuilderPageFolderExistsInput } from "./abstractions.js";
```

- [ ] **Step 8: Register**

In `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`, add the imports after the `CancelWebsiteBuilderPageReviewsForDeleteFeature` import:

```ts
import { ReassignWebsiteBuilderPageReviewStepFeature } from "./ReassignWebsiteBuilderPageReviewStep/feature.js";
import { ListWebsiteBuilderPageStepCandidatesFeature } from "./ListWebsiteBuilderPageStepCandidates/feature.js";
import { ListWebsiteBuilderPageReviewStepCandidatesFeature } from "./ListWebsiteBuilderPageReviewStepCandidates/feature.js";
import { InspectWebsiteBuilderPageRoutingFeature } from "./InspectWebsiteBuilderPageRouting/feature.js";
import { WebsiteBuilderPageFolderExistsFeature } from "./WebsiteBuilderPageFolderExists/feature.js";
```

replace

```ts
        CancelWebsiteBuilderPageReviewFeature.register(container);

        // Confirm path for trash and delete with a review in progress (D134)
        CancelWebsiteBuilderPageReviewsForDeleteFeature.register(container);
```

with

```ts
        CancelWebsiteBuilderPageReviewFeature.register(container);
        ReassignWebsiteBuilderPageReviewStepFeature.register(container);

        // Confirm path for trash and delete with a review in progress (D134)
        CancelWebsiteBuilderPageReviewsForDeleteFeature.register(container);

        // Routing: reviewer pickers and the workflow editor (R120, R121, R125)
        ListWebsiteBuilderPageStepCandidatesFeature.register(container);
        ListWebsiteBuilderPageReviewStepCandidatesFeature.register(container);
        InspectWebsiteBuilderPageRoutingFeature.register(container);
        WebsiteBuilderPageFolderExistsFeature.register(container);
```

- [ ] **Step 9: Run the tests**

Run, one at a time:

```
yarn test packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/wrappers/routingWrappers.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50
```

Expected: PASS. `reviewTransitions.test.ts` covers the changed `CountingEngineCalls`.

- [ ] **Step 10: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 11: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-website-builder-workflows): page reassign, step candidates, routing inspector and folder existence wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
