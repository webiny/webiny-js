### Task 22: Delete the old editor

R202, R219 (cleanup tests), R243; D162, D165-D169 context only; `ai-context/code-style/no-backwards-compat.md` (delete old code paths outright, no shims or aliases); Review Focus 10. The old workflow editor talks to `workflows { listWorkflows | storeWorkflow | deleteWorkflow | listWorkflowNotificationTypes }`, none of which exist on the API any more, and has no step type or config; Tasks 20 and 21 replaced its mounting. This task deletes it and everything only it used, in three packages, together with the tests, mocks, exports and package dependencies that point at it.

- **`app-workflows` deletions:**
  - `src/presentation/workflowsEditor/**` (22 files: presenter, abstractions, feature, hook, components).
  - `src/features/listWorkflows/**`, `src/features/storeWorkflow/**`, `src/features/deleteWorkflow/**`, `src/features/listNotificationTypes/**` (16 files).
  - `src/features/feature.ts` (`WorkflowsFeature`) and `src/features/graphqlFields.ts` (old `ERROR_FIELDS` and `WORKFLOW_FIELDS`; the review gateway has its own in `src/review/gateway/reviewFields.ts`).
  - `src/domain/index.ts`, `src/domain/WorkflowModel.ts`, `src/domain/WorkflowStepModel.ts`, `src/domain/abstractions/**`.
  - `src/hooks/canUseWorkflows.ts` (`useCanUseWorkflows`): its two callers were the old CMS route and the old WB menu, both replaced by Tasks 20 and 21.
  - From `src/types.ts` every old type (`IGenericMeta`, `IGenericError`, `IWorkflowApplication`, `IWorkflowStepNotification`, `IWorkflowStepTeam`, `IWorkflowStep`, `IWorkflowNotificationType`, `IWorkflow`); `IWorkflowsSecurityPermission` stays (`review/domain/getWorkflowsPermissionSet.ts` imports it).
  - From `src/index.tsx` the exports `Components` (`Permissions.HasWorkflowsEditorPermission`, `Admin.WorkflowsEditor`), `useCanUseWorkflows`, `IWorkflowApplication`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature`. Nothing outside `app-workflows` uses them once the CMS and WB old files are gone (verified by the grep in Step 1); `app-serverless-cms` imports only `WorkflowsAdminApp`.
  - From `src/app.tsx` the imports and registrations of `WorkflowsFeature` and `WorkflowsEditorPresenterFeature`.
- **Kept in `app-workflows`:** `src/domain/permissionsSchema.ts`, `src/features/permissions/**`, `src/presentation/permissions/**` (including the unexported `HasWorkflowsEditorPermission.tsx`, kept for the permission UI of 9c), `src/review/**`, `src/editor/**`, `src/types.ts` (one interface), `src/index.tsx` (`WorkflowsAdminApp`, `useWorkflowsPermission`, `WorkflowsPermissionsFeature`).
- **CMS deletions:** `src/Routes/CmsWorkflowsEditor.tsx`, `src/presentation/CmsWorkflowsEditorView.tsx`, `src/presentation/cmsWorkflowsEditor/**` (3 files), the four `cmsWorkflowsEditor/feature.js` test mocks, the old-editor wording of the `index.editor.test.tsx` comment, and the dependencies `react-helmet` and `mobx-react-lite` of `package.json` when `yarn adio` reports them unused. `src/Routes/index.ts` stays (it exports `CmsWorkflowEditor` since Task 20). `createAppName` stays (three other callers).
- **WB deletions:** `src/Components/PageWorkflows/**` (2 files: the old `PageWorkflowsEditorView.tsx` and its `index.ts`). `src/Routes/WebsiteBuilderWorkflowsMenu.tsx` is the Task 21 mount component and stays.
- **Cleanup tests (R219):** `app-workflows/src/app.cleanup.test.tsx`, `app-headless-cms-workflows/src/index.cleanup.test.tsx` and `app-website-builder-workflows/src/index.cleanup.test.tsx` list the new deleted paths, replace the kept-for-the-editor list by the real kept set, and pin that the barrel and `types.ts` carry no old API.

**Files:**
- Delete: the paths above (commands in Step 3).
- Modify: `packages/app-headless-cms-workflows/src/presentation/feature.ts`, `packages/app-headless-cms-workflows/src/routes.ts`, `packages/app-website-builder-workflows/src/routes.ts`
- Modify: `packages/app-workflows/src/app.tsx`, `packages/app-workflows/src/index.tsx`, `packages/app-workflows/src/types.ts`, `packages/app-workflows/package.json`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`, `src/index.test.tsx`, `src/index.editor.test.tsx`, `src/index.lists.test.tsx`, `src/features/trash/feature.test.tsx`, `package.json`
- Modify: `packages/app-website-builder-workflows/src/index.cleanup.test.tsx`

**Interfaces:**
- Consumes: Tasks 20 and 21 (the new mounting; the old editor has no caller left), existing (verified by grep before this plan): `IWorkflowsSecurityPermission` (`app-workflows/src/types.ts`, used by `review/domain/getWorkflowsPermissionSet.ts`), `WORKFLOWS_PERMISSIONS_SCHEMA` (`domain/permissionsSchema.ts`, used by `features/permissions` and `presentation/permissions/SecurityPermissions.tsx`), `WorkflowsAdminApp` (used by `app-serverless-cms/src/Admin.tsx`), `Feature` name `Workflows/ReviewServices` (`review/feature.ts`), `Workflows/ActiveReviewTrash` (`review/trash/feature.ts`).
- Produces: nothing for later tasks. Task 23 documents the removal (`app.md`, `integrations.md`).

- [ ] **Step 1: Write the failing tests and check the callers**

First prove nothing outside the doomed files still uses the old API. Run:

```bash
git grep -n -E "IWorkflowApplication|Components\.Admin|useCanUseWorkflows|WorkflowsEditorPresenterFeature|CmsWorkflowsEditor|PageWorkflowsEditor|\bWorkflowsFeature\b|HasWorkflowsEditorPermission" -- 'packages/app-*/src' 'packages/app-*/__tests__' ':!packages/app-workflows/src/presentation/workflowsEditor' ':!packages/app-headless-cms-workflows/src/presentation/cmsWorkflowsEditor' ':!packages/app-headless-cms-workflows/src/presentation/CmsWorkflowsEditorView.tsx' ':!packages/app-headless-cms-workflows/src/Routes/CmsWorkflowsEditor.tsx' ':!packages/app-website-builder-workflows/src/Components/PageWorkflows'
git grep -n -E "from \"~/types.js\"" -- 'packages/app-workflows/src' ':!packages/app-workflows/src/domain' ':!packages/app-workflows/src/features/listWorkflows' ':!packages/app-workflows/src/features/storeWorkflow' ':!packages/app-workflows/src/features/deleteWorkflow' ':!packages/app-workflows/src/features/listNotificationTypes' ':!packages/app-workflows/src/presentation/workflowsEditor'
git grep -n -E "~/domain/(WorkflowModel|WorkflowStepModel|index|abstractions)|~/features/(listWorkflows|storeWorkflow|deleteWorkflow|listNotificationTypes|feature|graphqlFields)|~/hooks/canUseWorkflows" -- 'packages/app-workflows/src' ':!packages/app-workflows/src/presentation/workflowsEditor' ':!packages/app-workflows/src/features/listWorkflows' ':!packages/app-workflows/src/features/storeWorkflow' ':!packages/app-workflows/src/features/deleteWorkflow' ':!packages/app-workflows/src/features/listNotificationTypes' ':!packages/app-workflows/src/domain'
```

Expected output of the first command, these files and no others (the three cleanup test files may also appear, they name the paths on purpose): `packages/app-workflows/src/index.tsx` (the `Components` block, `useCanUseWorkflows`, `IWorkflowApplication`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature` exports), `packages/app-workflows/src/app.tsx` (`WorkflowsFeature`, `WorkflowsEditorPresenterFeature`), `packages/app-workflows/src/presentation/permissions/HasWorkflowsEditorPermission.tsx` and `.../permissions/index.tsx` (the kept component), `packages/app-workflows/src/types.ts` (`IWorkflowApplication`), `packages/app-workflows/src/hooks/canUseWorkflows.ts`, the four `cmsWorkflowsEditor/feature.js` mocks (`CmsWorkflowsEditorPresenterFeature` in `index.test.tsx`, `index.editor.test.tsx`, `index.lists.test.tsx`, `features/trash/feature.test.tsx`), `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx` (the `not.toContain("CmsWorkflowsEditor")` lines from Task 20) and `packages/app-workflows/src/app.cleanup.test.tsx` (feature name strings). Expected output of the second command: `packages/app-workflows/src/review/domain/getWorkflowsPermissionSet.ts` (`IWorkflowsSecurityPermission`) and `packages/app-workflows/src/index.tsx` (`export type { IWorkflowApplication } from "~/types.js"`), nothing else. Expected output of the third: `packages/app-workflows/src/app.tsx` only (`~/features/feature.js`). If any command prints another file, that file still uses the old API: stop and fix the caller first (a new-editor file that imports a type from `~/types.js` keeps that type in `types.ts`).

