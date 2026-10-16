### Task 37: Delete the old review UI

R219 (delete and keep lists), R211, R202; Review Focus 15 ("deleting the old UI breaks the build or removes something kept for 9a/9c"); Roadmap row 8a ("delete the old admin review UI"). Every task before this one built and mounted the replacement (Tasks 10-36), so the old review code is now unreferenced from the mounted roots. This task deletes exactly what R219 lists, trims the shared files that carried both halves (`types.ts`, `graphqlFields.ts`, `features/feature.ts`, `domain/index.ts`, the barrels, `app.tsx`), lets `yarn adio` fix `package.json`, and proves with composition tests, file checks, greps and builds that nothing live imports a deleted path and that the old workflow editor (kept for 9a, 9c) still compiles.

- **Deleted in `packages/app-workflows/src`:** `features/{approveStep,cancelWorkflowState,getTargetWorkflowState,listWorkflowStates,rejectStep,requestReview,startStep,takeOverStep}/`; `presentation/{workflowState,workflowStateList,workflowStatesWidget,shared}/`; `presentation/ContentReviews.tsx`; `routes.ts` (its one route, `Workflows/ContentReviews` at `/workflows/content-reviews`, is replaced by the per-app routes of Tasks 29-30, R206); `domain/WorkflowStateModel.ts`, `domain/WorkflowStateStepModel.ts`, `domain/abstractions/WorkflowStateModel.ts`, `domain/abstractions/WorkflowStateStepModel.ts`, `domain/events.ts` (`WorkflowStateChangedEvent`, replaced by `ReviewChangedEvent`, R213).
- **Trimmed in `packages/app-workflows/src`:** `index.tsx`, `app.tsx`, `types.ts`, `features/graphqlFields.ts` (`ERROR_FIELDS` and `WORKFLOW_FIELDS` stay, four kept gateways import them), `features/feature.ts`, `domain/index.ts`.
- **Deleted in `packages/app-headless-cms-workflows/src`:** `Components/CmsEntriesWorkflowStateList/`, `Components/OptionItem/OpenInNewWindow.tsx`, `Components/ContentEntryForm/{ContentEntryFormWorkflow,CmsEntryFormTooltipButton,CmsEntryFormScheduleMenuItemAction,CmsEntryFormCreateNewRevisionButton}.tsx`, `features/WorkflowStateCacheHandler.ts`, `presentation/{ContentEntryFormPresenterWorkflowDecorator,TableRowMapperWorkflowDecorator,WorkflowStateGetEntryFieldSelection,WorkflowStateListEntriesFieldSelection}.ts`.
- **Deleted in `packages/app-website-builder-workflows/src`:** `Components/PagesList/PagesListContentReviews.tsx`, `Components/OptionItem/`, `Components/PageEditor/{PageFormWorkflowState,PageFormWorkflowStateTooltip,PageFormWorkflowStatePublishButton,ToggleEditorMode}.tsx`, `presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts`, `presentation/page/PageList/{WorkflowStateListPagesFieldSelection,TableRowMapperDecorator}.ts`, and `hooks/usePage.ts` only if nothing imports it any more (Contract notes 1).
- **Kept until 9a/9c (must survive):** in `app-workflows`: `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes,permissions}/`, `presentation/{workflowsEditor,permissions}/**`, `domain/{WorkflowModel,WorkflowStepModel}.ts` and their `abstractions/` twins, `domain/{index,permissionsSchema}.ts`, `hooks/canUseWorkflows.ts`, the `WorkflowsAdminApp` permission and editor registrations; in the apps the editor routes and views (`Routes/CmsWorkflowsEditor.tsx`, `presentation/CmsWorkflowsEditorView.tsx`, `presentation/cmsWorkflowsEditor/*`, `Routes/WebsiteBuilderWorkflowsMenu.tsx`, `Components/PageWorkflows/*`). The WB files `PageEditorConfig.tsx`, `PageEditorTopBar.tsx`, `PageEditorLayout.tsx`, `PageEditorAutoSave.tsx` are kept by name (rewritten by Tasks 22-23).
- **Also fixed:** `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` carries two `@see` lines that name deleted bar files (Contract notes 2).
- **Not changed:** the `exports` map of the three `package.json` files (`".": "./index.js"`, `"./*": "./*"` already cover everything); only `dependencies` change, through `yarn adio`.

**Files:**
- Create: `packages/app-workflows/src/app.cleanup.test.tsx`
- Create: `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`
- Create: `packages/app-website-builder-workflows/src/index.cleanup.test.tsx`
- Delete: the lists above (Step 3, one `git rm` block per package)
- Modify (full replacement): `packages/app-workflows/src/types.ts`, `packages/app-workflows/src/features/graphqlFields.ts`, `packages/app-workflows/src/features/feature.ts`, `packages/app-workflows/src/domain/index.ts`
- Modify (removal hunks): `packages/app-workflows/src/app.tsx`, `packages/app-workflows/src/index.tsx`, `packages/app-website-builder-workflows/src/Components/index.ts`, `packages/app-website-builder-workflows/src/Components/PagesList/PagesList.tsx` (only if Task 30 left the old import), `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx`
- Modify only if the Step 3 sweep still finds old imports (conditional hunks given): `packages/app-headless-cms-workflows/src/index.tsx`, `.../src/types.ts`, `.../src/Components/ContentEntryForm/index.ts`, `packages/app-website-builder-workflows/src/index.tsx`, `.../src/types.ts`
- Modify (generated): the three `package.json` and `tsconfig*.json` files through the pre-commit chain

