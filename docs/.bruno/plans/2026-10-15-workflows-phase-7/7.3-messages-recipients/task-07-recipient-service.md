### Task 7: `NotificationRecipientService` (pool members, e-mail lookup)

Spec 12, 6; D44, D48, D132; R183, R194, R196; A67; SEC-66; Review Focus 3 (pool excludes the requester, exclusions and non-readers). The one DI service the notifier and the handlers use to find people (Tasks 10-12). Internal (D132): no permission check, no identity read for access decisions.

- `listPool(params)` (R183, R194): the members of the step's `candidateTeamIds`, found through `RoutingEvaluatorService.listMembers`. The params are built like `ListStepCandidatesUseCase` builds them for a review's step: `teamIds` a copy of `step.candidateTeamIds`, `requesterId: review.createdBy.id`, `model: review.model`, `read: { type: "target", targetId: review.targetId, targetRevisionId: review.targetRevisionId }`, `now`. `listMembers` returns every member of the teams except the requester, each with `exclusion` and `canRead`, and filters nothing else (R194): this service keeps only members with `!member.exclusion && member.canRead` and returns them as `NotificationRecipient { id, displayName }` in the order `listMembers` gave (sorted by user id). An excluded member and a member who cannot read the target get nothing (Review Focus 3). It does not re-implement the read check, only uses its flag, and it wraps nothing in `withoutAuthorization` (the read checks run as the request identity inside `listMembers`, SEC-66).
- A step that is not in the review, a failed `listMembers` Result and a throwing `listMembers` are all failed Results holding a `WorkflowPersistenceError` (R87: nothing is thrown). The caller logs (R196); this service does not log and has no `Logger`.
- `listUsers(ids)` (R194, SEC-66): `NotificationTransport.User { id, email, displayName }` for the ids it finds, through `ListUsersUseCase.execute({ where: { id_in } })`. The ids are de-duplicated and blank or non-string ids dropped; an empty list returns `ok([])` without a call; the lookup runs in chunks of `MAX_USER_LIST_LIMIT` (200, `~/constants.js`). `ListUsersUseCase` needs `adminUsers.user`, so each lookup is wrapped in `identityContext.withoutAuthorization(...)` and nothing else in the service is. Ids it does not find (an `api-key` requester has no user, A67) are omitted. A failed Result or a throw in any chunk is a failed Result (no partial list). The service never looks a user up by anything but id. It returns the users as stored and does no address filtering (that lives only in the e-mail transport, Task 3, so custom transports decide for themselves). Its error message can embed addresses, so a caller logs only the error code and name (R196).

