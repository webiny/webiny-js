### Task 11: WB page folder chain, `canUserReadInFolder`, folder existence

Spec 6 (condition inputs: "the target's current folder and its ancestors"), 10 (`folderExists`); D61, D69, D118, D133; R50, R113, R114, R116, R121, R125; SEC-66; A28, A47. The Website Builder side of the routing ports in `packages/api-website-builder-workflows`, mirroring CMS Task 8:

- `WbPageReviewTargetFolderChain` implements the engine's `ReviewTargetFolderChain` (R114) for `wb.page`: ACO `GetFolderRepository` (no folder-level permissions; the folder model is private with `authorization: false`, so no `withoutAuthorization` and no CMS model cache, SEC-66) reads the folder, its `type` must be `wb:page` (`WB_PAGE_FOLDER_TYPE`), and ACO `GetAncestorsUseCase` returns `[folder, parent, ...]`. The port returns their ids, nearest first. A missing folder, a folder of another type and a failed read throw; the engine falls through to the pool (R116).
- `WbPageReviewTargetReadAccess.canUserReadInFolder` (R121) replaces the fail-closed stub 4.1 Task 2 added: another namespace answers `false`; otherwise `CandidateReadAccess` runs the new `WbPageAccess.canReadInFolder(folderId)` as the user. That check is `wb.page` read plus, unless the folder is the root (`null` or `"root"`) or FLP is not in use, `canAccessFolderContent` with `rwd: "r"`, as `canRead` does for a page (R78). Without a page there is no own-only check (A47: step reach re-checks the page). Any failure answers `false` (R50).
- `WbPageFolderExistsService.exists(folderId)` (R125, D69), the building block for Task 12's `WebsiteBuilderPageFolderExistsUseCase`: `GetFolderRepository` by id and `folder.type === "wb:page"`. A missing folder, another type or an id that is empty or contains `#` (folder ids are plain entry ids; the repository would read `<id>#<n>` as a revision) answer `false`; a failed read throws (the wrapper maps it, R87). No folder data leaves the service.