**Interfaces:**
- Consumes: Tasks 10, 13, 15-18, 25, 27, 28, 33, 34 (the mounted `app-workflows` features), Tasks 11, 20, 21, 29, 35 (`CmsWorkflows` root), Tasks 12, 22, 23, 24, 30, 36 (`WebsiteBuilderWorkflows` root); the R219 lists; existing `createFeature` (`@webiny/feature/admin`, shape `{ name, register, resolve }`, `packages/feature/src/admin/createFeature.ts`), `RegisterFeature` and `useFeatureFlags` (`@webiny/app-admin`, `packages/app-admin/src/components/RegisterFeature.tsx`), the three roots `WorkflowsAdminApp` (`app.tsx`), `CmsWorkflows` and `WebsiteBuilderWorkflows` (`index.tsx`).
- Produces: a tree without old review code (no later consumer); three composition tests that fail if an old feature, route, component or file comes back. The `@webiny/app-workflows` barrel loses `useWorkflowState`, `WorkflowStateValue`, `IWorkflowState`, `WorkflowStatePresenter(+Feature)`, `WorkflowStateListPresenterFeature`, `WorkflowStatesWidgetPresenterFeature`, `Components.ContentReview`, `Components.Overlay`, `Components.Widget`, `Components.List`; it keeps `WorkflowsAdminApp`, `useCanUseWorkflows`, `useWorkflowsPermission`, `IWorkflowApplication`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature`, `WorkflowsPermissionsFeature`, `Components.{Permissions,Admin}` and every export Tasks 8-34 added.

How the composition tests work: the three roots are plain function components whose only hook is `useFeatureFlags`. The tests mock `@webiny/app-admin` (original module plus a recording `RegisterFeature` and a `useFeatureFlags` that reads a hoisted flag), call the root as a function and walk the returned element tree (`React.Children.forEach`, element `props.children`), collecting each element's component name and, for `RegisterFeature`, `props.feature.name`. No provider, container or router is needed. Admin packages run `yarn test <path>` only: the storage (`test:os`) legs belong to the four API packages of 8a.1.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/app.cleanup.test.tsx`:

```tsx
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowsAdminApp } from "~/app.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const original = await importOriginal<typeof import("@webiny/app-admin")>();
    const RegisterFeature = () => null;
    const useFeatureFlags = () => {
        return { isEnabled: () => flags.enabled };
    };
    return { ...original, RegisterFeature, useFeatureFlags };
});

interface TreeProps {
    children?: React.ReactNode;
    feature?: { name: string };
}

interface NamedType {
    displayName?: string;
    name?: string;
}

interface TreeEntry {
    typeName: string;
    featureName: string | null;
}

const getTypeName = (type: React.ElementType): string => {
    if (typeof type === "string") {
        return type;
    }
    if (type === React.Fragment) {
        return "Fragment";
    }
    const named = type as NamedType;
    return named.displayName || named.name || "Anonymous";
};

const collectTree = (node: React.ReactNode, entries: TreeEntry[]): void => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        const featureName = child.props.feature ? child.props.feature.name : null;
        entries.push({ typeName: getTypeName(child.type), featureName });
        collectTree(child.props.children, entries);
    });
};

const renderRoot = (): TreeEntry[] => {
    const entries: TreeEntry[] = [];
    collectTree(WorkflowsAdminApp(), entries);
    return entries;
};

const srcDir = import.meta.dirname;

const DELETED_PATHS = [
    "features/approveStep",
    "features/cancelWorkflowState",
    "features/getTargetWorkflowState",
    "features/listWorkflowStates",
    "features/rejectStep",
    "features/requestReview",
    "features/startStep",
    "features/takeOverStep",
    "presentation/workflowState",
    "presentation/workflowStateList",
    "presentation/workflowStatesWidget",
    "presentation/shared",
    "presentation/ContentReviews.tsx",
    "routes.ts",
    "domain/WorkflowStateModel.ts",
    "domain/WorkflowStateStepModel.ts",
    "domain/abstractions/WorkflowStateModel.ts",
    "domain/abstractions/WorkflowStateStepModel.ts",
    "domain/events.ts"
];

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

const OLD_CODE_PATTERN = /WorkflowState|workflowState|domain\/events|~\/routes\.js/;

const SHARED_FILES = [
    "app.tsx",
    "index.tsx",
    "types.ts",
    "features/feature.ts",
    "features/graphqlFields.ts",
    "domain/index.ts"
];

describe("app-workflows cleanup (R219)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers nothing when the feature flag is off", () => {
        flags.enabled = false;

        expect(WorkflowsAdminApp()).toBeNull();
    });

    it("registers the kept features and none of the old presenters", () => {
        const entries = renderRoot();
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(featureNames).toContain("Workflows");
        expect(featureNames).toContain("Workflows/WorkflowsEditorPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatePresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStateListPresenter");
        expect(featureNames).not.toContain("Workflows/WorkflowStatesWidgetPresenter");
    });

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

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });
});
```

