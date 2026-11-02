### Task 2: Folder port, folder-level read check port method, `RoutingEvaluatorService`

Spec 6, D20, D21, D45, D61, D89, D97, D118, R110, R111, R112, R113, R114, R121 (port method only), R129, A47, A50, SEC-66. This task builds the one place that decides who may get a step. The step-reach resolver (Task 3), `InspectRoutingUseCase`, `ListStepCandidatesUseCase` and `ReassignReviewStepUseCase` (4.2) all use it.

- `ReviewTargetFolderChain` (R114) is a new engine port, one per namespace like `ReviewTargetLoader`: `canHandle(model)` and `listFolderChainIds({ model, folderId })`, which returns the folder and its ancestors, nearest first. The apps implement it in 4.3 / 4.4. If no implementation matches while a folder rule needs the chain, evaluation fails. If the port throws, the throw propagates, and the resolver falls through to the pool (R116, Task 3).
- `ReviewTargetReadAccess.canUserReadInFolder({ userId, model, folderId })` is the new folder-level read check: model read plus folder content read as that user, and model read only for the root folder (`folderId: null`). It serves the inspector and anything else without a target revision. Both app implementations get a fail-closed `false` here; 4.3 Task 8 and 4.4 Task 11 replace them.
- `RoutingEvaluatorService` (DI service, user rule) has three methods:
  - `evaluate(params)` runs the order of R110: the pick (when the step allows picks), then the rules (the first whose conditions all match and whose target is valid), then the strategy, then the pool. For a person target (pick, rule user target), validity checks in this order: not the requester, a member of the step's teams, not actively excluded, can read (R112). An invalid target writes a skip record with a fixed reason and evaluation goes on. A team target narrows the candidates to that team and sets `ruleId` (R109). The strategy runs over the candidates (R111): members of the candidate teams, minus the requester, minus active exclusions, sorted by user id. Read access is checked lazily in that order and stops at the first readable candidate; each unreadable one before it writes a skip. This task orders candidates by user id; Task 3 adds the round-robin rotation and least-loaded order through `RoutingStrategyService`. With no readable candidate the step goes to the pool with `"No eligible candidate; the step went to the pool."`. The trace has one entry per evaluated rule: `matched`, `notMatched`, or `skipped` with a reason (R121). For an excluded rule user target the trace shows the exclusion's own reason, or `"Excluded from reviews."` when it has none (R129); the record keeps the fixed reason. `skipped` lists every person skipped as a pick, a rule target or a strategy candidate refused read access, as `{ userId, displayName, reason }` with the trace's reasons (R129, D118); `displayName` is `null` for a user who is not a member of the step's teams.
  - `listMembers(params)`: every member of the given teams except the requester, sorted by user id, each with the active exclusion (or `null`) and a read check. 4.2 `ListStepCandidatesUseCase` builds its rows from this.
  - `checkUser(params)`: the person-target validity of one user (R112), with the user's display name when they are a member. 4.2 reassign uses it.
- Dependency rules: `ListUsersUseCase` runs inside `withoutAuthorization` (only that call). Read checks run as the request identity (SEC-66). Exclusions come from `GetWorkflowSettingsUseCase({ includeExpired: true })` filtered with `filterActiveExclusions(exclusions, now)`. Requester teams come from `ListUserTeamsUseCase(requesterId)`, read only when a rule with a `requesterTeamId` condition is reached; a failure means no teams (R113). A failed `ListUsers` or settings result fails with `RoutingDependencyError` (`Workflows/Routing/Dependency`). Throws propagate.
- Rule conditions are the pure `matchRoutingRuleConditions(conditions, facts)` (R113). `modelId` compares against `getNamespaceModelId(model)`: `cms.article` gives `article`, `wb.page` gives `page`. A folder condition needs a target folder of the same `type`. With `includeDescendants` it matches when the rule folder id is in the chain or equals the target folder; otherwise only when it equals the target folder. A target in the root matches no folder condition, and the port is not asked. A rule without conditions always matches.
- Records hold only fixed reasons, never an exclusion's own text (D89, D97). The exclusion's own text reaches only the evaluation's `trace` and `skipped`, which only the editor-only inspector returns (R129).
- Requester teams and the folder chain are read lazily, on the first rule whose conditions need them, so an earlier rule decides without those lookups. An API-key requester is not an admin user, so the team lookup returns no teams and a `requesterTeamId` rule does not match (R113).

