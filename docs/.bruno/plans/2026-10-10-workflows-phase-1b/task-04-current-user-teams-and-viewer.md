### Task 4: Current user's teams and review viewer

**Files:**
- Create: `packages/api-workflows/src/domain/permissions/errors.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentUserTeams/abstractions.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentUserTeams/CurrentUserTeams.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentUserTeams/feature.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentUserTeams/index.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentReviewViewer/abstractions.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentReviewViewer/CurrentReviewViewer.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentReviewViewer/feature.ts`
- Create: `packages/api-workflows/src/features/identity/CurrentReviewViewer/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeListUserTeams.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Create: `packages/api-workflows/__tests__/identity/CurrentUserTeams.test.ts`
- Create: `packages/api-workflows/__tests__/identity/CurrentReviewViewer.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `IdentityContext` (`getIdentity()`, `withIdentity(identity, cb)`), `AuthenticatedIdentity`, `AnonymousIdentity` (`@webiny/api-core/features/security/IdentityContext/index.js`); `ListUserTeamsUseCase` (`@webiny/api-core/features/users/ListUserTeams/index.js`: `execute(userId: string): Promise<Result<Team[], ListUserTeamsUseCase.Error>>`, runs without authorization); `UserStorageError` (`@webiny/api-core/features/users/shared/errors.js`); `Team` (`@webiny/api-core/types/security.js`); Task 1 `WorkflowsPermissions`; Task 3 `ReviewViewer`, `Actor`, `getReviewViewerFlags`, `canCancelByPermission`; fixtures.
- Produces:
  - `CurrentUserTeams.Interface { getTeamIds(): Promise<string[]> }` — team ids of the current identity over api-core `ListUserTeamsUseCase`; singleton in the request container, cache keyed by identity id; anonymous identity → `[]` without a lookup; failed lookup → `[]`, not cached (R36).
  - `CurrentReviewViewer.Interface { getActor(): Result<Actor, WorkflowsNotAuthenticatedError>; get(): Promise<Result<ReviewViewer, WorkflowsNotAuthenticatedError>> }` (R37, R42). The actor is `{ type: "user", id, displayName, identityType: identity.type }` for every non-anonymous identity, API keys included (`identityType: "api-key"`, D133). `getActor()` reads only the identity (no team lookup, no permission read), for wrappers that need just the actor (request, workflow CRUD); `get()` adds team ids and the permission set.
  - `WorkflowsNotAuthenticatedError` (`Workflows/NotAuthenticated`).
  - Test helper `FakeListUserTeams` and `createTeam(id: string): Team`; fixture `createRequestedReview` takes an optional `requester`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeListUserTeams.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";

export const createTeam = (id: string): Team => {
    return {
        id,
        name: id,
        slug: id,
        description: "",
        system: false,
        roles: [],
        createdOn: null,
        createdBy: null
    };
};

/**
 * Answers team lookups from a fixed map, records every asked user id, and fails the next
 * `failuresLeft` calls with a storage error.
 */
export class FakeListUserTeams implements ListUserTeamsUseCase.Interface {
    public readonly calls: string[] = [];
    public failuresLeft = 0;
    private readonly teamsByUser: Map<string, Team[]>;

    public constructor(teamsByUser: Map<string, Team[]> = new Map()) {
        this.teamsByUser = teamsByUser;
    }

    public async execute(userId: string): Promise<Result<Team[], ListUserTeamsUseCase.Error>> {
        this.calls.push(userId);
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        return Result.ok(this.teamsByUser.get(userId) ?? []);
    }
}
```

Create `packages/api-workflows/__tests__/identity/CurrentUserTeams.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTeam, FakeListUserTeams } from "~tests/__helpers/FakeListUserTeams.js";
import { OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";
const SECOND_USER_ID = "user-second";

const createFake = (): FakeListUserTeams => {
    return new FakeListUserTeams(
        new Map([
            [DEFAULT_USER_ID, [createTeam(REVIEW_TEAM_ID), createTeam(OTHER_TEAM_ID)]],
            [SECOND_USER_ID, [createTeam(OTHER_TEAM_ID)]]
        ])
    );
};

const createTeamsContext = async (fake: FakeListUserTeams) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUserTeamsUseCase, fake);
        }
    });
    return {
        container: context.container,
        teams: context.container.resolve(CurrentUserTeams)
    };
};

