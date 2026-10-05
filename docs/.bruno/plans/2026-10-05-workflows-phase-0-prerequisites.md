# Workflows Phase 0: Prerequisites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the bugs and add the platform pieces outside the workflows packages that later phases of the workflows refactor depend on.

**Architecture:** Seven independent, small changes across api-headless-cms-workflows, api-workflows, app-headless-cms-workflows, api-core (+ DDB/SQL storage), api-website-builder, api-headless-cms (+ storage filter registries) and common-audit-logs. Each task is self-contained and ends with passing tests and a commit. No workflows domain code is rewritten here.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`), `@webiny/di` container, vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (sections 9.1, 9.4, 9.5, 15). Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`. Bugs: `docs/.bruno/workflows/bugs.md` (B1-B3).

## Global Constraints

- DI conventions: one abstraction or implementation per file; implementation file named after its class (no `implementation.ts`); export name matches the abstraction; types via namespace (`X.Interface`); no inline object types (extract named interfaces); minimal barrel exports (only what external consumers need).
- Before every commit, run from the repo root, in order: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, build the changed packages (`yarn build -p <package> 2>&1 | tail -30`), `git add .`. If any step changes something or fails and you fix it, rerun the chain from the start.
- Commit messages use Conventional Commits and end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw
  ```
- Never push, never amend.
- Test commands (from repo root): `yarn test <path>` (default storage), `yarn test:ddb <path>`, `yarn test:os <path>`, `yarn test:sql <path>`. Cap output with `2>&1 | tail -50`.
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.

## Review Focus

1. Storage variance: `teams_in` / `id_in` must behave the same on DDB and SQL. Both are tested under `yarn test:ddb` and `yarn test:sql` in Task 3.
2. Folder delete error code: the WB guard must surface `Aco/Folder/NotEmpty` (so `DeleteFolderUseCase` returns `FolderNotEmptyError`), not a generic error mapped to "not authorized". Task 4 asserts the code.
3. Hidden pages: a page the deleting user cannot read must still block the folder delete. Task 4 runs the content check under `withoutAuthorization`; the test deletes as a user without page permissions.
4. `UpdateEntrySystemUseCase` must not touch meta (`savedOn`, `modifiedOn`, `modifiedBy`) and must not fire `EntryAfterUpdate`. Task 5 asserts unchanged `savedOn` and that an `EntryAfterUpdate` handler is not called.
5. `system.workflow` filtering must work on OpenSearch, the target storage for workflows. Task 6 runs under `yarn test:os` as well as `yarn test:ddb`.

---

### Task 1: Remove double registration of the API workflows feature (B2, API)

**Files:**
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `WorkflowsFeature` (`@webiny/api-workflows`), `CmsWorkflowsFeature` (`~/index.js`), `NotificationTransport` (`@webiny/api-workflows/features/notifications/NotificationTransport/abstractions.js`), `CreateWorkflowUseCase`, `UpdateWorkflowUseCase` (api-workflows, confirm export paths with codegraph).
- Produces: `CmsWorkflowsFeature` no longer registers `WorkflowsFeature`; the app stack (`packages/api-event-handler-core/src/registerApiRequestStack.ts:127-128`) remains the single registration point. Test harness of api-headless-cms-workflows registers both, like the stack.

- [ ] **Step 1: Make the CMS workflows test harness mirror the production stack**

In `packages/api-headless-cms-workflows/__tests__/__handler/context.ts`, replace the `setup` line and its comment:

```ts
import { WorkflowsFeature } from "@webiny/api-workflows";
// ...
        // Mirror the production stack (registerApiRequestStack.ts): core workflows first, then the
        // CMS integration.
        setup: container => {
            WorkflowsFeature.register(container);
            CmsWorkflowsFeature.register(container);
        },
```

- [ ] **Step 2: Write the failing registration test (CMS integration)**

Create `packages/api-headless-cms-workflows/__tests__/registration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { NotificationTransport } from "@webiny/api-workflows/features/notifications/NotificationTransport/abstractions.js";
import { createContextHandler } from "./__handler/context.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        const transports = ctx.container.resolveAll(NotificationTransport);

        expect(transports).toHaveLength(1);
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, `expected [ …, … ] to have a length of 1 but got 2`.