Create `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`:

```tsx
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CmsWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const original = await importOriginal<typeof import("@webiny/app-admin")>();
    const RegisterFeature = () => null;
    const useFeatureFlags = () => {
        return { isEnabled: () => flags.enabled };
    };
    return { ...original, RegisterFeature, useFeatureFlags };
});

interface TreeProps {
    children?: React.ReactNode;
    feature?: { name: string };
}

interface NamedType {
    displayName?: string;
    name?: string;
}

interface TreeEntry {
    typeName: string;
    featureName: string | null;
}

const getTypeName = (type: React.ElementType): string => {
    if (typeof type === "string") {
        return type;
    }
    if (type === React.Fragment) {
        return "Fragment";
    }
    const named = type as NamedType;
    return named.displayName || named.name || "Anonymous";
};

const collectTree = (node: React.ReactNode, entries: TreeEntry[]): void => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        const featureName = child.props.feature ? child.props.feature.name : null;
        entries.push({ typeName: getTypeName(child.type), featureName });
        collectTree(child.props.children, entries);
    });
};

const renderRoot = (): TreeEntry[] => {
    const entries: TreeEntry[] = [];
    collectTree(CmsWorkflows(), entries);
    return entries;
};

const srcDir = import.meta.dirname;

const DELETED_PATHS = [
    "Components/CmsEntriesWorkflowStateList",
    "Components/OptionItem/OpenInNewWindow.tsx",
    "Components/ContentEntryForm/ContentEntryFormWorkflow.tsx",
    "Components/ContentEntryForm/CmsEntryFormTooltipButton.tsx",
    "Components/ContentEntryForm/CmsEntryFormScheduleMenuItemAction.tsx",
    "Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.tsx",
    "features/WorkflowStateCacheHandler.ts",
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

const OLD_COMPONENTS = [
    "ListOpenInNewWindow",
    "CmsEntriesWorkflowStateListFooterMenu",
    "ContentEntryFormWorkflow",
    "CmsEntryFormTooltipButton",
    "CmsEntryFormScheduleMenuItemAction",
    "CmsEntryFormCreateNewRevisionButton"
];

// The route constant `WorkflowStateList` keeps its name (R206), so it is allowed.
const OLD_CODE_PATTERN = /WorkflowState(?!List\b)|workflowState|domain\/events/;

const SHARED_FILES = ["index.tsx", "types.ts", "presentation/feature.ts", "features/feature.ts"];

describe("app-headless-cms-workflows cleanup (R219)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers nothing when the feature flag is off", () => {
        flags.enabled = false;

        expect(CmsWorkflows()).toBeNull();
    });

    it("keeps the editor route and presenter and mounts no old component", () => {
        const entries = renderRoot();
        const typeNames = entries.map(entry => entry.typeName);
        const featureNames = entries.map(entry => entry.featureName).filter(name => name !== null);

        expect(typeNames).toContain("CmsWorkflowsEditor");
        expect(featureNames).toContain("CmsWorkflowsEditor/Presenter");
        for (const oldName of OLD_COMPONENTS) {
            expect(typeNames).not.toContain(oldName);
        }
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept for the editor (9a, 9c)", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });
});
```

Create `packages/app-website-builder-workflows/src/index.cleanup.test.tsx` (same walker, different root and lists):