**Files:**
- Create: `packages/api-workflows/src/domain/routing/reasons.ts`
- Create: `packages/api-workflows/src/domain/routing/errors.ts`
- Create: `packages/api-workflows/src/domain/routing/types.ts`
- Create: `packages/api-workflows/src/domain/routing/getNamespaceModelId.ts`
- Create: `packages/api-workflows/src/domain/routing/matchRoutingRuleConditions.ts`
- Create: `packages/api-workflows/src/domain/routing/getRoutingUserSkipReason.ts`
- Create: `packages/api-workflows/src/domain/routing/listRoutingCandidates.ts`
- Create: `packages/api-workflows/src/domain/routing/toRoutingEvaluation.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetFolderChain/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetFolderChain/index.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/abstractions.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/feature.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetReadAccess.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetReadAccess.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeListUsers.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeWorkflowSettings.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetReadAccess.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetFolderChain.ts`
- Create: `packages/api-workflows/__tests__/__helpers/routingContext.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Test: `packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts`
- Test: `packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts`

**Interfaces:**
- Consumes: `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`, `execute({ where: { id_in?, teams_in? } }): Promise<Result<AdminUser[], Error>>`, needs `withoutAuthorization`), `ListUserTeamsUseCase.execute(userId): Promise<Result<Team[], Error>>`, `IdentityContext.withoutAuthorization(cb)`, `GetWorkflowSettingsUseCase.execute({ includeExpired: true })`, `filterActiveExclusions(exclusions, now: Date)`, `ReviewTargetReadAccess.canUserRead({ userId, model, targetId, targetRevisionId })`, `ReviewStepConfig` / `RoutingRuleConditions` / `RoutingStrategy` (`domain/workflow/types.ts`), `AssignmentDecision`, `AssignmentSource` (Task 1), `TargetContextFolder`.
- Produces (Task 3 and 4.2 use these names exactly):
  - `ReviewTargetFolderChain` (`features/review/ReviewTargetFolderChain/index.js`): `IReviewTargetFolderChain { canHandle(model: string): boolean; listFolderChainIds(params: ReviewTargetFolderChainParams): Promise<string[]> }`, `ReviewTargetFolderChainParams { model: string; folderId: string }`; namespace `Interface`, `Params`.
  - `ReviewTargetReadAccess.Interface.canUserReadInFolder(params: ReviewTargetFolderReadParams): Promise<boolean>`, `ReviewTargetFolderReadParams { userId: string; model: string; folderId: string | null }`; namespace type `FolderReadParams`.
  - `domain/routing/reasons.ts`: `ROUTING_SKIP_REASONS = { requester: "The requester cannot review.", notMember: "Not a member of the step's teams.", excluded: "Excluded from reviews.", cannotRead: "Cannot read this content." } as const`, `type RoutingSkipReason`, `ROUTING_FAILED_REASON = "Routing failed; the step went to the pool."` (used by Task 3), `ROUTING_NO_CANDIDATE_REASON = "No eligible candidate; the step went to the pool."`.
  - `domain/routing/errors.ts`: `RoutingDependencyError` (code `Workflows/Routing/Dependency`, data `{ cause: { code?, message } }`).
  - `domain/routing/types.ts`:
    - `RoutingTargetReadScope { type: "target"; targetId: string; targetRevisionId: string }`, `RoutingFolderReadScope { type: "folder"; folderId: string | null }`, `type RoutingReadScope = RoutingTargetReadScope | RoutingFolderReadScope`.
    - `RoutingUser { id: string; displayName: string }`, `RoutingDirectoryUser { id: string; displayName: string; teams?: string[] }`.
    - `type RoutingSource = Extract<AssignmentSource, "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool">`, `type RoutingStrategyName = Exclude<RoutingStrategy, "none">`.
    - `type RoutingTraceOutcome = "matched" | "notMatched" | "skipped"`, `RoutingTraceEntry { ruleId: string; outcome: RoutingTraceOutcome; reason: string | null }`.
    - `RoutingRuleFacts { requesterId: string; requesterTeamIds: string[]; modelId: string; folder: TargetContextFolder | null; folderChainIds: string[] }`.
    - `RoutingEvaluateParams { config: ReviewStepConfig; model: string; workflowId: string | null; stepId: string; requesterId: string; pickedUserId: string | null; folder: TargetContextFolder | null; read: RoutingReadScope; now: Date }`.
    - `RoutingSkippedUser { userId: string; displayName: string | null; reason: string }` (R129; `displayName` `null` for a non-member).
    - `RoutingEvaluation { owner: RoutingUser | null; source: RoutingSource; ruleId: string | null; strategy: RoutingStrategy; candidateTeamIds: string[]; reason: string | null; records: AssignmentDecision[]; trace: RoutingTraceEntry[]; skipped: RoutingSkippedUser[] }`. `strategy` is the step's configured strategy, `records` holds the skips and then one outcome (fixed reasons only), `skipped` the skipped people with the trace's reasons (R129).
    - `RoutingMembersParams { teamIds: string[]; requesterId: string; model: string; read: RoutingReadScope; now: Date }`, `RoutingMember { id: string; displayName: string; teamIds: string[]; exclusion: WorkflowExclusion | null; canRead: boolean }`.
    - `RoutingUserCheckParams { userId: string; teamIds: string[]; requesterId: string; model: string; read: RoutingReadScope; now: Date }`, `RoutingUserCheck { user: RoutingUser | null; skipReason: RoutingSkipReason | null }`. The user is valid when `skipReason` is `null`; `user` is set whenever they are a member.
  - Pure functions: `getNamespaceModelId(model: string): string`, `matchRoutingRuleConditions(conditions: RoutingRuleConditions, facts: RoutingRuleFacts): boolean`, `getRoutingUserSkipReason(params: RoutingUserEligibilityParams): RoutingSkipReason | null` (`RoutingUserEligibilityParams { userId; requesterId; memberIds: string[]; exclusions: WorkflowExclusion[] }`), `listRoutingCandidates(input: RoutingCandidatesInput): RoutingUser[]` (`RoutingCandidatesInput { members: RoutingDirectoryUser[]; candidateTeamIds: string[]; requesterId: string; exclusions: WorkflowExclusion[] }`), `toRoutingEvaluation(input: RoutingDecisionInput): RoutingEvaluation` (`RoutingDecisionInput` carries `skips`, `trace` and `skipped`).
  - `RoutingEvaluatorService` (`features/routing/RoutingEvaluatorService/index.js`):
    ```ts
    interface IRoutingEvaluatorService {
        evaluate(params: RoutingEvaluateParams): Promise<Result<RoutingEvaluation, RoutingDependencyError>>;
        listMembers(params: RoutingMembersParams): Promise<Result<RoutingMember[], RoutingDependencyError>>;
        checkUser(params: RoutingUserCheckParams): Promise<Result<RoutingUserCheck, RoutingDependencyError>>;
    }
    ```
    Namespace types: `Interface`, `EvaluateParams`, `Evaluation`, `MembersParams`, `Member`, `UserCheckParams`, `UserCheck`, `Error`, `EvaluateReturn`, `MembersReturn`, `UserCheckReturn`. All three methods may throw when a port throws; callers catch (Task 3 resolver; 4.2 use cases).
  - Test helpers: `FakeListUsers` (`calls: ListUsersCall[]`, `failuresLeft`, `watch(identityContext)`), `FakeWorkflowSettings` (`exclusions`, `inputs`, `failuresLeft`), `FakeReviewTargetReadAccess` with `readableUsers`, `readChecks`, `throwingReadChecks`, `FakeReviewTargetFolderChain` with `folderChains`, `folderChainCalls`, `folderChainFaults`, and `createRoutingContext(params?)` / `resetRoutingFakes()` / `ROUTING_USERS` / `LEGAL_TEAM_ID` in `__tests__/__helpers/routingContext.ts`.

- [ ] **Step 1: Write the helpers and the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeListUsers.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";

export interface FakeUser {
    id: string;
    displayName: string;
    teams: string[];
}

export interface ListUsersCall {
    input: ListUsersInput;
    /** Whether authorization was on during the call; `null` before `watch`. */
    authorizationEnabled: boolean | null;
}

/**
 * Admin users from a fixed list, filtered by `id_in` and `teams_in` like api-core does. Records
 * every call and fails the next `failuresLeft` calls with a storage error. Register with
 * `container.registerInstance(ListUsersUseCase, fake)` and call `watch` once the context exists.
 */
export class FakeListUsers implements ListUsersUseCase.Interface {
    public readonly calls: ListUsersCall[] = [];
    public failuresLeft = 0;
    private identityContext: IdentityContext.Interface | null = null;

    public constructor(private users: FakeUser[]) {}

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async execute(
        input: ListUsersInput = {}
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        this.calls.push({
            input: structuredClone(input),
            authorizationEnabled: this.identityContext
                ? this.identityContext.isAuthorizationEnabled()
                : null
        });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        const where = input.where ?? {};
        const users = this.users.filter(user => {
            const idMatches = !where.id_in || where.id_in.includes(user.id);
            const teamMatches =
                !where.teams_in || where.teams_in.some(teamId => user.teams.includes(teamId));
            return idMatches && teamMatches;
        });
        return Result.ok(
            users.map(user => ({
                id: user.id,
                displayName: user.displayName,
                email: `${user.id}@webiny.test`,
                teams: [...user.teams],
                tenant: "root",
                createdOn: "2026-10-01T00:00:00.000Z",
                createdBy: null
            }))
        );
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeWorkflowSettings.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

/**
 * Settings with the given exclusions, expired ones included (the caller filters). Records every
 * input and fails the next `failuresLeft` calls. Register with
 * `container.registerInstance(GetWorkflowSettingsUseCase, fake)`.
 */
export class FakeWorkflowSettings implements GetWorkflowSettingsUseCase.Interface {
    public exclusions: WorkflowExclusion[] = [];
    public readonly inputs: GetWorkflowSettingsUseCase.Input[] = [];
    public failuresLeft = 0;

    public async execute(
        input: GetWorkflowSettingsUseCase.Input = {}
    ): GetWorkflowSettingsUseCase.Return {
        this.inputs.push({ ...input });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(
                new WorkflowSettingsPersistenceError(new Error("Storage is not available."))
            );
        }
        return Result.ok({ exclusions: structuredClone(this.exclusions) });
    }
}
```

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetReadAccess.ts`:

```ts
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export type ReadCheckScope = "target" | "folder";

export interface ReadCheckCall {
    userId: string;
    scope: ReadCheckScope;
    targetRevisionId: string | null;
    folderId: string | null;
    /** Must be `true`: read checks run as the request identity (SEC-66). */
    authorizationEnabled: boolean;
}

/** Users the fake lets read every "cms.article" target and folder. Reset per test. */
export const readableUsers = new Set<string>();

/** Every read check, in order. Reset per test. */
export const readChecks: ReadCheckCall[] = [];

/** Users whose read check throws. Reset per test. */
export const throwingReadChecks = new Set<string>();

class FakeReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public canHandle(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        readChecks.push({
            userId: params.userId,
            scope: "target",
            targetRevisionId: params.targetRevisionId,
            folderId: null,
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        if (throwingReadChecks.has(params.userId)) {
            throw new Error("The read check crashed.");
        }
        return readableUsers.has(params.userId);
    }

    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        readChecks.push({
            userId: params.userId,
            scope: "folder",
            targetRevisionId: null,
            folderId: params.folderId,
            authorizationEnabled: this.identityContext.isAuthorizationEnabled()
        });
        if (throwingReadChecks.has(params.userId)) {
            throw new Error("The read check crashed.");
        }
        return readableUsers.has(params.userId);
    }
}

export const FakeReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: FakeReviewTargetReadAccessImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetFolderChain.ts`:

```ts
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

/** Folder id to its chain (the folder, then ancestors). Unknown folders are their own chain. */
export const folderChains = new Map<string, string[]>();

/** Every chain request, in order. Reset per test. */
export const folderChainCalls: ReviewTargetFolderChain.Params[] = [];

export interface FolderChainFaults {
    throwNext: boolean;
}

export const folderChainFaults: FolderChainFaults = { throwNext: false };

class FakeReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public canHandle(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        folderChainCalls.push({ ...params });
        if (folderChainFaults.throwNext) {
            folderChainFaults.throwNext = false;
            throw new Error("The folder read crashed.");
        }
        return [...(folderChains.get(params.folderId) ?? [params.folderId])];
    }
}

export const FakeReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: FakeReviewTargetFolderChainImpl,
    dependencies: []
});
```

Create `packages/api-workflows/__tests__/__helpers/routingContext.ts`:

```ts
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { createContextHandler } from "./handler.js";
import { FakeListUsers, type FakeUser } from "./FakeListUsers.js";
import { createTeam, FakeListUserTeams } from "./FakeListUserTeams.js";
import { FakeWorkflowSettings } from "./FakeWorkflowSettings.js";
import {
    FakeReviewTargetReadAccess,
    readableUsers,
    readChecks,
    throwingReadChecks
} from "./FakeReviewTargetReadAccess.js";
import {
    FakeReviewTargetFolderChain,
    folderChainCalls,
    folderChainFaults,
    folderChains
} from "./FakeReviewTargetFolderChain.js";
import { OTHER_TEAM_ID, requester, REVIEW_TEAM_ID } from "./fixtures.js";

export const LEGAL_TEAM_ID = "team-legal";

/**
 * Reviewers Anna, Bob and Cara (Cara also in legal), Dan in another team, and the requester, who
 * is a member of the reviewers' team too. Sorted by id: anna, bob, cara, dan, requester.
 */
export const ROUTING_USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna", teams: [REVIEW_TEAM_ID] },
    { id: "user-bob", displayName: "Bob", teams: [REVIEW_TEAM_ID] },
    { id: "user-cara", displayName: "Cara", teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID] },
    { id: "user-dan", displayName: "Dan", teams: [OTHER_TEAM_ID] },
    { id: requester.id, displayName: requester.displayName, teams: [REVIEW_TEAM_ID] }
];