The default harness stand-ins for the two ACO reads (`registerNoAcoFolders`: no folder exists, no ancestors) were added by 4.3 Task 8, because this harness registers `CmsWorkflowsFeature` whose folder chain needs them. The folder tests here use real ACO folders instead: `registerAco` (ACO storage operations, `AcoFeature`, the fake FLP back on top, as `api-website-builder`'s `pageFolderDelete.test.ts` does) runs after the stand-ins and replaces them; `vitest.config.ts` gains the ACO storage-operations preset for it. The task adds this package's user directory (`FakeListUsers.ts`, the same shape as the CMS one: `TEST_USERS`, `registerTestUsers`) and `storeWbWorkflowWithAssignment`, reused by Tasks 12 and 13, and proves the chain end to end: a rule with a descendant folder condition routes a review of a page in a child folder to the rule's user.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetFolderChain.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/WbPageFolderExistsService.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/index.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/WbPageAccess/abstractions.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/WbPageAccess/WbPageAccess.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetReadAccess.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/feature.ts`
- Modify: `packages/api-website-builder-workflows/vitest.config.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/aco.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FakeListUsers.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/ThrowingWbPageAccess.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/engine.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Test: `packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts`
- Not touched (created by 4.3 Task 8): `packages/api-website-builder-workflows/__tests__/__helpers/NoAcoFolders.ts` and its registration in `__tests__/__helpers/handler.ts`.

**Interfaces:**
- Consumes:
  - 4.1 Task 2: `ReviewTargetFolderChain` (`@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js`), `canHandle(model: string): boolean`, `listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]>` with `Params` = `ReviewTargetFolderChainParams { model: string; folderId: string }`; resolved `multiple`, the last registered match wins (R114). `ReviewTargetReadAccess.canUserReadInFolder(params: ReviewTargetReadAccess.FolderReadParams): Promise<boolean>` with `FolderReadParams { userId: string; model: string; folderId: string | null }` (R121), and the fail-closed stub it added to `WbPageReviewTargetReadAccess` (this task replaces the whole file).
  - 4.1 Tasks 2/3: the routing resolver matches a rule's `folder` condition against `listFolderChainIds` of the review's `targetContext.folder` (R113) and writes `assignment: { source: "rule", ruleId }` for a valid user target (R109); a throw falls through to the pool with `reason: "Routing failed; the step went to the pool."` (`ROUTING_FAILED_REASON`, R116).
  - 4.2 Task 6: `StoreWorkflowUseCase` checks rule user targets with `ListUsersUseCase({ where: { id_in, teams_in } })` (R122); the fake directory answers it.
  - 4.3 Task 8: `registerNoAcoFolders(container)` (`__tests__/__helpers/NoAcoFolders.ts`), registered by default in `createContextHandler`.
  - ACO: `GetFolderRepository` (`@webiny/api-aco/features/folder/GetFolder/abstractions.js`), `execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>>`; `GetAncestorsUseCase` (`@webiny/api-aco/features/folder/GetAncestors/index.js`), `execute(params: { folder: Folder }): Promise<Result<Folder[], GetAncestorsUseCase.Error>>`; `FolderNotFoundError` (code `Aco/Folder/NotFound`, message `"Folder not found!"`), `FolderPersistenceError` (`@webiny/api-aco/domain/folder/errors.js`); `Folder` (`@webiny/api-aco/folder/folder.types.js`); `AcoFeature` (`@webiny/api-aco`); `CreateFolderUseCase` (`@webiny/api-aco/features/folder/CreateFolder/index.js`), `execute({ title, slug, type, parentId })`; `getStorageOps` (`@webiny/api-core/testing/environment.js`), `processLegacyPlugins` (`@webiny/api-headless-cms-testing`).
  - api-core: `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`), `execute(input?: ListUsersInput): Promise<Result<AdminUser[], ListUsersUseCase.Error>>`, `ListUsersInput` (`@webiny/api-core/features/users/shared/types.js`); `GetUserUseCase` (`@webiny/api-core/features/users/GetUser/index.js`).
  - Phase 2: `CandidateReadAccess` (`@webiny/api-workflows/features/identity/CandidateReadAccess/index.js`), `canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean>`; `WbPageTargetReader`, `WbPageAccess`, `WbPermissions.canRead("page")`, `FolderLevelPermissions`, `ROOT_FOLDER` (`@webiny/api-website-builder/constants.js`), `WB_PAGE_NAMESPACE`, `WB_PAGE_FOLDER_TYPE` (`~/constants.js`); `ReviewStepAssignmentConfig` (`@webiny/api-workflows/domain/workflow/types.js`).
- Produces:
  - `WbPageReviewTargetFolderChain` (a `ReviewTargetFolderChain` implementation, registered in `WbTargetFeature`). Error for a folder of another type: `Folder "<id>" is not a Website Builder page folder.`
  - `WbPageAccess.Interface.canReadInFolder(folderId: string | null): Promise<boolean>`.
  - `WbPageReviewTargetReadAccess.canUserReadInFolder` (real implementation).
  - `WbPageFolderExistsService` (`~/features/target/WbPageFolderExistsService/index.js`): `WbPageFolderExistsService.Interface { exists(folderId: string): Promise<boolean> }`; registered in `WbTargetFeature`; throws when the folder read fails.
  - Test helpers: `registerAco(container)`, `failFolderReads(container)` (every folder read fails with `FolderPersistenceError` `"Storage is down."`; register after `registerAco`), `createWbFolder(context, params: WbFolderParams): Promise<Folder>` with `WbFolderParams { title: string; slug: string; parentId?: string | null; type?: string }` (`type` defaults to `"wb:page"`) (`~tests/__helpers/aco.js`); `TestUser { identity: IdentityData; teams: string[] }`, `TEST_USERS` (REQUESTER, REVIEWER, OTHER_REVIEWER in `team-1`; READER, REASSIGNER, EDITOR in no team), `FakeListUsers`, `registerTestUsers(container)` (`~tests/__helpers/FakeListUsers.js`); `createWbWorkflowValuesWithAssignment(assignment: ReviewStepAssignmentConfig): WorkflowValues` and `storeWbWorkflowWithAssignment(context, assignment): Promise<Workflow>` (`~tests/__helpers/engine.js`); `WbPageAccessCheck` gains `"canReadInFolder"`.

- [ ] **Step 1: Write the failing tests**

Add the ACO preset to `packages/api-website-builder-workflows/vitest.config.ts`: replace

```ts
        ["@webiny/api-core", "storage-operations"]
    );
