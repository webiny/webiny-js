### Task 9: CMS reassign, candidates, inspector and folder existence wrappers

Spec 5.1, 6, 8, 10; D25, D33, D45, D69, D89, D97, D104, D118, D128, D132, D133; R46, R47, R87, R119, R120, R121, R125, R127, R128, R129; SEC-66. Five wrappers in `packages/api-headless-cms-workflows`, mirroring the phase 2/3 CMS wrappers (`CancelCmsEntryReviewUseCase`, `RequestCmsEntryReviewUseCase`, `ListCmsEntryWorkflowModelsUseCase`) and the guard service:

- `ReassignCmsEntryReviewStepUseCase` (R119, R125): `CmsEntryReviewGuardService` (viewer, `cms.*` review, read access to the target, action `"reassign this step"`), then `canReassignByPermission(viewer)` (refusal action `"reassign this step"`), then the engine's `ReassignReviewStepUseCase` with `viewer.actor`. The chosen user's validity (member, not excluded, not the requester, can read; same owner refused) is the engine's (R112, R119).
- `ListCmsEntryStepCandidatesUseCase` (request dialog, R120, R125): write access to the target exactly as `RequestCmsEntryReviewUseCase` checks it (another app's namespace or an unreadable / missing revision is `Workflows/Review/TargetNotFound`, R46; no write access is `Workflows/NotAuthorized` with action `"list the step's candidates"`; a throw is `Workflows/Review/Persistence`, R87), then the workflow's app (R128): `GetWorkflowUseCase` reads it and a workflow that is missing or not a CMS workflow (`isCmsWorkflow`) is `Workflows/Workflow/NotFound` `{ id }`, before the engine; then the engine's `ListStepCandidatesUseCase` with `requesterId` = the viewer.
- `ListCmsEntryReviewStepCandidatesUseCase` (reassign dialog): the guard (action `"list the step's candidates"`), then `reassign`, then the engine with `{ reviewId, stepId }`.
- Both candidate wrappers null `excludedReason` unless the viewer has `editor` or `reassign` (D89, D97, R120), with 4.2 Task 5's pure `redactStepCandidates` (R127). `excluded` itself stays visible.
- `InspectCmsEntryRoutingUseCase` (R121, R125): `editor` (a throwing permission check is `Workflows/Workflow/Persistence`, refusal action `"inspect routing"`), a `cms.*` namespace (else `Workflows/Workflow/Validation`), then the engine's `InspectRoutingUseCase` with the folder `{ id: folderId, type: "cms:<modelId>" }` (`null` / `"root"` → `null`, the 00-shared R121 update) and `now`.
- `CmsEntryFolderExistsUseCase` (D69, R125): `editor` (refusal action `"check folders"`), then Task 8's `CmsEntryFolderExistsService`; a throw is `Workflows/Workflow/Persistence` (R87). Returns only a boolean.

Every refusal before the engine is pinned with `engineCalls` (`CountingEngineCalls` gains `ReassignReviewStep`, `ListStepCandidates`, `InspectRouting`). The team directory is Task 8's `registerTestUsers` (REQUESTER, REVIEWER and OTHER_REVIEWER in `team-1`); candidates' CMS permissions come from `permissionsByIdentity`; OTHER_REVIEWER is excluded with the reason "On holiday." through the engine's `SaveWorkflowSettingsUseCase`.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/ReassignCmsEntryReviewStepUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/ListCmsEntryStepCandidatesUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/ListCmsEntryReviewStepCandidatesUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/InspectCmsEntryRoutingUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/CmsEntryFolderExistsUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts`

**Interfaces:**
- Consumes:
  - 4.1 Task 2: `ROUTING_SKIP_REASONS` texts (`"Not a member of the step's teams."`, `"Excluded from reviews."`, `"The requester cannot review."`, `"Cannot read this content."`), `RoutingTraceEntry`, `RoutingUser`.
  - 4.2 Task 4: `ReassignReviewStepUseCase` (`@webiny/api-workflows/features/review/ReassignReviewStep/index.js`), `execute(input: { reviewId: string; stepId: string; userId: string; actor: Actor }): Promise<Result<ReviewData, ReassignReviewStepUseCase.Error>>`; `ReviewReassignTargetInvalidError` (`Workflows/Review/ReassignTargetInvalid`, data `ReviewReassignTargetInvalidErrorData { reviewId, stepId, userId, reason }`, `@webiny/api-workflows/domain/review/errors.js`), `ReviewAlreadyOwnerError` (`Workflows/Review/AlreadyOwner`); assignment `{ source: "reassign", by: actor }`.
  - 4.2 Task 5: `ListStepCandidatesUseCase` (`@webiny/api-workflows/features/routing/ListStepCandidates/index.js`), `execute(input: ListStepCandidatesInput): Promise<Result<StepCandidate[], ListStepCandidatesUseCase.Error>>`, `ListRequestStepCandidatesInput { workflowId; stepId; model; targetId; targetRevisionId; requesterId }`, `ListReviewStepCandidatesInput { reviewId; stepId }`; `InspectRoutingUseCase` (`@webiny/api-workflows/features/routing/InspectRouting/index.js`), `execute(input: { stepConfig: unknown; model: string; requesterId: string; folder: TargetContextFolder | null; now: Date }): Promise<Result<RoutingInspection, InspectRoutingUseCase.Error>>` (invalid config: `Workflows/Workflow/Validation`); `StepCandidate { id; displayName; excluded: boolean; excludedReason: string | null }`, `RoutingInspection { owner: RoutingUser | null; source; ruleId: string | null; strategy; trace: RoutingTraceEntry[]; skipped: RoutingSkippedUser[] }` (`@webiny/api-workflows/domain/routing/types.js`; R129: the trace and `skipped` show an excluded rule target's own reason); `redactStepCandidates(candidates: StepCandidate[], permissions: WorkflowsPermissionSet): StepCandidate[]` (`@webiny/api-workflows/domain/routing/redactStepCandidates.js`, pure, R127).
  - Task 8: `CmsEntryFolderExistsService`, `toCmsFolderType`, `registerTestUsers`, `addTestFolder` / `testFolders` / `failingFolderReads`, `UserContextParams.permissionsByIdentity`, `createWorkflowValuesWithAssignment`.
  - Phase 2/3: `CmsEntryReviewGuardService`, `CurrentReviewViewer`, `WorkflowsPermissions.canEdit`, `canReassignByPermission`, `CmsEntryTargetReader`, `CmsEntryAccess`, `isCmsNamespace`, `getModelIdFromAppName`, `GetWorkflowUseCase` (`@webiny/api-workflows/features/workflow/GetWorkflow/index.js`), `isCmsWorkflow` (`~/features/wrappers/shared/cmsWorkflows.js`), `WorkflowNotFoundError`, `SaveWorkflowSettingsUseCase` (`@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js`), `WorkflowsNotAuthorizedError`, `ReviewTargetNotFoundError`, `ReviewPersistenceError`, `WorkflowPersistenceError`, `WorkflowValidationError`.
- Produces:
  - `ReassignCmsEntryReviewStepUseCase.Interface.execute(input: ReassignCmsEntryReviewStepInput): Promise<Result<ReviewData, ReassignCmsEntryReviewStepUseCase.Error>>`, `ReassignCmsEntryReviewStepInput { reviewId: string; stepId: string; userId: string }`. Refusal action `"reassign this step"`.
  - `ListCmsEntryStepCandidatesUseCase.Interface.execute(input: ListCmsEntryStepCandidatesInput): Promise<Result<StepCandidate[], ListCmsEntryStepCandidatesUseCase.Error>>`, `ListCmsEntryStepCandidatesInput { workflowId: string; stepId: string; model: string; targetId: string; targetRevisionId: string }`. Refusal action `"list the step's candidates"`.
  - `ListCmsEntryReviewStepCandidatesUseCase.Interface.execute(input: ListCmsEntryReviewStepCandidatesInput): Promise<Result<StepCandidate[], ListCmsEntryReviewStepCandidatesUseCase.Error>>`, `ListCmsEntryReviewStepCandidatesInput { reviewId: string; stepId: string }`. Refusal action `"list the step's candidates"`.
  - `InspectCmsEntryRoutingUseCase.Interface.execute(input: InspectCmsEntryRoutingInput): Promise<Result<RoutingInspection, InspectCmsEntryRoutingUseCase.Error>>`, `InspectCmsEntryRoutingInput { stepConfig: unknown; model: string; requesterId: string; folderId?: string | null }`. Refusal action `"inspect routing"`; validation message `"Routing can only be inspected for a CMS model."`.
  - `CmsEntryFolderExistsUseCase.Interface.execute(input: CmsEntryFolderExistsInput): Promise<Result<boolean, CmsEntryFolderExistsUseCase.Error>>`, `CmsEntryFolderExistsInput { id: string; type: string }`. Refusal action `"check folders"`.
  - Test helper: `engineCalls` names `"ReassignReviewStep"`, `"ListStepCandidates"`, `"InspectRouting"`.

- [ ] **Step 1: Write the failing tests**

In `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`, add the imports after the `DeleteTargetReviewsUseCase` import:

```ts
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
```

add the classes after `CountingCancelReview`:

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

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts`, add the imports after the `CancelCmsEntryReviewsForDeleteUseCase` import:

```ts
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";
```

and add to `WRAPPERS`, before `CmsEntryReviewGuardService`:

```ts
    ReassignCmsEntryReviewStepUseCase,
    ListCmsEntryStepCandidatesUseCase,
    ListCmsEntryReviewStepCandidatesUseCase,
    InspectCmsEntryRoutingUseCase,
    CmsEntryFolderExistsUseCase,
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewReassignTargetInvalidErrorData } from "@webiny/api-workflows/domain/review/errors.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    toActor
} from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    CMS_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { addTestFolder, failingFolderReads, testFolders } from "~tests/__helpers/FakeFolders.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";