**Files:**
- Create: `packages/api-workflows/src/features/notifications/NotificationRecipientService/abstractions.ts`
- Create: `packages/api-workflows/src/features/notifications/NotificationRecipientService/NotificationRecipientService.ts`
- Create: `packages/api-workflows/src/features/notifications/NotificationRecipientService/feature.ts`
- Create: `packages/api-workflows/src/features/notifications/NotificationRecipientService/index.ts`
- Create: `packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `NotificationTransport` and its namespace type `NotificationTransport.User { id: string; email: string; displayName: string }` (`~/features/notifications/NotificationTransport/abstractions.js`).
  - Existing: `RoutingEvaluatorService` (`~/features/routing/RoutingEvaluatorService/index.js`; `listMembers(params: RoutingMembersParams): Promise<Result<RoutingMember[], RoutingDependencyError>>`), `RoutingMember`, `RoutingMembersParams` (`~/domain/routing/types.js`), `RoutingDependencyError` (`~/domain/routing/errors.js`), `ReviewData` (`~/domain/review/types.js`), `WorkflowPersistenceError` (`~/domain/workflow/errors.js`, constructor takes a `PersistenceErrorSource`: any `Error` with an optional `code`), `MAX_USER_LIST_LIMIT` (`~/constants.js`, 200), `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`; `withoutAuthorization<T>(cb)`, `isAuthorizationEnabled()`), `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`; `execute(input?: ListUsersInput): Promise<Result<AdminUser[], ...>>`, `AdminUser` has `id`, `email`, `displayName`).
  - Test helpers: `createRoutingContext`, `resetRoutingFakes`, `ROUTING_USERS` (`~tests/__helpers/routingContext.js`), `createContextHandler` (`~tests/__helpers/handler.js`), `FakeListUsers`, `FakeUser` (`~tests/__helpers/FakeListUsers.js`), `readableUsers`, `readChecks` (`~tests/__helpers/FakeReviewTargetReadAccess.js`), `createRequestedReview`, `expectOk`, `NOW`, `REVIEW_TEAM_ID`, `requester` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `NotificationRecipient { id: string; displayName: string }`, `NotificationPoolParams { review: ReviewData; stepId: string; now: Date }`, `INotificationRecipientService { listPool(params): Promise<Result<NotificationRecipient[], WorkflowPersistenceError>>; listUsers(ids: string[]): Promise<Result<NotificationTransport.User[], WorkflowPersistenceError>> }`.
  - `NotificationRecipientService = createAbstraction<INotificationRecipientService>("NotificationRecipientService")` with the namespace `Interface`, `Recipient`, `PoolParams`, `Error`, `PoolReturn`, `UsersReturn`.
  - The implementation `NotificationRecipientService` (dependencies `[RoutingEvaluatorService, IdentityContext, ListUsersUseCase]`) and `NotificationRecipientServiceFeature` (registers it). `ReviewNotificationsFeature` (Task 12) registers the feature; until then the test registers it in `setup`. Consumed by Tasks 10-12.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createRoutingContext,
    resetRoutingFakes,
    ROUTING_USERS
} from "~tests/__helpers/routingContext.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { readableUsers, readChecks } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    createRequestedReview,
    NOW,
    REVIEW_TEAM_ID,
    requester
} from "~tests/__helpers/fixtures.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { ReviewData } from "~/domain/review/types.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingMember, RoutingMembersParams } from "~/domain/routing/types.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import {
    NotificationRecipientService,
    NotificationRecipientServiceFeature
} from "~/features/notifications/NotificationRecipientService/index.js";

/** The first step of the default review is "legal"; it was reached into the pool of the review team. */
const createReviewData = (): ReviewData => {
    return createRequestedReview().toData();
};

const createPoolParams = (review: ReviewData, stepId = "legal") => {
    return { review, stepId, now: new Date(NOW) };
};

const toMember = (id: string, overrides: Partial<RoutingMember> = {}): RoutingMember => {
    return {
        id,
        displayName: id,
        teamIds: [REVIEW_TEAM_ID],
        exclusion: null,
        canRead: true,
        ...overrides
    };
};

/** Answers `listMembers` with a fixed list, a failure or a throw, and records how it was called. */
class StubRouting implements RoutingEvaluatorService.Interface {
    public members: RoutingMember[] = [];
    public mode: "ok" | "fail" | "throw" = "ok";
    public readonly calls: RoutingMembersParams[] = [];
    /** Whether authorization was on during the last call; `null` before `watch`. */
    public authorizationEnabled: boolean | null = null;
    private identityContext: IdentityContext.Interface | null = null;

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async evaluate(): Promise<never> {
        throw new Error("Not used by these tests.");
    }

    public async listMembers(params: RoutingMembersParams) {
        this.calls.push(structuredClone(params));
        this.authorizationEnabled = this.identityContext
            ? this.identityContext.isAuthorizationEnabled()
            : null;
        if (this.mode === "throw") {
            throw new Error("The routing crashed.");
        }
        if (this.mode === "fail") {
            return Result.fail(new RoutingDependencyError(new Error("Users are not available.")));
        }
        return Result.ok(this.members.map(member => ({ ...member })));
    }

    public async checkUser(): Promise<never> {
        throw new Error("Not used by these tests.");
    }
}

class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): Promise<never> {
        throw new Error("The user lookup crashed.");
    }
}

const setupStubbed = async () => {
    const routing = new StubRouting();
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(RoutingEvaluatorService, routing);
            NotificationRecipientServiceFeature.register(container);
        }
    });
    routing.watch(context.container.resolve(IdentityContext));
    return { routing, service: context.container.resolve(NotificationRecipientService) };
};

const setupUsers = async (users: FakeUser[]) => {
    const fake = new FakeListUsers(users);
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, fake);
            NotificationRecipientServiceFeature.register(container);
        }
    });
    const identityContext = context.container.resolve(IdentityContext);
    fake.watch(identityContext);
    return {
        fake,
        identityContext,
        service: context.container.resolve(NotificationRecipientService)
    };
};

describe("NotificationRecipientService.listPool (R183, R194, SEC-66)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("keeps only members who are not excluded and can read; the requester is absent", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        // Anna and Bob can read, Cara cannot. Bob is excluded. The requester is in the team too.
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        routing.settings.exclusions = [{ userId: "user-bob", reason: "On leave" }];
        expect(ROUTING_USERS.map(user => user.id)).toContain(requester.id);

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([{ id: "user-anna", displayName: "Anna" }]);
        expect(result.value.map(recipient => recipient.id)).not.toContain(requester.id);
    });

    it("returns every member who can read, sorted by id, when nobody is excluded", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        readableUsers.add("user-cara");

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.value).toEqual([
            { id: "user-anna", displayName: "Anna" },
            { id: "user-bob", displayName: "Bob" },
            { id: "user-cara", displayName: "Cara" }
        ]);
    });

    it("wraps nothing in withoutAuthorization: the read checks run as the request identity", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        readableUsers.add("user-anna");

        await service.listPool(createPoolParams(createReviewData()));

        // The routing service's own membership lookup runs without authorization (D48); the
        // read checks it makes per member run with it (SEC-66).
        expect(routing.users.calls).toEqual([
            { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
        ]);
        expect(readChecks.length).toBeGreaterThan(0);
        expect(readChecks.every(check => check.authorizationEnabled)).toBe(true);
    });

    it("drops an excluded member, a non-reader and an excluded non-reader (stubbed flags)", async () => {
        const { routing, service } = await setupStubbed();
        routing.members = [
            toMember("user-a"),
            toMember("user-b", { exclusion: { userId: "user-b", reason: "On leave" } }),
            toMember("user-c", { canRead: false }),
            toMember("user-d", { exclusion: { userId: "user-d" }, canRead: false }),
            toMember("user-e")
        ];

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.value).toEqual([
            { id: "user-a", displayName: "user-a" },
            { id: "user-e", displayName: "user-e" }
        ]);
    });

    it("builds the routing params from the review's step like ListStepCandidatesUseCase", async () => {
        const { routing, service } = await setupStubbed();
        const review = createReviewData();
        review.steps[0].candidateTeamIds = ["team-one", "team-two"];

        await service.listPool(createPoolParams(review));

        expect(routing.calls).toEqual([
            {
                teamIds: ["team-one", "team-two"],
                requesterId: review.createdBy.id,
                model: review.model,
                read: {
                    type: "target",
                    targetId: review.targetId,
                    targetRevisionId: review.targetRevisionId
                },
                now: new Date(NOW)
            }
        ]);
        expect(routing.authorizationEnabled).toBe(true);
    });

    it("returns an empty pool for a step with no candidate teams", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        const review = createReviewData();
        review.steps[0].candidateTeamIds = [];

        const result = await service.listPool(createPoolParams(review));

        expect(result.value).toEqual([]);
    });

    it("fails for a step that is not in the review, without asking routing", async () => {
        const { routing, service } = await setupStubbed();

        const result = await service.listPool(createPoolParams(createReviewData(), "missing"));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(routing.calls).toEqual([]);
    });

    it("fails with a persistence error when listMembers fails (real routing, failing user lookup)", async () => {
        const routing = await createRoutingContext({
            setup: container => {
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = routing.context.container.resolve(NotificationRecipientService);
        routing.users.failuresLeft = 1;

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("fails with a persistence error when listMembers returns a failed Result", async () => {
        const { routing, service } = await setupStubbed();
        routing.mode = "fail";

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
    });

    it("fails with a persistence error, and does not reject, when listMembers throws", async () => {
        const { routing, service } = await setupStubbed();
        routing.mode = "throw";

        const result = await service.listPool(createPoolParams(createReviewData()));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(result.error.message).toBe("The routing crashed.");
    });
});

describe("NotificationRecipientService.listUsers (R194, A67, SEC-66)", () => {
    const USERS: FakeUser[] = [
        { id: "user-anna", displayName: "Anna", teams: [] },
        { id: "user-bob", displayName: "Bob", teams: [] }
    ];

    it("returns the users it finds, omits the ids it does not, and looks up under withoutAuthorization", async () => {
        const { fake, identityContext, service } = await setupUsers(USERS);

        const result = await service.listUsers(["user-anna", "user-ghost", "user-bob"]);

        expect(result.value).toEqual([
            { id: "user-anna", email: "user-anna@webiny.test", displayName: "Anna" },
            { id: "user-bob", email: "user-bob@webiny.test", displayName: "Bob" }
        ]);
        expect(fake.calls).toEqual([
            {
                input: { where: { id_in: ["user-anna", "user-ghost", "user-bob"] } },
                authorizationEnabled: false
            }
        ]);
        // Only the lookup ran without authorization.
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("de-duplicates the ids and drops blank ones", async () => {
        const { fake, service } = await setupUsers(USERS);

        const result = await service.listUsers(["user-anna", "user-anna", "", "user-bob"]);

        expect(result.value.map(user => user.id)).toEqual(["user-anna", "user-bob"]);
        expect(fake.calls.map(call => call.input)).toEqual([
            { where: { id_in: ["user-anna", "user-bob"] } }
        ]);
    });

    it("returns an empty list without a lookup for no ids or only blank ids", async () => {
        const { fake, service } = await setupUsers(USERS);

        const none = await service.listUsers([]);
        const blank = await service.listUsers(["", ""]);

        expect(none.value).toEqual([]);
        expect(blank.value).toEqual([]);
        expect(fake.calls).toEqual([]);
    });

    it("looks up in chunks of MAX_USER_LIST_LIMIT", async () => {
        const many: FakeUser[] = Array.from({ length: 450 }, (_, index) => {
            return { id: `user-${index}`, displayName: `User ${index}`, teams: [] };
        });
        const { fake, service } = await setupUsers(many);

        const result = await service.listUsers(many.map(user => user.id));

        expect(MAX_USER_LIST_LIMIT).toBe(200);
        expect(fake.calls.map(call => call.input.where?.id_in?.length)).toEqual([200, 200, 50]);
        expect(fake.calls.every(call => call.authorizationEnabled === false)).toBe(true);
        expect(result.value).toHaveLength(450);
    });

    it("fails with a persistence error for a failed lookup and stops at the first failing chunk", async () => {
        const many: FakeUser[] = Array.from({ length: 450 }, (_, index) => {
            return { id: `user-${index}`, displayName: `User ${index}`, teams: [] };
        });
        const { fake, service } = await setupUsers(many);
        fake.failuresLeft = 1;

        const result = await service.listUsers(many.map(user => user.id));

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(fake.calls).toHaveLength(1);
    });

    it("fails with a persistence error, does not reject and restores authorization when the lookup throws", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.registerInstance(ListUsersUseCase, new ThrowingListUsers());
                NotificationRecipientServiceFeature.register(container);
            }
        });
        const service = context.container.resolve(NotificationRecipientService);

        const result = await service.listUsers(["user-anna"]);

        expect(result.isFail()).toBe(true);
        expect(result.error).toBeInstanceOf(WorkflowPersistenceError);
        expect(result.error.message).toBe("The user lookup crashed.");
        expect(context.container.resolve(IdentityContext).isAuthorizationEnabled()).toBe(true);
    });
});
```