```

with

```ts
        ["@webiny/api-core", "storage-operations"],
        // Folder tests register ACO through `registerAco`.
        ["@webiny/api-aco", "storage-operations"]
    );
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/aco.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { processLegacyPlugins } from "@webiny/api-headless-cms-testing";
import { AcoFeature } from "@webiny/api-aco";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { FolderPersistenceError } from "@webiny/api-aco/domain/folder/errors.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { expectOk } from "./pages.js";

/**
 * Real ACO folders for the tests that need them (`legacyPlugins`), as `api-website-builder`'s
 * `pageFolderDelete.test.ts` registers them. Runs after the harness's `registerNoAcoFolders`
 * stand-ins and replaces them. `AcoFeature` registers its own FLP; the fake one goes back on top
 * (A28).
 */
export const registerAco = (container: Container) => {
    processLegacyPlugins(container, getStorageOps("aco").plugins);
    AcoFeature.register(container);
    container.register(FakeFolderLevelPermissions);
};

class FailingGetFolderRepository implements GetFolderRepository.Interface {
    public async execute(): Promise<Result<Folder, GetFolderRepository.Error>> {
        return Result.fail(new FolderPersistenceError(new Error("Storage is down.")));
    }
}

/** Every folder read fails (`legacyPlugins`, after `registerAco`). */
export const failFolderReads = (container: Container) => {
    container.registerInstance(GetFolderRepository, new FailingGetFolderRepository());
};

export interface WbFolderParams {
    title: string;
    slug: string;
    /** Defaults to the root (`null`). */
    parentId?: string | null;
    /** Defaults to `"wb:page"`. */
    type?: string;
}

/** Creates an ACO folder as the context's identity; needs `registerAco`. */
export const createWbFolder = async (
    context: CmsContext,
    params: WbFolderParams
): Promise<Folder> => {
    return expectOk(
        await context.container.resolve(CreateFolderUseCase).execute({
            title: params.title,
            slug: params.slug,
            type: params.type ?? "wb:page",
            parentId: params.parentId ?? null
        })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/FakeListUsers.ts`:

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
 * The stored admin users routing sees (R111), as in the CMS package. REQUESTER is a member of the
 * review team here so "minus the requester" is exercised; the reviewers' own team lookup
 * (`FakeListUserTeams` in `userContext.ts`) is unchanged.
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
 * admin-user lookup of `CandidateReadAccess` (R68). Give the users their page permissions with
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

In `packages/api-website-builder-workflows/__tests__/__helpers/engine.ts` replace the workflow type import with:

```ts
import type {
    ReviewStepAssignmentConfig,
    Workflow,
    WorkflowValues
} from "@webiny/api-workflows/domain/workflow/types.js";
```

and add after `storeWbWorkflow`:

```ts
/** The pages workflow with the given routing on its only step (team "team-1"). */
export const createWbWorkflowValuesWithAssignment = (
    assignment: ReviewStepAssignmentConfig
): WorkflowValues => {
    const values = createWbWorkflowValues();
    return {
        ...values,
        steps: values.steps.map(step => {
            return { ...step, config: { teams: [REVIEW_TEAM], assignment } };
        })
    };
};

/** Stores the pages workflow with the given routing through the engine (no wrapper). */
export const storeWbWorkflowWithAssignment = async (
    context: CmsContext,
    assignment: ReviewStepAssignmentConfig
): Promise<Workflow> => {
    return expectOk(
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWbWorkflowValuesWithAssignment(assignment),
            actor: WB_ADMIN_ACTOR
        })
    );
};
```

In `packages/api-website-builder-workflows/__tests__/__helpers/ThrowingWbPageAccess.ts` replace

```ts
export type WbPageAccessCheck =
    | "canRead"
    | "canWrite"
    | "canDelete"
    | "canWriteAnyPage"
    | "canDeleteAnyPage";
