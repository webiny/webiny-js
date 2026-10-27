### Task 17: Delete the unused permission code

R334 (cleanup), R316 (scope), R333 (Task 16 replaced the schema renderer, so the schema has no user left), R243; Q67; Review Focus 8; `ai-context/code-style/no-backwards-compat.md` (delete old code outright, no shims or aliases). `HasWorkflowsEditorPermission` is exported from `presentation/permissions/index.tsx` and used nowhere; the `WorkflowsPermissions` DI feature is registered in `WorkflowsAdminApp` and exported from the package barrel but never resolved (the admin reads permissions through `useWorkflowsPermission` over `getWorkflowsPermissionSet`, D162); `domain/permissionsSchema.ts` fed the feature and the stock schema renderer of `SecurityPermissions`, which Task 16 replaced with the `WorkflowsRolePermissions` element. This task deletes all three and everything that points at them.

- **Deleted** (in `packages/app-workflows/src`):
  - `presentation/permissions/HasWorkflowsEditorPermission.tsx` (the component and `IHasWorkflowsSecurityPermissionProps`) and its two exports in `presentation/permissions/index.tsx`.
  - `features/permissions/abstractions.ts` and `features/permissions/feature.ts` (the folder `features/` is empty afterwards and goes with them), the import and `<RegisterFeature feature={WorkflowsPermissionsFeature} />` in `app.tsx`, and the export in `index.tsx`.
  - `domain/permissionsSchema.ts` (`WORKFLOWS_PERMISSIONS_SCHEMA`).
- **Kept:** `presentation/permissions/` (`useWorkflowsPermission`, `SecurityPermissions`, `WorkflowsRolePermissions` and their tests), `domain/permissions/` (Task 15), `settings/` (Tasks 2-13), `editor/`, `review/`, `types.ts`.
- **Public barrel** (`index.tsx`) after this task: `WorkflowsAdminApp` and `useWorkflowsPermission`, nothing else (R334). The only importer outside the package, `packages/app-serverless-cms/src/Admin.tsx`, imports `WorkflowsAdminApp` only.
- **Cleanup test** (`app.cleanup.test.tsx`, R219 pattern from 9a Task 22): the deleted paths join `DELETED_PATHS`; `KEPT_PATHS` becomes exactly `domain/permissions`, `presentation/permissions`, `settings`, `editor`, `review`, `types.ts`; new tests pin that the root registers no `workflows:Permissions` feature (the name `createPermissionsFeature` gives it, `packages/app-admin/src/permissions/createPermissions.ts:224`), that the barrel exports exactly the two names, and that `app.tsx`, `index.tsx` and the two remaining permission files mention none of the deleted symbols.
- **No other package changes.** The check in Step 1 proves no file outside `packages/app-workflows/src` uses the deleted symbols (true at BASE 66a2d8797c, re-checked at execution).

