### Task 8: CMS folder chain, `canUserReadInFolder`, folder existence

Spec 6, 4.3, 10; D45, D61, D69, D95, D104, D118, D133; R50, R72, R113, R114, R116, R121, R125; SEC-66; A28, A47. The CMS side of the routing ports in `packages/api-headless-cms-workflows`:

- `CmsEntryReviewTargetFolderChain` implements the engine's `ReviewTargetFolderChain` (R114) for `cms.*`: ACO `GetFolderRepository` (no folder-level permissions; the folder model is private with `authorization: false`) reads the folder, its `type` must be `cms:<modelId>` of the namespace, and ACO `GetAncestorsUseCase` returns `[folder, parent, ...]`. The port returns their ids, nearest first. A missing folder, a folder of another type and a failed read throw; the engine falls through to the pool (R116).
- `CmsEntryReviewTargetReadAccess.canUserReadInFolder` (R121) replaces the fail-closed stub 4.1 Task 2 added. The model and its group are read as the current identity (A19, SEC-66), then `CandidateReadAccess` runs the new `CmsEntryAccess.canReadInFolder` as the user: group read, model read, entity-level entry read and, unless the folder is the root or FLP is off, `canAccessFolderContent` with `rwd: "r"` on the folder. Any failure answers `false` (R50).
- `CmsEntryFolderExistsService.exists({ id, type })` (R125, D69), the building block for Task 9's `cmsEntryFolderExists` wrapper: the type must be `cms:<modelId>` of a model the current identity can read that is public and publishable (`isBindableModel`); then `GetFolderRepository` by id and a type comparison. Another app's type, an unknown, private or unpublishable model, or a missing folder answer `false`; a failed read throws (the wrapper maps it, R87).

ACO is not part of this package's test harness (`NoFolders.ts`). The CMS folder chain depends on `GetFolderRepository` and `GetAncestorsUseCase`, and the engine resolves every `ReviewTargetFolderChain` on each step reach, so both test harnesses that register `CmsWorkflowsFeature` need the two ACO abstractions: this package gets an in-memory `FakeFolders` stand-in, and `api-website-builder-workflows` gets 4.4 Task 11's `registerNoAcoFolders` (no folder exists, no ancestors) already here, with exactly the content and handler edit Task 11 specifies, so the WB suite stays green between Task 8 and Task 11 (Task 11 then skips creating it). The routing test at the end of this task proves the chain end to end: a rule with a descendant folder condition routes a review of an entry in a child folder to the rule's user. The fake user directory (`FakeListUsers`) and `permissionsByIdentity` on `createUserContext` added here are reused by Tasks 9 and 10.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/utils/folderType.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetFolderChain.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/CmsEntryFolderExistsService.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/abstractions.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetReadAccess.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeFolders.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FakeListUsers.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingCmsEntryAccess.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/testContext.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/userContext.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryFolderPort.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/NoAcoFolders.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts`

**Interfaces:**
- Consumes:
  - 4.1 Task 2: `ReviewTargetFolderChain` (`@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js`), `canHandle(model: string): boolean`, `listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]>` with `Params { model: string; folderId: string }`; resolved `multiple`, the last registered match wins (R114). `ReviewTargetReadAccess.canUserReadInFolder(params: ReviewTargetReadAccess.FolderReadParams): Promise<boolean>` with `FolderReadParams { userId: string; model: string; folderId: string | null }` (R121).
  - 4.1 Task 2/3: the routing resolver evaluates a rule's `folder` condition against `listFolderChainIds` of the review's `targetContext.folder` (R113) and writes `assignment: { source: "rule", ruleId }` for a valid user target (R109).
  - 4.2 Task 6: `StoreWorkflowUseCase` checks rule user targets with `ListUsersUseCase({ where: { id_in, teams_in } })` (R122); the fake directory answers it.
  - ACO: `GetFolderRepository` (`@webiny/api-aco/features/folder/GetFolder/abstractions.js`), `execute(id: string): Promise<Result<Folder, FolderNotFoundError | FolderPersistenceError>>`; `GetAncestorsUseCase` (`@webiny/api-aco/features/folder/GetAncestors/index.js`), `execute(params: { folder: Folder }): Promise<Result<Folder[], GetAncestorsUseCase.Error>>`; `Folder` (`@webiny/api-aco/folder/folder.types.js`); `FolderNotFoundError` (code `Aco/Folder/NotFound`), `FolderPersistenceError` (`@webiny/api-aco/domain/folder/errors.js`).
  - CMS: `GetModelUseCase.execute(modelId)`, `GetGroupUseCase.execute(groupId)`, `AccessControl.canAccessGroup/canAccessModel/canAccessEntry`, `ROOT_FOLDER` (`@webiny/api-headless-cms/constants.js`).
  - api-core: `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`), `execute(input?: ListUsersInput): Promise<Result<AdminUser[], ListUsersUseCase.Error>>`, `ListUsersInput { where?: { id_in?: string[]; teams_in?: string[] }; sort?: string[] }` (`@webiny/api-core/features/users/shared/types.js`).
  - Phase 2/3: `CandidateReadAccess`, `CmsEntryAccess`, `isBindableModel`, `getModelIdFromAppName`, `isCmsNamespace`.