```tsx
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const original = await importOriginal<typeof import("@webiny/app-admin")>();
    const RegisterFeature = () => null;
    const useFeatureFlags = () => {
        return { isEnabled: () => flags.enabled };
    };
    return { ...original, RegisterFeature, useFeatureFlags };
});

interface TreeProps {
    children?: React.ReactNode;
    feature?: { name: string };
}

interface NamedType {
    displayName?: string;
    name?: string;
}

interface TreeEntry {
    typeName: string;
    featureName: string | null;
}

const getTypeName = (type: React.ElementType): string => {
    if (typeof type === "string") {
        return type;
    }
    if (type === React.Fragment) {
        return "Fragment";
    }
    const named = type as NamedType;
    return named.displayName || named.name || "Anonymous";
};

const collectTree = (node: React.ReactNode, entries: TreeEntry[]): void => {
    React.Children.forEach(node, child => {
        if (!React.isValidElement<TreeProps>(child)) {
            return;
        }
        const featureName = child.props.feature ? child.props.feature.name : null;
        entries.push({ typeName: getTypeName(child.type), featureName });
        collectTree(child.props.children, entries);
    });
};

const renderRoot = (): TreeEntry[] => {
    const entries: TreeEntry[] = [];
    collectTree(WebsiteBuilderWorkflows(), entries);
    return entries;
};

const srcDir = import.meta.dirname;

const DELETED_PATHS = [
    "Components/PagesList/PagesListContentReviews.tsx",
    "Components/OptionItem",
    "Components/PageEditor/PageFormWorkflowState.tsx",
    "Components/PageEditor/PageFormWorkflowStateTooltip.tsx",
    "Components/PageEditor/PageFormWorkflowStatePublishButton.tsx",
    "Components/PageEditor/ToggleEditorMode.tsx",
    "presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts",
    "presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts",
    "presentation/page/PageList/TableRowMapperDecorator.ts"
];

const KEPT_PATHS = [
    "Routes/WebsiteBuilderWorkflowsMenu.tsx",
    "Components/PageWorkflows/PageWorkflowsEditorView.tsx",
    "Components/PageEditor/PageEditorConfig.tsx",
    "Components/PageEditor/PageEditorTopBar.tsx",
    "Components/PageEditor/PageEditorLayout.tsx",
    "Components/PageEditor/PageEditorAutoSave.tsx"
];

const OLD_COMPONENTS = ["ListOpenInNewWindow"];

// The route constant `WorkflowStateList` keeps its name (R206), so it is allowed.
const OLD_CODE_PATTERN = /WorkflowState(?!List\b)|workflowState|domain\/events/;

const SHARED_FILES = [
    "index.tsx",
    "types.ts",
    "Components/index.ts",
    "Components/PagesList/PagesList.tsx",
    "presentation/page/PageGet/feature.ts",
    "presentation/page/PageList/feature.ts"
];

describe("app-website-builder-workflows cleanup (R219)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("registers nothing when the feature flag is off", () => {
        flags.enabled = false;

        expect(WebsiteBuilderWorkflows()).toBeNull();
    });

    it("keeps the editor menu and mounts no old component", () => {
        const typeNames = renderRoot().map(entry => entry.typeName);

        expect(typeNames).toContain("WebsiteBuilderWorkflowsMenu");
        expect(typeNames).toContain("PageEditorConfig");
        for (const oldName of OLD_COMPONENTS) {
            expect(typeNames).not.toContain(oldName);
        }
    });

    it.each(DELETED_PATHS)("%s is deleted", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(false);
    });

    it.each(KEPT_PATHS)("%s is kept (editor or rewritten by Tasks 22-23)", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });
});
```

`WebsiteBuilderWorkflows` is a function component whose `PageEditorConfig` name comes from `export const PageEditorConfig = ...` (`Components/PageEditor/PageEditorConfig.tsx`). verify: Tasks 22-23 keep that export name and keep it mounted by the root; if Task 22 wrapped it, assert the name the root really renders.

verify: the walkers above rely on `importOriginal` of `@webiny/app-admin` loading under the jsdom setup Tasks 8, 11 and 12 added (`vitest.config.ts` per package). If those tasks already added a shared mount helper for the flag on/off tests (`git grep -l "advancedPublishingWorkflow" -- 'packages/app-workflows/src/**/*.test.tsx' 'packages/app-headless-cms-workflows/src/**/*.test.tsx' 'packages/app-website-builder-workflows/src/**/*.test.tsx'`), reuse its `vi.mock` block instead of the one above and keep the assertions.

- [ ] **Step 2: Run the tests and expect failure**

Run, one command per file (admin packages: `yarn test` only, there is no `test:os` leg):

```
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -50
```

Expected: each file loads and fails (RED), for the right reasons:
- `app.cleanup.test.tsx`: "registers the kept features and none of the old presenters" fails because `Workflows/WorkflowStatePresenter` (and the list and widget presenters) are registered; "no longer mounts the global Content Reviews route" fails because `ContentReviews` is in the tree; all 19 "is deleted" cases fail (`expected true to be false`); the six "mentions no old review code" cases for `app.tsx`, `index.tsx`, `types.ts`, `features/feature.ts`, `features/graphqlFields.ts` and `domain/index.ts` fail. The flag-off case and the 14 "is kept" cases pass.
- the CMS file: every "is deleted" case fails, and `types.ts` (or `index.tsx`, `features/feature.ts`) fails the pattern while any old import remains; flag-off and "is kept" cases pass. If Tasks 20, 21 and 29 already removed the old components from the root, the "mounts no old component" case already passes: that is fine, the file cases still fail.
- the WB file: "is deleted" cases and the pattern case for `Components/index.ts` (`./OptionItem/index.js`) and `PagesList.tsx` (`PagesListContentReviews`, if still imported) fail.

A failure to import the module (`Cannot find module`, `no export named ... defined on the mock`) is a harness problem, not the expected red: fix the mock as described in Step 1 before going on.

- [ ] **Step 3: Implementation**

**3a. Record the importers before deleting (the safety net).** Run and keep the output; after the deletion Step 3e must show the same files fixed:

```
grep -rlE "presentation/(workflowState|workflowStateList|workflowStatesWidget|shared)|domain/events|~/routes\.js|features/(approveStep|cancelWorkflowState|getTargetWorkflowState|listWorkflowStates|rejectStep|requestReview|startStep|takeOverStep)" packages/app-workflows/src --include='*.ts' --include='*.tsx' | sort
grep -rn "app-workflows" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src packages/app-serverless-cms/src packages/app-admin/src --include='*.ts' --include='*.tsx' | grep -E "WorkflowState|workflowState|domain/events|useWorkflowState|WorkflowStateValue|Components\.(ContentReview|Overlay|Widget|List)|WorkflowStatePresenter" | sort
```