- [ ] **Step 4: Remove the core registration from `CmsWorkflowsFeature`**

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` delete the import `import { WorkflowsFeature } from "@webiny/api-workflows";` and the line `WorkflowsFeature.register(container);`. Keep everything else.

- [ ] **Step 5: Run the CMS workflows suite**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (all existing tests plus the new one).

- [ ] **Step 6: Write the failing test for `StoreWorkflowFeature` re-registration**

Create `packages/api-workflows/__tests__/registration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { CreateWorkflowUseCase } from "~/features/workflow/CreateWorkflow/index.js";
import { UpdateWorkflowUseCase } from "~/features/workflow/UpdateWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers create and update workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(CreateWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(UpdateWorkflowUseCase)).toHaveLength(1);
    });
});
```

- [ ] **Step 7: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, length 2.

- [ ] **Step 8: Stop `StoreWorkflowFeature` from re-registering its dependencies**

Replace `packages/api-workflows/src/features/workflow/StoreWorkflow/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        // CreateWorkflowFeature and UpdateWorkflowFeature are registered by WorkflowsFeature.
        container.register(StoreWorkflowUseCase);
    }
});
```

- [ ] **Step 9: Run the api-workflows suite**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 10: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "fix(api-workflows): register the workflows feature once

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 2: Remove double registration of the admin workflows features (B2, admin)

**Files:**
- Modify: `packages/app-headless-cms-workflows/src/presentation/feature.ts`

**Interfaces:**
- Consumes: `WorkflowsAdminApp` (`packages/app-workflows/src/app.tsx`) already registers `WorkflowsFeature` and `WorkflowStatePresenterFeature`; it is mounted before `<CmsWorkflows/>` in `packages/app-serverless-cms/src/Admin.tsx:56-58`, and both are gated by the same `advancedPublishingWorkflow` flag.
- Produces: the CMS admin feature registers only its own decorators and field selections.

The admin packages have no test suite; this task is verified by build and a manual check.

- [ ] **Step 1: Remove the duplicate registrations**

Replace `packages/app-headless-cms-workflows/src/presentation/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";
import { TableRowMapperWorkflowDecorator } from "./TableRowMapperWorkflowDecorator.js";
import { WorkflowStateListEntriesFieldSelection } from "./WorkflowStateListEntriesFieldSelection.js";
import { WorkflowStateGetEntryFieldSelection } from "./WorkflowStateGetEntryFieldSelection.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // WorkflowsFeature and WorkflowStatePresenterFeature are registered by WorkflowsAdminApp.
        container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);
        container.registerDecorator(TableRowMapperWorkflowDecorator);
        container.register(WorkflowStateListEntriesFieldSelection);
        container.register(WorkflowStateGetEntryFieldSelection);
    }
});
```

- [ ] **Step 2: Build the package**

Run: `yarn build -p @webiny/app-headless-cms-workflows 2>&1 | tail -30`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "fix(app-headless-cms-workflows): stop re-registering core workflows features

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 3: `teams_in` filter for admin users, and fix DDB `id_in` (B3, D48)

**Files:**
- Modify: `packages/api-core/src/features/users/shared/types.ts` (`ListUsersInput`, `StorageOperationsListUsersParams`)
- Modify: `packages/api-core/src/types/users.ts` (`ListUsersParams`)
- Modify: `packages/api-core-ddb/src/adminUsers/index.ts` (`listUsers`)
- Modify: `packages/api-core-sql/src/adminUsers/index.ts` (`listUsers`)
- Test: `packages/api-core/__tests__/users/users.test.ts`

**Interfaces:**
- Consumes: `ListUsersUseCase` (`~/features/users/ListUsers/index.js`), `CreateUserUseCase`.
- Produces: `ListUsersInput.where` and `ListUsersParams.where` gain `teams_in?: string[]` (a user matches when any of its `teams` is in the list). DDB `listUsers` applies `id_in` and `teams_in`; SQL `listUsers` applies `teams_in`. Phase 4 calls `listUsers.execute({ where: { teams_in } })` under `withoutAuthorization`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe("Users", ...)` block in `packages/api-core/__tests__/users/users.test.ts`:

```ts
    it("should filter users by id_in", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const listUsers = container.resolve(ListUsersUseCase);

        const userA = await createUser.execute(users.userA);
        await createUser.execute(users.userB);

        const result = await listUsers.execute({ where: { id_in: [userA.value.id] } });

        expect(result.isOk()).toBe(true);
        expect(result.value.map(user => user.id)).toEqual([userA.value.id]);
    });

    it("should filter users by teams_in", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const listUsers = container.resolve(ListUsersUseCase);

        const userA = await createUser.execute({ ...users.userA, teams: ["team-a", "team-b"] });
        await createUser.execute({ ...users.userB, teams: ["team-c"] });

        const result = await listUsers.execute({ where: { teams_in: ["team-b", "team-x"] } });

        expect(result.isOk()).toBe(true);
        expect(result.value.map(user => user.id)).toEqual([userA.value.id]);
    });

    it("should combine id_in and teams_in", async () => {
        const createUser = container.resolve(CreateUserUseCase);
        const listUsers = container.resolve(ListUsersUseCase);

        const userA = await createUser.execute({ ...users.userA, teams: ["team-a"] });
        const userB = await createUser.execute({ ...users.userB, teams: ["team-a"] });

        const result = await listUsers.execute({
            where: { id_in: [userB.value.id], teams_in: ["team-a"] }
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.map(user => user.id)).toEqual([userB.value.id]);
        expect(result.value.map(user => user.id)).not.toContain(userA.value.id);
    });
```