- Produces:
  - `toCmsFolderType(modelId: string): string` (`"cms:<modelId>"`) and `getModelIdFromFolderType(type: string): string | null` (`~/utils/folderType.js`, pure).
  - `CmsEntryReviewTargetFolderChain` (a `ReviewTargetFolderChain` implementation, registered in `CmsTargetFeature`).
  - `CmsEntryAccess.Interface.canReadInFolder(params: CmsEntryAccess.FolderReadParams): Promise<boolean>`, `CmsEntryFolderReadParams { model: CmsModel; group: CmsGroup; folderId: string | null }`.
  - `CmsEntryFolderExistsService` (`~/features/target/CmsEntryFolderExistsService/index.js`): `Interface.exists(params: CmsEntryFolderExistsService.Params): Promise<boolean>`, `CmsEntryFolderExistsParams { id: string; type: string }`; throws when a model or folder read fails.
  - Test helpers (CMS package): `testFolders`, `failingFolderReads`, `addTestFolder(params: TestFolderParams): Folder`, `registerFakeFolders(container)` (registered by default in `__handler/context.ts`); `TEST_USERS`, `FakeListUsers`, `registerTestUsers(container)` (fake `ListUsersUseCase` + `GetUserUseCase` for the directory); `createWorkflowValuesWithAssignment(assignment: ReviewStepAssignmentConfig)`; `UserContextParams.permissionsByIdentity` / `TestContextParams.permissionsByIdentity`; `CmsEntryAccessCheck` gains `"canReadInFolder"`.
  - Test helper (WB package, identical to 4.4 Task 11's): `__tests__/__helpers/NoAcoFolders.ts` with `registerNoAcoFolders(container)`, registered by `createContextHandler` in `__helpers/handler.ts`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeFolders.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import {
    GetAncestorsUseCase,
    type GetAncestorsParams
} from "@webiny/api-aco/features/folder/GetAncestors/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import {
    FolderNotFoundError,
    FolderPersistenceError
} from "@webiny/api-aco/domain/folder/errors.js";

/** ACO folders by id. Clear it in `afterEach`. */
export const testFolders = new Map<string, Folder>();

/** Folder ids whose read fails with a persistence error. Clear it in `afterEach`. */
export const failingFolderReads = new Set<string>();

export interface TestFolderParams {
    id: string;
    /** e.g. "cms:author" or "wb:page". */
    type: string;
    /** Defaults to the root. */
    parentId?: string | null;
}

const OWNER = { id: "id-12345678", type: "admin", displayName: "John Doe" };

/** Stores a folder (and its path, like ACO builds it) in `testFolders`. */
export const addTestFolder = (params: TestFolderParams): Folder => {
    const parent = params.parentId ? testFolders.get(params.parentId) : undefined;
    const folder: Folder = {
        id: params.id,
        title: params.id,
        slug: params.id,
        type: params.type,
        parentId: params.parentId ?? null,
        path: `${parent ? parent.path : "root"}/${params.id}`,
        permissions: [],
        createdOn: "2026-10-01T00:00:00.000Z",
        modifiedOn: null,
        savedOn: "2026-10-01T00:00:00.000Z",
        createdBy: OWNER,
        modifiedBy: null,
        savedBy: OWNER
    };
    testFolders.set(folder.id, folder);
    return folder;
};

class FakeGetFolderRepository implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        if (failingFolderReads.has(id)) {
            return Result.fail(new FolderPersistenceError(new Error("Storage is down.")));
        }
        const folder = testFolders.get(id);
        if (!folder) {
            return Result.fail(new FolderNotFoundError(id));
        }
        return Result.ok(folder);
    }
}

/** `[folder, parent, ...]`, as ACO's `GetAncestorsRepository` returns it. */
class FakeGetAncestors implements GetAncestorsUseCase.Interface {
    public async execute(
        params: GetAncestorsParams
    ): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        const chain: Folder[] = [];
        let current: Folder | undefined = params.folder;
        while (current) {
            chain.push(current);
            current = current.parentId ? testFolders.get(current.parentId) : undefined;
        }
        return Result.ok(chain);
    }
}

/**
 * The two ACO folder abstractions the CMS folder port reads (ACO is not part of the harness).
 * Registered by default in `createContextHandler`.
 */