Modify `packages/app-workflows/src/app.cleanup.test.tsx`. Add the deleted paths:

```ts
// before
    "domain/abstractions/WorkflowStateStepModel.ts",
    "domain/events.ts"
];
// after
    "domain/abstractions/WorkflowStateStepModel.ts",
    "domain/events.ts",
    "features/listWorkflows",
    "features/storeWorkflow",
    "features/deleteWorkflow",
    "features/listNotificationTypes",
    "features/feature.ts",
    "features/graphqlFields.ts",
    "presentation/workflowsEditor",
    "domain/index.ts",
    "domain/WorkflowModel.ts",
    "domain/WorkflowStepModel.ts",
    "domain/abstractions",
    "hooks/canUseWorkflows.ts"
];
```

Replace the kept and shared lists:

```ts
// before
const KEPT_PATHS = [
    "features/listWorkflows",
    "features/storeWorkflow",
    "features/deleteWorkflow",
    "features/listNotificationTypes",
    "features/permissions",
    "presentation/workflowsEditor",
    "presentation/permissions",
    "domain/WorkflowModel.ts",
    "domain/WorkflowStepModel.ts",
    "domain/abstractions/WorkflowModel.ts",
    "domain/abstractions/WorkflowStepModel.ts",
    "domain/index.ts",
    "domain/permissionsSchema.ts",
    "hooks/canUseWorkflows.ts"
];
// after
const KEPT_PATHS = [
    "features/permissions",
    "presentation/permissions",
    "domain/permissionsSchema.ts",
    "editor",
    "review",
    "types.ts"
];
```