describe("CurrentUserTeams", () => {
    it("returns the team ids of the current identity", async () => {
        const fake = createFake();
        const { teams } = await createTeamsContext(fake);

        expect(await teams.getTeamIds()).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID]);
    });

    it("looks the teams up once per request and identity", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);

        await teams.getTeamIds();
        await teams.getTeamIds();
        await container.resolve(CurrentUserTeams).getTeamIds();

        expect(fake.calls).toEqual([DEFAULT_USER_ID]);
    });

    it("keys the cache by identity", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);
        const identityContext = container.resolve(IdentityContext);
        const second = new AuthenticatedIdentity({
            id: SECOND_USER_ID,
            displayName: "Second User",
            type: "admin"
        });

        const defaultTeams = await teams.getTeamIds();
        const secondTeams = await identityContext.withIdentity(second, () => teams.getTeamIds());
        const defaultAgain = await teams.getTeamIds();

        expect(defaultTeams).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(secondTeams).toEqual([OTHER_TEAM_ID]);
        expect(defaultAgain).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID, SECOND_USER_ID]);
    });

    it("returns no teams for a failed lookup and does not cache it", async () => {
        const fake = createFake();
        fake.failuresLeft = 1;
        const { teams } = await createTeamsContext(fake);

        expect(await teams.getTeamIds()).toEqual([]);
        expect(await teams.getTeamIds()).toEqual([REVIEW_TEAM_ID, OTHER_TEAM_ID]);
        expect(fake.calls).toEqual([DEFAULT_USER_ID, DEFAULT_USER_ID]);
    });

    it("returns no teams for an anonymous identity without a lookup", async () => {
        const fake = createFake();
        const { container, teams } = await createTeamsContext(fake);
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            teams.getTeamIds()
        );

        expect(result).toEqual([]);
        expect(fake.calls).toEqual([]);
    });

    it("returns no teams when the identity has no admin user record", async () => {
        // Real `ListUserTeamsUseCase`: the default test identity has no admin user record.
        const { context } = await createContextHandler();

        expect(await context.container.resolve(CurrentUserTeams).getTeamIds()).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/identity/CurrentReviewViewer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTeam, FakeListUserTeams } from "~tests/__helpers/FakeListUserTeams.js";
import {
    createRequestedReview,
    expectOk,
    REVIEW_TEAM_ID,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { getReviewViewerFlags } from "~/domain/review/getReviewViewerFlags.js";
import { canCancelByPermission } from "~/domain/review/canCancelByPermission.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

/** An API key identity, as api-core's `ApiKeyAuthenticator` builds it (`type: "api-key"`). */
const apiKeyIdentity = (): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({
        id: "api-key-1",
        displayName: "CI key",
        type: "api-key"
    });
};

const createViewerContext = async (permissions: SecurityPermission[]) => {
    const fake = new FakeListUserTeams(new Map([[DEFAULT_USER_ID, [createTeam(REVIEW_TEAM_ID)]]]));
    const { context } = await createContextHandler({
        permissions,
        setup: container => {
            container.registerInstance(ListUserTeamsUseCase, fake);
        }
    });
    return {
        fake,
        container: context.container,
        viewer: context.container.resolve(CurrentReviewViewer)
    };
};

describe("CurrentReviewViewer", () => {
    it("builds the viewer from the identity, its teams and its workflows permissions", async () => {
        const { viewer } = await createViewerContext([{ name: "workflows", reassign: true }]);

        expect(expectOk(await viewer.get())).toEqual({
            actor: {
                type: "user",
                id: DEFAULT_USER_ID,
                displayName: "John Doe",
                identityType: "admin"
            },
            teamIds: [REVIEW_TEAM_ID],
            permissions: { fullAccess: false, editor: false, reassign: true }
        });
    });

    it("builds the actor without looking up teams or permissions", async () => {
        const { fake, viewer } = await createViewerContext([{ name: "workflows", editor: true }]);

        expect(expectOk(viewer.getActor())).toEqual({
            type: "user",
            id: DEFAULT_USER_ID,
            displayName: "John Doe",
            identityType: "admin"
        });
        expect(fake.calls).toEqual([]);
    });

    it("fails for an anonymous identity", async () => {
        const { container, viewer } = await createViewerContext([{ name: "*" }]);
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            viewer.get()
        );
        const actor = await identityContext.withIdentity(new AnonymousIdentity(), async () =>
            viewer.getActor()
        );

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(actor.isFail()).toBe(true);
        expect(actor.error.code).toBe("Workflows/NotAuthenticated");
    });

    it("lets an API key act as a user actor without teams (D133)", async () => {
        const { container, viewer } = await createViewerContext([{ name: "workflows" }]);
        const identityContext = container.resolve(IdentityContext);

        const current = expectOk(
            await identityContext.withIdentity(apiKeyIdentity(), () => viewer.get())
        );

        expect(current).toMatchObject({
            actor: {
                type: "user",
                id: "api-key-1",
                displayName: "CI key",
                identityType: "api-key"
            },
            teamIds: []
        });
        // No team: the key cannot start a pool step, but it can cancel the review it requested.
        const othersReview = toSaveData(createRequestedReview());
        expect(getReviewViewerFlags(othersReview, current).canStart).toBe(false);
        const ownReview = toSaveData(createRequestedReview({ requester: current.actor }));
        expect(canCancelByPermission(ownReview, current)).toBe(true);
    });

    it("feeds the viewer flags of a review", async () => {
        const { viewer } = await createViewerContext([{ name: "workflows.*" }]);
        const current = expectOk(await viewer.get());

        const flags = getReviewViewerFlags(toSaveData(createRequestedReview()), current);

        expect(flags.canStart).toBe(true);
        expect(flags.canCancel).toBe(true);
        expect(flags.canReassign).toBe(true);
    });
});
```

In `packages/api-workflows/__tests__/__helpers/fixtures.ts`, replace

```ts
export interface RequestedReviewParams {
    id?: string;
    targetRevisionId?: string;
    picks?: ReviewPick[];
    workflow?: Workflow;
}
```

with

```ts
export interface RequestedReviewParams {
    id?: string;
    targetRevisionId?: string;
    picks?: ReviewPick[];
    workflow?: Workflow;
    /** Defaults to the `requester` fixture. */
    requester?: Actor;
}
```

and in `createRequestedReview`, replace

```ts
            picks: params.picks ?? [],
            requester,
            now: NOW
        })
    );
    expectOk(review.reach({ resolution: poolResolution(), actor: requester, now: NOW }));