export const registerFakeFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new FakeGetFolderRepository());
    container.registerInstance(GetAncestorsUseCase, new FakeGetAncestors());
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FakeListUsers.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { FakeAdminUsers } from "./FakeAdminUsers.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER
} from "./identities.js";

export interface TestUser {
    identity: IdentityData;
    teams: string[];
}

/**
 * The stored admin users routing sees (R111). REQUESTER is a member of the review team here so
 * "minus the requester" is exercised; `TEST_TEAMS` (the reviewer's own team lookup) is unchanged.
 */
export const TEST_USERS: TestUser[] = [
    { identity: REQUESTER, teams: [REVIEW_TEAM] },
    { identity: REVIEWER, teams: [REVIEW_TEAM] },
    { identity: OTHER_REVIEWER, teams: [REVIEW_TEAM] },
    { identity: READER, teams: [] },
    { identity: REASSIGNER, teams: [] },
    { identity: EDITOR, teams: [] }
];

const toAdminUser = (user: TestUser): AdminUser => {
    return {
        id: user.identity.id,
        displayName: user.identity.displayName,
        email: `${user.identity.id}@webiny.test`,
        teams: user.teams,
        tenant: "root",
        createdOn: "2026-10-01T00:00:00.000Z",
        createdBy: null
    };
};

/** `ListUsersUseCase` over a fixed directory, honouring `id_in` and `teams_in` like the storage. */
export class FakeListUsers implements ListUsersUseCase.Interface {
    public constructor(private users: TestUser[]) {}

    public async execute(
        input?: ListUsersInput
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        const ids = input?.where?.id_in;
        const teams = input?.where?.teams_in;
        return Result.ok(
            this.users
                .filter(user => !ids || ids.includes(user.identity.id))
                .filter(user => !teams || user.teams.some(team => teams.includes(team)))
                .map(toAdminUser)
        );
    }
}

/**
 * The directory for routing and candidate reads (`legacyPlugins`): `ListUsersUseCase` and the
 * admin-user lookup of `CandidateReadAccess` (R68). Give the users their CMS permissions with
 * `permissionsByIdentity`.
 */
export const registerTestUsers = (container: Container) => {
    container.registerInstance(ListUsersUseCase, new FakeListUsers(TEST_USERS));
    container.registerInstance(
        GetUserUseCase,
        new FakeAdminUsers(TEST_USERS.map(user => user.identity.id))
    );
};
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingCmsEntryAccess.ts`, replace the `CmsEntryAccessCheck` type with:

```ts
export type CmsEntryAccessCheck =
    | "canRead"
    | "canWrite"
    | "canDelete"
    | "canDeleteAnyEntry"
    | "canReadInFolder";
```

and add the method after `canDeleteAnyEntry`:

```ts
    public async canReadInFolder(params: CmsEntryAccess.FolderReadParams): Promise<boolean> {
        if (throwingAccessChecks.has("canReadInFolder")) {
            return fail("canReadInFolder");
        }
        return this.decoratee.canReadInFolder(params);
    }
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/testContext.ts`, add to `TestContextParams` after `permissions`:

```ts
    /** Permissions of other users, for routing and candidate read checks (`withIdentity`). */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
```

and pass it to `createContextHandler`, after `permissions: params.permissions,`:

```ts
        permissionsByIdentity: params.permissionsByIdentity,
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/userContext.ts`, add to `UserContextParams` after `permissions`:

```ts
    /** Permissions of other users, for routing and candidate read checks. */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
```

and pass it to `createTestContext`, after `permissions: params.permissions,`:

```ts
        permissionsByIdentity: params.permissionsByIdentity,
```

In `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`, add the import after the `CmsWorkflowsFeature` import:

```ts
import { registerFakeFolders } from "../__helpers/FakeFolders.js";
```

and register the fakes in `setup`, after `CmsWorkflowsFeature.register(container);`:

```ts
            // ACO is not registered; the CMS folder port reads these stand-ins.
            registerFakeFolders(container);