If `CreateUserInput` in `~/types/users.js` does not accept `teams`, confirm with `codegraph explore "CreateUserInput"` (the create schema at `packages/api-core/src/features/users/CreateUser/schema.ts:22` accepts `teams`) and add `teams?: string[]` to that input type.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test:ddb packages/api-core/__tests__/users/users.test.ts 2>&1 | tail -50`
Expected: FAIL. `id_in` returns both users on DDB; `teams_in` fails to type-check or returns both users.

- [ ] **Step 3: Extend the input types**

In `packages/api-core/src/features/users/shared/types.ts`, extract the where shape into a named interface and use it in both types:

```ts
export interface ListUsersWhere {
    id_in?: string[];
    teams_in?: string[];
}

export interface ListUsersInput {
    where?: ListUsersWhere;
    sort?: string[];
}

export interface StorageOperationsListUsersWhere extends ListUsersWhere {
    tenant: string;
}

export interface StorageOperationsListUsersParams {
    where: StorageOperationsListUsersWhere;
    sort?: string[];
}
```

In `packages/api-core/src/types/users.ts`, change `ListUsersParams` to:

```ts
export interface ListUsersParams {
    where?: {
        id_in?: string[];
        teams_in?: string[];
    };
    sort?: string[];
}
```

(Keep the existing `StorageOperationsListUsersParams extends ListUsersParams` declaration in that file unchanged; it picks up `teams_in`.)

- [ ] **Step 4: Apply the filters in DDB storage**

In `packages/api-core-ddb/src/adminUsers/index.ts`, replace the final `return sortItems({ items, sort });` of `listUsers` with:

```ts
            const { id_in, teams_in } = where;

            const filtered = items.filter(item => {
                if (Array.isArray(id_in) && !id_in.includes(item.id)) {
                    return false;
                }
                if (Array.isArray(teams_in)) {
                    return (item.teams || []).some(team => teams_in.includes(team));
                }
                return true;
            });

            return sortItems({ items: filtered, sort });
```

- [ ] **Step 5: Apply `teams_in` in SQL storage**

In `packages/api-core-sql/src/adminUsers/index.ts`, replace the `id_in` block of `listUsers`:

```ts
                const { id_in } = where;

                if (Array.isArray(id_in)) {
                    return items.filter(item => id_in.includes(item.id));
                }

                return items;
```

with:

```ts
                const { id_in, teams_in } = where;

                return items.filter(item => {
                    if (Array.isArray(id_in) && !id_in.includes(item.id)) {
                        return false;
                    }
                    if (Array.isArray(teams_in)) {
                        return (item.teams || []).some(team => teams_in.includes(team));
                    }
                    return true;
                });
```

- [ ] **Step 6: Run the tests on both storages**

Run: `yarn test:ddb packages/api-core/__tests__/users 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:sql packages/api-core/__tests__/users 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Update bugs.md**

In `docs/.bruno/workflows/bugs.md`, append to B3: `- Fixed in Phase 0 Task 3.`

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-core`, `@webiny/api-core-ddb`, `@webiny/api-core-sql`), then:

```bash
git commit -m "fix(api-core): apply id_in in DDB listUsers and add teams_in filter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 4: Block deleting WB page folders that contain pages (B1)

**Files:**
- Create: `packages/api-website-builder/src/features/folders/EnsurePageFolderIsEmptyOnDelete/EnsurePageFolderIsEmptyOnDelete.ts`
- Create: `packages/api-website-builder/src/features/folders/EnsurePageFolderIsEmptyOnDelete/feature.ts`
- Modify: `packages/api-website-builder/src/WebsiteBuilderFeature.ts` (register the feature)
- Modify: `packages/api-website-builder/package.json` (add `@webiny/api-aco` dependency via `yarn adio`)
- Test: `packages/api-website-builder/__tests__/pageFolderDelete.test.ts`

**Interfaces:**
- Consumes: `FolderBeforeDeleteEventHandler` (`@webiny/api-aco/features/folder/DeleteFolder/index.js`), `EnsureFolderIsEmpty` (`@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js`), `ListPagesUseCase` (`~/features/pages/ListPages/index.js`), `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`).
- Produces: a `FolderBeforeDelete` handler that throws the `EnsureFolderIsEmpty` failure for `wb:page` folders containing pages, so `DeleteFolderUseCase` returns `FolderNotEmptyError` (code `Aco/Folder/NotEmpty`, mapped at `packages/api-aco/src/features/folder/DeleteFolder/DeleteFolderUseCase.ts:39-43`).

- [ ] **Step 1: Write the failing test**

