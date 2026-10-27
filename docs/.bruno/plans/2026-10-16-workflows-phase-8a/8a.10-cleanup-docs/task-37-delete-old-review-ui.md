### Task 37: Delete the old review UI

R219 (delete and keep lists), R211, R202; Review Focus 15 ("deleting the old UI breaks the build or removes something kept for 9a/9c"); Roadmap row 8a ("delete the old admin review UI"). Every task before this one built and mounted the replacement (Tasks 10-36), so the old review code is now unreferenced from the mounted roots. This task deletes exactly what R219 lists, trims the shared files that carried both halves (`types.ts`, `graphqlFields.ts`, `features/feature.ts`, `domain/index.ts`, the barrels, `app.tsx`), edits each `package.json` by hand for what `yarn adio` reports, and proves with composition tests, file checks, greps and builds that nothing live imports a deleted path and that the old workflow editor (kept for 9a, 9c) still compiles.

- **Deleted in `packages/app-workflows/src`:** `features/{approveStep,cancelWorkflowState,getTargetWorkflowState,listWorkflowStates,rejectStep,requestReview,startStep,takeOverStep}/`; `presentation/{workflowState,workflowStateList,workflowStatesWidget,shared}/`; `presentation/ContentReviews.tsx`; `routes.ts` (its one route, `Workflows/ContentReviews` at `/workflows/content-reviews`, is replaced by the per-app routes of Tasks 29-30, R206); `domain/WorkflowStateModel.ts`, `domain/WorkflowStateStepModel.ts`, `domain/abstractions/WorkflowStateModel.ts`, `domain/abstractions/WorkflowStateStepModel.ts`, `domain/events.ts` (`WorkflowStateChangedEvent`, replaced by `ReviewChangedEvent`, R213).
- **Trimmed in `packages/app-workflows/src`:** `index.tsx`, `app.tsx`, `types.ts`, `features/graphqlFields.ts` (`ERROR_FIELDS` and `WORKFLOW_FIELDS` stay, four kept gateways import them), `features/feature.ts`, `domain/index.ts`.
- **Deleted in `packages/app-headless-cms-workflows/src`:** `Components/CmsEntriesWorkflowStateList/`, `Components/OptionItem/OpenInNewWindow.tsx`, `Components/ContentEntryForm/{ContentEntryFormWorkflow,CmsEntryFormTooltipButton,CmsEntryFormScheduleMenuItemAction,CmsEntryFormCreateNewRevisionButton}.tsx`, `features/WorkflowStateCacheHandler.ts`, `presentation/{ContentEntryFormPresenterWorkflowDecorator,TableRowMapperWorkflowDecorator,WorkflowStateGetEntryFieldSelection,WorkflowStateListEntriesFieldSelection}.ts`.
- **Deleted in `packages/app-website-builder-workflows/src`:** `Components/PagesList/PagesListContentReviews.tsx`, `Components/OptionItem/`, `Components/PageEditor/{PageFormWorkflowState,PageFormWorkflowStateTooltip,PageFormWorkflowStatePublishButton,ToggleEditorMode}.tsx`, `presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts`, `presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts` (`TableRowMapperDecorator.ts` is already deleted by Task 24; `ToggleEditorMode.tsx` is deleted here, Task 22 only stops mounting it). `hooks/usePage.ts` is **kept**: Task 24 left its code unchanged and `PageListChangeStatus.tsx` imports it.
- **Kept until 9a/9c (must survive):** in `app-workflows`: `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes,permissions}/`, `presentation/{workflowsEditor,permissions}/**`, `domain/{WorkflowModel,WorkflowStepModel}.ts` and their `abstractions/` twins, `domain/{index,permissionsSchema}.ts`, `hooks/canUseWorkflows.ts`, the `WorkflowsAdminApp` permission and editor registrations; in the apps the editor routes and views (`Routes/CmsWorkflowsEditor.tsx`, `presentation/CmsWorkflowsEditorView.tsx`, `presentation/cmsWorkflowsEditor/*`, `Routes/WebsiteBuilderWorkflowsMenu.tsx`, `Components/PageWorkflows/*`). The WB files `PageEditorConfig.tsx`, `PageEditorTopBar.tsx`, `PageEditorLayout.tsx`, `PageEditorAutoSave.tsx` are kept by name (rewritten by Tasks 22-23).
- **Also fixed:** `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` carries two `@see` lines that name deleted bar files (Contract notes 2).
- **Not changed:** the `exports` map of the three `package.json` files (`".": "./index.js"`, `"./*": "./*"` already cover everything); only `dependencies` change, edited by hand for every unused or missing dependency `yarn adio` reports (adio only reports).