```

In `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`, add the type import after the `WorkflowValues` import:

```ts
import type { ReviewStepAssignmentConfig } from "@webiny/api-workflows/domain/workflow/types.js";
```

and add after `createWorkflowValues`:

```ts
/** The test workflow with the given routing on its only step (team "team-1"). */
export const createWorkflowValuesWithAssignment = (
    assignment: ReviewStepAssignmentConfig
): WorkflowValues => {
    const values = createWorkflowValues();
    return {
        ...values,
        steps: values.steps.map(step => {
            return { ...step, config: { teams: ["team-1"], assignment } };
        })
    };
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/NoAcoFolders.ts` (the WB harness registers `CmsWorkflowsFeature`, so the CMS folder chain needs the ACO reads there too; this is exactly 4.4 Task 11's file):

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { FolderNotFoundError } from "@webiny/api-aco/domain/folder/errors.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";

class NoFolder implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        return Result.fail(new FolderNotFoundError(id));
    }
}

class NoAncestors implements GetAncestorsUseCase.Interface {
    public async execute(): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        return Result.ok([]);
    }
}

/**
 * ACO is not part of this package's harness, but the folder-chain ports of both apps need its
 * folder reads whenever the engine resolves them: no folder exists and nothing has ancestors.
 * Tests that need real folders register ACO after these stand-ins (4.4 Task 11's `registerAco`).
 */
export const registerNoAcoFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new NoFolder());
    container.registerInstance(GetAncestorsUseCase, new NoAncestors());
};
```

In `packages/api-website-builder-workflows/__tests__/__helpers/handler.ts` add the import after the `NoopInvalidateAssetCacheTaskDefinition` import:

```ts
import { registerNoAcoFolders } from "./NoAcoFolders.js";
```

replace

```ts
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
                container.register(NoopFolderLevelPermissions);
            },
```

with

```ts
            (container: Container) => {
                container.register(NoopInvalidateAssetCacheTaskDefinition);
                container.register(NoopFolderLevelPermissions);
                registerNoAcoFolders(container);
            },
```

and in the doc comment above `createContextHandler` replace

```
 * the CMS workflows package, whose single handlers cover pages (R51). ACO is not registered, so a
 * no-op FLP stands in; tests replace it with the fake one through `legacyPlugins`. One public CMS
 * model ("article") exists for cross-app tests.
```

with

```
 * the CMS workflows package, whose single handlers cover pages (R51). ACO is not registered, so a
 * no-op FLP and folder reads without folders stand in; tests replace them with the fake FLP and
 * real ACO through `legacyPlugins`. One public CMS model ("article") exists for cross-app tests.
```

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts`, add the import after the `ReviewTargetReadAccess` import:

```ts
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
```

add the import after the `CmsEntryReviewGuardService` import:

```ts
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";
```

add `CmsEntryFolderExistsService` as the last item of `WRAPPERS` (after `CmsEntryReviewGuardService`), as WB does with `WbPageFolderExistsService`; in "registers one cms adapter port of each kind and every wrapper once", after the `ReviewTargetReadAccess` expectation:

```ts
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(1);
```

and in "registers no wrapper and no guard without the advancedPublishingWorkflow license", after the `WRAPPERS` loop:

```ts
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
```

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryFolderPort.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import {
    createWorkflowValuesWithAssignment,
    storeWorkflow
} from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { NOBODY, READER, REVIEW_TEAM, REVIEWER, WRITER } from "~tests/__helpers/identities.js";
import { CMS_ENTRY_READER_WITHOUT_MODEL, CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { addTestFolder, failingFolderReads, testFolders } from "~tests/__helpers/FakeFolders.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";

/** Admin users of the tenant; "user-elsewhere" has CMS read access but is not one of them. */
const registerFakes = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
    container.registerInstance(
        GetUserUseCase,
        new FakeAdminUsers([READER.id, NOBODY.id, WRITER.id])
    );
};

/** The default admin (`*`) with the extra code models, the fake FLP and throwing access checks. */
const createAdminContext = async (): Promise<CmsContext> => {
    const { context } = createContextHandler({
        legacyPlugins: [...createExtraModelPlugins(), registerFakes, throwOnAccessChecks],
        permissionsByIdentity: {
            [READER.id]: CMS_READER,
            [WRITER.id]: CMS_ENTRY_READER_WITHOUT_MODEL,
            "user-elsewhere": CMS_READER
        }
    });
    return context();
};

const getFolderChain = (context: CmsContext): ReviewTargetFolderChain.Interface => {
    return context.container
        .resolveAll(ReviewTargetFolderChain)
        .find(item => item.canHandle(AUTHOR_NAMESPACE))!;
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle(AUTHOR_NAMESPACE))!;
};

const folderExists = (context: CmsContext, id: string, type: string) => {
    return context.container.resolve(CmsEntryFolderExistsService).exists({ id, type });
};

/** "folder-parent" > "folder-child" > "folder-grandchild", and "folder-sibling", all "author". */
const addAuthorFolders = () => {
    addTestFolder({ id: "folder-parent", type: "cms:author" });
    addTestFolder({ id: "folder-child", type: "cms:author", parentId: "folder-parent" });
    addTestFolder({ id: "folder-grandchild", type: "cms:author", parentId: "folder-child" });
    addTestFolder({ id: "folder-sibling", type: "cms:author" });
};

describe("CMS folder port", () => {
    afterEach(() => {
        testFolders.clear();
        failingFolderReads.clear();
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists a folder and its ancestors, nearest first (R114)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        const chain = getFolderChain(context);

        const nested = await chain.listFolderChainIds({
            model: AUTHOR_NAMESPACE,
            folderId: "folder-grandchild"
        });
        const topLevel = await chain.listFolderChainIds({
            model: AUTHOR_NAMESPACE,
            folderId: "folder-parent"
        });

        expect(nested).toEqual(["folder-grandchild", "folder-child", "folder-parent"]);
        expect(topLevel).toEqual(["folder-parent"]);
    });

    it("answers only for cms namespaces", async () => {
        const context = await createAdminContext();
        const chains = context.container.resolveAll(ReviewTargetFolderChain);

        expect(chains.some(item => item.canHandle("cms.author"))).toBe(true);
        expect(chains.some(item => item.canHandle("wb.page"))).toBe(false);
    });

    it("throws for a missing folder, a folder of another model and a failed read (R116)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });
        failingFolderReads.add("folder-sibling");
        const chain = getFolderChain(context);

        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-missing" })
        ).rejects.toThrow("Folder not found!");
        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-book" })
        ).rejects.toThrow('Folder "folder-book" is not a folder of "cms.author".');
        await expect(
            chain.listFolderChainIds({ model: AUTHOR_NAMESPACE, folderId: "folder-sibling" })
        ).rejects.toThrow("Storage is down.");
    });

    it("answers folder read access with the user's permissions (R121)", async () => {
        const context = await createAdminContext();
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        const access = getReadAccess(context);

        const inRoot = await access.canUserReadInFolder({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: null
        });
        const inRootById = await access.canUserReadInFolder({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "root"
        });
        const inFolder = await access.canUserReadInFolder({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "folder-1"
        });
        const inLockedFolder = await access.canUserReadInFolder({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            folderId: "folder-locked"
        });

        expect(inRoot).toBe(true);
        expect(inRootById).toBe(true);
        expect(inFolder).toBe(true);
        expect(inLockedFolder).toBe(false);
    });

    it("denies a user without model read, without CMS permissions or outside the tenant (R72, R68)", async () => {
        const context = await createAdminContext();
        const access = getReadAccess(context);

        for (const userId of [WRITER.id, NOBODY.id, "user-elsewhere"]) {
            const canRead = await access.canUserReadInFolder({
                userId,
                model: AUTHOR_NAMESPACE,
                folderId: null
            });
            expect(canRead).toBe(false);
        }
    });

    it("denies another app's namespace, a missing or private model and a throwing check (R50)", async () => {
        const context = await createAdminContext();
        const access = getReadAccess(context);
        const ask = (model: string) => {
            return access.canUserReadInFolder({ userId: READER.id, model, folderId: null });
        };

        expect(await ask("wb.page")).toBe(false);
        expect(await ask("cms.missingModel")).toBe(false);
        expect(await ask("cms.secretNote")).toBe(false);
        throwingAccessChecks.add("canReadInFolder");
        expect(await ask(AUTHOR_NAMESPACE)).toBe(false);
    });

    it("finds a folder of a bindable model by id and type (D69, R125)", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });

        expect(await folderExists(context, "folder-child", "cms:author")).toBe(true);
        expect(await folderExists(context, "folder-book", "cms:book")).toBe(true);
    });

    it("does not find a missing folder or a folder of another type", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        addTestFolder({ id: "folder-book", type: "cms:book" });

        expect(await folderExists(context, "folder-missing", "cms:author")).toBe(false);
        expect(await folderExists(context, "folder-book", "cms:author")).toBe(false);
        // An empty id or one with "#" would be read as a revision by the ACO repository.
        expect(await folderExists(context, "", "cms:author")).toBe(false);
        expect(await folderExists(context, "folder-child#0001", "cms:author")).toBe(false);
    });

    it("does not find folders of another app, an unknown, private or unpublishable model", async () => {
        const context = await createAdminContext();
        addTestFolder({ id: "folder-page", type: "wb:page" });
        addTestFolder({ id: "folder-secret", type: "cms:secretNote" });
        addTestFolder({ id: "folder-setting", type: "cms:siteSetting" });
        addTestFolder({ id: "folder-unknown", type: "cms:unknownModel" });

        expect(await folderExists(context, "folder-page", "wb:page")).toBe(false);
        expect(await folderExists(context, "folder-secret", "cms:secretNote")).toBe(false);
        expect(await folderExists(context, "folder-setting", "cms:siteSetting")).toBe(false);
        expect(await folderExists(context, "folder-unknown", "cms:unknownModel")).toBe(false);
        expect(await folderExists(context, "folder-page", "page")).toBe(false);
    });

    it("throws when the folder read fails", async () => {
        const context = await createAdminContext();
        addAuthorFolders();
        failingFolderReads.add("folder-child");

        await expect(folderExists(context, "folder-child", "cms:author")).rejects.toThrow(
            "Storage is down."
        );
    });
});

describe("CMS folder rules in routing", () => {
    afterEach(() => {
        testFolders.clear();
        folderLevels.clear();
    });

    it("routes a review in a descendant folder to the rule's user (R113, R114)", async () => {
        addAuthorFolders();
        const admin = await createUserContext({
            legacyPlugins: [registerTestUsers],
            permissionsByIdentity: { [REVIEWER.id]: CMS_READER }
        });
        expectOk(
            await storeWorkflow(
                admin,
                createWorkflowValuesWithAssignment({
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        {
                            id: "rule-1",
                            conditions: {
                                folder: {
                                    id: "folder-parent",
                                    type: "cms:author",
                                    includeDescendants: true
                                }
                            },
                            target: { type: "user", id: REVIEWER.id }
                        }
                    ]
                })
            )
        );
        const inGrandchild = await createAuthorEntry(admin, {
            name: "Ann",
            folderId: "folder-grandchild"
        });
        const inSibling = await createAuthorEntry(admin, {
            name: "Bob",
            folderId: "folder-sibling"
        });
        const inRoot = await createAuthorEntry(admin, { name: "Cid" });

        const routed = await requestEntryReview(admin, inGrandchild);
        const notMatched = await requestEntryReview(admin, inSibling);
        const rootReview = await requestEntryReview(admin, inRoot);

        expect(routed.currentStepState).toBe("inReview");
        expect(routed.currentOwnerId).toBe(REVIEWER.id);
        expect(routed.steps[0].assignment).toMatchObject({ source: "rule", ruleId: "rule-1" });
        for (const pooled of [notMatched, rootReview]) {
            expect(pooled.currentStepState).toBe("awaiting");
            expect(pooled.currentOwnerId).toBeNull();
            expect(pooled.steps[0].candidateTeamIds).toEqual([REVIEW_TEAM]);
            expect(pooled.steps[0].assignment).toMatchObject({ source: "pool" });
        }
    });

    it("falls through to the pool when the folder chain read fails (R116)", async () => {
        addAuthorFolders();
        failingFolderReads.add("folder-child");
        const admin = await createUserContext({
            legacyPlugins: [registerTestUsers],
            permissionsByIdentity: { [REVIEWER.id]: CMS_READER }
        });
        expectOk(
            await storeWorkflow(
                admin,
                createWorkflowValuesWithAssignment({
                    strategy: "none",
                    allowManualPick: false,
                    rules: [
                        {
                            id: "rule-1",
                            conditions: {
                                folder: {
                                    id: "folder-parent",
                                    type: "cms:author",
                                    includeDescendants: true
                                }
                            },
                            target: { type: "user", id: REVIEWER.id }
                        }
                    ]
                })
            )
        );
        const entry = await createAuthorEntry(admin, { name: "Ann", folderId: "folder-child" });

        const review = await requestEntryReview(admin, entry);

        expect(review.currentStepState).toBe("awaiting");
        expect(review.currentOwnerId).toBeNull();
        expect(review.steps[0].assignment).toMatchObject({
            source: "pool",
            reason: "Routing failed; the step went to the pool."
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryFolderPort.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/target/CmsEntryFolderExistsService/index.js`.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, "registers one cms adapter port of each kind" expects 1 `ReviewTargetFolderChain`, receives 0.

- [ ] **Step 3: The folder type helpers**

Create `packages/api-headless-cms-workflows/src/utils/folderType.ts`:

```ts
const CMS_FOLDER_TYPE = /^cms:([a-zA-Z0-9_-]+)$/;

/** The ACO folder type of a CMS model's entries, e.g. "cms:article". Pure. */
export const toCmsFolderType = (modelId: string): string => {
    return `cms:${modelId}`;
};

/** The model id of a `cms:<modelId>` folder type; `null` for any other type (e.g. "wb:page"). */
export const getModelIdFromFolderType = (type: string): string | null => {
    const matched = type.match(CMS_FOLDER_TYPE);
    return matched ? matched[1] : null;
};
```

- [ ] **Step 4: The folder chain port**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetFolderChain.ts`:

```ts
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";
import { toCmsFolderType } from "~/utils/folderType.js";

/**
 * The folder of a `cms.<modelId>` target and its ancestors, nearest first, for the routing rules'
 * folder condition (spec 6, R113, R114). Read through ACO's repository, which applies no
 * folder-level permissions (the folder model is private with `authorization: false`): routing
 * matches the folder tree, not what the requester may see. Read at step reach, so a moved parent
 * counts. A missing folder, a folder of another type and a failed read throw; the engine falls
 * through to the pool (R116).
 */
class CmsEntryReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public constructor(
        private getFolder: GetFolderRepository.Interface,
        private getAncestors: GetAncestorsUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            throw new Error(`"${params.model}" is not a CMS namespace.`);
        }

        const folder = await this.getFolder.execute(params.folderId);
        if (folder.isFail()) {
            throw folder.error;
        }
        if (folder.value.type !== toCmsFolderType(modelId)) {
            throw new Error(`Folder "${params.folderId}" is not a folder of "${params.model}".`);
        }

        const ancestors = await this.getAncestors.execute({ folder: folder.value });
        if (ancestors.isFail()) {
            throw ancestors.error;
        }
        return ancestors.value.map(item => item.id);
    }
}