```

with

```ts
            picks: params.picks ?? [],
            requester: params.requester ?? requester,
            now: NOW
        })
    );
    expectOk(
        review.reach({
            resolution: poolResolution(),
            actor: params.requester ?? requester,
            now: NOW
        })
    );
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/identity 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/identity/CurrentUserTeams/index.js` and `~/features/identity/CurrentReviewViewer/index.js`.

- [ ] **Step 3: Add the error**

Create `packages/api-workflows/src/domain/permissions/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

/** Workflow actions need a signed-in identity; returned to app wrappers by `CurrentReviewViewer`. */
export class WorkflowsNotAuthenticatedError extends BaseError {
    override readonly code = "Workflows/NotAuthenticated" as const;

    constructor() {
        super({ message: "You must be signed in to use workflows." });
    }
}
```

- [ ] **Step 4: Add the team lookup**

Create `packages/api-workflows/src/features/identity/CurrentUserTeams/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ICurrentUserTeams {
    /**
     * Team ids of the current identity; `[]` for an anonymous identity or when the lookup fails
     * (no teams means no review rights, R36).
     */
    getTeamIds(): Promise<string[]>;
}

/**
 * The current user's teams, for `actorTeamIds` and viewer flags. A building block for the app
 * wrappers (D132); the api-workflows use cases take team ids as input instead.
 */
export const CurrentUserTeams = createAbstraction<ICurrentUserTeams>("CurrentUserTeams");

export namespace CurrentUserTeams {
    export type Interface = ICurrentUserTeams;
}
```

Create `packages/api-workflows/src/features/identity/CurrentUserTeams/CurrentUserTeams.ts`:

```ts
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { CurrentUserTeams as Abstraction } from "./abstractions.js";

/**
 * Registered as a singleton in the request container, so the cache lives for one request (like
 * the removed `GetUserTeams`). Keyed by identity id because `withIdentity` can switch the identity
 * mid-request. Only successful lookups are cached: a failed one returns `[]` (fail closed) and
 * is retried on the next call.
 */
class CurrentUserTeamsImpl implements Abstraction.Interface {
    private readonly cache = new Map<string, string[]>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface
    ) {}

    public async getTeamIds(): Promise<string[]> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return [];
        }

        const cached = this.cache.get(identity.id);
        if (cached) {
            return [...cached];
        }

        const result = await this.listUserTeams.execute(identity.id);
        if (result.isFail()) {
            return [];
        }

        const teamIds = result.value.map(team => team.id);
        this.cache.set(identity.id, teamIds);
        return [...teamIds];
    }
}

export const CurrentUserTeams = Abstraction.createImplementation({
    implementation: CurrentUserTeamsImpl,
    dependencies: [IdentityContext, ListUserTeamsUseCase]
});
```

Create `packages/api-workflows/src/features/identity/CurrentUserTeams/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CurrentUserTeams } from "./CurrentUserTeams.js";