Expected: only files in the delete lists, plus the files this task trims (`app.tsx`, `index.tsx`, `types.ts`, `features/feature.ts`, `features/graphqlFields.ts`, `domain/index.ts`), plus (second command) the old files of the two app packages and `types.ts` of both (see 3d). Any other hit is a live consumer: stop and report it before deleting.

**3b. Delete (`git rm`, from the repository root).**

```
git rm -r -q packages/app-workflows/src/features/approveStep packages/app-workflows/src/features/cancelWorkflowState packages/app-workflows/src/features/getTargetWorkflowState packages/app-workflows/src/features/listWorkflowStates packages/app-workflows/src/features/rejectStep packages/app-workflows/src/features/requestReview packages/app-workflows/src/features/startStep packages/app-workflows/src/features/takeOverStep
git rm -r -q packages/app-workflows/src/presentation/workflowState packages/app-workflows/src/presentation/workflowStateList packages/app-workflows/src/presentation/workflowStatesWidget packages/app-workflows/src/presentation/shared
git rm -q packages/app-workflows/src/presentation/ContentReviews.tsx packages/app-workflows/src/routes.ts
git rm -q packages/app-workflows/src/domain/WorkflowStateModel.ts packages/app-workflows/src/domain/WorkflowStateStepModel.ts packages/app-workflows/src/domain/abstractions/WorkflowStateModel.ts packages/app-workflows/src/domain/abstractions/WorkflowStateStepModel.ts packages/app-workflows/src/domain/events.ts

git rm -r -q packages/app-headless-cms-workflows/src/Components/CmsEntriesWorkflowStateList
git rm -q packages/app-headless-cms-workflows/src/Components/OptionItem/OpenInNewWindow.tsx
git rm -q packages/app-headless-cms-workflows/src/Components/ContentEntryForm/ContentEntryFormWorkflow.tsx packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryFormTooltipButton.tsx packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryFormScheduleMenuItemAction.tsx packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.tsx
git rm -q packages/app-headless-cms-workflows/src/features/WorkflowStateCacheHandler.ts
git rm -q packages/app-headless-cms-workflows/src/presentation/ContentEntryFormPresenterWorkflowDecorator.ts packages/app-headless-cms-workflows/src/presentation/TableRowMapperWorkflowDecorator.ts packages/app-headless-cms-workflows/src/presentation/WorkflowStateGetEntryFieldSelection.ts packages/app-headless-cms-workflows/src/presentation/WorkflowStateListEntriesFieldSelection.ts

git rm -q packages/app-website-builder-workflows/src/Components/PagesList/PagesListContentReviews.tsx
git rm -r -q packages/app-website-builder-workflows/src/Components/OptionItem
git rm -q packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowState.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowStateTooltip.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowStatePublishButton.tsx packages/app-website-builder-workflows/src/Components/PageEditor/ToggleEditorMode.tsx
git rm -q packages/app-website-builder-workflows/src/presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts packages/app-website-builder-workflows/src/presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts packages/app-website-builder-workflows/src/presentation/page/PageList/TableRowMapperDecorator.ts
```

`hooks/usePage.ts` (WB): R219 calls it "replaced", Task 24 lists it as modified. Decide by the importer check, never by assumption:

```
grep -rn "hooks/usePage" packages/app-website-builder-workflows/src
```

No hit: `git rm -q packages/app-website-builder-workflows/src/hooks/usePage.ts`. A hit (for example the rewritten `PageListChangeStatus.tsx`): keep the file, Task 24 modified it on purpose (Contract notes 1).

**3c. Trim the shared `app-workflows` files.**

Replace `packages/app-workflows/src/types.ts` with (the kept editor and permission types; `IGenericMeta`, `IGenericError`, `IIdentity`, `WorkflowStateValue`, `IWorkflowStateStep` and `IWorkflowState` belong to the old review UI, the new types live in `review/domain/`):

```ts
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { ReactElement } from "react";
import { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface IWorkflowApplication {
    id: string;
    icon: ReactElement;
    name: string;
}

export interface IWorkflowStepNotification {
    id: string;
}

export interface IWorkflowStepTeam {
    id: string;
}

export interface IWorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeam>;
    notifications?: IWorkflowStepNotification[];
}

export interface IWorkflowNotificationType {
    id: string;
    title: string;
}

export interface IWorkflow {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStep>;
}

export enum WorkflowsSecurityPermissionAccessLevel {
    NO = "no",
    YES = "yes"
}

export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor: WorkflowsSecurityPermissionAccessLevel;
}
```

Before saving, prove the three removed names have no live user: `grep -rnE "IGenericMeta|IGenericError|IIdentity\b" packages/*/src --include='*.ts' --include='*.tsx' | grep -v "packages/app-workflows/src/types.ts"`. The expected output is empty (the three only served the deleted state models and presenters). A hit outside `types.ts` means a kept file uses the type: keep that interface in `types.ts` and say so in the commit body.

Replace `packages/app-workflows/src/features/graphqlFields.ts` with (`META_FIELDS`, `WORKFLOW_STATE_STEP_FIELDS` and `WORKFLOW_STATE_FIELDS` were used only by the deleted gateways; `ERROR_FIELDS` and `WORKFLOW_FIELDS` by `ListWorkflowsGateway`, `StoreWorkflowGateway`, `DeleteWorkflowGateway` and `ListNotificationTypesGateway`):