export const CmsEntryReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: CmsEntryReviewTargetFolderChainImpl,
    dependencies: [GetFolderRepository, GetAncestorsUseCase]
});
```

- [ ] **Step 5: Folder-level read access**

In `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/abstractions.ts`, replace the type import with:

```ts
import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";

export interface CmsEntryFolderReadParams {
    /** Read as the current identity before the check (A19). */
    model: CmsModel;
    group: CmsGroup;
    /** `null` or "root": the root folder, no folder-level check. */
    folderId: string | null;
}
```

add to `ICmsEntryAccess` after `canDeleteAnyEntry`:

```ts
    /**
     * Read access of the current identity to the model's entries in a folder, without an entry
     * (the routing inspector, R121): group read, model read, entity-level entry read and the
     * folder's content read. Evaluated as another user inside `CandidateReadAccess`.
     */
    canReadInFolder(params: CmsEntryFolderReadParams): Promise<boolean>;
```

and add to the `CmsEntryAccess` namespace:

```ts
    export type FolderReadParams = CmsEntryFolderReadParams;
```

In `packages/api-headless-cms-workflows/src/features/target/CmsEntryAccess/CmsEntryAccess.ts`, add the method after `canDelete`:

```ts
    public async canReadInFolder(params: Abstraction.FolderReadParams): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: params.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: params.model }))) {
            return false;
        }
        const canAccessEntries = await this.accessControl.canAccessEntry({
            model: params.model,
            rwd: "r"
        });
        if (!canAccessEntries) {
            return false;
        }
        // As for an entry: skipped when FLP is not in use for the identity or for the root folder.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        if (!params.folderId || params.folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
            params.folderId
        );
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }
```

Replace `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetReadAccess.ts` (4.1 Task 2 left `canUserReadInFolder` answering `false` here) with:

```ts
import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "./CmsEntryAccess/index.js";