/** Clears the module-level state of the read access and folder chain fakes. */
export const resetRoutingFakes = (): void => {
    readableUsers.clear();
    readChecks.length = 0;
    throwingReadChecks.clear();
    folderChains.clear();
    folderChainCalls.length = 0;
    folderChainFaults.throwNext = false;
};

/**
 * Context with the routing fakes: `ROUTING_USERS` as the admin users, the requester in the
 * "other" team, settings without exclusions, and the "cms.article" read access and folder chain
 * fakes. `params.setup` runs after the fakes are registered.
 */
export const createRoutingContext = async (params: CmsTestHandlerParams = {}) => {
    const users = new FakeListUsers(ROUTING_USERS);
    const teams = new FakeListUserTeams(new Map([[requester.id, [createTeam(OTHER_TEAM_ID)]]]));
    const settings = new FakeWorkflowSettings();
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            container.registerInstance(ListUserTeamsUseCase, teams);
            container.registerInstance(GetWorkflowSettingsUseCase, settings);
            container.register(FakeReviewTargetReadAccess);
            container.register(FakeReviewTargetFolderChain);
            await params.setup?.(container);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    return { context, users, teams, settings };
};
```

Create `packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getNamespaceModelId } from "~/domain/routing/getNamespaceModelId.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingRuleFacts } from "~/domain/routing/types.js";

const FACTS: RoutingRuleFacts = {
    requesterId: "user-requester",
    requesterTeamIds: ["team-authors"],
    modelId: "article",
    folder: { id: "folder-child", type: "cms:article" },
    folderChainIds: ["folder-child", "folder-parent", "folder-root"]
};

describe("getNamespaceModelId (R113)", () => {
    it("takes what follows the app prefix", () => {
        expect(getNamespaceModelId("cms.article")).toBe("article");
        expect(getNamespaceModelId("cms.blog.post")).toBe("blog.post");
        expect(getNamespaceModelId("wb.page")).toBe("page");
        expect(getNamespaceModelId("plain")).toBe("plain");
    });
});

describe("matchRoutingRuleConditions (spec 6, R113)", () => {
    it("matches a rule without conditions", () => {
        expect(matchRoutingRuleConditions({}, FACTS)).toBe(true);
    });

    it("matches the requester, the requester's team and the model id", () => {
        expect(matchRoutingRuleConditions({ requesterUserId: "user-requester" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ requesterUserId: "user-other" }, FACTS)).toBe(false);
        expect(matchRoutingRuleConditions({ requesterTeamId: "team-authors" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ requesterTeamId: "team-other" }, FACTS)).toBe(false);
        expect(matchRoutingRuleConditions({ modelId: "article" }, FACTS)).toBe(true);
        expect(matchRoutingRuleConditions({ modelId: "page" }, FACTS)).toBe(false);
    });

    it("needs every condition to match", () => {
        expect(
            matchRoutingRuleConditions(
                { requesterUserId: "user-requester", modelId: "page" },
                FACTS
            )
        ).toBe(false);
    });

    it("matches a folder exactly, or with its descendants through the chain", () => {
        const parent = { id: "folder-parent", type: "cms:article" };

        expect(
            matchRoutingRuleConditions({ folder: { ...parent, includeDescendants: false } }, FACTS)
        ).toBe(false);
        expect(
            matchRoutingRuleConditions({ folder: { ...parent, includeDescendants: true } }, FACTS)
        ).toBe(true);
        expect(
            matchRoutingRuleConditions(
                { folder: { id: "folder-child", type: "cms:article", includeDescendants: false } },
                FACTS
            )
        ).toBe(true);
        expect(
            matchRoutingRuleConditions(
                { folder: { id: "folder-child", type: "cms:article", includeDescendants: true } },
                { ...FACTS, folderChainIds: [] }
            )
        ).toBe(true);
    });

    it("needs the same folder type, and never matches a target in the root", () => {
        const folder = { id: "folder-parent", type: "wb:page", includeDescendants: true };

        expect(matchRoutingRuleConditions({ folder }, FACTS)).toBe(false);
        expect(
            matchRoutingRuleConditions(
                { folder: { ...folder, type: "cms:article" } },
                { ...FACTS, folder: null, folderChainIds: [] }
            )
        ).toBe(false);
    });
});

describe("getRoutingUserSkipReason (R112)", () => {
    const params = {
        userId: "user-bob",
        requesterId: "user-requester",
        memberIds: ["user-bob", "user-requester"],
        exclusions: []
    };

    it("checks the requester, then membership, then exclusions", () => {
        expect(getRoutingUserSkipReason(params)).toBeNull();
        expect(getRoutingUserSkipReason({ ...params, userId: "user-requester" })).toBe(
            ROUTING_SKIP_REASONS.requester
        );
        expect(getRoutingUserSkipReason({ ...params, memberIds: ["user-requester"] })).toBe(
            ROUTING_SKIP_REASONS.notMember
        );
        expect(
            getRoutingUserSkipReason({
                ...params,
                exclusions: [{ userId: "user-bob", reason: "On leave until May" }]
            })
        ).toBe(ROUTING_SKIP_REASONS.excluded);
    });
});
```

Create `packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { ARTICLE_MODEL, NOW, requester, REVIEW_TEAM_ID, targetContext } from "~tests/__helpers/fixtures.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { folderChainCalls, folderChains } from "~tests/__helpers/FakeReviewTargetFolderChain.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type {
    ReviewStepAssignmentConfig,
    ReviewStepConfig,
    RoutingRule
} from "~/domain/workflow/types.js";
import type { RoutingEvaluateParams } from "~/domain/routing/types.js";
import {
    ROUTING_NO_CANDIDATE_REASON,
    ROUTING_SKIP_REASONS
} from "~/domain/routing/reasons.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const TARGET_READ = {
    type: "target" as const,
    targetId: "article-1",
    targetRevisionId: "article-1#0001"
};

const stepConfig = (assignment: Partial<ReviewStepAssignmentConfig> = {}): ReviewStepConfig => {
    return {
        teams: [REVIEW_TEAM_ID],
        assignment: { strategy: "none", allowManualPick: true, rules: [], ...assignment }
    };
};

const evaluateParams = (overrides: Partial<RoutingEvaluateParams> = {}): RoutingEvaluateParams => {
    return {
        config: stepConfig(),
        model: ARTICLE_MODEL,
        workflowId: "workflow-1",
        stepId: "legal",
        requesterId: requester.id,
        pickedUserId: null,
        folder: targetContext.folder,
        read: TARGET_READ,
        now: new Date(NOW),
        ...overrides
    };
};

const userRule = (id: string, userId: string, conditions: RoutingRule["conditions"] = {}) => {
    return { id, conditions, target: { type: "user" as const, id: userId } };
};

const teamRule = (id: string, teamId: string, conditions: RoutingRule["conditions"] = {}) => {
    return { id, conditions, target: { type: "team" as const, id: teamId } };
};

const skip = (
    userId: string,
    source: AssignmentDecision["source"],
    reason: string,
    ruleId: string | null = null
): AssignmentDecision => {
    return { kind: "skip", userId, source, ruleId, by: null, reason };
};

const outcome = (
    userId: string | null,
    source: AssignmentDecision["source"],
    ruleId: string | null = null,
    reason: string | null = null
): AssignmentDecision => {
    return { kind: "outcome", userId, source, ruleId, by: null, reason };
};

const createEvaluatorContext = async () => {
    const routing = await createRoutingContext();
    return {
        ...routing,
        evaluator: routing.context.container.resolve(RoutingEvaluatorService)
    };
};

describe("RoutingEvaluatorService.evaluate: pick", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("gives the step to a valid pick", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: BOB.id }));

        expect(result.value).toEqual({
            owner: BOB,
            source: "picked",
            ruleId: null,
            strategy: "none",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [outcome(BOB.id, "picked")],
            trace: [],
            skipped: []
        });
        expect(users.calls.map(call => call.input)).toEqual([
            { where: { teams_in: [REVIEW_TEAM_ID] } }
        ]);
        expect(readChecks).toMatchObject([
            { userId: BOB.id, scope: "target", targetRevisionId: "article-1#0001" }
        ]);
    });

    it("ignores the pick when the step does not allow picks, without reading users", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({ allowManualPick: false }),
                pickedUserId: BOB.id
            })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            records: [outcome(null, "pool")]
        });
        expect(users.calls).toEqual([]);
        expect(settings.inputs).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it.each([
        ["the requester", requester.id, ROUTING_SKIP_REASONS.requester],
        ["a user outside the step's teams", "user-dan", ROUTING_SKIP_REASONS.notMember],
        ["an excluded user", ANNA.id, ROUTING_SKIP_REASONS.excluded],
        ["a user who cannot read the content", BOB.id, ROUTING_SKIP_REASONS.cannotRead]
    ])("skips a pick of %s with a fixed reason and goes on", async (_label, userId, reason) => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave until May" }];
        readableUsers.add(ANNA.id);
        readableUsers.add(requester.id);
        readableUsers.add("user-dan");

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: userId }));

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            records: [skip(userId, "picked", reason), outcome(null, "pool")]
        });
        // An exclusion's own reason never reaches a record (D89, D97); only the inspector's
        // `skipped` list shows it (R129).
        expect(JSON.stringify(result.value?.records)).not.toContain("On leave");
        expect(result.value?.skipped).toMatchObject([
            { userId, reason: userId === ANNA.id ? "On leave until May" : reason }
        ]);
    });

    it("reads exclusions with the expired ones and treats an expired one as no exclusion", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, endsOn: "2026-10-01T00:00:00.000Z" }];
        readableUsers.add(ANNA.id);

        const result = await evaluator.evaluate(evaluateParams({ pickedUserId: ANNA.id }));

        expect(result.value?.owner).toEqual(ANNA);
        expect(settings.inputs).toEqual([{ includeExpired: true }]);
    });

    it("answers no access when no read check matches the namespace", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({ model: "cms.other", pickedUserId: BOB.id })
        );

        expect(result.value?.records).toEqual([
            skip(BOB.id, "picked", ROUTING_SKIP_REASONS.cannotRead),
            outcome(null, "pool")
        ]);
        expect(readChecks).toEqual([]);
    });

    it("asks the folder-level read check when there is no target revision", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: BOB.id,
                read: { type: "folder", folderId: "folder-1" }
            })
        );

        expect(result.value?.owner).toEqual(BOB);
        expect(readChecks).toMatchObject([
            { userId: BOB.id, scope: "folder", folderId: "folder-1" }
        ]);
    });

    it("reads users as the system and checks read access as the request identity (SEC-66)", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        await evaluator.evaluate(evaluateParams({ pickedUserId: BOB.id }));

        expect(users.calls.map(call => call.authorizationEnabled)).toEqual([false]);
        expect(readChecks.map(call => call.authorizationEnabled)).toEqual([true]);
    });
});