Create `packages/api-website-builder/__tests__/pageFolderDelete.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AcoFeature } from "@webiny/api-aco";
import { NoopFolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { DeleteFolderUseCase } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { CreatePageUseCase } from "~/features/pages/CreatePage/index.js";
import { useHandler } from "./utils/useHandler.js";
import { pageMocks } from "./mocks/page.mock.js";

const registerAco = createRegisterExtensionPlugin(context => {
    AcoFeature.register(context.container);
    context.container.register(NoopFolderLevelPermissions);
});

const createFolder = async (context: Awaited<ReturnType<ReturnType<typeof useHandler>["handler"]>>) => {
    const create = context.container.resolve(CreateFolderUseCase);
    const result = await create.execute({
        title: "Landing pages",
        slug: "landing-pages",
        type: "wb:page",
        parentId: null
    });
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Deleting Website Builder page folders", () => {
    it("blocks deleting a wb:page folder that contains a page", async () => {
        const { handler } = useHandler({ legacyPlugins: [registerAco] });
        const context = await handler();
        const folder = await createFolder(context);

        const createPage = context.container.resolve(CreatePageUseCase);
        const pageResult = await createPage.execute({
            ...pageMocks.pageA,
            location: { folderId: folder.id }
        });
        expect(pageResult.isOk()).toBe(true);

        const deleteFolder = context.container.resolve(DeleteFolderUseCase);
        const result = await deleteFolder.execute(folder.id);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Aco/Folder/NotEmpty");
    });

    it("allows deleting an empty wb:page folder", async () => {
        const { handler } = useHandler({ legacyPlugins: [registerAco] });
        const context = await handler();
        const folder = await createFolder(context);

        const deleteFolder = context.container.resolve(DeleteFolderUseCase);
        const result = await deleteFolder.execute(folder.id);

        expect(result.isOk()).toBe(true);
    });
});
```

If `useHandler`'s `legacyPlugins` does not accept a `createRegisterExtensionPlugin` value, follow the pattern in `packages/api-headless-cms-workflows/__tests__/__handler/context.ts` (it passes `registerNoopFlp` the same way). If `AcoFeature` needs `AcoHcmsFeature` too, check with `codegraph explore "AcoHcmsFeature"` and register it in the same plugin.

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-website-builder/__tests__/pageFolderDelete.test.ts 2>&1 | tail -50`
Expected: the first test FAILS (`result.isFail()` is false: the folder is deleted). The second passes.

- [ ] **Step 3: Write the handler**

Create `packages/api-website-builder/src/features/folders/EnsurePageFolderIsEmptyOnDelete/EnsurePageFolderIsEmptyOnDelete.ts`:

```ts
import { FolderBeforeDeleteEventHandler } from "@webiny/api-aco/features/folder/DeleteFolder/index.js";
import { EnsureFolderIsEmpty } from "@webiny/api-aco/features/folder/EnsureFolderIsEmpty/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListPagesUseCase } from "~/features/pages/ListPages/index.js";

const WB_PAGE_FOLDER_TYPE = "wb:page";

class EnsurePageFolderIsEmptyOnDeleteImpl implements FolderBeforeDeleteEventHandler.Interface {
    constructor(
        private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface,
        private listPages: ListPagesUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: FolderBeforeDeleteEventHandler.Event): Promise<void> {
        const { id, type } = event.payload.folder;

        if (type !== WB_PAGE_FOLDER_TYPE) {
            return;
        }

        const result = await this.ensureFolderIsEmpty.execute(type, id, async () => {
            // Pages hidden from the current user must still block the delete.
            const listResult = await this.identityContext.withoutAuthorization(() => {
                return this.listPages.execute({
                    where: { latest: true, location: { folderId: id } },
                    sort: ["createdOn_DESC"],
                    limit: 1,
                    after: null
                });
            });

            if (listResult.isFail()) {
                console.error(listResult.error.message);
                return true;
            }

            return listResult.value.pages.length > 0;
        });

        if (result.isFail()) {
            // Throw the original error so DeleteFolderUseCase maps "Aco/Folder/NotEmpty" correctly.
            throw result.error;
        }
    }
}

export const EnsurePageFolderIsEmptyOnDelete = FolderBeforeDeleteEventHandler.createImplementation({
    implementation: EnsurePageFolderIsEmptyOnDeleteImpl,
    dependencies: [EnsureFolderIsEmpty, ListPagesUseCase, IdentityContext]
});
```

If `ListPagesUseCase` already adds `latest: true`, drop it from `where` (confirm with `codegraph explore "ListPagesUseCase"`).

- [ ] **Step 4: Write the feature and register it**

Create `packages/api-website-builder/src/features/folders/EnsurePageFolderIsEmptyOnDelete/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { EnsurePageFolderIsEmptyOnDelete } from "./EnsurePageFolderIsEmptyOnDelete.js";

export const EnsurePageFolderIsEmptyOnDeleteFeature = createFeature({
    name: "Wb/EnsurePageFolderIsEmptyOnDelete",
    register(container) {
        container.register(EnsurePageFolderIsEmptyOnDelete);
    }
});
```

In `packages/api-website-builder/src/WebsiteBuilderFeature.ts`, import it and call `EnsurePageFolderIsEmptyOnDeleteFeature.register(container);` next to the other page feature registrations.

- [ ] **Step 5: Add the dependency**

Run: `yarn adio` (adds `@webiny/api-aco` to `packages/api-website-builder/package.json` dependencies), then `yarn > /dev/null 2>&1`.

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-website-builder/__tests__/pageFolderDelete.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder 2>&1 | tail -50`
Expected: PASS (no regressions).

- [ ] **Step 7: Update bugs.md**

Append to B1 in `docs/.bruno/workflows/bugs.md`: `- Fixed in Phase 0 Task 4.`

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder`), then:

```bash
git commit -m "fix(api-website-builder): block deleting page folders that contain pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 5: `UpdateEntrySystemUseCase` in api-headless-cms (D52)