/**
 * `canUserRead` and `canUserReadInFolder` for `cms.*` targets (D61, D133, R48, R121). The model,
 * group and revision are read as the current identity first, so nothing is read as the other user
 * (A19); only the CMS access check (group read, model read, entry and folder access, R72) runs as
 * that user, through `CandidateReadAccess` (R67), which wraps it in `withIdentity` and
 * `withAuthorization`.
 *
 * Contract (SEC-66): reach this only as the request identity, never from inside
 * `withoutAuthorization`. The CMS model cache is filled per tenant after access filtering, so a
 * model read without authorization would cache the unfiltered list for every later caller.
 * `CandidateReadAccess` is the only place that changes identity for the check. Any failure,
 * including a throwing target or model read, answers `false` (fail closed, R50).
 */
class CmsEntryReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private candidates: CandidateReadAccess.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        let target: CmsEntryTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
        } catch {
            return false;
        }
        if (!target || target.entry.entryId !== params.targetId) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => this.access.canRead(target));
    }

    /**
     * Without an entry (the routing inspector): the model and folder only, so a user shown as
     * readable can still lack access to one entry (own-only permissions, A47).
     */
    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        const modelId = getModelIdFromAppName(params.model);
        if (!modelId) {
            return false;
        }
        let model: CmsModel;
        let group: CmsGroup;
        try {
            const modelResult = await this.getModel.execute(modelId);
            if (modelResult.isFail() || modelResult.value.isPrivate) {
                return false;
            }
            const groupResult = await this.getGroup.execute(modelResult.value.group);
            if (groupResult.isFail()) {
                return false;
            }
            model = modelResult.value;
            group = groupResult.value;
        } catch {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => {
            return this.access.canReadInFolder({ model, group, folderId: params.folderId });
        });
    }
}