**Files:**
- Create: `packages/app-workflows/src/app.cleanup.test.tsx`
- Create: `packages/app-headless-cms-workflows/src/index.cleanup.test.tsx`
- Create: `packages/app-website-builder-workflows/src/index.cleanup.test.tsx`
- Delete: the lists above (Step 3, one `git rm` block per package)
- Modify (full replacement): `packages/app-workflows/src/types.ts`, `packages/app-workflows/src/features/graphqlFields.ts`, `packages/app-workflows/src/features/feature.ts`, `packages/app-workflows/src/domain/index.ts`
- Modify (removal hunks): `packages/app-workflows/src/app.tsx`, `packages/app-workflows/src/index.tsx`, `packages/app-headless-cms-workflows/src/index.tsx` (the old `ListOpenInNewWindow`), `packages/app-headless-cms-workflows/src/types.ts` (the two old interfaces), `packages/app-website-builder-workflows/src/index.tsx` (the old `ListOpenInNewWindow`), `packages/app-website-builder-workflows/src/Components/index.ts`, `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx`
- Modify (remove the mocks of the deleted modules, exact hunks in Step 3d): `packages/app-workflows/src/app.test.tsx` (Task 10), `packages/app-headless-cms-workflows/src/index.test.tsx` (Task 11), `.../src/index.editor.test.tsx` (Task 20), `.../src/index.lists.test.tsx` (Task 21), `packages/app-website-builder-workflows/src/index.test.tsx` (Task 12), `.../src/editorGlue.wiring.test.tsx` (Task 22), `.../src/publishAutosave.wiring.test.tsx` (Task 23), `.../src/pageListGlue.wiring.test.tsx` (Task 24)
- Not modified (done by earlier tasks): `Components/ContentEntryForm/index.ts` and `presentation/feature.ts` of the CMS package (Task 20), `Components/PagesList/PagesList.tsx` (Task 30), WB `types.ts`, `PageListChangeStatus.tsx`, the two `PageList`/`PageGet` `feature.ts` files (Task 24)
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
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
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
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
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
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
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
    "presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts"
];