**Files:**
- Create: `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/abstractions.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/events.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/UpdateEntrySystemUseCase.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/feature.ts`
- Create: `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/index.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/ContentEntriesFeature.ts` (register)
- Test: `packages/api-headless-cms/__tests__/contentAPI/updateEntrySystem.test.ts`

**Interfaces:**
- Consumes: `UpdateEntryRepository` (`../UpdateEntry/index.js`), `GetRevisionByIdUseCase`, `AccessControl`, `EventPublisher`; pattern: `packages/api-headless-cms/src/features/contentEntry/UpdateRevisionDescription/`.
- Produces:
  ```ts
  UpdateEntrySystemUseCase.execute<T>(model: CmsModel, id: string, system: Partial<ICmsEntrySystem>): Promise<Result<CmsEntry<T>, UpdateEntrySystemUseCase.Error>>
  ```
  Shallow-merges `system` into `original.system` (keys set to `null` are stored as `null`), persists through `UpdateEntryRepository`, publishes `EntryBeforeUpdateSystemEvent` / `EntryAfterUpdateSystemEvent` (event types `Cms/Entry/BeforeUpdateSystem`, `Cms/Entry/AfterUpdateSystem`), never rebuilds meta and never publishes `EntryBeforeUpdate` / `EntryAfterUpdate`. Exported from `@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms/__tests__/contentAPI/updateEntrySystem.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { EntryAfterUpdateEventHandler } from "~/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntrySystemUseCase } from "~/features/contentEntry/UpdateEntrySystem/index.js";
import type { ICmsEntrySystem } from "~/types/index.js";

interface ITestSystem {
    testFlag?: { value: string } | null;
}

const toSystem = (value: ITestSystem) => value as unknown as Partial<ICmsEntrySystem>;

const noteModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Note",
    modelId: "note",
    fields: [createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" })]
});

describe("UpdateEntrySystemUseCase", () => {
    const { handler, tenant } = useHandler({ plugins: [noteModel] });

    const getContext = () =>
        handler({ path: "/cms/manage/en-US", headers: { "x-tenant": tenant.id } });

    const setup = async () => {
        const context = await getContext();
        const model = (await context.container.resolve(GetModelUseCase).execute("note")).value;
        const created = await context.container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: { title: "Hello" } });
        if (created.isFail()) {
            throw created.error;
        }
        return { context, model, entry: created.value };
    };

    it("sets a system key without touching meta", async () => {
        const { context, model, entry } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const result = await updateSystem.execute(
            model,
            entry.id,
            toSystem({ testFlag: { value: "on" } })
        );

        expect(result.isOk()).toBe(true);
        const stored = await context.container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entry.id);
        expect((stored.value.system as ITestSystem).testFlag).toEqual({ value: "on" });
        expect(stored.value.savedOn).toBe(entry.savedOn);
        expect(stored.value.modifiedOn).toBe(entry.modifiedOn);
        expect(stored.value.values).toEqual(entry.values);
    });

    it("stores null values", async () => {
        const { context, model, entry } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        await updateSystem.execute(model, entry.id, toSystem({ testFlag: { value: "on" } }));
        await updateSystem.execute(model, entry.id, toSystem({ testFlag: null }));

        const stored = await context.container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entry.id);
        expect((stored.value.system as ITestSystem).testFlag).toBeNull();
    });

    it("does not publish EntryAfterUpdate", async () => {
        const { context, model, entry } = await setup();
        const handle = vi.fn();
        context.container.registerInstance(EntryAfterUpdateEventHandler, { handle });
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        await updateSystem.execute(model, entry.id, toSystem({ testFlag: { value: "on" } }));

        expect(handle).not.toHaveBeenCalled();
    });

    it("fails for an unknown revision", async () => {
        const { context, model } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const result = await updateSystem.execute(model, "unknown#0001", toSystem({}));

        expect(result.isFail()).toBe(true);
    });
});
```

Confirm the `EntryAfterUpdateEventHandler` export path and `GetRevisionByIdUseCase` path with codegraph before running. If `registerInstance` of an event handler abstraction is not picked up by `EventPublisher` (it resolves handlers with `resolveAll`), register a class handler with `container.register(...)` instead, following any existing handler in `packages/api-headless-cms/src/features/`.

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms/__tests__/contentAPI/updateEntrySystem.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/contentEntry/UpdateEntrySystem/index.js`.

- [ ] **Step 3: Write the abstraction**

Create `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/abstractions.ts`:

```ts
import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel, ICmsEntrySystem } from "~/types/index.js";
import type { EntryNotAuthorizedError, EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { IUpdateEntryUseCaseErrors } from "../UpdateEntry/abstractions.js";

/**
 * Updates only `system.*` keys of an entry revision. No meta rebuild, no EntryBeforeUpdate /
 * EntryAfterUpdate events. Used by features that keep denormalised state on entries (e.g. workflows).
 */
export interface IUpdateEntrySystemUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        system: Partial<ICmsEntrySystem>
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateEntrySystemUseCaseErrors extends IUpdateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
}