export const CmsEntryReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: CmsEntryReviewTargetReadAccessImpl,
    dependencies: [
        CmsEntryTargetReader,
        CmsEntryAccess,
        CandidateReadAccess,
        GetModelUseCase,
        GetGroupUseCase
    ]
});
```

- [ ] **Step 6: Folder existence**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface CmsEntryFolderExistsParams {
    id: string;
    /** ACO folder type, `cms:<modelId>`. */
    type: string;
}

export interface ICmsEntryFolderExistsService {
    /**
     * Whether a folder with this id and type exists. `false` for a type that is not
     * `cms:<modelId>`, a model the current identity cannot read, a private or unpublishable model,
     * a missing folder or a folder of another type. Throws when a model or folder read fails.
     */
    exists(params: CmsEntryFolderExistsParams): Promise<boolean>;
}

/**
 * Folder existence for the workflow editor's folder rules (D69, R125): the folder repository
 * without folder-level permissions, so it answers for folders the editor cannot open, and only a
 * boolean. The caller checks `editor`.
 */
export const CmsEntryFolderExistsService = createAbstraction<ICmsEntryFolderExistsService>(
    "CmsEntryFolderExistsService"
);

export namespace CmsEntryFolderExistsService {
    export type Interface = ICmsEntryFolderExistsService;
    export type Params = CmsEntryFolderExistsParams;
}
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/CmsEntryFolderExistsService.ts`:

```ts
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { getModelIdFromFolderType } from "~/utils/folderType.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { CmsEntryFolderExistsService as Abstraction } from "./abstractions.js";

const UNREADABLE_MODEL_CODES = ["Cms/Model/NotFound", "Cms/Model/NotAuthorized"];
const FOLDER_NOT_FOUND = "Aco/Folder/NotFound";

/**
 * The model is read as the current identity (the editor), so the answer never covers a model
 * they cannot bind (D116); the folder through ACO's repository, which applies no folder-level
 * permissions (D69).
 */
class CmsEntryFolderExistsServiceImpl implements Abstraction.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private getFolder: GetFolderRepository.Interface
    ) {}

    public async exists(params: Abstraction.Params): Promise<boolean> {
        // The ACO repository reads "<id>#<n>" as a revision; such an id is never a folder.
        if (!params.id || params.id.includes("#")) {
            return false;
        }
        const modelId = getModelIdFromFolderType(params.type);
        if (!modelId) {
            return false;
        }

        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (UNREADABLE_MODEL_CODES.includes(model.error.code)) {
                return false;
            }
            throw model.error;
        }
        if (!isBindableModel(model.value)) {
            return false;
        }

        const folder = await this.getFolder.execute(params.id);
        if (folder.isFail()) {
            if (folder.error.code === FOLDER_NOT_FOUND) {
                return false;
            }
            throw folder.error;
        }
        return folder.value.type === params.type;
    }
}

export const CmsEntryFolderExistsService = Abstraction.createImplementation({
    implementation: CmsEntryFolderExistsServiceImpl,
    dependencies: [GetModelUseCase, GetFolderRepository]
});
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryFolderExistsService/index.ts`:

```ts
export { CmsEntryFolderExistsService } from "./abstractions.js";
```

- [ ] **Step 7: Register**

Replace `packages/api-headless-cms-workflows/src/features/target/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsModelReviewNamespace } from "./CmsEntryReviewNamespace/CmsModelReviewNamespace.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/CmsEntryTargetReader.js";
import { CmsEntryAccess } from "./CmsEntryAccess/CmsEntryAccess.js";
import { CmsEntryFolderExistsService } from "./CmsEntryFolderExistsService/CmsEntryFolderExistsService.js";
import { CmsEntryReviewTargetLoader } from "./CmsEntryReviewTargetLoader.js";
import { CmsEntryReviewTargetSync } from "./CmsEntryReviewTargetSync.js";
import { CmsEntryReviewTargetReadAccess } from "./CmsEntryReviewTargetReadAccess.js";
import { CmsEntryReviewTargetFolderChain } from "./CmsEntryReviewTargetFolderChain.js";

/** The `cms.*` target adapter (spec 9.3). */
export const CmsTargetFeature = createFeature({
    name: "CmsWorkflows/Target",
    register(container) {
        container.register(CmsModelReviewNamespace);
        container.register(CmsEntryTargetReader);
        container.register(CmsEntryAccess);
        container.register(CmsEntryFolderExistsService);

        // Engine ports, one per namespace (R28, R50, R114).
        container.register(CmsEntryReviewTargetLoader);
        container.register(CmsEntryReviewTargetSync);
        container.register(CmsEntryReviewTargetReadAccess);
        container.register(CmsEntryReviewTargetFolderChain);
    }
});
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryFolderPort.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50`
Expected: PASS (the harness change and the changed read-access port leave the existing behaviour alone).

Run, one at a time:
`yarn test:os packages/api-headless-cms-workflows/__tests__/target/CmsEntryFolderPort.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-headless-cms-workflows/__tests__/registration.test.ts packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the cms folder chain, folder read check and folder existence

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