```

with

```ts
export type WbPageAccessCheck =
    | "canRead"
    | "canWrite"
    | "canDelete"
    | "canWriteAnyPage"
    | "canDeleteAnyPage"
    | "canReadInFolder";
```

and add after the `canDelete` method of `ThrowingWbPageAccessImpl`:

```ts
    public async canReadInFolder(folderId: string | null): Promise<boolean> {
        if (throwingAccessChecks.has("canReadInFolder")) {
            return fail("canReadInFolder");
        }
        return this.decoratee.canReadInFolder(folderId);
    }
```

In `packages/api-website-builder-workflows/__tests__/registration.test.ts` add the imports after the `ReviewTargetReadAccess` import:

```ts
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";
```

add `WbPageFolderExistsService` as the last item of `WRAPPERS` (after `WbPageReviewGuardService`), and in "registers one page adapter port of each kind beside the CMS ones, and every wrapper once", after the `ReviewTargetReadAccess` expectation:

```ts
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(2);
        expect(
            container
                .resolveAll(ReviewTargetFolderChain)
                .filter((item: ReviewTargetFolderChain.Interface) => item.canHandle("wb.page"))
        ).toHaveLength(1);
```

and in "registers no wrapper, guard, page adapter or page handler without the advancedPublishingWorkflow license", after `expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);`:

```ts
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import type { ReviewStepAssignmentConfig } from "@webiny/api-workflows/domain/workflow/types.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflowWithAssignment } from "~tests/__helpers/engine.js";
import {
    NOBODY,
    READER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    WB_READER,
    WB_WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, failFolderReads, registerAco } from "~tests/__helpers/aco.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { WbPageFolderExistsService } from "~/features/target/WbPageFolderExistsService/index.js";

/** READER and NOBODY are admin users of the tenant; "user-elsewhere" is not (R68). */
const registerAdminUsers = (container: Container) => {
    container.registerInstance(GetUserUseCase, new FakeAdminUsers([READER.id, NOBODY.id]));
};