**Files:**
- Delete: `packages/app-workflows/src/presentation/permissions/HasWorkflowsEditorPermission.tsx`
- Delete: `packages/app-workflows/src/features/permissions/abstractions.ts`
- Delete: `packages/app-workflows/src/features/permissions/feature.ts`
- Delete: `packages/app-workflows/src/domain/permissionsSchema.ts`
- Modify: `packages/app-workflows/src/presentation/permissions/index.tsx`
- Modify: `packages/app-workflows/src/index.tsx`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`
- Check (no change expected): `packages/app-workflows/src/app.test.tsx` (see Contract notes 1)

**Interfaces:**
- Consumes: Task 16 (`SecurityPermissions` renders `element={<WorkflowsRolePermissions />}` and no longer imports `WORKFLOWS_PERMISSIONS_SCHEMA`; `presentation/permissions/index.tsx` still exports `SecurityPermissions` and `useWorkflowsPermission`), Task 15 (`[AW]/domain/permissions/` exists), Tasks 2-13 (`[AW]/settings/` exists). Existing (verified with codegraph and grep at BASE): `WorkflowsAdminApp` (`[AW]/app.tsx`), `useWorkflowsPermission` (`[AW]/presentation/permissions/useWorkflowsPermission.ts`, reads `getWorkflowsPermissionSet` and `useSecurity`, not the DI feature), `createPermissionsFeature` (`packages/app-admin/src/permissions/createPermissions.ts:207`, feature name `` `${schema.prefix}:Permissions` ``, so `workflows:Permissions`).
- Produces: R334. Nothing for later tasks; Task 18 documents the removal.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. `app-workflows` has no `__tests__/**/*.test.ts`, so the type check of its co-located tests is the package build (8a R243).

- [ ] **Step 1: Check the callers, then write the failing tests**

First prove nothing outside `app-workflows` uses the code this task deletes, and see what inside it still does. Run from the repository root:

```bash
grep -rn "WorkflowsPermissionsFeature\|HasWorkflowsEditorPermission\|IHasWorkflowsSecurityPermissionProps\|WORKFLOWS_PERMISSIONS_SCHEMA\|app-workflows/features/permissions\|app-workflows/domain/permissionsSchema" packages --include='*.ts' --include='*.tsx' --exclude-dir=dist --exclude-dir=node_modules | grep -v "^packages/app-workflows/src/" | grep -v "^packages/api-workflows/src/"
grep -rn "WorkflowsPermissionsFeature\|HasWorkflowsEditorPermission\|IHasWorkflowsSecurityPermissionProps\|WORKFLOWS_PERMISSIONS_SCHEMA\|permissionsSchema\|features/permissions\|WorkflowsPermissions\b" packages/app-workflows/src
```

The `--include` patterns are quoted so zsh does not expand them. A bare `features/permissions` pattern is not used in the first command: other packages have their own unrelated `features/permissions` folders. The first command also drops `packages/api-workflows/src/`: the API has its own, unrelated `WorkflowsPermissionsFeature` (`api-workflows/src/features/permissions/WorkflowsPermissions/feature.ts`, registered in `api-workflows/src/WorkflowsFeature.ts`), which this task does not touch (Q65) and which imports nothing from `app-workflows`. Without the filter, those two lines print (true at BASE 576c24d1a8).

Expected: the first command prints nothing. The second prints only these lines (the line numbers may differ):

- `packages/app-workflows/src/app.tsx` (the `WorkflowsPermissionsFeature` import and its `RegisterFeature`),
- `packages/app-workflows/src/index.tsx` (the `WorkflowsPermissionsFeature` export),
- `packages/app-workflows/src/app.cleanup.test.tsx` (`"features/permissions"` and `"domain/permissionsSchema.ts"` in `KEPT_PATHS`),
- `packages/app-workflows/src/features/permissions/abstractions.ts` and `feature.ts` (deleted below),
- `packages/app-workflows/src/presentation/permissions/index.tsx` (the two `HasWorkflowsEditorPermission` exports),
- `packages/app-workflows/src/presentation/permissions/HasWorkflowsEditorPermission.tsx` (deleted below),
- `packages/app-workflows/src/domain/permissionsSchema.ts` (deleted below).

If the first command prints a file, another package uses the code: stop and report it (Review Focus 8). If the second prints `presentation/permissions/SecurityPermissions.tsx` or any `WorkflowsRolePermissions*` file, Task 16 still uses the schema: stop and report (R333 says the schema renderer goes). Any other file in the second output is a user the plan did not foresee: stop and report.

Also confirm the kept folders exist (Tasks 3 and 15 created them):

```bash
ls -d packages/app-workflows/src/settings packages/app-workflows/src/domain/permissions packages/app-workflows/src/presentation/permissions
```

Expected: the three paths. If one is missing, stop: an earlier task is not done.

Modify `packages/app-workflows/src/app.cleanup.test.tsx`.

Hunk 1, the barrel import (after the existing `WorkflowsAdminApp` import):

```ts
// before
import { vi } from "vitest";
import { WorkflowsAdminApp } from "~/app.js";
// after
import { vi } from "vitest";
import { WorkflowsAdminApp } from "~/app.js";
import * as barrel from "~/index.js";
```

Hunk 2, the deleted and kept paths:

```ts
// before
    "domain/abstractions",
    "hooks/canUseWorkflows.ts"
];