- [ ] **Step 2: Run the tests to see them fail**

`yarn test packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts 2>&1 | tail -50`
Expected: FAIL, `Cannot find module '~/features/notifications/NotificationRecipientService/index.js'`.

`yarn test:os packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts 2>&1 | tail -50`
Expected: the same failure.

- [ ] **Step 3: Implement**

Create `packages/api-workflows/src/features/notifications/NotificationRecipientService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";

/** A person a notification goes to: an id and the name messages show (R194). */
export interface NotificationRecipient {
    id: string;
    displayName: string;
}

export interface NotificationPoolParams {
    review: ReviewData;
    /** The step that reached the pool. */
    stepId: string;
    /** The notification time: exclusion expiry is evaluated at this instant (R118). */
    now: Date;
}

export interface INotificationRecipientService {
    /**
     * The people a pool step is announced to (R183, R194): the members of the step's candidate
     * teams, without the requester, without an active exclusion and only those who can read the
     * target. Fails when the step is not in the review or routing fails.
     */
    listPool(
        params: NotificationPoolParams
    ): Promise<Result<NotificationRecipient[], WorkflowPersistenceError>>;
    /**
     * The e-mail data of users by id (R194). Ids with no user (an api-key requester, A67) are
     * omitted. Runs the lookup without authorization, and only that. Users are returned as
     * stored: no address filtering here, a transport decides what it can use (the e-mail
     * transport filters addresses). A failed Result's message can embed addresses, so callers
     * must not log `error.message`: only `error.code` and `error.name` (R196).
     */
    listUsers(
        ids: string[]
    ): Promise<Result<NotificationTransport.User[], WorkflowPersistenceError>>;
}

/**
 * Finds the people a notification goes to. Internal (D132): no permission check. A failed or
 * throwing dependency is a failed Result; the caller logs it (R196) and still sends the
 * websocket message.
 */
export const NotificationRecipientService = createAbstraction<INotificationRecipientService>(
    "NotificationRecipientService"
);

export namespace NotificationRecipientService {
    export type Interface = INotificationRecipientService;
    export type Recipient = NotificationRecipient;
    export type PoolParams = NotificationPoolParams;
    export type Error = WorkflowPersistenceError;
    export type PoolReturn = Promise<Result<NotificationRecipient[], WorkflowPersistenceError>>;
    export type UsersReturn = Promise<
        Result<NotificationTransport.User[], WorkflowPersistenceError>
    >;
}
```