```ts
// before
const SHARED_FILES = [
    "app.tsx",
    "index.tsx",
    "types.ts",
    "features/feature.ts",
    "features/graphqlFields.ts",
    "domain/index.ts"
];
// after
const SHARED_FILES = ["app.tsx", "index.tsx", "types.ts"];

const OLD_EDITOR_API_PATTERN =
    /\bComponents\b|useCanUseWorkflows|IWorkflowApplication|\bWorkflowsFeature\b|WorkflowsEditorPresenterFeature|IGenericMeta|IGenericError|IWorkflowNotificationType|IWorkflowStep\b|IWorkflow\b/;
```

Replace the kept-features case:

```ts
// before
    it("registers the kept features and none of the old presenters", () => {
        const entries = renderRoot();
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(featureNames).toContain("Workflows");
        expect(featureNames).toContain("Workflows/WorkflowsEditorPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatePresenter");
// after
    it("registers the review features and none of the old editor or review presenters", () => {
        const entries = renderRoot();
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(featureNames).toContain("Workflows/ReviewServices");
        expect(featureNames).toContain("Workflows/ActiveReviewTrash");
        expect(featureNames).not.toContain("Workflows");
        expect(featureNames).not.toContain("Workflows/WorkflowsEditorPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatePresenter");
```