const KEPT_PATHS = [
    "features/permissions",
    "presentation/permissions",
    "domain/permissionsSchema.ts",
    "editor",
    "review",
    "types.ts"
];
// after
    "domain/abstractions",
    "hooks/canUseWorkflows.ts",
    "presentation/permissions/HasWorkflowsEditorPermission.tsx",
    "features/permissions",
    "domain/permissionsSchema.ts"
];

const KEPT_PATHS = [
    "domain/permissions",
    "presentation/permissions",
    "settings",
    "editor",
    "review",
    "types.ts"
];
```

Hunk 3, the pattern of the removed permission API and the files it is checked in (after `OLD_EDITOR_API_PATTERN`):

```ts
// before
const OLD_EDITOR_API_PATTERN =
    /\bComponents\b|useCanUseWorkflows|IWorkflowApplication|\bWorkflowsFeature\b|WorkflowsEditorPresenterFeature|IGenericMeta|IGenericError|IWorkflowNotificationType|IWorkflowStep\b|IWorkflow\b/;
// after
const OLD_EDITOR_API_PATTERN =
    /\bComponents\b|useCanUseWorkflows|IWorkflowApplication|\bWorkflowsFeature\b|WorkflowsEditorPresenterFeature|IGenericMeta|IGenericError|IWorkflowNotificationType|IWorkflowStep\b|IWorkflow\b/;

const PERMISSION_FILES = [
    "app.tsx",
    "index.tsx",
    "presentation/permissions/index.tsx",
    "presentation/permissions/SecurityPermissions.tsx"
];

const REMOVED_PERMISSION_API_PATTERN =
    /WorkflowsPermissionsFeature|HasWorkflowsEditorPermission|IHasWorkflowsSecurityPermissionProps|WORKFLOWS_PERMISSIONS_SCHEMA|permissionsSchema|features\/permissions/;