type UseCaseError = IUpdateEntrySystemUseCaseErrors[keyof IUpdateEntrySystemUseCaseErrors];

/** Update system keys of a content entry revision. */
export const UpdateEntrySystemUseCase = createAbstraction<IUpdateEntrySystemUseCase>(
    "Cms/Entry/UpdateEntrySystemUseCase"
);

export namespace UpdateEntrySystemUseCase {
    export type Interface = IUpdateEntrySystemUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;
}
```

- [ ] **Step 4: Write the events**

Create `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsEntry, CmsModel, ICmsEntrySystem } from "~/types/index.js";

export interface EntryUpdateSystemEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    system: Partial<ICmsEntrySystem>;
    model: CmsModel;
}

export class EntryBeforeUpdateSystemEvent extends DomainEvent<EntryUpdateSystemEventPayload> {
    eventType = "Cms/Entry/BeforeUpdateSystem" as const;

    getHandlerAbstraction() {
        return EntryBeforeUpdateSystemEventHandler;
    }
}

/** Hook in before an entry's system keys are updated. */
export const EntryBeforeUpdateSystemEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUpdateSystemEvent>
>("Cms/Entry/BeforeUpdateSystemEventHandler");

export namespace EntryBeforeUpdateSystemEventHandler {
    export type Interface = IEventHandler<EntryBeforeUpdateSystemEvent>;
    export type Event = EntryBeforeUpdateSystemEvent;
}

export class EntryAfterUpdateSystemEvent extends DomainEvent<EntryUpdateSystemEventPayload> {
    eventType = "Cms/Entry/AfterUpdateSystem" as const;

    getHandlerAbstraction() {
        return EntryAfterUpdateSystemEventHandler;
    }
}

/** Hook in after an entry's system keys are updated. */
export const EntryAfterUpdateSystemEventHandler = createAbstraction<
    IEventHandler<EntryAfterUpdateSystemEvent>
>("Cms/Entry/AfterUpdateSystemEventHandler");

export namespace EntryAfterUpdateSystemEventHandler {
    export type Interface = IEventHandler<EntryAfterUpdateSystemEvent>;
    export type Event = EntryAfterUpdateSystemEvent;
}
```

If the repo convention is one event (class + handler abstraction) per file, split into `EntryBeforeUpdateSystemEvent.ts` and `EntryAfterUpdateSystemEvent.ts`; `UpdateRevisionDescription/events.ts` keeps both in one file, so one file is acceptable here.

- [ ] **Step 5: Write the use case**

Create `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/UpdateEntrySystemUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateEntrySystemUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EntryAfterUpdateSystemEvent, EntryBeforeUpdateSystemEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/abstractions.js";
import { UpdateEntryRepository } from "../UpdateEntry/index.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { CmsEntry, CmsEntryValues, CmsModel, ICmsEntrySystem } from "~/types/index.js";

class UpdateEntrySystemUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: UpdateEntryRepository.Interface,
        private accessControl: AccessControl.Interface,
        private getRevisionByIdUseCase: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        system: Partial<ICmsEntrySystem>
    ): Promise<Result<CmsEntry<T>, UseCaseAbstraction.Error>> {
        const canAccess = await this.accessControl.canAccessEntry({ model, rwd: "w" });
        if (!canAccess) {
            return Result.fail(EntryNotAuthorizedError.fromModel(model));
        }

        try {
            const result = await this.getRevisionByIdUseCase.execute<T>(model, id);
            if (result.isFail()) {
                return Result.fail(result.error);
            }

            const original = result.value;
            const entry: CmsEntry<T> = {
                ...original,
                system: {
                    ...original.system,
                    ...system
                }
            };

            await this.eventPublisher.publish(
                new EntryBeforeUpdateSystemEvent({ entry, original, system, model })
            );

            const updateResult = await this.repository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(updateResult.error);
            }

            await this.eventPublisher.publish(
                new EntryAfterUpdateSystemEvent({ entry, original, system, model })
            );

            return Result.ok(entry);
        } catch (error) {
            return Result.fail(error as UseCaseAbstraction.Error);
        }
    }
}

export const UpdateEntrySystemUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateEntrySystemUseCaseImpl,
    dependencies: [EventPublisher, UpdateEntryRepository, AccessControl, GetRevisionByIdUseCase]
});
```

Match the exact import paths and `canAccessEntry` signature of `UpdateRevisionDescriptionUseCase.ts`; that file is the reference.

- [ ] **Step 6: Write the feature, barrel, and register it**

Create `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { UpdateEntrySystemUseCase } from "./UpdateEntrySystemUseCase.js";