```ts
export const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    app
    name
    steps {
        id
        title
        color
        description
        teams {
            id
        }
        notifications {
            id
        }
    }
`;
```

Replace `packages/app-workflows/src/features/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListWorkflowsFeature } from "./listWorkflows/feature.js";
import { StoreWorkflowFeature } from "./storeWorkflow/feature.js";
import { DeleteWorkflowFeature } from "./deleteWorkflow/feature.js";
import { ListNotificationTypesFeature } from "./listNotificationTypes/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container) {
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        ListNotificationTypesFeature.register(container);
    }
});
```

Replace `packages/app-workflows/src/domain/index.ts` with:

```ts
export type { IWorkflowModel } from "./abstractions/WorkflowModel.js";
export type { IWorkflowStepModel } from "./abstractions/WorkflowStepModel.js";
export { WorkflowModel } from "./WorkflowModel.js";
export { WorkflowStepModel } from "./WorkflowStepModel.js";
```

`packages/app-workflows/src/app.tsx`: the old registrations go; the lines Tasks 10, 13, 15-18, 25, 27, 34 added (the `review/...` feature imports and their `<RegisterFeature>` lines) stay untouched. Remove exactly these lines:

```diff
-import { WorkflowStatePresenterFeature } from "~/presentation/workflowState/feature.js";
-import { WorkflowStateListPresenterFeature } from "~/presentation/workflowStateList/feature.js";
-import { WorkflowStatesWidgetPresenterFeature } from "~/presentation/workflowStatesWidget/feature.js";
-import { ContentReviews } from "~/presentation/ContentReviews.js";
```

```diff
-            <RegisterFeature feature={WorkflowStatePresenterFeature} />
-            <RegisterFeature feature={WorkflowStateListPresenterFeature} />
-            <RegisterFeature feature={WorkflowStatesWidgetPresenterFeature} />
```

```diff
-            <ContentReviews />
```

What stays in the root: `WorkflowsPermissionsFeature`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature`, `SecurityPermissions` and every `review/` feature, all inside the existing `advancedPublishingWorkflow` gate (R211).

`packages/app-workflows/src/index.tsx`: remove the old exports and imports; keep every line Tasks 8-34 added. Remove exactly these lines:

```diff
-import { WorkflowStateOptionsOpenInNewWindow } from "~/presentation/shared/index.js";
-import {
-    WorkflowStatesOwnWidget,
-    WorkflowStatesRequestedWidget
-} from "./presentation/workflowStatesWidget/components/index.js";
-
-import { WorkflowStateListAppOverlay } from "./presentation/workflowStateList/components/Overlay/WorkflowStateListAppOverlay.js";
-import { WorkflowStateBar } from "./presentation/workflowState/components/Bar/WorkflowStateBar.js";
-import { WorkflowStateOverlay } from "./presentation/workflowState/components/Overlay/WorkflowStateOverlay.js";
-import { WorkflowStateTooltip } from "./presentation/workflowState/components/Tooltip/WorkflowStateTooltip.js";
```

```diff
-export { useWorkflowState } from "./presentation/workflowState/useWorkflowState.js";
-export type { IWorkflowApplication, IWorkflowState } from "~/types.js";
-export { WorkflowStateValue } from "~/types.js";
+export type { IWorkflowApplication } from "~/types.js";
```

```diff
-export { WorkflowStatePresenterFeature } from "./presentation/workflowState/feature.js";
-export { WorkflowStatePresenter } from "./presentation/workflowState/abstractions.js";
-export type { IWorkflowStatePresenter } from "./presentation/workflowState/abstractions.js";
-export { WorkflowStateListPresenterFeature } from "./presentation/workflowStateList/feature.js";
-export { WorkflowStatesWidgetPresenterFeature } from "./presentation/workflowStatesWidget/feature.js";
```

and replace the `Components` object by (the editor views of both apps use only `Components.Admin.WorkflowsEditor` and `Components.Permissions.HasWorkflowsEditorPermission`; everything else of the old object moved to named exports in Tasks 14-28):

```diff
 export const Components = {
-    ContentReview: {
-        WorkflowStateTooltip,
-        WorkflowStateOverlay,
-        WorkflowStateBar
-    },
     Permissions: {
         HasWorkflowsEditorPermission
     },
     Admin: {
         WorkflowsEditor
-    },
-    Overlay: {
-        WorkflowStateListAppOverlay
-    },
-    Widget: {
-        OwnWidget: WorkflowStatesOwnWidget,
-        RequestedWidget: WorkflowStatesRequestedWidget
-    },
-    List: {
-        Options: {
-            OpenInNewWindow: WorkflowStateOptionsOpenInNewWindow
-        }
     }
 };
```

Keep `export { WorkflowsAdminApp } from "./app.js";`, `export { useCanUseWorkflows } ...`, `export { useWorkflowsPermission } ...`, `export { WorkflowsFeature } ...`, `export { WorkflowsEditorPresenterFeature } ...`, `export { WorkflowsPermissionsFeature } ...` and the `WorkflowsEditor` and `HasWorkflowsEditorPermission` imports.

**3d. The two app packages.**