describe("RoutingEvaluatorService.evaluate: rules", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("takes the first rule whose conditions match and whose target is valid", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-1", BOB.id, { requesterUserId: "user-someone" }),
                        userRule("rule-2", "user-dan", { modelId: "article" }),
                        userRule("rule-3", CARA.id, { requesterTeamId: "team-other" })
                    ]
                })
            })
        );

        expect(result.value).toEqual({
            owner: CARA,
            source: "rule",
            ruleId: "rule-3",
            strategy: "none",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [
                skip("user-dan", "rule", ROUTING_SKIP_REASONS.notMember, "rule-2"),
                outcome(CARA.id, "rule", "rule-3")
            ],
            trace: [
                { ruleId: "rule-1", outcome: "notMatched", reason: null },
                {
                    ruleId: "rule-2",
                    outcome: "skipped",
                    reason: ROUTING_SKIP_REASONS.notMember
                },
                { ruleId: "rule-3", outcome: "matched", reason: null }
            ],
            skipped: [
                { userId: "user-dan", displayName: null, reason: ROUTING_SKIP_REASONS.notMember }
            ]
        });
        // Read lazily: the team lookup runs when rule 3 is reached, once.
        expect(teams.calls).toEqual([requester.id]);
    });

    it("shows an excluded rule target's own reason in the trace, never in the record (R129)", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [
            { userId: ANNA.id, reason: "On leave until May" },
            { userId: BOB.id }
        ];
        readableUsers.add(ANNA.id);
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-anna", ANNA.id),
                        userRule("rule-bob", BOB.id),
                        userRule("rule-cara", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-cara",
            records: [
                skip(ANNA.id, "rule", ROUTING_SKIP_REASONS.excluded, "rule-anna"),
                skip(BOB.id, "rule", ROUTING_SKIP_REASONS.excluded, "rule-bob"),
                outcome(CARA.id, "rule", "rule-cara")
            ],
            trace: [
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave until May" },
                { ruleId: "rule-bob", outcome: "skipped", reason: ROUTING_SKIP_REASONS.excluded },
                { ruleId: "rule-cara", outcome: "matched", reason: null }
            ],
            skipped: [
                { userId: ANNA.id, displayName: "Anna", reason: "On leave until May" },
                { userId: BOB.id, displayName: "Bob", reason: ROUTING_SKIP_REASONS.excluded }
            ]
        });
        expect(JSON.stringify(result.value?.records)).not.toContain("On leave");
    });

    it("matches no requester team rule for a requester without teams, such as an API key (R113)", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                requesterId: "api-key-1",
                config: stepConfig({
                    rules: [
                        userRule("rule-team", BOB.id, { requesterTeamId: "team-other" }),
                        userRule("rule-any", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-any",
            trace: [
                { ruleId: "rule-team", outcome: "notMatched", reason: null },
                { ruleId: "rule-any", outcome: "matched", reason: null }
            ]
        });
        expect(teams.calls).toEqual(["api-key-1"]);
    });

    it("prefers a valid pick over the rules", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: BOB.id,
                config: stepConfig({ rules: [userRule("rule-1", CARA.id)] })
            })
        );

        expect(result.value).toMatchObject({ owner: BOB, source: "picked", trace: [] });
    });

    it("skips a rule user target who cannot read and takes the next rule", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [userRule("rule-1", BOB.id), userRule("rule-2", CARA.id)]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            ruleId: "rule-2",
            records: [
                skip(BOB.id, "rule", ROUTING_SKIP_REASONS.cannotRead, "rule-1"),
                outcome(CARA.id, "rule", "rule-2")
            ],
            trace: [
                { ruleId: "rule-1", outcome: "skipped", reason: ROUTING_SKIP_REASONS.cannotRead },
                { ruleId: "rule-2", outcome: "matched", reason: null }
            ]
        });
    });

    it("narrows the pool to a team target when the step has no strategy", async () => {
        const { evaluator, users } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({ rules: [teamRule("rule-legal", LEGAL_TEAM_ID)] })
            })
        );

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: "rule-legal",
            strategy: "none",
            candidateTeamIds: [LEGAL_TEAM_ID],
            reason: null,
            records: [outcome(null, "pool", "rule-legal")],
            trace: [{ ruleId: "rule-legal", outcome: "matched", reason: null }],
            skipped: []
        });
        expect(users.calls).toEqual([]);
    });

    it("matches folder rules on the target folder and its ancestors from the folder port", async () => {
        const { evaluator } = await createEvaluatorContext();
        folderChains.set("folder-1", ["folder-1", "folder-parent"]);
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        const parent = { id: "folder-parent", type: "cms:article" };

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-exact", CARA.id, {
                            folder: { ...parent, includeDescendants: false }
                        }),
                        userRule("rule-tree", BOB.id, {
                            folder: { ...parent, includeDescendants: true }
                        })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: BOB, ruleId: "rule-tree" });
        expect(folderChainCalls).toEqual([{ model: ARTICLE_MODEL, folderId: "folder-1" }]);
    });

    it("never matches a folder rule for a target in the root and does not ask the folder port", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(BOB.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                folder: null,
                config: stepConfig({
                    rules: [
                        userRule("rule-tree", BOB.id, {
                            folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
                        })
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            trace: [{ ruleId: "rule-tree", outcome: "notMatched", reason: null }]
        });
        expect(folderChainCalls).toEqual([]);
    });

    it("fails when a folder rule needs a folder chain and no port handles the namespace", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({
                model: "wb.page",
                folder: { id: "folder-1", type: "wb:page" },
                config: stepConfig({
                    rules: [
                        userRule("rule-tree", BOB.id, {
                            folder: { id: "folder-1", type: "wb:page", includeDescendants: true }
                        })
                    ]
                })
            })
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("treats a failed requester team lookup as no teams", async () => {
        const { evaluator, teams } = await createEvaluatorContext();
        teams.failuresLeft = 1;
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                config: stepConfig({
                    rules: [
                        userRule("rule-team", BOB.id, { requesterTeamId: "team-other" }),
                        userRule("rule-any", CARA.id)
                    ]
                })
            })
        );

        expect(result.value).toMatchObject({ owner: CARA, ruleId: "rule-any" });
    });
});