const KEPT_PATHS = [
    "Routes/WebsiteBuilderWorkflowsMenu.tsx",
    "Components/PageWorkflows/PageWorkflowsEditorView.tsx",
    "Components/PageEditor/PageEditorConfig.tsx",
    "Components/PageEditor/PageEditorTopBar.tsx",
    "Components/PageEditor/PageEditorLayout.tsx",
    "Components/PageEditor/PageEditorAutoSave.tsx",
    "hooks/usePage.ts"
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
- the WB file: the "is deleted" cases and the pattern case for `Components/index.ts` (`./OptionItem/index.js`) fail. The old `TableRowMapperDecorator.ts` and the `PagesList.tsx` mounting are already gone (Tasks 24 and 30), so they are not in the lists.

A failure to import the module (`Cannot find module`, `no export named ... defined on the mock`) is a harness problem, not the expected red: fix the mock as described in Step 1 before going on.

- [ ] **Step 3: Implementation**

**3a. Record the importers before deleting (the safety net).** Run and keep the output; after the deletion Step 3e (which runs after 3d) must show the same files fixed:

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
git rm -q packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowState.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowStateTooltip.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageFormWorkflowStatePublishButton.tsx
git rm -q --ignore-unmatch packages/app-website-builder-workflows/src/Components/PageEditor/ToggleEditorMode.tsx
git rm -q packages/app-website-builder-workflows/src/presentation/page/PageGet/WorkflowStatesGetPageGraphQLFieldSelection.ts packages/app-website-builder-workflows/src/presentation/page/PageList/WorkflowStateListPagesFieldSelection.ts
```

`hooks/usePage.ts` (WB) is not deleted: Task 24 keeps its code and `PageListChangeStatus.tsx` imports it (the WB cleanup test lists it as kept). `ToggleEditorMode.tsx` is removed with `--ignore-unmatch` above because Task 22 only stops mounting it (its text says "deleted in Task 37") while the coordinator's note says Task 22 deletes it; both orders work.

**3c. Trim the shared `app-workflows` files.** Before rewriting `types.ts`, prove nothing that remains uses the dropped types (the only users of `WorkflowStateValue`, `IWorkflowStateStep`, `IWorkflowState` and `IIdentity` were the deleted files, `routes.ts` and the deleted `workflowStatesWidget` row component; Tasks 8-36 write none, the `review/` tree has its own types):

```
grep -rnE "WorkflowStateValue|IWorkflowStateStep|IWorkflowState\b|IIdentity|WORKFLOW_STATE_STEP_FIELDS|WORKFLOW_STATE_FIELDS" packages/*/src --include='*.ts' --include='*.tsx' | grep -v "\.cleanup\.test\.tsx" | sort
```

Expected, run after 3b: only the two files this step rewrites (`packages/app-workflows/src/types.ts`, `packages/app-workflows/src/features/graphqlFields.ts`) and `packages/app-headless-cms-workflows/src/types.ts` (fixed in 3d). Any other hit is a live consumer: stop and report it. Also check the sibling task files: `grep -rnE "IIdentity|WorkflowStateValue|IWorkflowState\b|WORKFLOW_STATE_" docs/.bruno/plans/2026-10-16-workflows-phase-8a --include='*.md' | grep -v 8a.10-cleanup-docs` prints only the note lines of Task 8 about `graphqlFields.ts` (no code that imports them). `META_FIELDS` is dropped too: its only user was `ListWorkflowStatesGateway` (deleted), and the review gateways of Task 8 define their own fields.

Replace `packages/app-workflows/src/types.ts` with:

```ts
import type { GenericRecord } from "@webiny/app/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import type { ReactElement } from "react";
import { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface IGenericMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface IGenericError {
    message: string;
    code: string | null;
    data?: GenericRecord;
    stack?: string;
}

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

(dropped: `WorkflowStateValue`, `IWorkflowStateStep`, `IWorkflowState` and `IIdentity`, whose only users were the deleted files.)

Replace `packages/app-workflows/src/features/graphqlFields.ts` with (the four kept gateways import `ERROR_FIELDS` and `WORKFLOW_FIELDS`: `ListWorkflowsGateway` and `StoreWorkflowGateway` both, `ListNotificationTypesGateway` and `DeleteWorkflowGateway` `ERROR_FIELDS`):

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

`packages/app-workflows/src/app.tsx` (removal hunks; Tasks 10-34 added review imports and `RegisterFeature` lines around these, all stay; `WorkflowsPermissionsFeature`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature` and `SecurityPermissions` stay):

```diff
-import { WorkflowStatePresenterFeature } from "~/presentation/workflowState/feature.js";
-import { WorkflowStateListPresenterFeature } from "~/presentation/workflowStateList/feature.js";
-import { WorkflowStatesWidgetPresenterFeature } from "~/presentation/workflowStatesWidget/feature.js";
```

```diff
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

`packages/app-workflows/src/index.tsx` (removal hunks; no 8a task adds to this file (R-k); `export { WorkflowsAdminApp } from "./app.js";`, the `WorkflowsEditor` and `HasWorkflowsEditorPermission` imports, `useCanUseWorkflows`, `useWorkflowsPermission`, `WorkflowsFeature`, `WorkflowsEditorPresenterFeature` and `WorkflowsPermissionsFeature` stay):

```diff
-import { WorkflowStateOptionsOpenInNewWindow } from "~/presentation/shared/index.js";
-import {
-    WorkflowStatesOwnWidget,
-    WorkflowStatesRequestedWidget
-} from "./presentation/workflowStatesWidget/components/index.js";
-
-import { WorkflowStateListAppOverlay } from "./presentation/workflowStateList/components/Overlay/WorkflowStateListAppOverlay.js";
 export { WorkflowsAdminApp } from "./app.js";
-import { WorkflowStateBar } from "./presentation/workflowState/components/Bar/WorkflowStateBar.js";
-import { WorkflowStateOverlay } from "./presentation/workflowState/components/Overlay/WorkflowStateOverlay.js";
-import { WorkflowStateTooltip } from "./presentation/workflowState/components/Tooltip/WorkflowStateTooltip.js";
```

(the `export { WorkflowsAdminApp } from "./app.js";` line sits between the overlay import and the `WorkflowStateBar` import in the real file and is kept, shown here as a context line so the hunk applies literally)

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

and inside `export const Components = { ... }`:

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

If a task before this one already appended an entry to `Components` (re-read the object first), keep it and fix the trailing comma of the entry before it; the object then has no comma after its last entry.

`packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` (the two `@see` lines name deleted files; point them at the new bars):

```diff
- * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarApproved.tsx
- * @see packages/app-workflows/src/Components/WorkflowState/Bar/Bars/WorkflowStateBarRejected.tsx
+ * @see packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.tsx
+ * @see packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx
```

Also in the same comment, the sentence "Example usage is in Workflow State Bar" becomes "Example usage is in the review bars":

```diff
- * Example usage is in Workflow State Bar, where we need some button to be present only while developing the feature - and debugging.
+ * Example usage is in the review bars, where we need some button to be present only while developing the feature - and debugging.
```

verify: `grep -n "WorkflowState\|Workflow State" packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` prints nothing after the edit.

**3d. The two app packages.**

`packages/app-website-builder-workflows/src/Components/index.ts`:

```diff
-export * from "./OptionItem/index.js";
 export * from "./PageEditor/PageEditorConfig.js";
 export * from "./PagesList/index.js";
```

`packages/app-headless-cms-workflows/src/index.tsx`: Tasks 20 and 29 already replaced the form components and the footer menu; the old `ListOpenInNewWindow` row action is the one old child left (its replacement is the per-row link of Task 25's list, R206). Remove:

```diff
-import { ListOpenInNewWindow } from "~/Components/OptionItem/OpenInNewWindow.js";
```

```diff
-            <ListOpenInNewWindow />
```

`packages/app-headless-cms-workflows/src/types.ts` (Task 21 added `ICmsEntrySystemWithReview` and `ICmsEntryMetaWithReview` and kept the two old interfaces for the old files): remove the old import and interfaces, keep the rest.

```diff
-import type { WorkflowStateValue } from "@webiny/app-workflows/types.js";
-
-export interface ICmsEntryWorkflowState {
-    workflowId: string;
-    stepId: string;
-    stepName: string;
-    state: WorkflowStateValue;
-}
-
-export interface ICmsEntrySystemWithWorkflow {
-    workflow?: ICmsEntryWorkflowState | null;
-}
-
```

(the file then starts with Task 21's two `import type` lines; check with `grep -rn "ICmsEntryWorkflowState\|ICmsEntrySystemWithWorkflow" packages/app-headless-cms-workflows/src` that no user is left: the deleted `TableRowMapperWorkflowDecorator.ts` and `WorkflowStateCacheHandler.ts` were the only ones.)

`packages/app-website-builder-workflows/src/index.tsx`: remove the old row action (its import is part of the `~/Components/index.js` import list; re-read the line first, Tasks 22 and 30 may have reformatted it):

```diff
-import { ListOpenInNewWindow, PageEditorConfig, PagesList } from "~/Components/index.js";
+import { PageEditorConfig, PagesList } from "~/Components/index.js";
```

```diff
-            <ListOpenInNewWindow />
```

`packages/app-website-builder-workflows/src/Components/index.ts` (above) drops the `OptionItem` export. `PagesList.tsx` (Task 30), WB `types.ts` and the two feature files (Task 24) and the CMS `ContentEntryForm/index.ts` and `presentation/feature.ts` (Task 20) are not touched here: the cleanup tests pin that they hold no old code.

**Mocks of the deleted modules.** `vi.mock` of a path that no longer exists is a stale mock (it hides nothing and breaks the next reader). Remove these blocks, each only if present as written by the producing task; every other mock stays:

- `packages/app-workflows/src/app.test.tsx` (Task 10): remove this block and the blank line that follows it (the new `~/Components/ContentReviews/*` mounts, if mocked by Tasks 28-30, stay):

```tsx
vi.mock("~/presentation/ContentReviews.js", () => {
    return { ContentReviews: () => null };
});

```
- `packages/app-headless-cms-workflows/src/index.test.tsx`, `index.editor.test.tsx`, `index.lists.test.tsx`: `vi.mock("~/Components/OptionItem/OpenInNewWindow.js", () => { return { ListOpenInNewWindow: () => null }; });`.
- `packages/app-website-builder-workflows/src/index.test.tsx`: the line `        ListOpenInNewWindow: () => null,` inside `vi.mock("~/Components/index.js", ...)`.
- `packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx`, `publishAutosave.wiring.test.tsx`, `pageListGlue.wiring.test.tsx`: `vi.mock("~/Components/OptionItem/index.js", () => { return { ListOpenInNewWindow: () => null }; });`.

Then `grep -rn "OptionItem\|presentation/ContentReviews\.js\|CmsEntriesWorkflowStateList\|PagesListContentReviews\|CmsEntryFormCreateNewRevisionButton" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src` must print nothing (a stale mock of another deleted module, left by an earlier task, is removed the same way).

**3e. Importer check after the deletion (the hard stop; runs after 3d, because 3d fixes the two app packages this check covers).** Re-run the greps of 3a with the patterns that name a package-local path (`~/routes\.js`, `domain/events`) scoped to `packages/app-workflows/src` (other packages have their own `routes.ts` and event folders), the deep imports of those two paths from every other package, and the repository-wide check, with the test files of this task excluded:

```
grep -rlE "presentation/(workflowState|workflowStateList|workflowStatesWidget|shared)|features/(approveStep|cancelWorkflowState|getTargetWorkflowState|listWorkflowStates|rejectStep|requestReview|startStep|takeOverStep)|domain/(WorkflowStateModel|WorkflowStateStepModel)|presentation/ContentReviews\.js" packages/*/src --include='*.ts' --include='*.tsx' --exclude='*.cleanup.test.tsx' | sort
grep -rlE "domain/events|~/routes\.js" packages/app-workflows/src --include='*.ts' --include='*.tsx' --exclude='*.cleanup.test.tsx' | sort
grep -rlE "@webiny/app-workflows/(domain/events|routes)" packages/*/src --include='*.ts' --include='*.tsx' --exclude='*.cleanup.test.tsx' | sort
grep -rnE "WorkflowState|workflowState|useWorkflowState|Components\.(ContentReview|Overlay|Widget|List)\b" packages/*/src --include='*.ts' --include='*.tsx' --exclude='*.cleanup.test.tsx' | grep -vE "WorkflowStateList\b" | grep -v workflowStateTooltip | sort
```

(`workflowStateTooltip` is the old test id Task 20's negative assertions look for, so those assertions are the one allowed match besides `WorkflowStateList`.)

Expected: no output from any of them. Fix loop for every hit, one file at a time: (1) a hit in a kept file is an import or reference of a deleted module: remove the import and the code that used it if that code was old review UI (an earlier task should already have replaced it; if it is live code with no replacement, stop and report, do not restore the deleted file); (2) a hit in a test file is a stale mock or assertion of a deleted module: remove it as in the mocks list above; (3) re-run all the greps until empty, then Step 4. The whole word `WorkflowStateList` (route constants of R206) is the only allowed match.

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

All green, none edited to pass. The type check of these packages is their build (R-e: `yarn build -p`, there is no separate test-type command), run next. Builds (the type check), including the old editor which must still compile (R219) and the package that mounts all three roots:

```
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-serverless-cms --no-cache 2>&1 | tail -30
```

All green. If a build fails on a missing module, the message names a deleted path a kept file still imports: fix that import (Step 3e), do not restore the file.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (it stages everything with `git add .`) and restore `.gitleaks.toml` after format and after build:

```
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
git diff -- 'packages/app-workflows/package.json' 'packages/app-headless-cms-workflows/package.json' 'packages/app-website-builder-workflows/package.json'
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-serverless-cms --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "refactor(app-workflows): delete the old admin review UI" -m "Removes the old review presenters, dialogs, widgets, list, gateways, WorkflowState models and WorkflowStateChangedEvent from app-workflows, the old editor decorators, cache handler and mounting components from app-headless-cms-workflows and app-website-builder-workflows, and the global Workflows/ContentReviews route (R219). Kept for 9a and 9c: the workflow editor, notification types, permissions and the editor routes and views. Adds composition tests for the three gated roots." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

`yarn adio` only reports. For every unused or missing dependency it prints for the three packages (expected: `@webiny/app-workflows` may lose nothing, the two app packages may lose entries only the deleted files used), edit that `package.json` by hand (`dependencies` only, no `exports` change), run `yarn` again and rerun `yarn adio` until it passes.

If any step of the chain fails and you fix something, rerun the whole chain from the first line. Do not commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`.

**Done-when check for this task (run after the commit, expected output in brackets):**

```
grep -rnE "WorkflowState|workflowState|app-workflows/domain/events|Workflows/ContentReviews" packages/app-*/src packages/app/src --exclude='*.cleanup.test.tsx' | grep -vE "WorkflowStateList\b" | grep -v workflowStateTooltip   [no output]
yarn adio                                                                                                                          [passes]
yarn check-ts-configs                                                                                                              [passes]
```

**Contract notes:**
1. R219 lists `hooks/usePage.ts` (WB) as "replaced"; Task 24 keeps its code (the contract entry of Task 24 is the later word), so it stays and the cleanup test pins it as kept. R219's `ToggleEditorMode.tsx` is deleted here (`git rm --ignore-unmatch`: Task 22's text leaves it to Task 37).
2. `packages/app-admin/src/components/DeveloperMode/DeveloperMode.tsx` is not in the contract's Files list for Task 37, but its two `@see` lines name deleted files and the overview's grep for `WorkflowState` in `packages/app-*/src` would find them. The edit is comment-only (the developer-mode "Remove review request" action itself is out of 8a, "Not in this phase").
3. The overview's "Done when" grep (`WorkflowState` in `packages/app-*/src`) also matches the route constants `Routes.ContentEntries.ContentReviews` name string `"Cms/ContentEntries/WorkflowStateList"` and `Routes.Pages.WorkflowStateList`, which R206 keeps unchanged and Tasks 22, 29 and 30 use. The commands and tests above therefore allow `WorkflowStateList` as a whole word and nothing else; renaming the routes would be a separate ruling.
4. The old `Components.Overlay`, `Components.Widget` and `Components.List` entries of the `@webiny/app-workflows` barrel are removed; their only consumers were the deleted old files of the two app packages (3a second grep proves it). If that grep shows another consumer, stop and report it.
5. `Components.ContentReview.*`, `useWorkflowState`, `WorkflowStatePresenter` and `WorkflowStateValue` leave the public barrel; the three packages are not published outside this monorepo's unreleased rewrite, so no compatibility shim is added.
6. The composition tests (`*.cleanup.test.tsx`) call the three roots as functions with `useFeatureFlags` mocked; they carry a small test-only element walker that is repeated in each package (test code, not production logic). The tests import the real roots (module imports only, nothing is rendered), so they need the DOM setup and svg alias of Task 14 (`app-workflows`), Task 20 (`app-headless-cms-workflows`) and Task 22 (`app-website-builder-workflows`); verify: that `@webiny/app-admin`'s barrel loads under each package's jsdom `vitest.config.ts` (the flag on/off tests of Tasks 10-12 rely on the same, and Tasks 20-30 add `vi.mock` stubs for the shell-dependent components, which are only needed when a root is rendered), and the rendered component names `CmsWorkflowsEditor`, `WebsiteBuilderWorkflowsMenu`, `PageEditorConfig`.
7. The hunks for `app.tsx` and `index.tsx` are written against the pre-8a text of those files. Tasks 10-34 add lines to `app.tsx` only (no 8a task adds to `index.tsx`, R-k), so every hunk is a removal and the `app.tsx` line numbers will have drifted.
8. Size: a deletion of about 190 files plus six small file rewrites; the one step with judgement is the 3a/3e importer check, which is why it is a hard stop rather than a fix-up.