`packages/app-website-builder-workflows/src/Components/index.ts`:

```diff
-export * from "./OptionItem/index.js";
 export * from "./PageEditor/PageEditorConfig.js";
 export * from "./PagesList/index.js";
```

`packages/app-website-builder-workflows/src/Components/PagesList/PagesList.tsx` (only if Task 30 left the old mounting; if the file no longer imports `PagesListContentReviews`, there is nothing to do, and the Task 30 sidebar item stays wherever Task 30 mounted it):

```diff
-import { PagesListContentReviews } from "./PagesListContentReviews.js";
```

```diff
-            {/* Add a Content Reviews button to footer in sidebar  */}
-            <PagesListContentReviews />
```

Conditional hunks, applied only for what the 3a second grep and the Step 4 test still report (Tasks 20, 21, 24, 29 and 30 were told to stop mounting these, so most are already gone):

- `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/index.ts` still exporting the four deleted components: replace it with the Task 20 components (names from Task 20: `CmsEntryReviewBar`, `CmsEntryReviewTooltip`, `CmsEntryReviewScheduleMenuItem`, `CmsEntryReviewNewRevision`):

  ```ts
  export { CmsEntryReviewBar } from "./CmsEntryReviewBar.js";
  export { CmsEntryReviewTooltip } from "./CmsEntryReviewTooltip.js";
  export { CmsEntryReviewScheduleMenuItem } from "./CmsEntryReviewScheduleMenuItem.js";
  export { CmsEntryReviewNewRevision } from "./CmsEntryReviewNewRevision.js";
  ```

  If Task 20 wrote its own `index.ts` already, only confirm that no old export line remains.
- `packages/app-headless-cms-workflows/src/index.tsx` still importing or rendering `ContentEntryFormWorkflow`, `CmsEntryFormTooltipButton`, `CmsEntryFormScheduleMenuItemAction`, `CmsEntryFormCreateNewRevisionButton`, `CmsEntriesWorkflowStateListFooterMenu` or `ListOpenInNewWindow` (the old `~/Components/OptionItem/OpenInNewWindow.js` import): delete those imports and their JSX elements; each has a Task 20 or Task 29 replacement mounted next to it.
- `packages/app-headless-cms-workflows/src/types.ts` and `packages/app-website-builder-workflows/src/types.ts` still importing `WorkflowStateValue` from `@webiny/app-workflows/types.js` (Tasks 21 and 24 re-read these files; if they retyped them, nothing to do). Fallback, using the shared `SystemWorkflowValue` of Task 8 (exported from the `@webiny/app-workflows` barrel by Task 10), CMS:

  ```ts
  import type { SystemWorkflowValue } from "@webiny/app-workflows";

  export interface ICmsEntrySystemWithWorkflow {
      workflow?: SystemWorkflowValue | null;
  }
  ```

  and WB (`IPageWorkflowState` becomes `SystemWorkflowValue`):

  ```ts
  import type { SystemWorkflowValue } from "@webiny/app-workflows";

  export type WithWorkflows<T> = T & {
      workflow: SystemWorkflowValue | null;
  };

  declare module "@webiny/app-website-builder/types.js" {
      export interface WbPageSystem {
          workflow: SystemWorkflowValue | null;
      }
  }
  ```

  Check `grep -rn "ICmsEntryWorkflowState\|IPageWorkflowState" packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src` first and update any user of the removed interface names.

`packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx`: the two `@see` lines point to bar files that no longer exist. Replace the header comment:

```diff
 /**
  * Component is used to display something that you want to be hidden to everyone except Webiny team.
- * Example usage is in Workflow State Bar, where we need some button to be present only while developing the feature - and debugging.
- * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarApproved.tsx
- * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarRejected.tsx
+ * Example usage is a debugging action that must be present only while a feature is being developed.
  */
```

**3e. Sweep, then dependencies.**

```
grep -rnE "WorkflowState|workflowState|app-workflows/domain/events|Workflows/ContentReviews" packages/app-*/src packages/app/src | grep -vE "WorkflowStateList\b" 
```

Expected: no output. (`WorkflowStateList` is the kept route constant and route name of the two app packages, R206; the filter drops only those lines.) Any other line is an import of a deleted path or a stale comment: fix it at the source. Then:

```
grep -rn "app-workflows" packages/app-serverless-cms/src
```

Expected: only `import { WorkflowsAdminApp } from "@webiny/app-workflows";` (`Admin.tsx`, still valid).

Dependencies: do not edit `package.json` by hand. Run `yarn adio` in Step 6 and accept its result. The expected effect on `packages/app-workflows/package.json` is that `lodash` goes (its only user was the deleted `WorkflowStateListAppOverlayView.tsx`, unless Task 26 imports `debounce` from it, in which case adio keeps it), while `@webiny/app-websockets` (Task 28), `@webiny/di`, `vitest` and `@testing-library/react` (Tasks 8, 28) stay. For the two app packages adio may drop `react-helmet` or `mobx-react-lite` and a dependency only the deleted files used; it must never remove `@webiny/app-workflows` from them. Review the `git diff -- '*/package.json'` before the commit: a removal of a package some kept file imports means a kept file was missed by Step 3e.