```

Hunk 4, the new tests and the kept-path title (the `it.each(KEPT_PATHS)` title said "for the editor (9a, 9c)", which no longer fits a list that holds the settings area):

```ts
// before
    it("no longer mounts the global Content Reviews route, menu and widgets", () => {
        const typeNames = renderRoot().map(entry => entry.typeName);

        expect(typeNames).not.toContain("ContentReviews");
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept for the editor (9a, 9c)", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });
// after
    it("no longer mounts the global Content Reviews route, menu and widgets", () => {
        const typeNames = renderRoot().map(entry => entry.typeName);

        expect(typeNames).not.toContain("ContentReviews");
    });

    it("registers no workflows permissions DI feature (R334)", () => {
        const entries = renderRoot();
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(featureNames).toContain("Workflows/ReviewServices");
        expect(featureNames).not.toContain("workflows:Permissions");
    });

    it("exports only WorkflowsAdminApp and useWorkflowsPermission from the barrel (R334)", () => {
        const exportedNames = Object.keys(barrel).sort();

        expect(exportedNames).toEqual(["WorkflowsAdminApp", "useWorkflowsPermission"]);
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it.each(PERMISSION_FILES)("%s mentions none of the removed permission code", relativePath => {
        const filePath = path.join(srcDir, relativePath);
        const source = fs.readFileSync(filePath, "utf-8");

        expect(source).not.toMatch(REMOVED_PERMISSION_API_PATTERN);
    });
```

`Object.keys(barrel).sort()` sorts by code unit, so `WorkflowsAdminApp` (upper-case `W`) comes before `useWorkflowsPermission`.

- [ ] **Step 2: Run the tests and expect failure**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
```

Expected: FAIL, exactly these cases:

- `presentation/permissions/HasWorkflowsEditorPermission.tsx is deleted`, `features/permissions is deleted`, `domain/permissionsSchema.ts is deleted` (`expected true to be false`);
- `registers no workflows permissions DI feature (R334)` (`featureNames` contains `workflows:Permissions`);
- `exports only WorkflowsAdminApp and useWorkflowsPermission from the barrel (R334)` (the barrel also has `WorkflowsPermissionsFeature`);
- `app.tsx mentions none of the removed permission code`, `index.tsx mentions none of the removed permission code`, `presentation/permissions/index.tsx mentions none of the removed permission code`.

Every other case passes, including all six `is kept` cases and `presentation/permissions/SecurityPermissions.tsx mentions none of the removed permission code` (Task 16 removed the schema import). A different failure set means the tree is not what Step 1 showed: stop and report.

- [ ] **Step 3: Delete the code and update the imports**

Delete the four files (git removes the then-empty `features/permissions` and `features` folders):

```bash
git rm -q packages/app-workflows/src/presentation/permissions/HasWorkflowsEditorPermission.tsx packages/app-workflows/src/features/permissions/abstractions.ts packages/app-workflows/src/features/permissions/feature.ts packages/app-workflows/src/domain/permissionsSchema.ts
ls packages/app-workflows/src/features 2>&1 | tail -1
```

Expected for the `ls`: `No such file or directory`. If the folder still exists (an untracked file is in it), list it and stop: the plan does not know that file.

Modify `packages/app-workflows/src/presentation/permissions/index.tsx`. Remove the two `HasWorkflowsEditorPermission` lines and nothing else (Task 16 left the other lines unchanged; keep whatever else Task 16 added):

```ts
// before
export { SecurityPermissions } from "./SecurityPermissions.js";
export { useWorkflowsPermission } from "./useWorkflowsPermission.js";
export type { IHasWorkflowsSecurityPermissionProps } from "./HasWorkflowsEditorPermission.js";
export { HasWorkflowsEditorPermission } from "./HasWorkflowsEditorPermission.js";
// after
export { SecurityPermissions } from "./SecurityPermissions.js";
export { useWorkflowsPermission } from "./useWorkflowsPermission.js";
```

Replace `packages/app-workflows/src/index.tsx` with (the whole file; no 9c task adds a barrel export, R334):

```tsx
export { WorkflowsAdminApp } from "./app.js";

export { useWorkflowsPermission } from "./presentation/permissions/useWorkflowsPermission.js";
```

Modify `packages/app-workflows/src/app.tsx`. Remove exactly two lines; Tasks 3, 7, 9, 10 and 13 added registrations and imports around them, so remove these two lines wherever they now sit and change nothing else:

```tsx
// before (the import, at BASE line 5)
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { WorkflowsPermissionsFeature } from "~/features/permissions/feature.js";
import { ActiveReviewTrashFeature } from "~/review/trash/feature.js";
// after
import { SecurityPermissions } from "~/presentation/permissions/index.js";
import { ActiveReviewTrashFeature } from "~/review/trash/feature.js";
```

```tsx
// before (the registration, the first child of the fragment at BASE)
        <>
            <RegisterFeature feature={WorkflowsPermissionsFeature} />
            <RegisterFeature feature={ReviewServicesFeature} />
// after
        <>
            <RegisterFeature feature={ReviewServicesFeature} />
```

Then confirm nothing is left:

```bash
grep -rn "WorkflowsPermissionsFeature\|HasWorkflowsEditorPermission\|IHasWorkflowsSecurityPermissionProps\|WORKFLOWS_PERMISSIONS_SCHEMA\|permissionsSchema\|features/permissions" packages/app-workflows/src
```

Expected: only `packages/app-workflows/src/app.cleanup.test.tsx` (its `DELETED_PATHS` entries and `REMOVED_PERMISSION_API_PATTERN`).

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
```

Expected: PASS, every case.

- [ ] **Step 5: Run the existing tests that cover the changed code, and build**

```bash
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -30
ls packages/app-workflows/src/presentation/permissions/*.test.ts*
```

Then run, one command each, every test file the `ls` lists that the two commands above did not run (Task 16 created `SecurityPermissions.test.tsx`, `WorkflowsRolePermissions.test.tsx` and `WorkflowsRolePermissions.a109.test.tsx`; the contract names them, the `ls` shows the real names):

```bash
yarn test packages/app-workflows/src/presentation/permissions/SecurityPermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/WorkflowsRolePermissions.a109.test.tsx 2>&1 | tail -30
```

Expected: all PASS, unchanged from before this task (`app.test.tsx` mocks `~/presentation/permissions/index.js` by spreading the real module, which still exports `SecurityPermissions`). If `app.test.tsx` fails because it imports a deleted path, remove that import or mock line only and record it under "Contract notes" in the report.

Type check and build (the package has no `__tests__`, so the build type-checks the co-located tests, 8a R243):

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: the build succeeds with no TypeScript error. The CMS and WB workflows packages and `app-serverless-cms` import none of the deleted symbols (Step 1), so they need no build here; the pre-commit chain covers the rest.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git status --short
```

`yarn adio` must not report `@webiny/app-admin` as unused (the package still imports it in many files); if it reports another dependency of `app-workflows` as unused because of this deletion, remove that dependency from `packages/app-workflows/package.json` and rerun the chain from the first line. `git status --short` must list only the four deleted files, `presentation/permissions/index.tsx`, `index.tsx`, `app.tsx`, `app.cleanup.test.tsx` (and `package.json` only if `adio` asked for it), with no `docs/.reports`, `.superpowers` or `.gitleaks.toml` entry.

```bash
git commit -m "refactor(app-workflows): delete the unused editor permission component and permissions DI feature" -m "HasWorkflowsEditorPermission was exported and never used, the WorkflowsPermissions DI feature was registered and exported but never resolved, and the workflows permission schema has no user since the role form renders its own element. The barrel now exports WorkflowsAdminApp and useWorkflowsPermission only." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step of the chain fails and you fix something, rerun the chain from the first line.

**Contract notes:**
1. The contract lists `[AW]/app.test.tsx` among the files to edit. At BASE it references none of the deleted symbols: it mocks `~/presentation/permissions/index.js` by spreading the real module and replacing `SecurityPermissions`, and it resolves no permissions token. Nothing in it needs to change for the deletion, and the "nothing registered" proof for the deleted feature is in `app.cleanup.test.tsx` (`workflows:Permissions` is not among the root's feature names), next to the other removal checks. Step 5 runs `app.test.tsx` to prove it still passes; an edit is made only if Task 16 added an import of a deleted path, and is then reported.
2. The contract's check-first grep is kept as given, with the `--include` patterns quoted (unquoted `*.ts` fails in zsh with "no matches found"). A second, package-local grep is added so the executor sees every internal user before deleting.
3. `features/` holds only `permissions/` at BASE, so the whole `features/` folder disappears. `DELETED_PATHS` lists `features/permissions` (the contract's path); the empty parent is not listed separately.
4. The contract's Task 17 entry says the check-first grep "finds only files under `packages/app-workflows/src`" at BASE. It does not: `WorkflowsPermissionsFeature` also matches the API's own, unrelated feature of that name in `packages/api-workflows/src` (two lines). Step 1 filters that package out and says why; the API is out of scope (Q65).

## Review fixes (sub-phase review)

- Step 1: the first grep now drops `packages/api-workflows/src/` (its unrelated `WorkflowsPermissionsFeature` would have printed two lines and stopped the executor); added the explanation and Contract note 4.
- Step 1 hunk 4: the new `PERMISSION_FILES` test no longer passes `path.join(...)` straight into `fs.readFileSync` (no nested call arguments).