/** Real ACO folders; the default admin (`*`) unless given; READER reads pages. */
const createAcoContext = (params: UserContextParams = {}) => {
    return createUserContext({
        ...params,
        permissionsByIdentity: { [READER.id]: WB_READER, "user-elsewhere": WB_READER },
        legacyPlugins: [
            registerAco,
            registerAdminUsers,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const getFolderChain = (context: CmsContext): ReviewTargetFolderChain.Interface => {
    return context.container
        .resolveAll(ReviewTargetFolderChain)
        .find(item => item.canHandle("wb.page"))!;
};

const getReadAccess = (context: CmsContext): ReviewTargetReadAccess.Interface => {
    return context.container
        .resolveAll(ReviewTargetReadAccess)
        .find(item => item.canHandle("wb.page"))!;
};

const folderExists = (context: CmsContext, id: string) => {
    return context.container.resolve(WbPageFolderExistsService).exists(id);
};

/** Marketing > Campaigns > Spring and Legal (root level), all page folders. */
const createPageFolders = async (context: CmsContext) => {
    const marketing = await createWbFolder(context, { title: "Marketing", slug: "marketing" });
    const campaigns = await createWbFolder(context, {
        title: "Campaigns",
        slug: "campaigns",
        parentId: marketing.id
    });
    const spring = await createWbFolder(context, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    const legal = await createWbFolder(context, { title: "Legal", slug: "legal" });
    return { marketing, campaigns, spring, legal };
};

/** One rule: pages under the given folder (descendants included) go to REVIEWER. */
const folderRule = (folderId: string): ReviewStepAssignmentConfig => {
    return {
        strategy: "none",
        allowManualPick: false,
        rules: [
            {
                id: "rule-campaigns",
                conditions: { folder: { id: folderId, type: "wb:page", includeDescendants: true } },
                target: { type: "user", id: REVIEWER.id }
            }
        ]
    };
};

describe("WB folder port", () => {
    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
    });

    it("lists a page folder and its ancestors, nearest first (R114)", async () => {
        const context = await createAcoContext();
        const { marketing, campaigns, spring } = await createPageFolders(context);
        const chain = getFolderChain(context);

        const nested = await chain.listFolderChainIds({ model: "wb.page", folderId: spring.id });
        const topLevel = await chain.listFolderChainIds({
            model: "wb.page",
            folderId: marketing.id
        });

        expect(nested).toEqual([spring.id, campaigns.id, marketing.id]);
        expect(topLevel).toEqual([marketing.id]);
    });

    it("reads the chain as a page author without CMS permissions (private folder model)", async () => {
        const admin = await createAcoContext();
        const { marketing, campaigns } = await createPageFolders(admin);
        const requester = await createAcoContext({ identity: REQUESTER, permissions: WB_WRITER });

        const ids = await getFolderChain(requester).listFolderChainIds({
            model: "wb.page",
            folderId: campaigns.id
        });

        expect(ids).toEqual([campaigns.id, marketing.id]);
    });

    it("answers only for the wb.page namespace", async () => {
        const chain = getFolderChain(await createAcoContext());

        expect(chain.canHandle("wb.page")).toBe(true);
        expect(chain.canHandle("cms.article")).toBe(false);
    });

    it("throws for a missing folder and a folder of another type (R116)", async () => {
        const context = await createAcoContext();
        const articles = await createWbFolder(context, {
            title: "Articles",
            slug: "articles",
            type: "cms:article"
        });
        const chain = getFolderChain(context);

        await expect(
            chain.listFolderChainIds({ model: "wb.page", folderId: "folder-missing" })
        ).rejects.toThrow("Folder not found!");
        await expect(
            chain.listFolderChainIds({ model: "wb.page", folderId: articles.id })
        ).rejects.toThrow(`Folder "${articles.id}" is not a Website Builder page folder.`);
    });

    it("throws when the folder read fails", async () => {
        const context = await createAcoContext({ legacyPlugins: [failFolderReads] });

        await expect(
            getFolderChain(context).listFolderChainIds({ model: "wb.page", folderId: "folder-1" })
        ).rejects.toThrow("Storage is down.");
    });

    it("answers folder read access with the user's permissions (R121)", async () => {
        const access = getReadAccess(await createAcoContext());
        folderLevels.set("folder-locked", new Map([[READER.id, "no-access"]]));
        folderLevels.set("root", new Map([[READER.id, "no-access"]]));
        const ask = (folderId: string | null) => {
            return access.canUserReadInFolder({ userId: READER.id, model: "wb.page", folderId });
        };

        const inRoot = await ask(null);
        const inRootById = await ask("root");
        const inFolder = await ask("folder-1");
        const inLockedFolder = await ask("folder-locked");

        expect({ inRoot, inRootById, inFolder, inLockedFolder }).toEqual({
            inRoot: true,
            inRootById: true,
            inFolder: true,
            inLockedFolder: false
        });
    });

    it("denies a user without page permissions or outside the tenant (R68)", async () => {
        const access = getReadAccess(await createAcoContext());

        for (const userId of [NOBODY.id, "user-elsewhere"]) {
            const canRead = await access.canUserReadInFolder({
                userId,
                model: "wb.page",
                folderId: null
            });
            expect(canRead).toBe(false);
        }
    });

    it("denies another app's namespace and a throwing check (R50)", async () => {
        const access = getReadAccess(await createAcoContext());
        const ask = (model: string) => {
            return access.canUserReadInFolder({ userId: READER.id, model, folderId: "folder-1" });
        };

        expect(await ask("cms.article")).toBe(false);
        throwingAccessChecks.add("canReadInFolder");
        expect(await ask("wb.page")).toBe(false);
    });

    it("answers as the user while the request runs as a reader (SEC-66)", async () => {
        const context = await createAcoContext({ identity: READER, permissions: WB_READER });
        folderLevels.set("folder-1", new Map([[READER.id, "viewer"]]));
        const access = getReadAccess(context);

        const reader = await access.canUserReadInFolder({
            userId: READER.id,
            model: "wb.page",
            folderId: "folder-1"
        });
        const nobody = await access.canUserReadInFolder({
            userId: NOBODY.id,
            model: "wb.page",
            folderId: "folder-1"
        });

        expect({ reader, nobody }).toEqual({ reader: true, nobody: false });
        expect(context.container.resolve(IdentityContext).getIdentity().id).toBe(READER.id);
    });

    it("finds a page folder by id, without folder-level permissions (D69, R125)", async () => {
        const admin = await createAcoContext();
        const { spring } = await createPageFolders(admin);
        folderLevels.set(spring.id, new Map([[READER.id, "no-access"]]));
        const reader = await createAcoContext({ identity: READER, permissions: WB_READER });

        expect(await folderExists(admin, spring.id)).toBe(true);
        expect(await folderExists(reader, spring.id)).toBe(true);
    });

    it("does not find a missing folder, a folder of another type or a revision-like id", async () => {
        const context = await createAcoContext();
        const { spring } = await createPageFolders(context);
        const articles = await createWbFolder(context, {
            title: "Articles",
            slug: "articles",
            type: "cms:article"
        });

        expect(await folderExists(context, "folder-missing")).toBe(false);
        expect(await folderExists(context, articles.id)).toBe(false);
        expect(await folderExists(context, `${spring.id}#0001`)).toBe(false);
        expect(await folderExists(context, "")).toBe(false);
    });

    it("throws when the folder read fails", async () => {
        const context = await createAcoContext({ legacyPlugins: [failFolderReads] });

        await expect(folderExists(context, "folder-1")).rejects.toThrow("Storage is down.");
    });
});

describe("WB folder rules in routing", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("routes a review of a page in a descendant folder to the rule's user (R113, R114)", async () => {
        const admin = await createUserContext({
            legacyPlugins: [registerAco, registerTestUsers],
            permissionsByIdentity: { [REVIEWER.id]: WB_READER }
        });
        const { campaigns, spring, legal } = await createPageFolders(admin);
        await storeWbWorkflowWithAssignment(admin, folderRule(campaigns.id));
        const inSpring = await createPage(admin, { title: "Spring", folderId: spring.id });
        const inLegal = await createPage(admin, { title: "Legal", folderId: legal.id });
        const inRoot = await createPage(admin, { title: "Home" });

        const routed = await requestPageReview(admin, inSpring);
        const notMatched = await requestPageReview(admin, inLegal);
        const rootReview = await requestPageReview(admin, inRoot);

        expect(routed.currentStepState).toBe("inReview");
        expect(routed.currentOwnerId).toBe(REVIEWER.id);
        expect(routed.steps[0].assignment).toMatchObject({
            source: "rule",
            ruleId: "rule-campaigns"
        });
        for (const pooled of [notMatched, rootReview]) {
            expect(pooled.currentStepState).toBe("awaiting");
            expect(pooled.currentOwnerId).toBeNull();
            expect(pooled.steps[0].candidateTeamIds).toEqual([REVIEW_TEAM]);
            expect(pooled.steps[0].assignment).toMatchObject({ source: "pool" });
        }
    });

    it("falls through to the pool when the folder chain read fails (R116)", async () => {
        const setup = await createUserContext({ legacyPlugins: [registerAco] });
        const { campaigns, spring } = await createPageFolders(setup);
        const admin = await createUserContext({
            legacyPlugins: [registerAco, registerTestUsers, failFolderReads],
            permissionsByIdentity: { [REVIEWER.id]: WB_READER }
        });
        await storeWbWorkflowWithAssignment(admin, folderRule(campaigns.id));
        const page = await createPage(admin, { title: "Spring", folderId: spring.id });

        const review = await requestPageReview(admin, page);

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

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/target/WbPageFolderExistsService/index.js`.

Run: `yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, the same unresolved import. Record both as RED.

- [ ] **Step 3: `WbPageAccess.canReadInFolder`**

In `packages/api-website-builder-workflows/src/features/target/WbPageAccess/abstractions.ts` add after the `canRead` member of `IWbPageAccess`:

```ts
    /**
     * Read access of the current identity to pages in a folder, without a page (the routing
     * inspector, R121): `wb.page` read plus folder content read. Root (`null` or `"root"`) or FLP
     * not in use: the page read only. No own-only check without a page (A47).
     */
    canReadInFolder(folderId: string | null): Promise<boolean>;
```

In `packages/api-website-builder-workflows/src/features/target/WbPageAccess/WbPageAccess.ts` add after the `canRead` method:

```ts
    public async canReadInFolder(folderId: string | null): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or for the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }
```

- [ ] **Step 4: `canUserReadInFolder`**

Replace `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetReadAccess.ts` (including 4.1 Task 2's stub) with:

```ts
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { CandidateReadAccess } from "@webiny/api-workflows/features/identity/CandidateReadAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";

/**
 * `canUserRead` for pages (D61, D133, R48): the page is read as the current identity, only the WB
 * access check runs as the other user, through `CandidateReadAccess` (R67). `canUserReadInFolder`
 * (R121) has no page: only the folder-level check runs as the other user.
 *
 * Contract (SEC-66): reach this only as the request identity, never from inside
 * `withoutAuthorization`. The page model is read through `PageModelProvider`, which uses the CMS
 * model cache (filled per tenant after access filtering), so a read without authorization would
 * cache the unfiltered list for every later caller. `CandidateReadAccess` is the only place that
 * changes identity for the check. Any failure, including a throwing target read, answers `false`
 * (fail closed, R50).
 */
class WbPageReviewTargetReadAccessImpl implements ReviewTargetReadAccess.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private candidates: CandidateReadAccess.Interface
    ) {}

    public canHandle(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async canUserRead(params: ReviewTargetReadAccess.UserReadParams): Promise<boolean> {
        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: params.model,
                targetRevisionId: params.targetRevisionId
            });
        } catch {
            return false;
        }
        if (!target || target.page.entryId !== params.targetId) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => this.access.canRead(target));
    }

    public async canUserReadInFolder(
        params: ReviewTargetReadAccess.FolderReadParams
    ): Promise<boolean> {
        if (params.model !== WB_PAGE_NAMESPACE) {
            return false;
        }
        return this.candidates.canUserRead(params.userId, () => {
            return this.access.canReadInFolder(params.folderId);
        });
    }
}

export const WbPageReviewTargetReadAccess = ReviewTargetReadAccess.createImplementation({
    implementation: WbPageReviewTargetReadAccessImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, CandidateReadAccess]
});
```

- [ ] **Step 5: The folder chain port**

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetFolderChain.ts`:

```ts
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { WB_PAGE_FOLDER_TYPE, WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The folder of a `wb.page` target and its ancestors, nearest first, for the routing rules'
 * folder condition (spec 6, R113, R114). Read through ACO's repository, which applies no
 * folder-level permissions (the folder model is private with `authorization: false`): routing
 * matches the folder tree, not what the requester may see. Read at step reach, so a moved parent
 * counts. A missing folder, a folder of another type and a failed read throw; the engine falls
 * through to the pool (R116).
 */
class WbPageReviewTargetFolderChainImpl implements ReviewTargetFolderChain.Interface {
    public constructor(
        private getFolder: GetFolderRepository.Interface,
        private getAncestors: GetAncestorsUseCase.Interface
    ) {}

    public canHandle(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async listFolderChainIds(params: ReviewTargetFolderChain.Params): Promise<string[]> {
        const folder = await this.getFolder.execute(params.folderId);
        if (folder.isFail()) {
            throw folder.error;
        }
        if (folder.value.type !== WB_PAGE_FOLDER_TYPE) {
            throw new Error(`Folder "${params.folderId}" is not a Website Builder page folder.`);
        }

        // The folder itself first, then its parents up to the root level.
        const ancestors = await this.getAncestors.execute({ folder: folder.value });
        if (ancestors.isFail()) {
            throw ancestors.error;
        }
        return ancestors.value.map(item => item.id);
    }
}

export const WbPageReviewTargetFolderChain = ReviewTargetFolderChain.createImplementation({
    implementation: WbPageReviewTargetFolderChainImpl,
    dependencies: [GetFolderRepository, GetAncestorsUseCase]
});
```

- [ ] **Step 6: The folder existence service**

Create `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IWbPageFolderExistsService {
    /**
     * Whether a `wb:page` folder with this id exists. A missing folder, another folder type or an
     * id that is no folder id (empty, or with `#`) answer `false`; a failed read throws.
     */
    exists(folderId: string): Promise<boolean>;
}

/**
 * The dangling-folder check of the workflow editor (D69, R125): reads the folder with ACO's
 * repository, without folder-level permissions, and answers only a boolean, never folder data.
 * The caller checks `editor` first (`WebsiteBuilderPageFolderExistsUseCase`).
 */
export const WbPageFolderExistsService = createAbstraction<IWbPageFolderExistsService>(
    "WbPageFolderExistsService"
);

export namespace WbPageFolderExistsService {
    export type Interface = IWbPageFolderExistsService;
}
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/WbPageFolderExistsService.ts`:

```ts
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import { WbPageFolderExistsService as Abstraction } from "./abstractions.js";

/** Compared by code, as the CMS service does: no dependency on one ACO module instance. */
const FOLDER_NOT_FOUND = "Aco/Folder/NotFound";

/**
 * The ACO folder model is private (`authorization: false`): the repository read needs no
 * `withoutAuthorization` and runs no folder-level permissions (D69).
 */
class WbPageFolderExistsServiceImpl implements Abstraction.Interface {
    public constructor(private getFolder: GetFolderRepository.Interface) {}

    public async exists(folderId: string): Promise<boolean> {
        // Folder ids are plain entry ids; the repository would read `<id>#<n>` as a revision.
        if (!folderId || folderId.includes("#")) {
            return false;
        }
        const folder = await this.getFolder.execute(folderId);
        if (folder.isFail()) {
            if (folder.error.code === FOLDER_NOT_FOUND) {
                return false;
            }
            throw folder.error;
        }
        return folder.value.type === WB_PAGE_FOLDER_TYPE;
    }
}

export const WbPageFolderExistsService = Abstraction.createImplementation({
    implementation: WbPageFolderExistsServiceImpl,
    dependencies: [GetFolderRepository]
});
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageFolderExistsService/index.ts`:

```ts
export { WbPageFolderExistsService } from "./abstractions.js";
```

- [ ] **Step 7: Register them**

Replace `packages/api-website-builder-workflows/src/features/target/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { WbPageReviewNamespace } from "./WbPageReviewNamespace.js";
import { WbPageTargetReader } from "./WbPageTargetReader/WbPageTargetReader.js";
import { WbPageAccess } from "./WbPageAccess/WbPageAccess.js";
import { WbPageFolderExistsService } from "./WbPageFolderExistsService/WbPageFolderExistsService.js";
import { WbPageReviewTargetLoader } from "./WbPageReviewTargetLoader.js";
import { WbPageReviewTargetSync } from "./WbPageReviewTargetSync.js";
import { WbPageReviewTargetReadAccess } from "./WbPageReviewTargetReadAccess.js";
import { WbPageReviewTargetFolderChain } from "./WbPageReviewTargetFolderChain.js";

/** The `wb.page` target adapter (spec 9.3). */
export const WbTargetFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Target",
    register(container) {
        // Lets the single CMS handlers cover pages (R51).
        container.register(WbPageReviewNamespace);
        container.register(WbPageTargetReader);
        container.register(WbPageAccess);
        // The workflow editor's dangling-folder check (D69, R125).
        container.register(WbPageFolderExistsService);

        // Engine ports, one per namespace (R28, R50, R114).
        container.register(WbPageReviewTargetLoader);
        container.register(WbPageReviewTargetSync);
        container.register(WbPageReviewTargetReadAccess);
        container.register(WbPageReviewTargetFolderChain);
    }
});
```

- [ ] **Step 8: Run the tests**

Run, one at a time:

```
yarn test packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts packages/api-website-builder-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/target/WbPageFolderPort.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts packages/api-website-builder-workflows/__tests__/target/WbPageAccess.test.ts packages/api-website-builder-workflows/__tests__/wrappers/requestAndGetReview.test.ts 2>&1 | tail -50
```

Expected: PASS. `WbPageAdapter.test.ts` and `WbPageAccess.test.ts` cover the replaced read-access file and the changed `WbPageAccess`; `requestAndGetReview.test.ts` covers step reach resolving the now two folder-chain ports with the default stand-ins.

- [ ] **Step 9: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 10: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-website-builder-workflows): page folder chain, folder-level read check and folder existence

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