Add a case at the end of the `describe` block, after the `SHARED_FILES` case:

```ts
    it.each(SHARED_FILES)("%s carries no old editor API", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_EDITOR_API_PATTERN);
    });
```

(`app.tsx` and `index.tsx` mention `Workflows` features by other names only; `IWorkflowsSecurityPermission` in `types.ts` does not match `IWorkflow\b` because of the trailing `s`.)

Modify `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`:

```ts
// before
    "presentation/ContentEntryFormPresenterWorkflowDecorator.ts",
    "presentation/TableRowMapperWorkflowDecorator.ts",
    "presentation/WorkflowStateGetEntryFieldSelection.ts",
    "presentation/WorkflowStateListEntriesFieldSelection.ts"
];

const KEPT_PATHS = [
    "Routes/CmsWorkflowsEditor.tsx",
    "presentation/CmsWorkflowsEditorView.tsx",
    "presentation/cmsWorkflowsEditor"
];
// after
    "presentation/ContentEntryFormPresenterWorkflowDecorator.ts",
    "presentation/TableRowMapperWorkflowDecorator.ts",
    "presentation/WorkflowStateGetEntryFieldSelection.ts",
    "presentation/WorkflowStateListEntriesFieldSelection.ts",
    "Routes/CmsWorkflowsEditor.tsx",
    "presentation/CmsWorkflowsEditorView.tsx",
    "presentation/cmsWorkflowsEditor"
];

const KEPT_PATHS = ["Routes/index.ts", "Routes/CmsWorkflowEditor.tsx", "features/editorMounting"];
```

Modify `packages/app-website-builder-workflows/src/index.cleanup.test.tsx`:

```ts
// before
    "presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts",
    "presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts"
];

const KEPT_PATHS = [
    "Routes/WebsiteBuilderWorkflowsMenu.tsx",
    "Components/PageWorkflows/PageWorkflowsEditorView.tsx",
// after
    "presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts",
    "presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts",
    "Components/PageWorkflows"
];

const KEPT_PATHS = [
    "Routes/WebsiteBuilderWorkflowsMenu.tsx",
    "features/editorMounting",
```

Also change the case title `"%s is kept (editor or rewritten by Tasks 22-23)"` to `"%s is kept (the editor mount or the page editor)"`:

```ts
// before
    it.each(KEPT_PATHS)("%s is kept (editor or rewritten by Tasks 22-23)", relativePath => {
// after
    it.each(KEPT_PATHS)("%s is kept (the editor mount or the page editor)", relativePath => {
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -40
```

Expected: each fails on the new deleted-path cases (`presentation/workflowsEditor is deleted`, `Routes/CmsWorkflowsEditor.tsx is deleted`, `Components/PageWorkflows is deleted`: `expected true to be false`); `app.cleanup.test.tsx` also fails on `expected [...] not to contain 'Workflows'` and on the `index.tsx carries no old editor API` case.

- [ ] **Step 3: Implementation**

Delete the old files:

```bash
git rm -r packages/app-workflows/src/presentation/workflowsEditor
git rm -r packages/app-workflows/src/features/listWorkflows
git rm -r packages/app-workflows/src/features/storeWorkflow
git rm -r packages/app-workflows/src/features/deleteWorkflow
git rm -r packages/app-workflows/src/features/listNotificationTypes
git rm packages/app-workflows/src/features/feature.ts
git rm packages/app-workflows/src/features/graphqlFields.ts
git rm -r packages/app-workflows/src/domain/abstractions
git rm packages/app-workflows/src/domain/index.ts
git rm packages/app-workflows/src/domain/WorkflowModel.ts
git rm packages/app-workflows/src/domain/WorkflowStepModel.ts
git rm packages/app-workflows/src/hooks/canUseWorkflows.ts
git rm packages/app-headless-cms-workflows/src/Routes/CmsWorkflowsEditor.tsx
git rm packages/app-headless-cms-workflows/src/presentation/CmsWorkflowsEditorView.tsx
git rm -r packages/app-headless-cms-workflows/src/presentation/cmsWorkflowsEditor
git rm -r packages/app-website-builder-workflows/src/Components/PageWorkflows
```