/** CMS permissions of the users routing evaluates as candidates (`CandidateReadAccess`). */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER,
    [OTHER_REVIEWER.id]: CMS_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const ON_HOLIDAY = "On holiday.";

/**
 * Admin stores the workflow (pool of "team-1": REQUESTER, REVIEWER, OTHER_REVIEWER), excludes
 * OTHER_REVIEWER ("On holiday.") and REQUESTER asks for reviews of "Ann" (root) and "Locked"
 * ("folder-locked"). Both steps wait in the pool.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    expectOk(await storeWorkflow(admin));
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, lockedEntry, review, lockedReview };
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
            ...createExtraModelPlugins(),
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
        .resolve(ReassignCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, userId });
};

/** The revision a request dialog asks about. */
interface TargetRevision {
    entryId: string;
    id: string;
}

const listRequestCandidates = (
    context: CmsContext,
    entry: TargetRevision,
    model: string = AUTHOR_NAMESPACE
) => {
    return context.container.resolve(ListCmsEntryStepCandidatesUseCase).execute({
        workflowId: "workflow-1",
        stepId: STEP_ID,
        model,
        targetId: entry.entryId,
        targetRevisionId: entry.id
    });
};

const listReviewCandidates = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ListCmsEntryReviewStepCandidatesUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const inspect = (context: CmsContext, input: InspectCmsEntryRoutingUseCase.Input) => {
    return context.container.resolve(InspectCmsEntryRoutingUseCase).execute(input);
};