describe("RoutingEvaluatorService.evaluate: strategy candidates", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("never selects the requester, an excluded user or a user without read access", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(ANNA.id);
        readableUsers.add(requester.id);
        readableUsers.add(CARA.id);

        const result = await evaluator.evaluate(
            evaluateParams({
                pickedUserId: null,
                config: stepConfig({ strategy: "roundRobin" })
            })
        );

        expect(result.value).toEqual({
            owner: CARA,
            source: "roundRobin",
            ruleId: null,
            strategy: "roundRobin",
            candidateTeamIds: [REVIEW_TEAM_ID],
            reason: null,
            records: [
                skip(BOB.id, "roundRobin", ROUTING_SKIP_REASONS.cannotRead),
                outcome(CARA.id, "roundRobin")
            ],
            trace: [],
            // Excluded candidates and the requester are dropped without a skip (A50).
            skipped: [
                { userId: BOB.id, displayName: BOB.displayName, reason: ROUTING_SKIP_REASONS.cannotRead }
            ]
        });
        // Lazy: excluded users and the requester are never asked; asking stops at Cara.
        expect(readChecks.map(call => call.userId)).toEqual([BOB.id, CARA.id]);
    });

    it("goes to the pool with a reason when no candidate can read", async () => {
        const { evaluator } = await createEvaluatorContext();

        const result = await evaluator.evaluate(
            evaluateParams({ config: stepConfig({ strategy: "leastLoaded" }) })
        );

        expect(result.value).toMatchObject({
            owner: null,
            source: "pool",
            strategy: "leastLoaded",
            reason: ROUTING_NO_CANDIDATE_REASON,
            records: [
                skip(ANNA.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                skip(BOB.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                skip(CARA.id, "leastLoaded", ROUTING_SKIP_REASONS.cannotRead),
                outcome(null, "pool", null, ROUTING_NO_CANDIDATE_REASON)
            ]
        });
    });

    it("runs the strategy over a team target's members only", async () => {
        const { evaluator } = await createEvaluatorContext();
        readableUsers.add(ANNA.id);
        readableUsers.add(CARA.id);

        // Save-time validation needs a team target among the step's teams.
        const result = await evaluator.evaluate(
            evaluateParams({
                config: {
                    ...stepConfig({
                        strategy: "roundRobin",
                        rules: [teamRule("rule-legal", LEGAL_TEAM_ID)]
                    }),
                    teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID]
                }
            })
        );

        expect(result.value).toMatchObject({
            owner: CARA,
            source: "roundRobin",
            ruleId: "rule-legal",
            candidateTeamIds: [LEGAL_TEAM_ID],
            records: [outcome(CARA.id, "roundRobin", "rule-legal")]
        });
    });

    it("fails when users or settings cannot be read", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        const params = evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) });

        users.failuresLeft = 1;
        const usersFailed = await evaluator.evaluate(params);
        settings.failuresLeft = 1;
        const settingsFailed = await evaluator.evaluate(params);

        expect(usersFailed.error.code).toBe("Workflows/Routing/Dependency");
        expect(settingsFailed.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("lets a throwing read check propagate to the caller", async () => {
        const { evaluator } = await createEvaluatorContext();
        throwingReadChecks.add(ANNA.id);

        await expect(
            evaluator.evaluate(evaluateParams({ config: stepConfig({ strategy: "roundRobin" }) }))
        ).rejects.toThrow("The read check crashed.");
    });
});