export const CurrentUserTeamsFeature = createFeature({
    name: "Workflows/CurrentUserTeams",
    register(container) {
        container.register(CurrentUserTeams).inSingletonScope();
    }
});
```

Create `packages/api-workflows/src/features/identity/CurrentUserTeams/index.ts`:

```ts
export { CurrentUserTeams } from "./abstractions.js";
```

- [ ] **Step 5: Add the review viewer**

Create `packages/api-workflows/src/features/identity/CurrentReviewViewer/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewViewer } from "~/domain/review/types.js";
import type { WorkflowsNotAuthenticatedError } from "~/domain/permissions/errors.js";

export interface ICurrentReviewViewer {
    /**
     * The current identity as a `user` actor, API keys included (`identityType: "api-key"`,
     * D133). Reads only the identity: no team lookup, no permission read.
     */
    getActor(): Result<Actor, WorkflowsNotAuthenticatedError>;
    /** The current identity as a review viewer: actor, team ids and workflows permissions. */
    get(): Promise<Result<ReviewViewer, WorkflowsNotAuthenticatedError>>;
}

/**
 * Builds the reading user for viewer flags and the actor and team ids for the internal review
 * use cases, in one place for every app wrapper (D132, R37, R42). Only an anonymous identity is
 * refused.
 */
export const CurrentReviewViewer = createAbstraction<ICurrentReviewViewer>("CurrentReviewViewer");

export namespace CurrentReviewViewer {
    export type Interface = ICurrentReviewViewer;
    export type ActorResult = Result<Actor, WorkflowsNotAuthenticatedError>;
    export type Return = Promise<Result<ReviewViewer, WorkflowsNotAuthenticatedError>>;
}
```

Create `packages/api-workflows/src/features/identity/CurrentReviewViewer/CurrentReviewViewer.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { WorkflowsNotAuthenticatedError } from "~/domain/permissions/errors.js";
import type { ReviewViewer } from "~/domain/review/types.js";
import { CurrentReviewViewer as Abstraction } from "./abstractions.js";

/**
 * Reads the identity on every call (no cache): its parts are cached by their own owners. Every
 * non-anonymous identity is a `user` actor; `identityType` keeps its kind (`admin`, `api-key`,
 * D30, D133). An API key belongs to no team, so `teamIds` is `[]` for it (A16).
 */
class CurrentReviewViewerImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private currentUserTeams: CurrentUserTeams.Interface,
        private permissions: WorkflowsPermissions.Interface
    ) {}

    public getActor(): Abstraction.ActorResult {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new WorkflowsNotAuthenticatedError());
        }
        return Result.ok({
            type: "user",
            id: identity.id,
            displayName: identity.displayName,
            identityType: identity.type
        });
    }

    public async get(): Abstraction.Return {
        const actor = this.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        const [teamIds, permissions] = await Promise.all([
            this.currentUserTeams.getTeamIds(),
            this.permissions.getPermissionSet()
        ]);
        const viewer: ReviewViewer = {
            actor: actor.value,
            teamIds,
            permissions
        };
        return Result.ok(viewer);
    }
}

export const CurrentReviewViewer = Abstraction.createImplementation({
    implementation: CurrentReviewViewerImpl,
    dependencies: [IdentityContext, CurrentUserTeams, WorkflowsPermissions]
});
```

Create `packages/api-workflows/src/features/identity/CurrentReviewViewer/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CurrentReviewViewer } from "./CurrentReviewViewer.js";

export const CurrentReviewViewerFeature = createFeature({
    name: "Workflows/CurrentReviewViewer",
    register(container) {
        container.register(CurrentReviewViewer);
    }
});
```

Create `packages/api-workflows/src/features/identity/CurrentReviewViewer/index.ts`:

```ts
export { CurrentReviewViewer } from "./abstractions.js";
```

- [ ] **Step 6: Register both**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { CurrentUserTeamsFeature } from "~/features/identity/CurrentUserTeams/feature.js";
import { CurrentReviewViewerFeature } from "~/features/identity/CurrentReviewViewer/feature.js";
```

and, in the `// Building blocks for the app wrappers (D132)` block from Task 1, add after `WorkflowsPermissionsFeature.register(container);`:

```ts
        CurrentUserTeamsFeature.register(container);
        CurrentReviewViewerFeature.register(container);
```

In `packages/api-workflows/__tests__/registration.test.ts`, add the imports

```ts
import { CurrentUserTeams } from "~/features/identity/CurrentUserTeams/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
```

and add after `expect(container.resolveAll(WorkflowsPermissions)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(CurrentUserTeams)).toHaveLength(1);
        expect(container.resolveAll(CurrentReviewViewer)).toHaveLength(1);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/identity 2>&1 | tail -50`
Expected: PASS (6 + 5 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (incl. `registration.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: not runnable locally (A9); record "not run" and leave it to CI.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add current user teams and review viewer lookups

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```

---