Create `packages/api-workflows/src/features/notifications/NotificationRecipientService/NotificationRecipientService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingMember, RoutingMembersParams } from "~/domain/routing/types.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import type { NotificationTransport } from "~/features/notifications/NotificationTransport/abstractions.js";
import {
    NotificationRecipientService as Abstraction,
    type NotificationRecipient
} from "./abstractions.js";

class NotificationRecipientServiceImpl implements Abstraction.Interface {
    public constructor(
        private routing: RoutingEvaluatorService.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsersUseCase: ListUsersUseCase.Interface
    ) {}

    public async listPool(params: Abstraction.PoolParams): Abstraction.PoolReturn {
        const { review, stepId, now } = params;
        const step = review.steps.find(item => item.id === stepId);
        if (!step) {
            return Result.fail(
                new WorkflowPersistenceError(
                    new Error(`Step "${stepId}" does not exist in this review.`)
                )
            );
        }

        // The same params `ListStepCandidatesUseCase` builds for a review's step (R120).
        const membersParams: RoutingMembersParams = {
            teamIds: [...step.candidateTeamIds],
            requesterId: review.createdBy.id,
            model: review.model,
            read: {
                type: "target",
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            },
            now
        };

        // `listMembers` returns every member except the requester, with `exclusion` and
        // `canRead`, and filters nothing (R194). Its user lookup and its read checks (as the
        // request identity, SEC-66) are its own business: nothing is wrapped here.
        let listed: Result<RoutingMember[], RoutingDependencyError>;
        try {
            listed = await this.routing.listMembers(membersParams);
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listed.error));
        }

        const pool: NotificationRecipient[] = [];
        for (const member of listed.value) {
            if (!member.exclusion && member.canRead) {
                pool.push({ id: member.id, displayName: member.displayName });
            }
        }
        return Result.ok(pool);
    }

    public async listUsers(ids: string[]): Abstraction.UsersReturn {
        const unique = [
            ...new Set(ids.filter(id => typeof id === "string" && id.trim() !== ""))
        ];
        if (unique.length === 0) {
            return Result.ok([]);
        }

        const users: NotificationTransport.User[] = [];
        for (let start = 0; start < unique.length; start += MAX_USER_LIST_LIMIT) {
            const chunk = unique.slice(start, start + MAX_USER_LIST_LIMIT);

            // `ListUsersUseCase` needs `adminUsers.user`: a lookup of the people to tell, not an
            // access decision (SEC-66). Only this call runs without authorization.
            let listed: Result<AdminUser[], ListUsersUseCase.Error>;
            try {
                listed = await this.identityContext.withoutAuthorization(() => {
                    return this.listUsersUseCase.execute({ where: { id_in: chunk } });
                });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (listed.isFail()) {
                return Result.fail(new WorkflowPersistenceError(listed.error));
            }
            for (const user of listed.value) {
                users.push({ id: user.id, email: user.email, displayName: user.displayName });
            }
        }
        return Result.ok(users);
    }
}

export const NotificationRecipientService = Abstraction.createImplementation({
    implementation: NotificationRecipientServiceImpl,
    dependencies: [RoutingEvaluatorService, IdentityContext, ListUsersUseCase]
});
```

Create `packages/api-workflows/src/features/notifications/NotificationRecipientService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { NotificationRecipientService } from "./NotificationRecipientService.js";

export const NotificationRecipientServiceFeature = createFeature({
    name: "WorkflowNotifications/NotificationRecipientService",
    register(container) {
        container.register(NotificationRecipientService);
    }
});
```

Create `packages/api-workflows/src/features/notifications/NotificationRecipientService/index.ts`:

```ts
export { NotificationRecipientServiceFeature } from "./feature.js";
export { NotificationRecipientService } from "./abstractions.js";
export type {
    INotificationRecipientService,
    NotificationPoolParams,
    NotificationRecipient
} from "./abstractions.js";
```

- [ ] **Step 4: Run the tests to see them pass**

`yarn test packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts 2>&1 | tail -50`
Expected: PASS.

`yarn test:os packages/api-workflows/__tests__/notifications/NotificationRecipientService.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

Nothing existing is modified; the routing service this one builds on stays green:

`yarn test packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts 2>&1 | tail -50` and `yarn test packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts 2>&1 | tail -50`, and the same two with `yarn test:os` (one at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched packages.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, and restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`). If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): add the notification recipient service for pool members and e-mail lookup" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