const folderExists = (context: CmsContext, id: string, type: string) => {
    return context.container.resolve(CmsEntryFolderExistsUseCase).execute({ id, type });
};

/** One rule: entries under "folder-parent" (descendants included) go to REVIEWER. */
const FOLDER_RULE_CONFIG = {
    teams: [REVIEW_TEAM],
    assignment: {
        strategy: "none",
        allowManualPick: false,
        rules: [
            {
                id: "rule-1",
                conditions: {
                    folder: { id: "folder-parent", type: "cms:author", includeDescendants: true }
                },
                target: { type: "user", id: REVIEWER.id }
            }
        ]
    }
};

describe("CMS reassign wrapper", () => {
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
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await reassign(reviewer, review.id, OTHER_REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses a reassigner without read access to the target, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, wbReview.id, REVIEWER.id);

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

describe("CMS step candidate wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("lists the team without the requester, by name, without reasons for a plain requester (R120)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const candidates = expectOk(await listRequestCandidates(requester, entry));

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
        const { lockedEntry } = await createScenario();
        lockFolderForReviewer();
        const requester = await asUser(REQUESTER, [WORKFLOWS_EDITOR, ...CMS_WRITER]);

        const candidates = expectOk(await listRequestCandidates(requester, lockedEntry));

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

    it("refuses a viewer without write access to the target, before the engine (R125)", async () => {
        const { entry } = await createScenario();
        const reader = await asUser(READER, CMS_READER);

        const result = await listRequestCandidates(reader, entry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports another app's namespace and a missing revision as not found (R46)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const otherApp = await listRequestCandidates(requester, entry, "wb.page");
        const missing = await listRequestCandidates(requester, {
            entryId: entry.entryId,
            id: `${entry.entryId}#0009`
        });

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the target read or write check throws (R87)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        throwingTargetRevisions.add(entry.id);
        const readFailed = await listRequestCandidates(requester, entry);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canWrite");
        const checkFailed = await listRequestCandidates(requester, entry);

        expect(readFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(checkFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses a writer without write access to the entry's folder, before the engine", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await listRequestCandidates(requester, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses an anonymous identity before the engine (R87)", async () => {
        const { entry } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await listRequestCandidates(anonymous, entry);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a workflow that does not exist as not found, before the engine", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await requester.container
            .resolve(ListCmsEntryStepCandidatesUseCase)
            .execute({
                workflowId: "workflow-missing",
                stepId: STEP_ID,
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Website Builder workflow as not found, before the engine (R46, R128)", async () => {
        const { entry } = await createScenario();
        await createWbReview();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await requester.container
            .resolve(ListCmsEntryStepCandidatesUseCase)
            .execute({
                workflowId: "wb-workflow",
                stepId: STEP_ID,
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            });

        expect(result.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "wb-workflow" }
        });
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
        const reviewer = await asUser(REVIEWER, CMS_READER);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const withoutReassign = await listReviewCandidates(reviewer, review.id);
        const withoutRead = await listReviewCandidates(reassigner, lockedReview.id);

        for (const result of [withoutReassign, withoutRead]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "list the step's candidates" });
        }
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Website Builder review as not found for its candidates (R46)", async () => {
        const wbReview = await createWbReview();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await listReviewCandidates(reassigner, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });
});

describe("CMS inspector and folder existence wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        addTestFolder({ id: "folder-parent", type: "cms:author" });
        addTestFolder({ id: "folder-child", type: "cms:author", parentId: "folder-parent" });
    });

    afterEach(() => {
        testFolders.clear();
        failingFolderReads.clear();
        folderLevels.clear();
    });

    it("inspects an unsaved config for a requester and a folder (R121)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const inChild = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: "folder-child"
            })
        );
        const inRoot = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: null
            })
        );

        expect(inChild).toEqual({
            owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
            source: "rule",
            ruleId: "rule-1",
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "notMatched", reason: null }],
            skipped: []
        });
    });

    it("skips a rule user who cannot read the folder (R121, A47)", async () => {
        await createScenario();
        folderLevels.set("folder-child", new Map([[REVIEWER.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const inspection = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: "folder-child"
            })
        );

        expect(inspection.owner).toBeNull();
        expect(inspection.trace).toEqual([
            { ruleId: "rule-1", outcome: "skipped", reason: "Cannot read this content." }
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
        const requester = await asUser(REQUESTER, CMS_WRITER);
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const refused = await inspect(requester, {
            stepConfig: FOLDER_RULE_CONFIG,
            model: AUTHOR_NAMESPACE,
            requesterId: REQUESTER.id
        });
        expect(engineCalls).not.toContain("InspectRouting");
        const invalid = await inspect(editor, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            model: AUTHOR_NAMESPACE,
            requesterId: REQUESTER.id
        });

        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "inspect routing" });
        expect(invalid.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("refuses another app's namespace and maps a throwing permission check (R87)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const throwing = await asUser(EDITOR, EDITOR_PERMISSIONS, [throwOnWorkflowsPermissions]);
        const input = { stepConfig: FOLDER_RULE_CONFIG, requesterId: REQUESTER.id };

        const otherApp = await inspect(editor, { ...input, model: "wb.page" });
        const failed = await inspect(throwing, { ...input, model: AUTHOR_NAMESPACE });

        expect(otherApp.error).toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: "Routing can only be inspected for a CMS model."
        });
        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(engineCalls).not.toContain("InspectRouting");
    });

    it("answers folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const reader = await asUser(READER, CMS_READER);

        expect(expectOk(await folderExists(editor, "folder-child", "cms:author"))).toBe(true);
        expect(expectOk(await folderExists(editor, "folder-child", "cms:book"))).toBe(false);
        expect(expectOk(await folderExists(editor, "folder-missing", "cms:author"))).toBe(false);
        const refused = await folderExists(reader, "folder-child", "cms:author");
        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "check folders" });
    });

    it("maps a failed folder read and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        failingFolderReads.add("folder-child");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const anonymous = await asUser(null, []);

        const failed = await folderExists(editor, "folder-child", "cms:author");
        const refused = await folderExists(anonymous, "folder-child", "cms:author");

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/ReassignCmsEntryReviewStep/index.js` (and the other four wrapper modules).

- [ ] **Step 3: ReassignCmsEntryReviewStep**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ReassignCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    /** The admin user who gets the step; validated like a pick by the engine (R112). */
    userId: string;
}

export interface IReassignCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    reassign: ReassignReviewStepUseCase.Error;
}

type UseCaseError =
    IReassignCmsEntryReviewStepUseCaseErrors[keyof IReassignCmsEntryReviewStepUseCaseErrors];

export interface IReassignCmsEntryReviewStepUseCase {
    execute(input: ReassignCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Give a CMS review step to another team member (spec 5.1, D25, D33, R119): read access to the
 * target and `reassign` here, the step and the chosen user's rules in the engine.
 */
export const ReassignCmsEntryReviewStepUseCase =
    createAbstraction<IReassignCmsEntryReviewStepUseCase>("ReassignCmsEntryReviewStepUseCase");

export namespace ReassignCmsEntryReviewStepUseCase {
    export type Interface = IReassignCmsEntryReviewStepUseCase;
    export type Input = ReassignCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/ReassignCmsEntryReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { ReassignCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "reassign this step";

class ReassignCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const ReassignCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: ReassignCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ReassignReviewStepUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReassignCmsEntryReviewStepUseCase } from "./ReassignCmsEntryReviewStepUseCase.js";

export const ReassignCmsEntryReviewStepFeature = createFeature({
    name: "CmsWorkflows/ReassignCmsEntryReviewStep",
    register(container) {
        container.register(ReassignCmsEntryReviewStepUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ReassignCmsEntryReviewStep/index.ts`:

```ts
export { ReassignCmsEntryReviewStepUseCase } from "./abstractions.js";
export type { ReassignCmsEntryReviewStepInput } from "./abstractions.js";
```

- [ ] **Step 4: ListCmsEntryStepCandidates (request dialog)**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/abstractions.ts`:

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

export interface ListCmsEntryStepCandidatesInput {
    workflowId: string;
    stepId: string;
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface IListCmsEntryStepCandidatesUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    workflow: GetWorkflowUseCase.Error;
    workflowNotFound: WorkflowNotFoundError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListCmsEntryStepCandidatesUseCaseErrors[keyof IListCmsEntryStepCandidatesUseCaseErrors];

export interface IListCmsEntryStepCandidatesUseCase {
    execute(
        input: ListCmsEntryStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who could take a step of a review the viewer is about to request (spec 10, D128, R120): write
 * access to the revision, as for the request itself (D77); a workflow of another app is not found
 * (R46, R128); exclusion reasons only for `editor` / `reassign` (D97).
 */
export const ListCmsEntryStepCandidatesUseCase =
    createAbstraction<IListCmsEntryStepCandidatesUseCase>("ListCmsEntryStepCandidatesUseCase");

export namespace ListCmsEntryStepCandidatesUseCase {
    export type Interface = IListCmsEntryStepCandidatesUseCase;
    export type Input = ListCmsEntryStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/ListCmsEntryStepCandidatesUseCase.ts`:

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
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { ListCmsEntryStepCandidatesUseCase as UseCase } from "./abstractions.js";

/**
 * The target checks are `RequestCmsEntryReviewUseCase`'s: a target of another app or one the
 * viewer cannot see is not found (R46), a visible target without write access is not authorized.
 * A workflow of another app is not found either (R128), as `GetCmsEntryWorkflowUseCase` answers.
 * The viewer is the requester the engine leaves out of the list.
 */
class ListCmsEntryStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private listCandidates: ListStepCandidatesUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        let target: CmsEntryTargetReader.Target | null = null;
        if (isCmsNamespace(input.model)) {
            try {
                target = await this.targets.read({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                });
            } catch (error) {
                return Result.fail(
                    new ReviewPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
        }
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
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
            return Result.fail(
                new WorkflowsNotAuthorizedError({ action: "list the step's candidates" })
            );
        }

        const workflow = await this.getWorkflow.execute({ id: input.workflowId });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        // R128, R46: another app's workflow is not found here; its name never leaks.
        if (!isCmsWorkflow(workflow.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.workflowId }));
        }

        const candidates = await this.listCandidates.execute({
            workflowId: input.workflowId,
            stepId: input.stepId,
            model: input.model,
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

export const ListCmsEntryStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryStepCandidatesUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        CmsEntryTargetReader,
        CmsEntryAccess,
        GetWorkflowUseCase,
        ListStepCandidatesUseCase
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryStepCandidatesUseCase } from "./ListCmsEntryStepCandidatesUseCase.js";

export const ListCmsEntryStepCandidatesFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryStepCandidates",
    register(container) {
        container.register(ListCmsEntryStepCandidatesUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryStepCandidates/index.ts`:

```ts
export { ListCmsEntryStepCandidatesUseCase } from "./abstractions.js";
export type { ListCmsEntryStepCandidatesInput } from "./abstractions.js";
```

- [ ] **Step 5: ListCmsEntryReviewStepCandidates (reassign dialog)**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "@webiny/api-workflows/domain/routing/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ListCmsEntryReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export interface IListCmsEntryReviewStepCandidatesUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    candidates: ListStepCandidatesUseCase.Error;
}

type UseCaseError =
    IListCmsEntryReviewStepCandidatesUseCaseErrors[keyof IListCmsEntryReviewStepCandidatesUseCaseErrors];

export interface IListCmsEntryReviewStepCandidatesUseCase {
    execute(
        input: ListCmsEntryReviewStepCandidatesInput
    ): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who a CMS review step can be reassigned to (spec 10, D128, R120): read access to the target and
 * `reassign`, as for the reassign itself (R125); the step from the review's snapshot.
 */
export const ListCmsEntryReviewStepCandidatesUseCase =
    createAbstraction<IListCmsEntryReviewStepCandidatesUseCase>(
        "ListCmsEntryReviewStepCandidatesUseCase"
    );

export namespace ListCmsEntryReviewStepCandidatesUseCase {
    export type Interface = IListCmsEntryReviewStepCandidatesUseCase;
    export type Input = ListCmsEntryReviewStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/ListCmsEntryReviewStepCandidatesUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { redactStepCandidates } from "@webiny/api-workflows/domain/routing/redactStepCandidates.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase as UseCase } from "./abstractions.js";

const ACTION = "list the step's candidates";

class ListCmsEntryReviewStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

export const ListCmsEntryReviewStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryReviewStepCandidatesUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ListStepCandidatesUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryReviewStepCandidatesUseCase } from "./ListCmsEntryReviewStepCandidatesUseCase.js";

export const ListCmsEntryReviewStepCandidatesFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryReviewStepCandidates",
    register(container) {
        container.register(ListCmsEntryReviewStepCandidatesUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviewStepCandidates/index.ts`:

```ts
export { ListCmsEntryReviewStepCandidatesUseCase } from "./abstractions.js";
export type { ListCmsEntryReviewStepCandidatesInput } from "./abstractions.js";
```

- [ ] **Step 6: InspectCmsEntryRouting**

Create `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingInspection } from "@webiny/api-workflows/domain/routing/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import type { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";

export interface InspectCmsEntryRoutingInput {
    /** The step config as the editor holds it, unsaved; the engine validates it. */
    stepConfig: unknown;
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    requesterId: string;
    /** An entry folder of the model; missing, `null` or "root" is the root. */
    folderId?: string | null;
}

export interface IInspectCmsEntryRoutingUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
    inspect: InspectRoutingUseCase.Error;
}

type UseCaseError =
    IInspectCmsEntryRoutingUseCaseErrors[keyof IInspectCmsEntryRoutingUseCaseErrors];

export interface IInspectCmsEntryRoutingUseCase {
    execute(input: InspectCmsEntryRoutingInput): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The workflow editor's rule inspector for CMS entries (spec 6, D45, D95, D118, R121): `editor`
 * only (R125); read access at folder level (A47).
 */
export const InspectCmsEntryRoutingUseCase = createAbstraction<IInspectCmsEntryRoutingUseCase>(
    "InspectCmsEntryRoutingUseCase"
);

export namespace InspectCmsEntryRoutingUseCase {
    export type Interface = IInspectCmsEntryRoutingUseCase;
    export type Input = InspectCmsEntryRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/InspectCmsEntryRoutingUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { InspectRoutingUseCase } from "@webiny/api-workflows/features/routing/InspectRouting/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { toCmsFolderType } from "~/utils/folderType.js";
import { InspectCmsEntryRoutingUseCase as UseCase } from "./abstractions.js";

/**
 * The folder type is derived from the model (`cms:<modelId>`, R121); the CMS folder port refuses a
 * folder of another type, which the engine reports as a routing failure.
 */
class InspectCmsEntryRoutingUseCaseImpl implements UseCase.Interface {
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

        const modelId = getModelIdFromAppName(input.model);
        if (!modelId) {
            return Result.fail(
                new WorkflowValidationError("Routing can only be inspected for a CMS model.")
            );
        }
        const folderId = input.folderId && input.folderId !== ROOT_FOLDER ? input.folderId : null;

        return this.inspectRouting.execute({
            stepConfig: input.stepConfig,
            model: input.model,
            requesterId: input.requesterId,
            folder: folderId ? { id: folderId, type: toCmsFolderType(modelId) } : null,
            now: new Date()
        });
    }
}

export const InspectCmsEntryRoutingUseCase = UseCase.createImplementation({
    implementation: InspectCmsEntryRoutingUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, InspectRoutingUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { InspectCmsEntryRoutingUseCase } from "./InspectCmsEntryRoutingUseCase.js";

export const InspectCmsEntryRoutingFeature = createFeature({
    name: "CmsWorkflows/InspectCmsEntryRouting",
    register(container) {
        container.register(InspectCmsEntryRoutingUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/InspectCmsEntryRouting/index.ts`:

```ts
export { InspectCmsEntryRoutingUseCase } from "./abstractions.js";
export type { InspectCmsEntryRoutingInput } from "./abstractions.js";
```

- [ ] **Step 7: CmsEntryFolderExists**

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface CmsEntryFolderExistsInput {
    id: string;
    /** ACO folder type, `cms:<modelId>`. */
    type: string;
}

export interface ICmsEntryFolderExistsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = ICmsEntryFolderExistsUseCaseErrors[keyof ICmsEntryFolderExistsUseCaseErrors];

export interface ICmsEntryFolderExistsUseCase {
    execute(input: CmsEntryFolderExistsInput): Promise<Result<boolean, UseCaseError>>;
}

/**
 * Whether a folder a rule names still exists (D69, R125): `editor` only, the answer only, for
 * folders the editor may not be able to open.
 */
export const CmsEntryFolderExistsUseCase = createAbstraction<ICmsEntryFolderExistsUseCase>(
    "CmsEntryFolderExistsUseCase"
);

export namespace CmsEntryFolderExistsUseCase {
    export type Interface = ICmsEntryFolderExistsUseCase;
    export type Input = CmsEntryFolderExistsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/CmsEntryFolderExistsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";
import { CmsEntryFolderExistsUseCase as UseCase } from "./abstractions.js";

class CmsEntryFolderExistsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private folders: CmsEntryFolderExistsService.Interface
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
            return Result.ok(await this.folders.exists({ id: input.id, type: input.type }));
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
    }
}

export const CmsEntryFolderExistsUseCase = UseCase.createImplementation({
    implementation: CmsEntryFolderExistsUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, CmsEntryFolderExistsService]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsEntryFolderExistsUseCase } from "./CmsEntryFolderExistsUseCase.js";

export const CmsEntryFolderExistsFeature = createFeature({
    name: "CmsWorkflows/CmsEntryFolderExists",
    register(container) {
        container.register(CmsEntryFolderExistsUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CmsEntryFolderExists/index.ts`:

```ts
export { CmsEntryFolderExistsUseCase } from "./abstractions.js";
export type { CmsEntryFolderExistsInput } from "./abstractions.js";
```

- [ ] **Step 8: Register**

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`, add the imports after the `CancelCmsEntryReviewsForDeleteFeature` import:

```ts
import { ReassignCmsEntryReviewStepFeature } from "./ReassignCmsEntryReviewStep/feature.js";
import { ListCmsEntryStepCandidatesFeature } from "./ListCmsEntryStepCandidates/feature.js";
import { ListCmsEntryReviewStepCandidatesFeature } from "./ListCmsEntryReviewStepCandidates/feature.js";
import { InspectCmsEntryRoutingFeature } from "./InspectCmsEntryRouting/feature.js";
import { CmsEntryFolderExistsFeature } from "./CmsEntryFolderExists/feature.js";
```

add after `CancelCmsEntryReviewFeature.register(container);`:

```ts
        ReassignCmsEntryReviewStepFeature.register(container);
```

and add before the `// Confirm path for trash and delete ...` comment:

```ts
        // Routing: candidates for the request and reassign dialogs, the editor's
        // inspector and folder existence (R120, R121, R125)
        ListCmsEntryStepCandidatesFeature.register(container);
        ListCmsEntryReviewStepCandidatesFeature.register(container);
        InspectCmsEntryRoutingFeature.register(container);
        CmsEntryFolderExistsFeature.register(container);

```

- [ ] **Step 9: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run, one at a time:
`yarn test:os packages/api-headless-cms-workflows/__tests__/wrappers/routingWrappers.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 10: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the cms reassign, step candidate, inspector and folder existence wrappers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