export const UpdateEntrySystemFeature = createFeature({
    name: "UpdateEntrySystem",
    register(container) {
        container.register(UpdateEntrySystemUseCase);
    }
});
```

Create `packages/api-headless-cms/src/features/contentEntry/UpdateEntrySystem/index.ts`:

```ts
export { UpdateEntrySystemUseCase } from "./abstractions.js";
export {
    EntryAfterUpdateSystemEventHandler,
    EntryBeforeUpdateSystemEventHandler
} from "./events.js";
```

In `packages/api-headless-cms/src/features/contentEntry/ContentEntriesFeature.ts`, import `UpdateEntrySystemFeature` from `./UpdateEntrySystem/feature.js` and call `UpdateEntrySystemFeature.register(container);` right after `UpdateRevisionDescriptionFeature.register(container);`.

- [ ] **Step 7: Run the tests**

Run: `yarn test:ddb packages/api-headless-cms/__tests__/contentAPI/updateEntrySystem.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-headless-cms/__tests__/contentAPI/updateEntrySystem.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms`), then:

```bash
git commit -m "feat(api-headless-cms): add UpdateEntrySystemUseCase

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 6: Filterable `system.workflow` fields (D53)

**Files:**
- Modify: `packages/api-headless-cms-storage/src/filtering/fields/systemFields.ts` (add `system` object field)
- Create: `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/fields/system.ts`
- Modify: `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/fields.ts` (spread `systemFields`)
- Modify (if the snapshot fails): `packages/api-headless-cms-ddb/__tests__/operations/entry/filtering/mocks/expectedSystemFields.ts`
- Test: `packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts`

**Interfaces:**
- Consumes: `UpdateEntrySystemUseCase` (Task 5), `ListLatestEntriesUseCase` (confirm name with `codegraph explore "ListLatestEntriesUseCase"`).
- Produces: list `where` accepts `system: { workflow: { workflowId?, reviewState?, stepId?, stepState? } }` with text operators (`reviewState`, `reviewState_in`, …) on DDB, OpenSearch and SQL storage. The legacy `state` field stays untouched. Storage ids are raw (`system`, `workflow`, `reviewState`, …), like the `live` field, because `system` is stored as-is on the entry.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { UpdateEntrySystemUseCase } from "~/features/contentEntry/UpdateEntrySystem/index.js";
import type { CmsEntryListWhere, ICmsEntrySystem } from "~/types/index.js";

interface ITestWorkflow {
    workflowId: string;
    reviewState: string;
    stepId: string;
    stepName: string;
    stepState: string;
}

const toSystem = (workflow: ITestWorkflow) =>
    ({ workflow }) as unknown as Partial<ICmsEntrySystem>;

const articleModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" })]
});