describe("RoutingEvaluatorService.listMembers and checkUser", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("lists every member of the teams but the requester, by id, with exclusion and read access", async () => {
        const { evaluator, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id, reason: "On leave" }];
        readableUsers.add(BOB.id);

        const result = await evaluator.listMembers({
            teamIds: [REVIEW_TEAM_ID],
            requesterId: requester.id,
            model: ARTICLE_MODEL,
            read: TARGET_READ,
            now: new Date(NOW)
        });

        expect(result.value).toEqual([
            {
                ...ANNA,
                teamIds: [REVIEW_TEAM_ID],
                exclusion: { userId: ANNA.id, reason: "On leave" },
                canRead: false
            },
            { ...BOB, teamIds: [REVIEW_TEAM_ID], exclusion: null, canRead: true },
            {
                ...CARA,
                teamIds: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                exclusion: null,
                canRead: false
            }
        ]);
        expect(readChecks.map(call => call.userId)).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("fails listing members when users cannot be read", async () => {
        const { evaluator, users } = await createEvaluatorContext();
        users.failuresLeft = 1;

        const result = await evaluator.listMembers({
            teamIds: [REVIEW_TEAM_ID],
            requesterId: requester.id,
            model: ARTICLE_MODEL,
            read: TARGET_READ,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Routing/Dependency");
    });

    it("checks one user like a pick (R112)", async () => {
        const { evaluator, users, settings } = await createEvaluatorContext();
        settings.exclusions = [{ userId: ANNA.id }];
        readableUsers.add(ANNA.id);
        readableUsers.add(CARA.id);
        const check = (userId: string) => {
            return evaluator.checkUser({
                userId,
                teamIds: [REVIEW_TEAM_ID],
                requesterId: requester.id,
                model: ARTICLE_MODEL,
                read: TARGET_READ,
                now: new Date(NOW)
            });
        };

        expect((await check(CARA.id)).value).toEqual({ user: CARA, skipReason: null });
        expect((await check(requester.id)).value).toEqual({
            user: null,
            skipReason: ROUTING_SKIP_REASONS.requester
        });
        expect((await check("user-dan")).value).toEqual({
            user: null,
            skipReason: ROUTING_SKIP_REASONS.notMember
        });
        expect((await check(ANNA.id)).value).toEqual({
            user: ANNA,
            skipReason: ROUTING_SKIP_REASONS.excluded
        });
        expect((await check(BOB.id)).value).toEqual({
            user: BOB,
            skipReason: ROUTING_SKIP_REASONS.cannotRead
        });
        expect(users.calls[0]).toEqual({
            input: { where: { id_in: [CARA.id], teams_in: [REVIEW_TEAM_ID] } },
            authorizationEnabled: false
        });
        // The requester is refused without a lookup.
        expect(users.calls).toHaveLength(4);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the imports:

```ts
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/index.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
```

and replace:

```ts
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);
```

with:

```ts
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
        expect(container.resolveAll(RoutingEvaluatorService)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/routing/getNamespaceModelId.js`, `~/features/review/ReviewTargetFolderChain/index.js` and `~/features/routing/RoutingEvaluatorService/index.js`.

- [ ] **Step 3: The routing domain**

Create `packages/api-workflows/src/domain/routing/reasons.ts`:

```ts
/**
 * Fixed reasons on skip records and trace entries (R112). An exclusion's own text never goes
 * into a record (D89, D97); only the inspector's trace and skipped list show it (R129).
 */
export const ROUTING_SKIP_REASONS = {
    requester: "The requester cannot review.",
    notMember: "Not a member of the step's teams.",
    excluded: "Excluded from reviews.",
    cannotRead: "Cannot read this content."
} as const;

export type RoutingSkipReason = (typeof ROUTING_SKIP_REASONS)[keyof typeof ROUTING_SKIP_REASONS];

/** The pool reason when anything in resolution failed (R116). */
export const ROUTING_FAILED_REASON = "Routing failed; the step went to the pool.";

/** The pool reason when a strategy found nobody who can review (R111). */
export const ROUTING_NO_CANDIDATE_REASON = "No eligible candidate; the step went to the pool.";
```

Create `packages/api-workflows/src/domain/routing/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";

export interface RoutingDependencyErrorCause {
    code?: string;
    message: string;
}

export interface RoutingDependencyErrorData {
    cause: RoutingDependencyErrorCause;
}

/**
 * A lookup routing needs failed: users, settings or the folder chain (R116). The resolver turns
 * it into the pool; the inspector and candidate lists report it.
 */
export class RoutingDependencyError extends BaseError<RoutingDependencyErrorData> {
    override readonly code = "Workflows/Routing/Dependency" as const;

    constructor(error: PersistenceErrorSource) {
        super({
            message: error.message,
            data: { cause: { code: error.code, message: error.message } }
        });
    }
}
```

Create `packages/api-workflows/src/domain/routing/types.ts`:

```ts
import type { AssignmentDecision, AssignmentSource } from "~/domain/assignment/types.js";
import type { TargetContextFolder } from "~/domain/review/types.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import type { ReviewStepConfig, RoutingStrategy } from "~/domain/workflow/types.js";
import type { RoutingSkipReason } from "./reasons.js";

/** Read access to a target revision: step reach, request candidates, reassign. */
export interface RoutingTargetReadScope {
    type: "target";
    targetId: string;
    targetRevisionId: string;
}

/** Read access to a folder's content, without a revision: the inspector (R121). */
export interface RoutingFolderReadScope {
    type: "folder";
    /** `null`: the root folder (model read only). */
    folderId: string | null;
}

export type RoutingReadScope = RoutingTargetReadScope | RoutingFolderReadScope;

export interface RoutingUser {
    id: string;
    displayName: string;
}

/** What routing reads of an admin user (`AdminUser` fits). */
export interface RoutingDirectoryUser {
    id: string;
    displayName: string;
    teams?: string[];
}

/** The sources a step-reach decision can have (R109). */
export type RoutingSource = Extract<
    AssignmentSource,
    "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool"
>;

export type RoutingStrategyName = Exclude<RoutingStrategy, "none">;

export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped";

/** One evaluated rule, for the inspector (R121). No load numbers. */
export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    /**
     * The skip reason for `skipped`; `null` otherwise. An excluded user target shows the
     * exclusion's own reason, or "Excluded from reviews." when it has none (R129, D118).
     */
    reason: string | null;
}

/**
 * A person routing skipped, for the inspector (R129, D118): a pick, a rule user target or a
 * strategy candidate refused read access. Same reason as the trace; never written to a record.
 */
export interface RoutingSkippedUser {
    userId: string;
    /** `null` for a user who is not a member of the step's teams (not looked up). */
    displayName: string | null;
    reason: string;
}

/** What rule conditions are matched against (R113). */
export interface RoutingRuleFacts {
    requesterId: string;
    /** Empty when the lookup failed or the requester is an API key. */
    requesterTeamIds: string[];
    /** The model id of the review's namespace (`getNamespaceModelId`). */
    modelId: string;
    /** The target's folder; `null` for the root. */
    folder: TargetContextFolder | null;
    /** The folder and its ancestors, nearest first; empty when not read. */
    folderChainIds: string[];
}

export interface RoutingEvaluateParams {
    config: ReviewStepConfig;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** `null` for a workflow not stored yet: round robin has no history. */
    workflowId: string | null;
    stepId: string;
    requesterId: string;
    /** The requester's pick for this step; used only when the step allows picks. */
    pickedUserId: string | null;
    folder: TargetContextFolder | null;
    read: RoutingReadScope;
    /** The reach time (R118): exclusion expiry is evaluated at this instant. */
    now: Date;
}

/** The decision for one step (spec 6). */
export interface RoutingEvaluation {
    owner: RoutingUser | null;
    source: RoutingSource;
    /** The rule that decided, also for a team target that narrowed the candidates (R109). */
    ruleId: string | null;
    /** The step's configured strategy. */
    strategy: RoutingStrategy;
    candidateTeamIds: string[];
    /** The pool reason, e.g. no eligible candidate; `null` for an owner. */
    reason: string | null;
    /** Skips in decision order, then one outcome (R117). Fixed reasons only (D89, D97). */
    records: AssignmentDecision[];
    trace: RoutingTraceEntry[];
    /** The skipped people in decision order, with the trace's reasons (R129). */
    skipped: RoutingSkippedUser[];
}

export interface RoutingMembersParams {
    teamIds: string[];
    requesterId: string;
    model: string;
    read: RoutingReadScope;
    now: Date;
}

/** A member of the step's teams, for candidate lists (R120). */
export interface RoutingMember {
    id: string;
    displayName: string;
    teamIds: string[];
    /** The active exclusion, with its own reason; `null` when not excluded. */
    exclusion: WorkflowExclusion | null;
    canRead: boolean;
}

export interface RoutingUserCheckParams {
    userId: string;
    teamIds: string[];
    requesterId: string;
    model: string;
    read: RoutingReadScope;
    now: Date;
}

/** Validity of one person target (R112). Valid when `skipReason` is `null`. */
export interface RoutingUserCheck {
    /** Set whenever the user is a member of the teams. */
    user: RoutingUser | null;
    skipReason: RoutingSkipReason | null;
}
```

Create `packages/api-workflows/src/domain/routing/getNamespaceModelId.ts`:

```ts
/**
 * The model id of a namespace, what a rule's `modelId` condition compares (R113): `cms.article`
 * gives `article`, `wb.page` gives `page`. Pure.
 */
export const getNamespaceModelId = (model: string): string => {
    const index = model.indexOf(".");
    return index === -1 ? model : model.slice(index + 1);
};
```

Create `packages/api-workflows/src/domain/routing/matchRoutingRuleConditions.ts`:

```ts
import type { RoutingRuleConditions } from "~/domain/workflow/types.js";
import type { RoutingRuleFacts } from "./types.js";

/**
 * Whether every condition of a rule holds (spec 6, R113). Pure. A rule without conditions
 * matches. A folder condition needs a target folder of the same type: with `includeDescendants`
 * it matches when the rule folder is the target folder or one of its ancestors, otherwise only
 * the target folder itself. A target in the root matches no folder condition.
 */
export const matchRoutingRuleConditions = (
    conditions: RoutingRuleConditions,
    facts: RoutingRuleFacts
): boolean => {
    if (conditions.requesterUserId && conditions.requesterUserId !== facts.requesterId) {
        return false;
    }
    if (
        conditions.requesterTeamId &&
        !facts.requesterTeamIds.includes(conditions.requesterTeamId)
    ) {
        return false;
    }
    if (conditions.modelId && conditions.modelId !== facts.modelId) {
        return false;
    }
    const folder = conditions.folder;
    if (folder) {
        if (!facts.folder || folder.type !== facts.folder.type) {
            return false;
        }
        const isTargetFolder = folder.id === facts.folder.id;
        const matches = folder.includeDescendants
            ? isTargetFolder || facts.folderChainIds.includes(folder.id)
            : isTargetFolder;
        if (!matches) {
            return false;
        }
    }
    return true;
};
```

Create `packages/api-workflows/src/domain/routing/getRoutingUserSkipReason.ts`:

```ts
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { ROUTING_SKIP_REASONS, type RoutingSkipReason } from "./reasons.js";

export interface RoutingUserEligibilityParams {
    userId: string;
    requesterId: string;
    /** Members of the candidate teams. */
    memberIds: string[];
    /** Active exclusions only (`filterActiveExclusions`). */
    exclusions: WorkflowExclusion[];
}

/**
 * Why a person target cannot get the step, before the read check (R112): the requester, then
 * membership, then exclusion. The requester comes first, so a requester outside the step's teams
 * gets the requester reason. `null` when they pass; the caller checks read access next. Pure.
 */
export const getRoutingUserSkipReason = (
    params: RoutingUserEligibilityParams
): RoutingSkipReason | null => {
    if (params.userId === params.requesterId) {
        return ROUTING_SKIP_REASONS.requester;
    }
    if (!params.memberIds.includes(params.userId)) {
        return ROUTING_SKIP_REASONS.notMember;
    }
    if (params.exclusions.some(exclusion => exclusion.userId === params.userId)) {
        return ROUTING_SKIP_REASONS.excluded;
    }
    return null;
};
```

Create `packages/api-workflows/src/domain/routing/listRoutingCandidates.ts`:

```ts
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import type { RoutingDirectoryUser, RoutingUser } from "./types.js";

export interface RoutingCandidatesInput {
    members: RoutingDirectoryUser[];
    candidateTeamIds: string[];
    requesterId: string;
    /** Active exclusions only (`filterActiveExclusions`). */
    exclusions: WorkflowExclusion[];
}

/**
 * The strategy candidates in their stable order (R111): members of the candidate teams, minus
 * the requester and active exclusions, sorted by user id. Read access is checked later, lazily.
 * Pure.
 */
export const listRoutingCandidates = (input: RoutingCandidatesInput): RoutingUser[] => {
    return input.members
        .filter(member => {
            return (
                member.id !== input.requesterId &&
                input.candidateTeamIds.some(teamId => member.teams?.includes(teamId)) &&
                !input.exclusions.some(exclusion => exclusion.userId === member.id)
            );
        })
        .map(member => ({ id: member.id, displayName: member.displayName }))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
};
```

Create `packages/api-workflows/src/domain/routing/toRoutingEvaluation.ts`:

```ts
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { RoutingStrategy } from "~/domain/workflow/types.js";
import type {
    RoutingEvaluation,
    RoutingSkippedUser,
    RoutingSource,
    RoutingTraceEntry,
    RoutingUser
} from "./types.js";

export interface RoutingDecisionInput {
    owner: RoutingUser | null;
    source: RoutingSource;
    ruleId: string | null;
    strategy: RoutingStrategy;
    candidateTeamIds: string[];
    reason: string | null;
    /** The skips so far, in decision order. */
    skips: AssignmentDecision[];
    trace: RoutingTraceEntry[];
    /** The skipped people so far, in decision order (R129). */
    skipped: RoutingSkippedUser[];
}

/** The evaluation with its outcome record appended after the skips (R117). Pure. */
export const toRoutingEvaluation = (input: RoutingDecisionInput): RoutingEvaluation => {
    return {
        owner: input.owner ? { ...input.owner } : null,
        source: input.source,
        ruleId: input.ruleId,
        strategy: input.strategy,
        candidateTeamIds: [...input.candidateTeamIds],
        reason: input.reason,
        records: [
            ...input.skips.map(skip => ({ ...skip })),
            {
                kind: "outcome",
                userId: input.owner?.id ?? null,
                source: input.source,
                ruleId: input.ruleId,
                by: null,
                reason: input.reason
            }
        ],
        trace: input.trace.map(entry => ({ ...entry })),
        skipped: input.skipped.map(item => ({ ...item }))
    };
};
```

- [ ] **Step 4: The folder port and the folder-level read check**

Create `packages/api-workflows/src/features/review/ReviewTargetFolderChain/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetFolderChainParams {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    folderId: string;
}

export interface IReviewTargetFolderChain {
    /** Whether this adapter answers for the namespace. */
    canHandle(model: string): boolean;
    /**
     * The folder and its ancestors, nearest first, as stored now (spec 6: a parent folder can
     * move while a review runs, so routing reads the chain at step reach). Read without
     * folder-level permissions. Throws when the folders cannot be read.
     */
    listFolderChainIds(params: ReviewTargetFolderChainParams): Promise<string[]>;
}

/**
 * The engine's folder lookup for rule conditions (R114). One implementation per namespace,
 * registered by the app adapters (ACO `GetFolderRepository` + `GetAncestorsUseCase`); the last
 * registered match wins. No match while a folder rule needs the chain fails routing, which falls
 * through to the pool (R116).
 */
export const ReviewTargetFolderChain =
    createAbstraction<IReviewTargetFolderChain>("ReviewTargetFolderChain");

export namespace ReviewTargetFolderChain {
    export type Interface = IReviewTargetFolderChain;
    export type Params = ReviewTargetFolderChainParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetFolderChain/index.ts`:

```ts
export { ReviewTargetFolderChain } from "./abstractions.js";
```

In `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts`, replace:

```ts
export interface IReviewTargetReadAccess {
```

with:

```ts
export interface ReviewTargetFolderReadParams {
    userId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** `null`: the root folder. */
    folderId: string | null;
}

export interface IReviewTargetReadAccess {
```

replace:

```ts
    canUserRead(params: ReviewTargetUserReadParams): Promise<boolean>;
}
```

with:

```ts
    canUserRead(params: ReviewTargetUserReadParams): Promise<boolean>;
    /**
     * Whether the user could read content of the model in the folder, without a revision (R121):
     * model read and folder content read as that user; for the root folder, model read only. Same
     * identity contract as `canUserRead` (SEC-66). Fail closed.
     */
    canUserReadInFolder(params: ReviewTargetFolderReadParams): Promise<boolean>;
}
```

and replace:

```ts
    export type UserReadParams = ReviewTargetUserReadParams;
}
```

with:

```ts
    export type UserReadParams = ReviewTargetUserReadParams;
    export type FolderReadParams = ReviewTargetFolderReadParams;
}
```

In `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetReadAccess.ts`, after the `canUserRead` method add:

```ts

    /**
     * Fail closed until 4.3 Task 8 adds the model read and folder content check (R121): nobody
     * passes the inspector's folder-level check yet.
     */
    public async canUserReadInFolder(): Promise<boolean> {
        return false;
    }
```

In `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetReadAccess.ts`, after the `canUserRead` method add:

```ts

    /**
     * Fail closed until 4.4 Task 11 adds the page model read and folder content check (R121):
     * nobody passes the inspector's folder-level check yet.
     */
    public async canUserReadInFolder(): Promise<boolean> {
        return false;
    }
```

- [ ] **Step 5: `RoutingEvaluatorService`**

Create `packages/api-workflows/src/features/routing/RoutingEvaluatorService/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type {
    RoutingEvaluateParams,
    RoutingEvaluation,
    RoutingMember,
    RoutingMembersParams,
    RoutingUserCheck,
    RoutingUserCheckParams
} from "~/domain/routing/types.js";

export interface IRoutingEvaluatorService {
    /**
     * Who gets the step (spec 6, R110): pick, then the first matching rule with a valid target,
     * then the strategy over the candidates, then the pool. Skips and the outcome are in
     * `records`, evaluated rules in `trace`.
     */
    evaluate(
        params: RoutingEvaluateParams
    ): Promise<Result<RoutingEvaluation, RoutingDependencyError>>;
    /** Every member of the teams except the requester, by user id, with exclusion and access. */
    listMembers(
        params: RoutingMembersParams
    ): Promise<Result<RoutingMember[], RoutingDependencyError>>;
    /** Whether one user is a valid person target (R112): pick, rule user target, reassign. */
    checkUser(
        params: RoutingUserCheckParams
    ): Promise<Result<RoutingUserCheck, RoutingDependencyError>>;
}

/**
 * The routing rules in one place, for the step-reach resolver, the inspector, the candidate lists
 * and reassign (spec 6). Internal: no permission checks (D132). User lookups run without
 * authorization; read checks run as the request identity (SEC-66). A failed lookup fails with
 * `RoutingDependencyError`; a throwing port propagates. Callers decide what a failure means (the
 * resolver falls through to the pool, R116).
 */
export const RoutingEvaluatorService =
    createAbstraction<IRoutingEvaluatorService>("RoutingEvaluatorService");

export namespace RoutingEvaluatorService {
    export type Interface = IRoutingEvaluatorService;
    export type EvaluateParams = RoutingEvaluateParams;
    export type Evaluation = RoutingEvaluation;
    export type MembersParams = RoutingMembersParams;
    export type Member = RoutingMember;
    export type UserCheckParams = RoutingUserCheckParams;
    export type UserCheck = RoutingUserCheck;
    export type Error = RoutingDependencyError;
    export type EvaluateReturn = Promise<Result<RoutingEvaluation, RoutingDependencyError>>;
    export type MembersReturn = Promise<Result<RoutingMember[], RoutingDependencyError>>;
    export type UserCheckReturn = Promise<Result<RoutingUserCheck, RoutingDependencyError>>;
}
```

Create `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import {
    ROUTING_NO_CANDIDATE_REASON,
    ROUTING_SKIP_REASONS,
    type RoutingSkipReason
} from "~/domain/routing/reasons.js";
import type {
    RoutingDirectoryUser,
    RoutingMember,
    RoutingRuleFacts,
    RoutingSkippedUser,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
import { getNamespaceModelId } from "~/domain/routing/getNamespaceModelId.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { listRoutingCandidates } from "~/domain/routing/listRoutingCandidates.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import { toRoutingEvaluation } from "~/domain/routing/toRoutingEvaluation.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/abstractions.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/abstractions.js";
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/abstractions.js";
import { RoutingEvaluatorService as Abstraction } from "./abstractions.js";

class RoutingEvaluatorServiceImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface,
        private readAccesses: ReviewTargetReadAccess.Interface[],
        private folderChains: ReviewTargetFolderChain.Interface[]
    ) {}

    public async evaluate(params: Abstraction.EvaluateParams): Abstraction.EvaluateReturn {
        const { config } = params;
        const strategy = config.assignment.strategy;
        const rules = config.assignment.rules;
        const skips: AssignmentDecision[] = [];
        const trace: RoutingTraceEntry[] = [];
        // The skipped people for the inspector, with the exclusion's own reason (R129).
        const skipped: RoutingSkippedUser[] = [];
        // One read check per namespace; the last registered match wins, none means no access.
        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;
        const pickedUserId = config.assignment.allowManualPick ? params.pickedUserId : null;

        // Members of the step's teams and the active exclusions, read once when a pick, a user
        // target or a strategy needs them (R111).
        let members: RoutingDirectoryUser[] = [];
        let exclusions: WorkflowExclusion[] = [];
        const needsMembers =
            Boolean(pickedUserId) ||
            strategy !== "none" ||
            rules.some(rule => rule.target.type === "user");
        if (needsMembers && config.teams.length > 0) {
            // Listing users needs `adminUsers.user`: a membership lookup, read as the system
            // (D48). Only this call; the read checks below run as the request identity (SEC-66).
            const listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute({ where: { teams_in: [...config.teams] } });
            });
            if (listed.isFail()) {
                return Result.fail(new RoutingDependencyError(listed.error));
            }
            members = listed.value.filter(user => {
                return config.teams.some(teamId => user.teams?.includes(teamId));
            });
            const settings = await this.getSettings.execute({ includeExpired: true });
            if (settings.isFail()) {
                return Result.fail(new RoutingDependencyError(settings.error));
            }
            exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        }
        const memberIds = members.map(member => member.id);

        // 1. The requester's pick (spec 6, R110).
        if (pickedUserId) {
            const member = members.find(item => item.id === pickedUserId);
            let reason: RoutingSkipReason | null = getRoutingUserSkipReason({
                userId: pickedUserId,
                requesterId: params.requesterId,
                memberIds,
                exclusions
            });
            if (!reason && member) {
                const canRead = !readAccess
                    ? false
                    : params.read.type === "target"
                      ? await readAccess.canUserRead({
                            userId: member.id,
                            model: params.model,
                            targetId: params.read.targetId,
                            targetRevisionId: params.read.targetRevisionId
                        })
                      : await readAccess.canUserReadInFolder({
                            userId: member.id,
                            model: params.model,
                            folderId: params.read.folderId
                        });
                if (canRead) {
                    return Result.ok(
                        toRoutingEvaluation({
                            owner: { id: member.id, displayName: member.displayName },
                            source: "picked",
                            ruleId: null,
                            strategy,
                            candidateTeamIds: [...config.teams],
                            reason: null,
                            skips,
                            trace,
                            skipped
                        })
                    );
                }
                reason = ROUTING_SKIP_REASONS.cannotRead;
            }
            const pickReason = reason ?? ROUTING_SKIP_REASONS.notMember;
            skips.push({
                kind: "skip",
                userId: pickedUserId,
                source: "picked",
                ruleId: null,
                by: null,
                reason: pickReason
            });
            // The inspector shows the exclusion's own reason; the record keeps the fixed one
            // (R129, D89, D97).
            skipped.push({
                userId: pickedUserId,
                displayName: member?.displayName ?? null,
                reason:
                    pickReason === ROUTING_SKIP_REASONS.excluded
                        ? exclusions.find(item => item.userId === pickedUserId)?.reason ||
                          pickReason
                        : pickReason
            });
        }

        // 2. Rules, in order: the first whose conditions match and whose target is valid (R110).
        let candidateTeamIds = [...config.teams];
        let ruleId: string | null = null;
        if (rules.length > 0) {
            // Read lazily, on the first rule that needs them: an earlier rule decides without
            // these lookups.
            let requesterTeamIds: string[] | null = null;
            let folderChainIds: string[] | null = null;

            for (const rule of rules) {
                if (rule.conditions.requesterTeamId && requesterTeamIds === null) {
                    // Runs as the system itself; a failure or an API key requester has no teams
                    // (R113).
                    const teams = await this.listUserTeams.execute(params.requesterId);
                    requesterTeamIds = teams.isOk() ? teams.value.map(team => team.id) : [];
                }
                if (rule.conditions.folder && params.folder && folderChainIds === null) {
                    const folderChain = [...this.folderChains]
                        .reverse()
                        .find(item => item.canHandle(params.model));
                    if (!folderChain) {
                        return Result.fail(
                            new RoutingDependencyError(
                                new Error(`No folder chain is registered for "${params.model}".`)
                            )
                        );
                    }
                    folderChainIds = await folderChain.listFolderChainIds({
                        model: params.model,
                        folderId: params.folder.id
                    });
                }
                const facts: RoutingRuleFacts = {
                    requesterId: params.requesterId,
                    requesterTeamIds: requesterTeamIds ?? [],
                    modelId: getNamespaceModelId(params.model),
                    folder: params.folder,
                    folderChainIds: folderChainIds ?? []
                };
                if (!matchRoutingRuleConditions(rule.conditions, facts)) {
                    trace.push({ ruleId: rule.id, outcome: "notMatched", reason: null });
                    continue;
                }
                if (rule.target.type === "team") {
                    // A team target narrows the candidates; the strategy picks among them (R109).
                    trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                    ruleId = rule.id;
                    candidateTeamIds = [rule.target.id];
                    break;
                }
                const targetId = rule.target.id;
                const member = members.find(item => item.id === targetId);
                let reason: RoutingSkipReason | null = getRoutingUserSkipReason({
                    userId: targetId,
                    requesterId: params.requesterId,
                    memberIds,
                    exclusions
                });
                if (!reason && member) {
                    const canRead = !readAccess
                        ? false
                        : params.read.type === "target"
                          ? await readAccess.canUserRead({
                                userId: member.id,
                                model: params.model,
                                targetId: params.read.targetId,
                                targetRevisionId: params.read.targetRevisionId
                            })
                          : await readAccess.canUserReadInFolder({
                                userId: member.id,
                                model: params.model,
                                folderId: params.read.folderId
                            });
                    if (canRead) {
                        trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                        return Result.ok(
                            toRoutingEvaluation({
                                owner: { id: member.id, displayName: member.displayName },
                                source: "rule",
                                ruleId: rule.id,
                                strategy,
                                candidateTeamIds: [...config.teams],
                                reason: null,
                                skips,
                                trace,
                                skipped
                            })
                        );
                    }
                    reason = ROUTING_SKIP_REASONS.cannotRead;
                }
                const skipReason = reason ?? ROUTING_SKIP_REASONS.notMember;
                // The editor sees the exclusion's own reason in the trace; the record keeps the
                // fixed one (R129, D89, D97).
                const shownReason =
                    skipReason === ROUTING_SKIP_REASONS.excluded
                        ? exclusions.find(item => item.userId === targetId)?.reason || skipReason
                        : skipReason;
                trace.push({ ruleId: rule.id, outcome: "skipped", reason: shownReason });
                skipped.push({
                    userId: targetId,
                    displayName: member?.displayName ?? null,
                    reason: shownReason
                });
                skips.push({
                    kind: "skip",
                    userId: targetId,
                    source: "rule",
                    ruleId: rule.id,
                    by: null,
                    reason: skipReason
                });
            }
        }

        // 3. The strategy over the candidates, then 4. the pool (R110).
        if (strategy === "none") {
            return Result.ok(
                toRoutingEvaluation({
                    owner: null,
                    source: "pool",
                    ruleId,
                    strategy,
                    candidateTeamIds,
                    reason: null,
                    skips,
                    trace,
                    skipped
                })
            );
        }
        const candidates = listRoutingCandidates({
            members,
            candidateTeamIds,
            requesterId: params.requesterId,
            exclusions
        });
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of candidates) {
            const canRead = !readAccess
                ? false
                : params.read.type === "target"
                  ? await readAccess.canUserRead({
                        userId: candidate.id,
                        model: params.model,
                        targetId: params.read.targetId,
                        targetRevisionId: params.read.targetRevisionId
                    })
                  : await readAccess.canUserReadInFolder({
                        userId: candidate.id,
                        model: params.model,
                        folderId: params.read.folderId
                    });
            if (canRead) {
                return Result.ok(
                    toRoutingEvaluation({
                        owner: candidate,
                        source: strategy,
                        ruleId,
                        strategy,
                        candidateTeamIds,
                        reason: null,
                        skips,
                        trace,
                        skipped
                    })
                );
            }
            skips.push({
                kind: "skip",
                userId: candidate.id,
                source: strategy,
                ruleId,
                by: null,
                reason: ROUTING_SKIP_REASONS.cannotRead
            });
            skipped.push({
                userId: candidate.id,
                displayName: candidate.displayName,
                reason: ROUTING_SKIP_REASONS.cannotRead
            });
        }
        return Result.ok(
            toRoutingEvaluation({
                owner: null,
                source: "pool",
                ruleId,
                strategy,
                candidateTeamIds,
                reason: ROUTING_NO_CANDIDATE_REASON,
                skips,
                trace,
                skipped
            })
        );
    }

    public async listMembers(params: Abstraction.MembersParams): Abstraction.MembersReturn {
        if (params.teamIds.length === 0) {
            return Result.ok([]);
        }
        // A membership lookup, read as the system (D48); read checks run as the request identity.
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listUsers.execute({ where: { teams_in: [...params.teamIds] } });
        });
        if (listed.isFail()) {
            return Result.fail(new RoutingDependencyError(listed.error));
        }
        const settings = await this.getSettings.execute({ includeExpired: true });
        if (settings.isFail()) {
            return Result.fail(new RoutingDependencyError(settings.error));
        }
        const exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;

        const users = listed.value
            .filter(user => {
                return (
                    user.id !== params.requesterId &&
                    params.teamIds.some(teamId => user.teams?.includes(teamId))
                );
            })
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const members: RoutingMember[] = [];
        for (const user of users) {
            const canRead = !readAccess
                ? false
                : params.read.type === "target"
                  ? await readAccess.canUserRead({
                        userId: user.id,
                        model: params.model,
                        targetId: params.read.targetId,
                        targetRevisionId: params.read.targetRevisionId
                    })
                  : await readAccess.canUserReadInFolder({
                        userId: user.id,
                        model: params.model,
                        folderId: params.read.folderId
                    });
            const exclusion = exclusions.find(item => item.userId === user.id);
            members.push({
                id: user.id,
                displayName: user.displayName,
                teamIds: [...(user.teams ?? [])],
                exclusion: exclusion ? { ...exclusion } : null,
                canRead
            });
        }
        return Result.ok(members);
    }

    public async checkUser(params: Abstraction.UserCheckParams): Abstraction.UserCheckReturn {
        if (params.userId === params.requesterId) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.requester });
        }
        if (params.teamIds.length === 0) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.notMember });
        }
        // A membership lookup, read as the system (D48); the read check runs as the request
        // identity.
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listUsers.execute({
                where: { id_in: [params.userId], teams_in: [...params.teamIds] }
            });
        });
        if (listed.isFail()) {
            return Result.fail(new RoutingDependencyError(listed.error));
        }
        const member = listed.value.find(user => {
            return (
                user.id === params.userId &&
                params.teamIds.some(teamId => user.teams?.includes(teamId))
            );
        });
        if (!member) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.notMember });
        }
        const user = { id: member.id, displayName: member.displayName };

        const settings = await this.getSettings.execute({ includeExpired: true });
        if (settings.isFail()) {
            return Result.fail(new RoutingDependencyError(settings.error));
        }
        const exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        if (exclusions.some(exclusion => exclusion.userId === params.userId)) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.excluded });
        }

        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;
        const canRead = !readAccess
            ? false
            : params.read.type === "target"
              ? await readAccess.canUserRead({
                    userId: params.userId,
                    model: params.model,
                    targetId: params.read.targetId,
                    targetRevisionId: params.read.targetRevisionId
                })
              : await readAccess.canUserReadInFolder({
                    userId: params.userId,
                    model: params.model,
                    folderId: params.read.folderId
                });
        if (!canRead) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.cannotRead });
        }
        return Result.ok({ user, skipReason: null });
    }
}

export const RoutingEvaluatorService = Abstraction.createImplementation({
    implementation: RoutingEvaluatorServiceImpl,
    dependencies: [
        IdentityContext,
        ListUsersUseCase,
        ListUserTeamsUseCase,
        GetWorkflowSettingsUseCase,
        [ReviewTargetReadAccess, { multiple: true }],
        [ReviewTargetFolderChain, { multiple: true }]
    ]
});
```

Create `packages/api-workflows/src/features/routing/RoutingEvaluatorService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RoutingEvaluatorService } from "./RoutingEvaluatorService.js";

export const RoutingEvaluatorFeature = createFeature({
    name: "Workflows/RoutingEvaluator",
    register(container) {
        container.register(RoutingEvaluatorService);
    }
});
```

Create `packages/api-workflows/src/features/routing/RoutingEvaluatorService/index.ts`:

```ts
export { RoutingEvaluatorService } from "./abstractions.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import:

```ts
import { RoutingEvaluatorFeature } from "~/features/routing/RoutingEvaluatorService/feature.js";
```

and replace:

```ts
        // Assignment log (written from phase 4, read by the get-review wrappers)
```

with:

```ts
        // Routing (spec 6): who gets a step when it is reached
        RoutingEvaluatorFeature.register(container);

        // Assignment log (written from phase 4, read by the get-review wrappers)
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows/__tests__/routing/matchRoutingRuleConditions.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50`
Expected: PASS (the app read-access implementations still compile and register).

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): add the routing evaluator, the folder chain port and the folder-level read check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