Modify `packages/app-workflows/src/index.tsx`: delete these lines and keep every other export (the file ends with only `WorkflowsAdminApp`, `useWorkflowsPermission` and `WorkflowsPermissionsFeature`):

```ts
// delete
import { WorkflowsEditor } from "./presentation/workflowsEditor/components/index.js";
import { HasWorkflowsEditorPermission } from "./presentation/permissions/index.js";
export { useCanUseWorkflows } from "./hooks/canUseWorkflows.js";
export type { IWorkflowApplication } from "~/types.js";
export { WorkflowsFeature } from "./features/feature.js";
export { WorkflowsEditorPresenterFeature } from "./presentation/workflowsEditor/feature.js";
export const Components = {
    Permissions: {
        HasWorkflowsEditorPermission
    },
    Admin: {
        WorkflowsEditor
    }
};
```

Modify `packages/app-workflows/src/types.ts`: delete every interface except `IWorkflowsSecurityPermission` (`IGenericMeta`, `IGenericError`, `IWorkflowApplication`, `IWorkflowStepNotification`, `IWorkflowStepTeam`, `IWorkflowStep`, `IWorkflowNotificationType`, `IWorkflow`) and the imports they alone use (`GenericRecord`, `NonEmptyArray`, `ReactElement`). The file keeps:

```ts
import { Identity } from "@webiny/app-admin/domain/Identity.js";

// The stored `workflows` permission (R259): booleans, one entry per role.
export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor?: boolean;
    reassign?: boolean;
}
```

Modify `packages/app-headless-cms-workflows/src/presentation/feature.ts` (the comment goes stale with `WorkflowsFeature`):

```ts
// before
        // WorkflowsFeature and the review services are registered by WorkflowsAdminApp.
// after
        // The review services are registered by WorkflowsAdminApp.
```

Drop the dead `app` route param (nothing reads it once the old views are deleted). In `packages/app-headless-cms-workflows/src/routes.ts`:

```ts
// before
        Workflows: new Route({
            name: "Cms/ContentModels/Workflows",
            path: "/cms/workflows",
            params: zod => {
                return {
                    app: zod.string().optional()
                };
            }
        })
// after
        Workflows: new Route({
            name: "Cms/ContentModels/Workflows",
            path: "/cms/workflows"
        })
```

In `packages/app-website-builder-workflows/src/routes.ts`:

```ts
// before
        Workflows: new Route({
            name: "WebsiteBuilder/PageWorkflow",
            path: "/website-builder/workflows",
            params: zod => {
                return {
                    app: zod.string().optional()
                };
            }
        }),
// after
        Workflows: new Route({
            name: "WebsiteBuilder/PageWorkflow",
            path: "/website-builder/workflows"
        }),
```

Modify `packages/app-workflows/src/app.tsx` (other tasks added their own registrations to this file; only these four lines go):

```tsx
// before
import { WorkflowsFeature } from "~/features/feature.js";
// after (the line is deleted)
```

```tsx
// before
import { WorkflowsEditorPresenterFeature } from "~/presentation/workflowsEditor/feature.js";
// after (the line is deleted)
```

```tsx
// before
            <RegisterFeature feature={WorkflowsFeature} />
// after (the line is deleted)
```

```tsx
// before
            <RegisterFeature feature={WorkflowsEditorPresenterFeature} />
// after (the line is deleted)
```

Remove the four stale test mocks. In `packages/app-headless-cms-workflows/src/index.test.tsx`, `src/index.editor.test.tsx`, `src/index.lists.test.tsx` and `src/features/trash/feature.test.tsx` delete this identical block (and the blank line after it):

```tsx
vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});
```

In `packages/app-headless-cms-workflows/src/index.editor.test.tsx` fix the comment above the remaining mocks:

```tsx
// before
/*
 * The editor route, the Content Reviews route, menu and sidebar item, the "open in new window" option and the old
 * editor presenter need routing and menu providers and are not what this test asserts (Task 11's
 * composition test stubs the same modules).
 */
// after
/*
 * The workflow editor route, the Content Reviews route, menu and sidebar item and the "open in new window"
 * option need routing and menu providers and are not what this test asserts (Task 11's composition test
 * stubs the same modules).
 */
```

Fix the package dependencies. Run `yarn adio` (it reports, it does not edit): in the three `package.json` files remove exactly what it reports as unused and add what it reports as missing. Which dependencies the old editor alone used (`@webiny/form`, `@webiny/validation`, `mobx`, `mobx-react-lite`, `@webiny/utils`) and which the new editor needs depends on Tasks 8-19, so no name list is fixed here. Expected for the CMS package: `react-helmet` and `mobx-react-lite` reported (their last importers were the deleted route and view); `mobx` stays (`CmsEntryFormPresenterReviewDecorator.ts`) and `@fortawesome/react-fontawesome` stays (the Task 20 adapter). Run `node scripts/generateTsConfigsInPackages.js` afterwards so the tsconfig references follow.

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -40
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type check**

```bash
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/presentation/permissions/useWorkflowsPermission.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.lists.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-serverless-cms --no-cache 2>&1 | tail -30
```

Expected: pass and clean builds. Then prove the old editor is gone from the whole repo (both commands print nothing):

```bash
git grep -n -E "IWorkflowApplication|Components\.Admin|useCanUseWorkflows|WorkflowsEditorPresenterFeature|CmsWorkflowsEditor|PageWorkflowsEditor|cmsWorkflowsEditor|workflowsEditor" -- 'packages/**/*.ts' 'packages/**/*.tsx' ':!packages/app-*/src/*cleanup.test.tsx'
git grep -n -E "listWorkflowNotificationTypes|ListWorkflowNotificationTypes" -- 'packages/app-*'
```

If the first command prints a line, it is a stale reference: fix it and rerun. If the second prints a line, the old notification-type gateway is still in use: stop and report it.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): delete the old workflow editor" -m "The old editor presenter, components, gateways, models and exports in app-workflows, the old CMS route, view and presenter and the old WB page workflows view are deleted with their tests, mocks and unused dependencies. The cleanup tests pin the deleted and the kept paths and that the barrel exports no old API." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **WB route file is not deleted.** The contract's WB deletion is `Components/PageWorkflows/**` only; `Routes/WebsiteBuilderWorkflowsMenu.tsx` was rewritten in place by Task 21 and stays. The CMS route file `Routes/CmsWorkflowsEditor.tsx` is deleted as the contract says; its replacement is `Routes/CmsWorkflowEditor.tsx` (Task 20), so `Routes/index.ts` stays.
- **`HasWorkflowsEditorPermission.tsx` stays** (contract: keep the permission files) although it loses its only export path, `Components.Permissions`; it is still re-exported from `presentation/permissions/index.tsx` and 9c may use it. `useCanUseWorkflows` is deleted (contract: keep "while used"; Tasks 20 and 21 removed its last two callers, proven by the Step 1 grep).
- **Test updates split with Tasks 20 and 21.** The contract lists the CMS `index.test.tsx`, `index.editor.test.tsx`, `index.lists.test.tsx` and `features/trash/feature.test.tsx` and the WB cleanup and wiring tests under Task 22. Tasks 20 and 21 already changed the `~/Routes/index.js` mock name and the root cases, because the root no longer mounts the old component and those tests would otherwise break one task earlier; this task removes only the mocks of the deleted presenter module and the old wording. The six WB wiring tests need no change (the WB mount component kept its name).
- **Dependencies.** The set depends on what Tasks 8-19 import, so the plan says "remove what `yarn adio` reports, add what it reports missing" and names only the CMS result.
- **Route params.** The unused optional `app` param of `Routes.ContentModels.Workflows` and `Routes.Pages.Workflows` is dropped here (no-backwards-compat).
- **Docs.** `app.md` and `integrations.md` still describe the old editor until Task 23.