describe("filtering by system.workflow", () => {
    const { handler, tenant } = useHandler({ plugins: [articleModel] });

    it("filters latest entries by reviewState and stepState", async () => {
        const context = await handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });
        const model = (await context.container.resolve(GetModelUseCase).execute("article")).value;
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const approved = (await createEntry.execute(model, { values: { title: "A" } })).value;
        const inProgress = (await createEntry.execute(model, { values: { title: "B" } })).value;
        await createEntry.execute(model, { values: { title: "C" } });

        await updateSystem.execute(
            model,
            approved.id,
            toSystem({
                workflowId: "wf1",
                reviewState: "approved",
                stepId: "s2",
                stepName: "Legal",
                stepState: "approved"
            })
        );
        await updateSystem.execute(
            model,
            inProgress.id,
            toSystem({
                workflowId: "wf1",
                reviewState: "inProgress",
                stepId: "s1",
                stepName: "Editor",
                stepState: "inReview"
            })
        );

        const list = context.container.resolve(ListLatestEntriesUseCase);

        const byReview = await list.execute(model, {
            where: { system: { workflow: { reviewState: "approved" } } } as CmsEntryListWhere
        });
        expect(byReview.value.entries.map(e => e.id)).toEqual([approved.id]);

        const byStep = await list.execute(model, {
            where: { system: { workflow: { stepState_in: ["inReview"] } } } as CmsEntryListWhere
        });
        expect(byStep.value.entries.map(e => e.id)).toEqual([inProgress.id]);

        const byWorkflow = await list.execute(model, {
            where: { system: { workflow: { workflowId: "wf1" } } } as CmsEntryListWhere,
            sort: ["createdOn_ASC"]
        });
        expect(byWorkflow.value.entries.map(e => e.id)).toEqual([approved.id, inProgress.id]);
    });
});
```

On OpenSearch, entries are indexed asynchronously in some test setups; if the list returns empty on `test:os`, follow how other CMS list tests wait for the index (search `__tests__` for `until(` or `refreshIndex`).

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test:ddb packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts 2>&1 | tail -50`
Expected: FAIL with an error like `There is no field with the field path "system..."` or an empty result.

- [ ] **Step 3: Add the storage filter field (DDB and SQL)**

In `packages/api-headless-cms-storage/src/filtering/fields/systemFields.ts`, add this entry to the returned array, after the `live` field:

```ts
        createModelField({
            id: "system",
            type: "object",
            storageId: "system",
            fieldId: "system",
            label: "System",
            settings: {
                fields: [
                    createModelField({
                        id: "workflow",
                        type: "object",
                        storageId: "workflow",
                        fieldId: "workflow",
                        label: "Workflow",
                        settings: {
                            fields: ["workflowId", "reviewState", "stepId", "stepState"].map(
                                fieldId =>
                                    createModelField({
                                        id: fieldId,
                                        type: "text",
                                        storageId: fieldId,
                                        fieldId,
                                        label: lodashStartCase(fieldId)
                                    })
                            )
                        }
                    })
                ]
            }
        }),
```

- [ ] **Step 4: Run DDB and SQL**

Run: `yarn test:ddb packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:sql packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts 2>&1 | tail -50`
Expected: PASS. If SQL fails because it maps nested object paths differently, trace `createSystemFields` usage in `packages/api-headless-cms-sql/src/operations/entry/queryHelpers.ts` with codegraph and adjust there.

- [ ] **Step 5: Add the OpenSearch fields**

Create `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/fields/system.ts`, mirroring `live.ts`:

```ts
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import { createSystemField } from "./createSystemField.js";
import { createModelField } from "@webiny/api-headless-cms";

const WORKFLOW_TEXT_FIELDS = ["workflowId", "reviewState", "stepId", "stepState"];

const workflowParents = [
    { fieldId: "system", type: "object", storageId: "system" },
    { fieldId: "workflow", type: "object", storageId: "workflow" }
];

const createWorkflowTextField = (fieldId: string) =>
    createModelField({ id: fieldId, fieldId, storageId: fieldId, type: "text", label: fieldId });

export const systemFields: ModelFields = {
    system: {
        type: "object",
        systemField: true,
        searchable: true,
        sortable: false,
        field: createSystemField({
            storageId: "system",
            fieldId: "system",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        id: "workflow",
                        fieldId: "workflow",
                        storageId: "workflow",
                        type: "object",
                        label: "Workflow",
                        settings: { fields: WORKFLOW_TEXT_FIELDS.map(createWorkflowTextField) }
                    })
                ]
            }
        }),
        parents: []
    },
    ...Object.fromEntries(
        WORKFLOW_TEXT_FIELDS.map(fieldId => [
            `system.workflow.${fieldId}`,
            {
                type: "text",
                systemField: true,
                searchable: true,
                sortable: false,
                parents: workflowParents,
                field: createSystemField({
                    id: fieldId,
                    fieldId,
                    storageId: fieldId,
                    type: "text",
                    label: fieldId
                })
            }
        ])
    )
};
```

Compare the shape of `parents` and `createSystemField` params with `live.ts` / `state.ts` in the same folder and adjust names if they differ. In `packages/api-headless-cms-utils-os/src/operations/entry/elasticsearch/fields.ts`, import `systemFields` from `./fields/system.js` and add `...systemFields` next to `...stateFields` and `...liveFields`.

- [ ] **Step 6: Run OpenSearch and the filtering snapshot suites**

Run: `yarn test:os packages/api-headless-cms/__tests__/contentAPI/filterSystemWorkflow.test.ts 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-headless-cms-ddb/__tests__/operations/entry/filtering 2>&1 | tail -50`
Expected: PASS, or a snapshot diff in `expectedSystemFields.ts` that only adds the new `system` field. If so, update `packages/api-headless-cms-ddb/__tests__/operations/entry/filtering/mocks/expectedSystemFields.ts` to include it and rerun.
Run: `yarn test:os packages/api-headless-cms-utils-os 2>&1 | tail -50`
Expected: PASS (update any field-list snapshot the same way).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-storage`, `@webiny/api-headless-cms-utils-os`), then:

```bash
git commit -m "feat(api-headless-cms-storage): make system.workflow fields filterable

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

### Task 7: Remove the v5 APW audit log app (D65)

**Files:**
- Modify: `packages/common-audit-logs/src/apps.ts` (delete the `APW` entry at lines 43-80)

**Interfaces:**
- Consumes: nothing. A repo search found no other reference to the `APW` app, `CHANGE_REQUEST` or `CONTENT_REVIEW` in `common-audit-logs`, `api-audit-logs` or `app-audit-logs`.
- Produces: `apps` no longer contains an `APW` entry. The future "Workflows" audit app (D65) is not added here.

- [ ] **Step 1: Confirm no references**

Run: `grep -rn '"APW"\|CHANGE_REQUEST\|CONTENT_REVIEW\|/apw/' packages/common-audit-logs/src packages/api-audit-logs/src packages/app-audit-logs/src`
Expected: matches only inside `packages/common-audit-logs/src/apps.ts`.

- [ ] **Step 2: Delete the entry**

In `packages/common-audit-logs/src/apps.ts`, delete the whole object `{ app: "APW", displayName: "APW", entities: [ ... ] },` (the first element of `apps`, from `app: "APW"` through its closing `},` before `app: "FILE_MANAGER"`).

- [ ] **Step 3: Build and run audit log tests**

Run: `yarn build -p @webiny/common-audit-logs 2>&1 | tail -30`
Expected: success.
Run: `yarn test packages/api-audit-logs 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 4: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "chore(common-audit-logs): remove the v5 APW audit app

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Vm4YZF3PH1u3WJMtFK5BRw"
```

---

## Not in this phase

- `TaskService.trigger` identity (D58): `IdentityContext.withIdentity` already exists, so phase 5 wraps `trigger` instead of changing api-core. See the roadmap note.
- Any change to the workflows domain, GraphQL, admin UI or target adapters (phases 1-9).