- [ ] **Step 4: Run the tests and expect pass**

```
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
```

Expected: all three green (19 deleted, 14 kept and 6 shared-file cases for `app-workflows`; the CMS and WB files green with their own counts).

- [ ] **Step 5: Run the existing tests covering the changed code, the type check and the builds**

Every earlier task's co-located tests that mount a root or import a trimmed barrel, one command per file:

```
git grep -l "advancedPublishingWorkflow" -- 'packages/app-workflows/src/**/*.test.ts*' 'packages/app-headless-cms-workflows/src/**/*.test.ts*' 'packages/app-website-builder-workflows/src/**/*.test.ts*'
```

Run `yarn test <path> 2>&1 | tail -30` for each file the command prints (the flag on/off tests of Tasks 10, 11, 12, 20-24, 29, 30, 34-36), then the pure and presenter tests that import `~/types.js` or the barrel:

```
git grep -l "~/types.js\|from \"~/index.js\"" -- 'packages/app-workflows/src/**/*.test.ts*'
```

All green, none edited to pass. Type check (the tests of all three packages and `app-admin`'s touched file):

```
yarn check:test:types -p packages/app-workflows --report cli 2>&1 | tail -40
yarn check:test:types -p packages/app-headless-cms-workflows --report cli 2>&1 | tail -40
yarn check:test:types -p packages/app-website-builder-workflows --report cli 2>&1 | tail -40
```

No errors. Builds, including the old editor which must still compile (R219) and the package that mounts all three roots:

```
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-serverless-cms --no-cache 2>&1 | tail -30
```

All green. If a build fails on a missing module, the message names a deleted path a kept file still imports: fix that import (3e), do not restore the file.

- [ ] **Step 6: Pre-commit chain and commit**

```
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
git diff -- 'packages/app-workflows/package.json' 'packages/app-headless-cms-workflows/package.json' 'packages/app-website-builder-workflows/package.json'
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-serverless-cms --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): delete the old admin review UI" -m "Removes the old review presenters, dialogs, widgets, list, gateways, WorkflowState models and WorkflowStateChangedEvent from app-workflows, the old editor decorators, cache handler and mounting components from app-headless-cms-workflows and app-website-builder-workflows, and the global Workflows/ContentReviews route (R219). Kept for 9a and 9c: the workflow editor, notification types, permissions and the editor routes and views. Adds composition tests for the three gated roots." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

If any step of the chain fails and you fix something, rerun the whole chain from the first line. Do not commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`.

**Done-when check for this task (run after the commit, expected output in brackets):**

```
grep -rnE "WorkflowState|workflowState|app-workflows/domain/events|Workflows/ContentReviews" packages/app-*/src packages/app/src | grep -vE "WorkflowStateList\b"   [no output]
yarn adio                                                                                                                          [passes]
yarn check-ts-configs                                                                                                              [passes]
```

**Contract notes:**
1. R219 says `hooks/usePage.ts` (WB) is deleted ("replaced") while Task 24's Files list modifies it (`PageListChangeStatus.tsx` imports it). This task deletes it only when no file imports it (Step 3b); otherwise it stays, rewritten by Task 24.
2. `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` is not in the contract's Files list for Task 37, but its two `@see` lines name deleted files and the overview's grep for `WorkflowState` in `packages/app-*/src` would find them. The edit is comment-only (the developer-mode "Remove review request" action itself is out of 8a, "Not in this phase").
3. The overview's "Done when" grep (`WorkflowState` in `packages/app-*/src`) also matches the route constants `Routes.ContentEntries.ContentReviews` name string `"Cms/ContentEntries/WorkflowStateList"` and `Routes.Pages.WorkflowStateList`, which R206 keeps unchanged and Tasks 22, 29 and 30 use. The commands and tests above therefore allow `WorkflowStateList` as a whole word and nothing else; renaming the routes would be a separate ruling.
4. The old `Components.Overlay`, `Components.Widget` and `Components.List` entries of the `@webiny/app-workflows` barrel are removed; their only consumers were the deleted old files of the two app packages (3a second grep proves it). If that grep shows another consumer, stop and report it.
5. `Components.ContentReview.*`, `useWorkflowState`, `WorkflowStatePresenter` and `WorkflowStateValue` leave the public barrel; the three packages are not published outside this monorepo's unreleased rewrite, so no compatibility shim is added.
6. The composition tests (`*.cleanup.test.tsx`) call the three roots as functions with `useFeatureFlags` mocked; they carry a small test-only element walker that is repeated in each package (test code, not production logic). verify: that `@webiny/app-admin`'s barrel loads under each package's jsdom `vitest.config.ts` (the flag on/off tests of Tasks 10-12 rely on the same), and the rendered component names `CmsWorkflowsEditor`, `WebsiteBuilderWorkflowsMenu`, `PageEditorConfig` (as exported today, not renamed by Tasks 20-23).
7. The hunks for `app.tsx` and `index.tsx` are written against the pre-8a text of those files; Tasks 10-34 add lines to both, so every hunk is a removal and line numbers will have drifted.
8. Size: a deletion of about 190 files plus six small file rewrites; the one step with judgement is the 3a/3e importer check, which is why it is a hard stop rather than a fix-up.
