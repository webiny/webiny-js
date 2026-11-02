### Task 6: Editor consumers; per-app editor bundles go

R344 (the multi-registration exception), R347, R348 (#10-#15), R349, R352, R353, R354, R355, R356, R362; A113, A114, A117; Review Focus 3, 6, 8, 10 (`../00-shared.md`). Every Global Constraint of the plan applies (read: no behaviour change R342, Q76 naming, one class or one public function per file, one named import per line, no inline object types, no nested call arguments, no wrapper helpers around dependency calls, presenters inject exactly the use cases they call, no use case on a runtime path, registration order R349, one test command at a time, one commit). 8a R202, R238 and R243 still bind.

The editor presenter injects the six editor use cases and passes `app: this.params.app.appKind` with every call; nothing passes editor use cases at runtime any more. The CMS and WB editor gateways register under the shared `WorkflowEditorAppGateway` token (their exports keep their app names, R344), so Task 5's routing gateway reaches them; the per-app editor tokens, the per-app bundle subclasses, the shared bundle, its interface, its test and its aggregate fake are deleted in this same commit (R356: no editor bridge). The review bundle still travels to the editor as `reviewUseCases` until Task 10.

- **Presenter** (`[AWE]/presentation/editor/WorkflowEditorPresenter.ts`, R352): the constructor gains `listWorkflowModelsUseCase`, `getWorkflowUseCase`, `storeWorkflowUseCase`, `deleteWorkflowUseCase`, `inspectRoutingUseCase`, `folderExistsUseCase` (in this order, right after Task 4's `ListWorkflowUsersUseCase` parameter and before `identityContext`); `dependencies` gain the six tokens after `ListWorkflowUsersUseCase`; `makeAutoObservable` excludes the six fields (`false`). The eight call sites change from `params.useCases.x(...)` to `this.<x>UseCase.execute({ app: params.app.appKind, ... })`: `listModels` (`loadModels`), `getWorkflow` (`openModel`, `resolveDuplicateBanner`, `loadWorkflowInto`), `storeWorkflow` (`persist`), `deleteWorkflow` (`deleteCurrent`), `inspectRouting` (the StepDrawer source `inspectRouting(params)`), `folderExists` (`resolveReferences`). Every other line, the four `reviewUseCases.invalidateWorkflows()` calls included, stays (Task 10 moves them).
- **Runtime passing goes** (R353): `WorkflowEditorInitParams` loses `useCases` (keeps `reviewUseCases` and `app`); `WorkflowEditorView` and `WorkflowEditorRoute` lose the `useCases` prop; `[CMS]/Routes/CmsWorkflowEditor.tsx` and `[WB]/Routes/WebsiteBuilderWorkflowsMenu.tsx` stop passing it; `CmsWorkflowEditorMountingFeature` / `WbWorkflowEditorMountingFeature` resolve `{ reviewUseCases, app }`.
- **App bindings** (R344, R347, R354): `CmsWorkflowEditorGateway` and `WbWorkflowEditorGateway` are created on `WorkflowEditorAppGateway` (`import { WorkflowEditorAppGateway as GatewayAbstraction }`); `CmsWorkflowEditorFeature` / `WbWorkflowEditorFeature` register only the gateway as a singleton and have no `resolve`.
- **Deleted** (R356): `[AWE]/useCases/{IWorkflowEditorUseCases.ts, WorkflowEditorUseCases.ts, WorkflowEditorUseCases.test.ts}`, `[AWET]/fakeWorkflowEditorUseCases.ts`, `[CMS]/features/editorGateway/{CmsWorkflowEditorGateway/abstractions.ts, CmsWorkflowEditorUseCases/}`, `[WB]/features/editorGateway/{WbWorkflowEditorGateway/abstractions.ts, WbWorkflowEditorUseCases/}`. The bundle test's cases already live in Task 5's routing-gateway and use-case tests; its "per-app subclasses" cases test R237 for a class that no longer exists, and the CMS/WB coexistence they stood for is now asserted by the index tests below.
- **Tests** (R355, R362, Review Focus 3, 8, 10): `[AWET]/editorPresenterSetup.ts` registers one `{ execute: vi.fn() }` per editor use case and returns them by name (`setup.getWorkflow.execute`); the 15 `WorkflowEditorPresenter.*.test.ts` files change only how they reach the fakes (a one-off script), and the assertions on the parameters gain the `app` key (`"cms"`, and `"wb"` in two added assertions); the gateway tests resolve the shared token and assert `app`; each `[CMS|WB]/features/editorGateway/feature.test.ts` asserts only its own gateway under the shared token and keeps its behaviour cases by running the shared use cases over its gateway; `[CMS|WB]/index.test.tsx` assert the shared-token registration with the flag on and off, and the editor half of Review Focus 10: after the render (and not during it) the routing gateway sends `app: "cms"` to the CMS gateway and the other app to a stub; `[WB]/index.test.tsx` also renders `WorkflowsAdminApp`, `CmsWorkflows` and `WebsiteBuilderWorkflows` in that order on one container and routes `cms` and `wb` to the real gateways.

**Files:**
- Create: `packages/app-workflows/src/editor/testing/editorUseCaseFakes.ts`
- Modify: `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts`
- Modify: the 15 files `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.{cards,delete,flow,init,inspectionNames,models,options,overlap,references,ruleErrors,save,saveFailures,stepWarnings,teamSearch,teams}.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`
- Modify: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`
- Modify: `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`
- Delete: `packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts`
- Delete: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts`
- Delete: `packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts`
- Delete: `packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts`
- Delete: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/abstractions.ts`
- Delete: `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCases/` (`abstractions.ts`, `CmsWorkflowEditorUseCases.ts`)
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/feature.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts`
- Delete: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/abstractions.ts`
- Delete: `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCases/` (`abstractions.ts`, `WbWorkflowEditorUseCases.ts`)
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx`
- Modify: `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`

**Interfaces:**
- Consumes: Task 5 (`WorkflowAppKind`; `WorkflowEditorAppGateway` with `Interface`; `WorkflowEditorGateway`; `WorkflowEditorRepositoryFeature`; the six use cases with `Interface`, `Params` and `<Name>Feature`; `createFakeEditorAppGateway(app)` from `[AWET]/fakeWorkflowEditorAppGateway.ts`); Task 4 (the editor presenter injects `ListStepTypesUseCase, ListAutomationDefinitionsUseCase, ListNotificationTransportsUseCase, ListAiModelsUseCase, ListAiToolsUseCase, ListWorkflowTeamsUseCase, ListWorkflowUsersUseCase, IdentityContext, WorkflowEditorToasts`, R352, and `editorPresenterSetup.ts` returns one fake per config use case by name, R355); Task 3 (`WorkflowConfigServicesFeature` registered in `[AW]/app.tsx`). Existing (verified at HEAD with codegraph and the source): `Container.resolveAll`, `Container.registerFactory` (`@webiny/di` 2.0.0; `resolveMultiple` calls a registered factory each time it collects the token, so a factory registration counts how often a routing gateway is built); `WorkflowsAdminApp` (`[AW]/app.tsx`); `CmsWorkflows` (`[CMS]/index.tsx`); `WebsiteBuilderWorkflows` (`[WB]/index.tsx`); `CompositionProvider` (`@webiny/react-composition`); `createEditorWorkflow`, `createEditorWorkflowDto`, `createRoutingInspection`, `createRoutingInspectionDto`, `createWorkflowModelPage`, `createWorkflowModelRowDto`, `EDITOR_SAVED_ON` (`[AWET]/editorFixtures.ts`); `WorkflowErrorCode` (`[AWE]/domain/WorkflowErrorCode.ts`).
- Produces (matches the contract): R352's editor row (`WorkflowEditorPresenter` depends on the seven config use cases, the six editor use cases, `IdentityContext`, `WorkflowEditorToasts`), R353's editor props (`WorkflowEditorInitParams { reviewUseCases; app }`, `WorkflowEditorViewProps` and `WorkflowEditorRouteProps` without `useCases`), `CmsWorkflowEditorFeature` / `WbWorkflowEditorFeature` without `resolve`, the editor mounting features resolving `{ reviewUseCases, app }`, the editor half of Review Focus 10 in `[CMS|WB]/index.test.tsx`; test types `FakeListWorkflowModelsUseCase`, `FakeGetWorkflowUseCase`, `FakeStoreWorkflowUseCase`, `FakeDeleteWorkflowUseCase`, `FakeInspectRoutingUseCase`, `FakeFolderExistsUseCase` (`[AWET]/editorUseCaseFakes.ts`) and `EditorPresenterSetup.{listWorkflowModels, getWorkflow, storeWorkflow, deleteWorkflow, inspectRouting, folderExists}`. Consumed by Task 10 (it drops `reviewUseCases` from the same props and adds the invalidation to `StoreWorkflowUseCase` / `DeleteWorkflowUseCase`) and Task 7 (it adds the review half to the same index tests).

**Test runner note:** admin packages, `yarn test <path>` only, one file per command, and the commands of each block run one at a time, in order; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/editorUseCaseFakes.ts` (types only, R355: one double per use case, none carries several operations):

```ts
import type { Mock } from "vitest";
import type { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import type { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import type { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import type { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import type { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import type { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";

// The editor use cases as test doubles, one per use case: only `execute`, a vitest mock (R355).

export interface FakeListWorkflowModelsUseCase extends ListWorkflowModelsUseCase.Interface {
    execute: Mock<ListWorkflowModelsUseCase.Interface["execute"]>;
}

export interface FakeGetWorkflowUseCase extends GetWorkflowUseCase.Interface {
    execute: Mock<GetWorkflowUseCase.Interface["execute"]>;
}

export interface FakeStoreWorkflowUseCase extends StoreWorkflowUseCase.Interface {
    execute: Mock<StoreWorkflowUseCase.Interface["execute"]>;
}

export interface FakeDeleteWorkflowUseCase extends DeleteWorkflowUseCase.Interface {
    execute: Mock<DeleteWorkflowUseCase.Interface["execute"]>;
}

export interface FakeInspectRoutingUseCase extends InspectRoutingUseCase.Interface {
    execute: Mock<InspectRoutingUseCase.Interface["execute"]>;
}

export interface FakeFolderExistsUseCase extends FolderExistsUseCase.Interface {
    execute: Mock<FolderExistsUseCase.Interface["execute"]>;
}
```

Modify `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts` (as Task 4 leaves it; these hunks touch only the editor half, the config fakes stay as Task 4 wrote them). Task 4's file has no `vitest` import; add it as the first line.

Before:

```ts
import { Container } from "@webiny/di";
```

After:

```ts
import { vi } from "vitest";
import { Container } from "@webiny/di";
```

Before:

```ts
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { FakeWorkflowEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
```

After:

```ts
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createRoutingInspection } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import type { FakeDeleteWorkflowUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import type { FakeFolderExistsUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import type { FakeGetWorkflowUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import type { FakeInspectRoutingUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import type { FakeListWorkflowModelsUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import type { FakeStoreWorkflowUseCase } from "~/editor/testing/editorUseCaseFakes.js";
import { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
```

(Task 4's file imports `createAiModel`, `createAiTool` and `createWorkflowTeamSummary` from `editorFixtures.js`, none of these three.)

Before:

```ts
    useCases: FakeWorkflowEditorUseCases;
```

After:

```ts
    listWorkflowModels: FakeListWorkflowModelsUseCase;
    getWorkflow: FakeGetWorkflowUseCase;
    storeWorkflow: FakeStoreWorkflowUseCase;
    deleteWorkflow: FakeDeleteWorkflowUseCase;
    inspectRouting: FakeInspectRoutingUseCase;
    folderExists: FakeFolderExistsUseCase;
```

Before:

```ts
    const useCases = createFakeEditorUseCases();
```

After:

```ts
    // The defaults of the old bundle fake: one model row bound to the default workflow, which every
    // read, store and delete answers; a rule decision for the inspection; every folder exists.
    const workflow = createEditorWorkflow();
    const modelPage = createWorkflowModelPage();
    const inspection = createRoutingInspection();
    const listWorkflowModels: FakeListWorkflowModelsUseCase = {
        execute: vi.fn().mockResolvedValue(modelPage)
    };
    const getWorkflow: FakeGetWorkflowUseCase = {
        execute: vi.fn().mockResolvedValue(workflow)
    };
    const storeWorkflow: FakeStoreWorkflowUseCase = {
        execute: vi.fn().mockResolvedValue(workflow)
    };
    const deleteWorkflow: FakeDeleteWorkflowUseCase = {
        execute: vi.fn().mockResolvedValue(workflow)
    };
    const inspectRouting: FakeInspectRoutingUseCase = {
        execute: vi.fn().mockResolvedValue(inspection)
    };
    const folderExists: FakeFolderExistsUseCase = {
        execute: vi.fn().mockResolvedValue(true)
    };
```

Before:

```ts
    container.registerInstance(WorkflowEditorToasts, toasts);
```

After:

```ts
    container.registerInstance(WorkflowEditorToasts, toasts);
    container.registerInstance(ListWorkflowModelsUseCase, listWorkflowModels);
    container.registerInstance(GetWorkflowUseCase, getWorkflow);
    container.registerInstance(StoreWorkflowUseCase, storeWorkflow);
    container.registerInstance(DeleteWorkflowUseCase, deleteWorkflow);
    container.registerInstance(InspectRoutingUseCase, inspectRouting);
    container.registerInstance(FolderExistsUseCase, folderExists);
```

Before:

```ts
    const params: WorkflowEditorInitParams = { useCases, reviewUseCases, app };
```

After:

```ts
    const params: WorkflowEditorInitParams = { reviewUseCases, app };
```

In the `return { ... }` statement at the end of `createEditorPresenterSetup` (Task 4 writes it one entry per line), replace the entry `useCases`; every other entry stays as Task 4 left it.

Before:

```ts
        container,
        useCases,
```

After:

```ts
        container,
        listWorkflowModels,
        getWorkflow,
        storeWorkflow,
        deleteWorkflow,
        inspectRouting,
        folderExists,
```

Rewrite the 15 editor presenter tests to the per-use-case fakes. Save this one-off script as `.superpowers/sdd/layers-plan/renameEditorFakes.mjs` (git-excluded, not committed):

```js
// One-off rewrite for Task 6: the editor presenter tests stop reading the aggregate
// `useCases` fake and read one fake per editor use case instead (R355).
import fs from "node:fs";

const NAMES = {
    listModels: "listWorkflowModels",
    getWorkflow: "getWorkflow",
    storeWorkflow: "storeWorkflow",
    deleteWorkflow: "deleteWorkflow",
    inspectRouting: "inspectRouting",
    folderExists: "folderExists"
};

const ORDER = [
    "listWorkflowModels",
    "getWorkflow",
    "storeWorkflow",
    "deleteWorkflow",
    "inspectRouting",
    "folderExists"
];

const METHODS = Object.keys(NAMES).join("|");
const PROPERTY_ACCESS = new RegExp(`\\.useCases\\.(${METHODS})\\b`, "g");
const BARE_ACCESS = new RegExp(`(^|[^.\\w])useCases\\.(${METHODS})\\b`, "g");
const USED_FAKE = new RegExp(`(^|[^.\\w])(${ORDER.join("|")})\\.execute\\b`, "g");

const indentOf = line => {
    return line.length - line.trimStart().length;
};

const findBlockEnd = (lines, start) => {
    const indent = indentOf(lines[start]);
    for (let index = start + 1; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() === "") {
            continue;
        }
        if (indentOf(line) < indent) {
            return index;
        }
    }
    return lines.length;
};

const rewriteFile = filePath => {
    const source = fs.readFileSync(filePath, "utf-8");
    let text = source.replace(PROPERTY_ACCESS, (match, method) => {
        return `.${NAMES[method]}.execute`;
    });
    text = text.replace(BARE_ACCESS, (match, prefix, method) => {
        return `${prefix}${NAMES[method]}.execute`;
    });

    const lines = text.split("\n");
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if (!/const \{[^}]*\buseCases\b[^}]*\}/.test(line)) {
            continue;
        }
        const end = findBlockEnd(lines, index);
        const used = new Set();
        for (let inner = index + 1; inner < end; inner++) {
            for (const match of lines[inner].matchAll(USED_FAKE)) {
                used.add(match[2]);
            }
        }
        const names = ORDER.filter(name => used.has(name));
        let replaced = line;
        if (names.length > 0) {
            replaced = line.replace(/\buseCases\b/, names.join(", "));
        } else {
            replaced = line.replace(/,\s*useCases\b/, "").replace(/\buseCases,\s*/, "");
        }
        lines[index] = replaced;
    }
    const result = lines.join("\n");
    if (result !== source) {
        fs.writeFileSync(filePath, result);
    }
};

for (const filePath of process.argv.slice(2)) {
    rewriteFile(filePath);
}
```

Run it, then check that no aggregate access is left (the grep prints nothing; `reviewUseCases` does not match):

```bash
node .superpowers/sdd/layers-plan/renameEditorFakes.mjs packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.*.test.ts
grep -n "\buseCases\b" packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.*.test.ts
```

What it does: `useCases.getWorkflow` and `setup.useCases.getWorkflow` become `getWorkflow.execute` and `setup.getWorkflow.execute` (`listModels` becomes `listWorkflowModels`); in every one-line destructuring of the setup (`const { presenter, params, useCases } = ...`, also of the helpers `setupWithThreeModels`, `dirtySetup`, `openWith`, `openedSetup`) `useCases` is replaced by the fakes that test uses, in the order above, or dropped when it uses none. (Dry run on the HEAD versions of the 15 files: 326 changed lines, no `useCases` left.)

Then add the routing key to the assertions on the parameters (the text below is what the script leaves).

`WorkflowEditorPresenter.init.test.ts`:

Before:

```ts
        expect(listWorkflowModels.execute).toHaveBeenCalledWith({ search: "", limit: 20, after: null });
```

After:

```ts
        expect(listWorkflowModels.execute).toHaveBeenCalledWith({
            app: "cms",
            search: "",
            limit: 20,
            after: null
        });
```

Before:

```ts
        expect(getWorkflow.execute).toHaveBeenCalledWith("workflow-1");
```

After:

```ts
        expect(getWorkflow.execute).toHaveBeenCalledWith({ app: "cms", id: "workflow-1" });
```

Before:

```ts
        expect(wb.presenter.vm.panel.showSearch).toBe(false);
```

After:

```ts
        expect(wb.presenter.vm.panel.showSearch).toBe(false);
        expect(cms.listWorkflowModels.execute).toHaveBeenCalledWith({
            app: "cms",
            search: "",
            limit: 20,
            after: null
        });
        expect(wb.listWorkflowModels.execute).toHaveBeenCalledWith({
            app: "wb",
            search: "",
            limit: 20,
            after: null
        });
```

`WorkflowEditorPresenter.delete.test.ts`:

Before:

```ts
        expect(deleteWorkflow.execute).toHaveBeenCalledWith("workflow-1");
```

After:

```ts
        expect(deleteWorkflow.execute).toHaveBeenCalledWith({ app: "cms", id: "workflow-1" });
```

`WorkflowEditorPresenter.models.test.ts`:

Before:

```ts
        expect(listWorkflowModels.execute).toHaveBeenCalledWith({
            search: "arti",
```

After:

```ts
        expect(listWorkflowModels.execute).toHaveBeenCalledWith({
            app: "cms",
            search: "arti",
```

Before:

```ts
        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            search: "",
            limit: 20,
            after: "c1"
```

After:

```ts
        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            app: "cms",
            search: "",
            limit: 20,
            after: "c1"
```

Before:

```ts
        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            search: "x",
```

After:

```ts
        expect(listWorkflowModels.execute).toHaveBeenLastCalledWith({
            app: "cms",
            search: "x",
```

Before (two occurrences, in "loads the bound workflow of another model when the draft is clean" and "discards the draft and opens the model on confirm"; replace both):

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith("workflow-2");
```

After:

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-2" });
```

`WorkflowEditorPresenter.saveFailures.test.ts`:

Before (two occurrences, both in tests over the CMS `dirtySetup()`; replace both):

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith("workflow-9");
```

After:

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-9" });
```

Before:

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith("workflow-1");
```

After:

```ts
        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "cms", id: "workflow-1" });
```

Before (the Website Builder banner test, over `dirtySetup("wb")`):

```ts
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
```

After:

```ts
            "Could not save the workflow — Pages already have a workflow: “Pages approval”. Pages can have one workflow."
        );
        expect(getWorkflow.execute).toHaveBeenLastCalledWith({ app: "wb", id: "workflow-9" });
```

`WorkflowEditorPresenter.references.test.ts`:

Before:

```ts
        expect(setup.folderExists.execute).toHaveBeenCalledWith({ id: "f2", type: FOLDER_TYPE });
```

After:

```ts
        expect(setup.folderExists.execute).toHaveBeenCalledWith({
            app: "cms",
            id: "f2",
            type: FOLDER_TYPE
        });
```

Before:

```ts
        expect(setup.folderExists.execute).toHaveBeenCalledWith({ id: "f9", type: "cms:other" });
```

After:

```ts
        expect(setup.folderExists.execute).toHaveBeenCalledWith({
            app: "cms",
            id: "f9",
            type: "cms:other"
        });
```

`WorkflowEditorPresenter.options.test.ts`:

Before:

```ts
        expect(setup.inspectRouting.execute).toHaveBeenCalledWith({
            stepConfig,
```

After:

```ts
        expect(setup.inspectRouting.execute).toHaveBeenCalledWith({
            app: "cms",
            stepConfig,
```

`WorkflowEditorPresenter.save.test.ts`:

Before:

```ts
        const call = storeWorkflow.execute.mock.calls[0][0];
        expect(call.savedOn).toBe(EDITOR_SAVED_ON);
```

After:

```ts
        const call = storeWorkflow.execute.mock.calls[0][0];
        expect(call.app).toBe("cms");
        expect(call.savedOn).toBe(EDITOR_SAVED_ON);
```

Two fakes branch on the id they receive; `execute` now receives `{ app, id }`, so they read `params.id` (without this the branch never matches and the typed callback no longer fits `GetWorkflowUseCase.Interface["execute"]`).

`WorkflowEditorPresenter.models.test.ts` (in `setupWithThreeModels`):

Before:

```ts
    setup.getWorkflow.execute.mockImplementation(async (id: string): Promise<EditorWorkflow> => {
        if (id === "workflow-2") {
```

After:

```ts
    setup.getWorkflow.execute.mockImplementation(async (params): Promise<EditorWorkflow> => {
        if (params.id === "workflow-2") {
```

`WorkflowEditorPresenter.references.test.ts`:

Before:

```ts
        setup.getWorkflow.execute.mockImplementation(async id => {
            if (id === "workflow-2") {
```

After:

```ts
        setup.getWorkflow.execute.mockImplementation(async params => {
            if (params.id === "workflow-2") {
```

(The `folderExists` fake of `references.test.ts`, `async params => params.id === "f2"`, already reads `params.id` and needs no change.)

(Checked on a dry run of the HEAD files: every before-block above occurs exactly once after the script, except the two marked "two occurrences". The other `toHaveBeenCalledTimes`, `not.toHaveBeenCalled`, `mock.calls[n][0].savedOn` and `mock.invocationCallOrder` assertions need no change.)

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`:

Before:

```tsx
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
```

After:

```tsx
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
```

Before:

```tsx
const useCases = { name: "editor use cases" } as unknown as IWorkflowEditorUseCases;
const reviewUseCases = { name: "review use cases" } as unknown as IReviewReadUseCases;
```

After:

```tsx
const reviewUseCases = { name: "review use cases" } as unknown as IReviewReadUseCases;
```

Before (five occurrences; replace all):

```tsx
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
```

After:

```tsx
            <WorkflowEditorView reviewUseCases={reviewUseCases} app={app} />,
```

Before:

```tsx
    it("initialises the presenter with the per-app props and disposes it on unmount", () => {
```

After:

```tsx
    it("initialises the presenter with the per-app props, no editor use cases, and disposes it on unmount (R353)", () => {
```

Before:

```tsx
        expect(init).toHaveBeenCalledWith({ useCases, reviewUseCases, app });
```

After:

```tsx
        expect(init).toHaveBeenCalledWith({ reviewUseCases, app });
```

Modify `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx`:

Before:

```tsx
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
```

After: (the line is removed)

```tsx
```

Before:

```tsx
const useCases = createFakeEditorUseCases();

const reviewUseCases = createFakeUseCases();
```

After:

```tsx
const reviewUseCases = createFakeUseCases();
```

Before:

```tsx
    breadcrumbName: "cms.workflows",
    useCases,
    reviewUseCases,
```

After:

```tsx
    breadcrumbName: "cms.workflows",
    reviewUseCases,
```

Before:

```tsx
    it("gives the view the use cases, the review use cases and the app adapter as props", async () => {
```

After:

```tsx
    it("gives the view the review use cases and the app adapter as props, no editor use cases (R353)", async () => {
```

Before:

```tsx
        expect(views[0].props.useCases).toBe(useCases);
```

After:

```tsx
        expect(views[0].props).not.toHaveProperty("useCases");
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts`:

Before:

```ts
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
```

After:

```ts
import { WorkflowEditorAppGateway as GatewayAbstraction } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway.js";
```

Before:

```ts
    describe("listModels", () => {
        it("sends search, limit and after and folds data and meta into one page", async () => {
```

After:

```ts
    it("declares the cms app, the key the routing gateway picks it by (R347)", () => {
        expect(gateway.app).toBe("cms");
    });

    describe("listModels", () => {
        it("sends search, limit and after and folds data and meta into one page", async () => {
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts`:

Before:

```ts
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";
```

After:

```ts
import { WorkflowEditorAppGateway as GatewayAbstraction } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway.js";
```

Before:

```ts
    describe("listModels", () => {
        it("answers the single Pages row with the workflow that binds wb.page", async () => {
```

After:

```ts
    it("declares the wb app, the key the routing gateway picks it by (R347)", () => {
        expect(gateway.app).toBe("wb");
    });

    describe("listModels", () => {
        it("answers the single Pages row with the workflow that binds wb.page", async () => {
```

Replace `packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts` with (R362: only its own registration under the shared token; the behaviour cases run the shared use cases over the CMS gateway):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { DeleteWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/abstractions.js";
import { DeleteWorkflowFeature } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/feature.js";
import { FolderExistsUseCase } from "@webiny/app-workflows/editor/useCases/folderExists/abstractions.js";
import { FolderExistsFeature } from "@webiny/app-workflows/editor/useCases/folderExists/feature.js";
import { GetWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/getWorkflow/abstractions.js";
import { GetWorkflowFeature } from "@webiny/app-workflows/editor/useCases/getWorkflow/feature.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { ListWorkflowModelsUseCase } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/abstractions.js";
import { ListWorkflowModelsFeature } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/feature.js";
import { StoreWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/storeWorkflow/abstractions.js";
import { StoreWorkflowFeature } from "@webiny/app-workflows/editor/useCases/storeWorkflow/feature.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createWorkflowModelRowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { CmsWorkflowEditorFeature } from "./feature.js";

describe("CmsWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        CmsWorkflowEditorFeature.register(container);
    });

    it("registers only the CMS gateway under the shared app gateway token (R347, R362)", () => {
        const gateways = container.resolveAll(WorkflowEditorAppGateway);

        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("cms");
    });

    it("registers the gateway as a singleton", () => {
        expect(container.resolve(WorkflowEditorAppGateway)).toBe(
            container.resolve(WorkflowEditorAppGateway)
        );
    });

    describe("the shared editor use cases over the CMS gateway", () => {
        beforeEach(() => {
            WorkflowEditorRepositoryFeature.register(container);
            ListWorkflowModelsFeature.register(container);
            GetWorkflowFeature.register(container);
            StoreWorkflowFeature.register(container);
            DeleteWorkflowFeature.register(container);
            InspectRoutingFeature.register(container);
            FolderExistsFeature.register(container);
        });

        it("runs the routing inspection with the bare model id", async () => {
            client.execute.mockResolvedValue({
                cms: {
                    inspectCmsEntryRouting: {
                        data: createRoutingInspectionDto({
                            ruleId: "rule-2",
                            narrowedTeamId: "team-2",
                            candidateIds: ["user-3"],
                            candidateCount: 4
                        }),
                        error: null
                    }
                }
            });
            const useCase = container.resolve(InspectRoutingUseCase);

            const inspection = await useCase.execute({
                app: "cms",
                stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
                requesterId: "user-1",
                folderId: null,
                modelId: "article"
            });

            expect(inspection.ruleId).toBe("rule-2");
            expect(inspection.narrowedTeamId).toBe("team-2");
            expect(inspection.candidateIds).toEqual(["user-3"]);
            expect(inspection.candidateCount).toBe(4);
            expect(client.execute.mock.calls[0][0].variables.modelId).toBe("article");
            expect(client.execute.mock.calls[0][0].variables.folderId).toBeNull();
        });

        it("answers false for a deleted folder, not an error", async () => {
            client.execute.mockResolvedValue({
                cms: { cmsEntryFolderExists: { data: false, error: null } }
            });
            const useCase = container.resolve(FolderExistsUseCase);

            const exists = await useCase.execute({ app: "cms", id: "folder-1", type: "cms:article" });

            expect(exists).toBe(false);
            expect(client.execute.mock.calls[0][0].variables).toEqual({
                id: "folder-1",
                type: "cms:article"
            });
        });

        it("turns a rule validation error of the inspector into a GraphQLOperationError that keeps the rule id", async () => {
            const data = {
                stepId: "step-1",
                field: "config.assignment.rules.target",
                ruleId: "rule-1",
                workflowId: null
            };
            client.execute.mockResolvedValue({
                cms: {
                    inspectCmsEntryRouting: {
                        data: null,
                        error: {
                            code: WorkflowErrorCode.Validation,
                            message: "The target team is not one of the step's reviewing teams.",
                            data
                        }
                    }
                }
            });
            const useCase = container.resolve(InspectRoutingUseCase);

            const promise = useCase.execute({
                app: "cms",
                stepConfig: { teams: ["team-1"], assignment: { rules: [] } },
                requesterId: "user-1",
                folderId: null,
                modelId: "article"
            });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.Validation,
                data
            });
        });

        it("lists the models with the page meta", async () => {
            client.execute.mockResolvedValue({
                cms: {
                    listCmsEntryWorkflowModels: {
                        data: [createWorkflowModelRowDto()],
                        meta: { cursor: "cursor-2", hasMoreItems: true },
                        error: null
                    }
                }
            });
            const useCase = container.resolve(ListWorkflowModelsUseCase);

            const page = await useCase.execute({ app: "cms", search: "", limit: 20, after: null });

            expect(page.cursor).toBe("cursor-2");
            expect(page.hasMoreItems).toBe(true);
            expect(page.rows[0].model).toBe("cms.article");
        });

        it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
            client.execute.mockResolvedValueOnce({
                cms: {
                    getCmsEntryWorkflow: {
                        data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:15:30.123Z" }),
                        error: null
                    }
                }
            });
            client.execute.mockResolvedValueOnce({
                cms: {
                    storeCmsEntryWorkflow: {
                        data: createEditorWorkflowDto({ savedOn: "2026-10-18T09:20:00.000Z" }),
                        error: null
                    }
                }
            });
            const getWorkflow = container.resolve(GetWorkflowUseCase);
            const storeWorkflow = container.resolve(StoreWorkflowUseCase);

            const loaded = await getWorkflow.execute({ app: "cms", id: "workflow-1" });
            const stored = await storeWorkflow.execute({
                app: "cms",
                data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
                savedOn: loaded.savedOn
            });

            expect(loaded.savedOn).toBe(EDITOR_SAVED_ON);
            expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
            expect(stored.savedOn).toBe("2026-10-18T09:20:00.000Z");
        });

        it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
            const data = {
                savedOn: "2026-10-18T10:00:00.000Z",
                savedBy: { displayName: "Grace" }
            };
            client.execute.mockResolvedValue({
                cms: {
                    storeCmsEntryWorkflow: {
                        data: null,
                        error: {
                            code: WorkflowErrorCode.Conflict,
                            message: "The workflow was changed.",
                            data
                        }
                    }
                }
            });
            const useCase = container.resolve(StoreWorkflowUseCase);

            const promise = useCase.execute({
                app: "cms",
                data: { id: "workflow-1", name: "A", models: ["cms.article"], steps: [] },
                savedOn: EDITOR_SAVED_ON
            });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({ code: WorkflowErrorCode.Conflict, data });
        });

        it("lets a transport failure pass through the use cases as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);
            const useCase = container.resolve(DeleteWorkflowUseCase);

            await expect(useCase.execute({ app: "cms", id: "workflow-1" })).rejects.toBe(failure);
        });
    });
});
```

Replace `packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts` with (R362; its old CMS-and-WB coexistence case moves to the three-root test of `[WB]/index.test.tsx` below):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowErrorCode } from "@webiny/app-workflows/editor/domain/WorkflowErrorCode.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { DeleteWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/abstractions.js";
import { DeleteWorkflowFeature } from "@webiny/app-workflows/editor/useCases/deleteWorkflow/feature.js";
import { FolderExistsUseCase } from "@webiny/app-workflows/editor/useCases/folderExists/abstractions.js";
import { FolderExistsFeature } from "@webiny/app-workflows/editor/useCases/folderExists/feature.js";
import { GetWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/getWorkflow/abstractions.js";
import { GetWorkflowFeature } from "@webiny/app-workflows/editor/useCases/getWorkflow/feature.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { ListWorkflowModelsUseCase } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/abstractions.js";
import { ListWorkflowModelsFeature } from "@webiny/app-workflows/editor/useCases/listWorkflowModels/feature.js";
import { StoreWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/storeWorkflow/abstractions.js";
import { StoreWorkflowFeature } from "@webiny/app-workflows/editor/useCases/storeWorkflow/feature.js";
import { EDITOR_SAVED_ON } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createRoutingInspectionDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { WbWorkflowEditorFeature } from "./feature.js";

describe("WbWorkflowEditorFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbWorkflowEditorFeature.register(container);
    });

    it("registers only the WB gateway under the shared app gateway token (R347, R362)", () => {
        const gateways = container.resolveAll(WorkflowEditorAppGateway);

        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers the gateway as a singleton", () => {
        expect(container.resolve(WorkflowEditorAppGateway)).toBe(
            container.resolve(WorkflowEditorAppGateway)
        );
    });

    describe("the shared editor use cases over the WB gateway", () => {
        beforeEach(() => {
            WorkflowEditorRepositoryFeature.register(container);
            ListWorkflowModelsFeature.register(container);
            GetWorkflowFeature.register(container);
            StoreWorkflowFeature.register(container);
            DeleteWorkflowFeature.register(container);
            InspectRoutingFeature.register(container);
            FolderExistsFeature.register(container);
        });

        it("runs the routing inspection without a model", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    inspectWebsiteBuilderPageRouting: {
                        data: createRoutingInspectionDto({
                            ruleId: "rule-2",
                            narrowedTeamId: "team-2",
                            candidateIds: ["user-3"],
                            candidateCount: 4
                        }),
                        error: null
                    }
                }
            });
            const useCase = container.resolve(InspectRoutingUseCase);

            const inspection = await useCase.execute({
                app: "wb",
                stepConfig: { teams: ["team-2"], assignment: { strategy: "none", rules: [] } },
                requesterId: "user-1",
                folderId: null,
                modelId: "page"
            });

            expect(inspection.ruleId).toBe("rule-2");
            expect(inspection.narrowedTeamId).toBe("team-2");
            expect(inspection.candidateIds).toEqual(["user-3"]);
            expect(inspection.candidateCount).toBe(4);
            expect(client.execute.mock.calls[0][0].variables).not.toHaveProperty("modelId");
        });

        it("answers false for a deleted folder, not an error", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: { websiteBuilderPageFolderExists: { data: false, error: null } }
            });
            const useCase = container.resolve(FolderExistsUseCase);

            const exists = await useCase.execute({ app: "wb", id: "folder-1", type: "wb:page" });

            expect(exists).toBe(false);
            expect(client.execute.mock.calls[0][0].variables).toEqual({ id: "folder-1" });
        });

        it("lists the single Pages row", async () => {
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    listWebsiteBuilderPageWorkflows: {
                        data: [{ id: "workflow-1", name: "Page review", models: ["wb.page"] }],
                        error: null
                    }
                }
            });
            const useCase = container.resolve(ListWorkflowModelsUseCase);

            const page = await useCase.execute({ app: "wb", search: "", limit: 20, after: null });

            expect(page.rows).toEqual([
                {
                    model: "wb.page",
                    modelId: "page",
                    name: "Pages",
                    workflow: { id: "workflow-1", name: "Page review" }
                }
            ]);
            expect(page.cursor).toBeNull();
            expect(page.hasMoreItems).toBe(false);
        });

        it("keeps savedOn as the identical string from the read to the store (D131)", async () => {
            client.execute.mockResolvedValueOnce({
                websiteBuilder: {
                    getWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ models: ["wb.page"] }),
                        error: null
                    }
                }
            });
            client.execute.mockResolvedValueOnce({
                websiteBuilder: {
                    storeWebsiteBuilderPageWorkflow: {
                        data: createEditorWorkflowDto({ models: ["wb.page"] }),
                        error: null
                    }
                }
            });
            const getWorkflow = container.resolve(GetWorkflowUseCase);
            const storeWorkflow = container.resolve(StoreWorkflowUseCase);

            const loaded = await getWorkflow.execute({ app: "wb", id: "workflow-1" });
            await storeWorkflow.execute({
                app: "wb",
                data: { id: loaded.id, name: loaded.name, models: loaded.models, steps: [] },
                savedOn: loaded.savedOn
            });

            expect(client.execute.mock.calls[1][0].variables.savedOn).toBe(EDITOR_SAVED_ON);
        });

        it("turns an envelope error into a GraphQLOperationError that keeps code and data", async () => {
            const data = { count: 1, reviews: [{ reviewId: "review-1" }] };
            client.execute.mockResolvedValue({
                websiteBuilder: {
                    deleteWebsiteBuilderPageWorkflow: {
                        data: null,
                        error: {
                            code: WorkflowErrorCode.HasActiveReviews,
                            message: "In use.",
                            data
                        }
                    }
                }
            });
            const useCase = container.resolve(DeleteWorkflowUseCase);

            const promise = useCase.execute({ app: "wb", id: "workflow-1" });

            await expect(promise).rejects.toBeInstanceOf(GraphQLOperationError);
            await expect(promise).rejects.toMatchObject({
                code: WorkflowErrorCode.HasActiveReviews,
                data
            });
        });

        it("lets a transport failure pass through the use cases as it is", async () => {
            const failure = new Error("Network down.");
            client.execute.mockRejectedValue(failure);
            const useCase = container.resolve(GetWorkflowUseCase);

            await expect(useCase.execute({ app: "wb", id: "workflow-1" })).rejects.toBe(failure);
        });
    });
});
```

Modify `packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts`:

Before:

```ts
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases/abstractions.js";
```

After:

```ts
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsReviewContentAdapter } from "~/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
```

Before:

```ts
const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

```

After:

```ts
const contentAdapter = createFakeContentAdapter();

```

Before:

```ts
    container.registerInstance(CmsWorkflowEditorUseCases, editorUseCases);
```

After: (the line is removed)

```ts
```

Before:

```ts
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const {
            useCases,
            reviewUseCases: resolvedReview,
            app
        } = CmsWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("cms");
        expect(app.contentAdapter).toBe(contentAdapter);
    });
```

After:

```ts
    it("resolves the review use cases and the app adapter for the view, no editor use cases (R353)", () => {
        const { container, reviewUseCases } = createContainer();

        const resolved = CmsWorkflowEditorMountingFeature.resolve(container);

        expect(resolved).not.toHaveProperty("useCases");
        expect(resolved.reviewUseCases).toBe(reviewUseCases);
        expect(resolved.app.appKind).toBe("cms");
        expect(resolved.app.contentAdapter).toBe(contentAdapter);
    });
```

Modify `packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts`:

Before:

```ts
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases/abstractions.js";
```

After:

```ts
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
```

Before:

```ts
const contentAdapter = createFakeContentAdapter();

const editorUseCases = createFakeEditorUseCases();

```

After:

```ts
const contentAdapter = createFakeContentAdapter();

```

Before:

```ts
    container.registerInstance(WbWorkflowEditorUseCases, editorUseCases);
```

After: (the line is removed)

```ts
```

Before:

```ts
    it("resolves the editor use cases, the review use cases and the app adapter for the view", () => {
        const { container, reviewUseCases } = createContainer();

        const {
            useCases,
            reviewUseCases: resolvedReview,
            app
        } = WbWorkflowEditorMountingFeature.resolve(container);

        expect(useCases).toBe(editorUseCases);
        expect(resolvedReview).toBe(reviewUseCases);
        expect(app.appKind).toBe("wb");
        expect(app.contentAdapter).toBe(contentAdapter);
    });
```

After:

```ts
    it("resolves the review use cases and the app adapter for the view, no editor use cases (R353)", () => {
        const { container, reviewUseCases } = createContainer();

        const resolved = WbWorkflowEditorMountingFeature.resolve(container);

        expect(resolved).not.toHaveProperty("useCases");
        expect(resolved.reviewUseCases).toBe(reviewUseCases);
        expect(resolved.app.appKind).toBe("wb");
        expect(resolved.app.contentAdapter).toBe(contentAdapter);
    });
```

Modify `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx`:

Before:

```tsx
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
```

After: (the line is removed)

```tsx
```

Before:

```tsx
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases/abstractions.js";
```

After: (the line is removed)

```tsx
```

Before:

```tsx
const editorUseCases = createFakeEditorUseCases();

const reviewUseCases = createFakeUseCases();
```

After:

```tsx
const reviewUseCases = createFakeUseCases();
```

Before:

```tsx
// The real mounting feature resolves the three tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(CmsWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(CmsReviewUseCases, reviewUseCases);
```

After:

```tsx
// The real mounting feature resolves the two tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(CmsReviewUseCases, reviewUseCases);
```

Before:

```tsx
    it("gives the view the CMS editor use cases, the CMS review use cases and the CMS adapter", async () => {
```

After:

```tsx
    it("gives the view the CMS review use cases and the CMS adapter, no editor use cases (R353)", async () => {
```

Before:

```tsx
        expect(views[0].props.useCases).toBe(editorUseCases);
```

After:

```tsx
        expect(views[0].props).not.toHaveProperty("useCases");
```

Modify `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx`:

Before:

```tsx
import { createFakeEditorUseCases } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorUseCases.js";
```

After: (the line is removed)

```tsx
```

Before:

```tsx
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases/abstractions.js";
```

After: (the line is removed)

```tsx
```

Before:

```tsx
const editorUseCases = createFakeEditorUseCases();

const reviewUseCases = createFakeUseCases();
```

After:

```tsx
const reviewUseCases = createFakeUseCases();
```

Before:

```tsx
// The real mounting feature resolves the three tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(WbWorkflowEditorUseCases, editorUseCases);
    container.registerInstance(WbReviewUseCases, reviewUseCases);
```

After:

```tsx
// The real mounting feature resolves the two tokens, which the test registers as instances.
const mount = async (): Promise<Captured> => {
    const container = new Container();
    container.registerInstance(WbReviewUseCases, reviewUseCases);
```

Before:

```tsx
    it("gives the view the WB editor use cases, the WB review use cases and the WB adapter", async () => {
```

After:

```tsx
    it("gives the view the WB review use cases and the WB adapter, no editor use cases (R353)", async () => {
```

Before:

```tsx
        expect(views[0].props.useCases).toBe(editorUseCases);
```

After:

```tsx
        expect(views[0].props).not.toHaveProperty("useCases");
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (the shared-token registration with the flag on and off; the editor half of Review Focus 10, R349, R362).

Before:

```tsx
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsWorkflowEditorUseCases } from "~/features/editorGateway/CmsWorkflowEditorUseCases/abstractions.js";
```

After:

```tsx
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/abstractions.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorAppGateway.js";
```

Before:

```tsx
    it("registers the CMS workflow editor use cases with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(CmsWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers no workflow editor use cases with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorUseCases)).toThrow("No registration found");
    });

    it("sends the routing inspection of the editor through the CMS gateway with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCases = container.resolve(CmsWorkflowEditorUseCases);
        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(inspection.owner).toBeNull();
        expect(lastRequest.query).toContain("inspectCmsEntryRouting");
    });
```

After:

```tsx
    it("registers the CMS editor gateway under the shared app gateway token with the flag on (R347)", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const gateways = container.resolveAll(WorkflowEditorAppGateway);
        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("cms");
    });

    it("registers no editor gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("sends the routing inspection of the editor through the CMS gateway with the flag on", async () => {
        const container = createContainer(true);
        // The data layer of app-workflows, which WorkflowsAdminApp registers in the admin.
        WorkflowEditorRepositoryFeature.register(container);
        InspectRoutingFeature.register(container);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                inspectCmsEntryRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCase = container.resolve(InspectRoutingUseCase);
        const inspection = await useCase.execute({
            app: "cms",
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: "article"
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(inspection.owner).toBeNull();
        expect(lastRequest.query).toContain("inspectCmsEntryRouting");
    });
```

Before:

```tsx
    it("registers the workflow editor use cases and the CMS editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(CmsReviewContentAdapter);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolve(CmsWorkflowEditorUseCases)).toBeDefined();
    });
```

After:

```tsx
    it("registers the CMS editor gateway and the CMS editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(CmsWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(CmsReviewContentAdapter);

        expect(adapter.appKind).toBe("cms");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolveAll(WorkflowEditorAppGateway)).toHaveLength(1);
    });
```

Before:

```tsx
    it("registers neither the workflow editor use cases nor the CMS editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(() => container.resolve(CmsWorkflowEditorUseCases)).toThrow("No registration found");
    });
```

After:

```tsx
    it("registers neither the CMS editor gateway nor the CMS editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(CmsWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("routes the editor by app only after the render: cms to the CMS gateway, wb to the other app (R349, R362)", async () => {
        const container = createContainer(true);
        WorkflowEditorRepositoryFeature.register(container);
        const wbGateway = createFakeEditorAppGateway("wb");
        wbGateway.getWorkflow.mockResolvedValue({
            data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
            error: null
        });
        // A factory runs each time a routing gateway collects the app gateways, so it counts the builds.
        const createWbGateway = vi.fn(() => wbGateway);
        container.registerFactory(WorkflowEditorAppGateway, createWbGateway);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        expect(createWbGateway).not.toHaveBeenCalled();
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValue({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-cms" }),
                    error: null
                }
            }
        });

        const gateway = container.resolve(WorkflowEditorGateway);
        const cms = await gateway.getWorkflow({ app: "cms", id: "workflow-cms" });
        const wb = await gateway.getWorkflow({ app: "wb", id: "workflow-wb" });

        expect(createWbGateway).toHaveBeenCalledTimes(1);
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        expect(vi.mocked(client.execute)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(client.execute).mock.calls[0][0].query).toContain("getCmsEntryWorkflow");
        expect(wbGateway.getWorkflow).toHaveBeenCalledWith("workflow-wb");
    });

    it("routes no editor operation to the CMS with the flag off", async () => {
        const container = createContainer(false);
        WorkflowEditorRepositoryFeature.register(container);
        const wbGateway = createFakeEditorAppGateway("wb");
        container.registerInstance(WorkflowEditorAppGateway, wbGateway);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );
        const gateway = container.resolve(WorkflowEditorGateway);
        const client = container.resolve(MainGraphQLClient);

        await expect(gateway.getWorkflow({ app: "cms", id: "workflow-cms" })).rejects.toThrow(
            'No workflows app is registered for "cms".'
        );
        expect(vi.mocked(client.execute)).not.toHaveBeenCalled();
    });
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx` (the same for the WB, plus the three-root test, Review Focus 10, A113).

Before:

```tsx
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { WbWorkflowEditorUseCases } from "~/features/editorGateway/WbWorkflowEditorUseCases/abstractions.js";
```

After:

```tsx
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
import { WbReviewContentAdapter } from "~/features/gateway/WbReviewContentAdapter/abstractions.js";
import { CompositionProvider } from "@webiny/react-composition";
import { WorkflowsAdminApp } from "@webiny/app-workflows/app.js";
import { WorkflowEditorAppGateway } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
import { WorkflowEditorGateway } from "@webiny/app-workflows/editor/gateway/abstractions.js";
import { WorkflowEditorRepositoryFeature } from "@webiny/app-workflows/editor/repository/feature.js";
import { GetWorkflowUseCase } from "@webiny/app-workflows/editor/useCases/getWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "@webiny/app-workflows/editor/useCases/inspectRouting/abstractions.js";
import { InspectRoutingFeature } from "@webiny/app-workflows/editor/useCases/inspectRouting/feature.js";
import { createEditorWorkflowDto } from "@webiny/app-workflows/editor/testing/editorFixtures.js";
import { createFakeEditorAppGateway } from "@webiny/app-workflows/editor/testing/fakeWorkflowEditorAppGateway.js";
import { CmsWorkflows } from "@webiny/app-headless-cms-workflows/index.js";
```

Before:

```tsx
vi.mock("~/presentation/page/PageGet/feature.js", () => {
    return {
        PageGetWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});
```

After (the UI of the two other roots is stubbed as their own root tests stub it, so the three-root test renders only their registrations; the mocks do not touch `WebsiteBuilderWorkflows`):

```tsx
vi.mock("~/presentation/page/PageGet/feature.js", () => {
    return {
        PageGetWorkflowsFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

vi.mock("@webiny/app-workflows/presentation/permissions/index.js", async importOriginal => {
    const actual =
        await importOriginal<typeof import("@webiny/app-workflows/presentation/permissions/index.js")>();
    return { ...actual, SecurityPermissions: () => null };
});

vi.mock("@webiny/app-workflows/editor/WorkflowEditorConfig.js", () => {
    return { WorkflowEditorConfig: () => null };
});

vi.mock("@webiny/app-workflows/settings/mounting/ExclusionsSettings.js", () => {
    return { ExclusionsSettings: () => null };
});

vi.mock("@webiny/app-workflows/review/trash/components/ActiveReviewWarningConfig.js", () => {
    return { ActiveReviewWarningConfig: () => null };
});

vi.mock("@webiny/app-headless-cms-workflows/Routes/index.js", () => {
    return { CmsWorkflowEditor: () => null };
});

vi.mock("@webiny/app-headless-cms-workflows/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryReviewBar: () => null,
        CmsEntryReviewBlockedActions: () => null,
        CmsEntryReviewFormLock: () => null,
        CmsEntryReviewNewRevision: () => null,
        CmsEntryReviewScheduleMenuItem: () => null
    };
});

vi.mock("@webiny/app-headless-cms-workflows/Components/ContentReviews/CmsContentReviews.js", () => {
    return { CmsContentReviews: () => null };
});

vi.mock(
    "@webiny/app-headless-cms-workflows/Components/ContentReviews/CmsContentReviewsSidebarItem.js",
    () => {
        return { CmsContentReviewsSidebarItem: () => null };
    }
);

vi.mock("@webiny/app-headless-cms-workflows/Components/CmsEntriesList/CmsReviewMoveEntryAction.js", () => {
    return { CmsReviewMoveEntryAction: () => null };
});

vi.mock("@webiny/app-headless-cms-workflows/presentation/feature.js", () => {
    return {
        CmsWorkflowsFeature: { name: "Mock", register: () => undefined, resolve: () => undefined }
    };
});

vi.mock("@webiny/app-headless-cms-workflows/features/feature.js", () => {
    return {
        CmsWorkflowsCacheFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});
```

Before:

```tsx
    it("sends the routing inspection of the editor through the WB gateway with the flag on", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                inspectWebsiteBuilderPageRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCases = container.resolve(WbWorkflowEditorUseCases);
        const inspection = await useCases.inspectRouting({
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: null
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(lastRequest.query).toContain("inspectWebsiteBuilderPageRouting");
    });

    it("registers the WB workflow editor use cases with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
    });

    it("registers no workflow editor use cases with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
    });
```

After:

```tsx
    it("sends the routing inspection of the editor through the WB gateway with the flag on", async () => {
        const container = createContainer(true);
        // The data layer of app-workflows, which WorkflowsAdminApp registers in the admin.
        WorkflowEditorRepositoryFeature.register(container);
        InspectRoutingFeature.register(container);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                inspectWebsiteBuilderPageRouting: {
                    data: {
                        owner: null,
                        source: "pool",
                        ruleId: null,
                        strategy: "none",
                        narrowedTeamId: null,
                        candidateIds: [],
                        candidateCount: 0,
                        trace: [],
                        skipped: []
                    },
                    error: null
                }
            }
        });

        const useCase = container.resolve(InspectRoutingUseCase);
        const inspection = await useCase.execute({
            app: "wb",
            stepConfig: { teams: ["team-1"], assignment: { strategy: "none", rules: [] } },
            requesterId: "user-1",
            folderId: null,
            modelId: null
        });

        const calls = vi.mocked(client.execute).mock.calls;
        const lastRequest = calls[calls.length - 1][0];
        expect(inspection.source).toBe("pool");
        expect(lastRequest.query).toContain("inspectWebsiteBuilderPageRouting");
    });

    it("registers the WB editor gateway under the shared app gateway token with the flag on (R347)", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const gateways = container.resolveAll(WorkflowEditorAppGateway);
        expect(gateways).toHaveLength(1);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers no editor gateway with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });
```

Before:

```tsx
    it("registers the workflow editor use cases and the WB editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(WbReviewContentAdapter);

        expect(adapter.appKind).toBe("wb");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolve(WbWorkflowEditorUseCases)).toBeDefined();
    });
```

After:

```tsx
    it("registers the WB editor gateway and the WB editor adapter with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const adapter = container.resolve(WbWorkflowEditorAppAdapter);
        const contentAdapter = container.resolve(WbReviewContentAdapter);

        expect(adapter.appKind).toBe("wb");
        expect(adapter.contentAdapter).toBe(contentAdapter);
        expect(container.resolveAll(WorkflowEditorAppGateway)).toHaveLength(1);
    });
```

Before:

```tsx
    it("registers neither the workflow editor use cases nor the WB editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(() => container.resolve(WbWorkflowEditorUseCases)).toThrow("No registration found");
    });
```

After:

```tsx
    it("registers neither the WB editor gateway nor the WB editor adapter with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbWorkflowEditorAppAdapter)).toThrow(
            "No registration found"
        );
        expect(container.resolveAll(WorkflowEditorAppGateway)).toEqual([]);
    });

    it("routes the editor by app only after the render: wb to the WB gateway, cms to the other app (R349, R362)", async () => {
        const container = createContainer(true);
        WorkflowEditorRepositoryFeature.register(container);
        const cmsGateway = createFakeEditorAppGateway("cms");
        cmsGateway.getWorkflow.mockResolvedValue({
            data: createEditorWorkflowDto({ id: "workflow-cms" }),
            error: null
        });
        // A factory runs each time a routing gateway collects the app gateways, so it counts the builds.
        const createCmsGateway = vi.fn(() => cmsGateway);
        container.registerFactory(WorkflowEditorAppGateway, createCmsGateway);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(createCmsGateway).not.toHaveBeenCalled();
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValue({
            websiteBuilder: {
                getWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                    error: null
                }
            }
        });

        const gateway = container.resolve(WorkflowEditorGateway);
        const wb = await gateway.getWorkflow({ app: "wb", id: "workflow-wb" });
        const cms = await gateway.getWorkflow({ app: "cms", id: "workflow-cms" });

        expect(createCmsGateway).toHaveBeenCalledTimes(1);
        expect(wb.id).toBe("workflow-wb");
        expect(cms.id).toBe("workflow-cms");
        expect(vi.mocked(client.execute)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(client.execute).mock.calls[0][0].query).toContain(
            "getWebsiteBuilderPageWorkflow"
        );
        expect(cmsGateway.getWorkflow).toHaveBeenCalledWith("workflow-cms");
    });

    it("routes no editor operation to the WB with the flag off", async () => {
        const container = createContainer(false);
        WorkflowEditorRepositoryFeature.register(container);
        const cmsGateway = createFakeEditorAppGateway("cms");
        container.registerInstance(WorkflowEditorAppGateway, cmsGateway);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );
        const gateway = container.resolve(WorkflowEditorGateway);
        const client = container.resolve(MainGraphQLClient);

        await expect(gateway.getWorkflow({ app: "wb", id: "workflow-wb" })).rejects.toThrow(
            'No workflows app is registered for "wb".'
        );
        expect(vi.mocked(client.execute)).not.toHaveBeenCalled();
    });

    it("routes the editor of each app to its own gateway with the three roots rendered in admin order (R349, A113, R362)", async () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CompositionProvider>
                    <WorkflowsAdminApp />
                    <CmsWorkflows />
                    <WebsiteBuilderWorkflows />
                </CompositionProvider>
            </DiContainerProvider>
        );
        const client = container.resolve(MainGraphQLClient);
        vi.mocked(client.execute).mockClear();
        vi.mocked(client.execute).mockResolvedValueOnce({
            cms: {
                getCmsEntryWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-cms" }),
                    error: null
                }
            }
        });
        vi.mocked(client.execute).mockResolvedValueOnce({
            websiteBuilder: {
                getWebsiteBuilderPageWorkflow: {
                    data: createEditorWorkflowDto({ id: "workflow-wb", models: ["wb.page"] }),
                    error: null
                }
            }
        });

        const getWorkflow = container.resolve(GetWorkflowUseCase);
        const cms = await getWorkflow.execute({ app: "cms", id: "workflow-cms" });
        const wb = await getWorkflow.execute({ app: "wb", id: "workflow-wb" });

        const calls = vi.mocked(client.execute).mock.calls;
        expect(cms.id).toBe("workflow-cms");
        expect(wb.id).toBe("workflow-wb");
        expect(calls).toHaveLength(2);
        expect(calls[0][0].query).toContain("getCmsEntryWorkflow");
        expect(calls[1][0].query).toContain("getWebsiteBuilderPageWorkflow");
        const apps = container.resolveAll(WorkflowEditorAppGateway).map(gateway => gateway.app);
        expect(apps).toEqual(["cms", "wb"]);
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: the presenter tests fail (the presenter still reads `params.useCases`, which the kit no longer passes: `Cannot read properties of undefined (reading 'listModels')`, so `status` is `failed` and the per-use-case fakes are never called); `WorkflowEditorView.test.tsx` fails on `toHaveBeenCalledWith({ reviewUseCases, app })` (the view still passes `useCases: undefined`); `WorkflowEditorRoute.test.tsx` fails on `not.toHaveProperty("useCases")`; the CMS and WB gateway tests fail to resolve `Workflows/WorkflowEditorAppGateway` until Step 3 creates the gateways on the shared token; both `editorGateway/feature.test.ts` fail (`resolveAll` is empty: the gateway is still bound to the per-app token); the mounting feature tests and the route tests fail on `not.toHaveProperty("useCases")`; the index tests fail on the shared-token cases and the routing cases (`No workflows app is registered for "cms".` / `"wb"`). Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`:

Before:

```ts
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
```

After:

```ts
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
```

Before:

```ts
// The per-app parts the shared view passes in (the 8a mounting pattern).
export interface WorkflowEditorInitParams {
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}
```

After:

```ts
/*
 * The per-app parts the shared view passes in (the 8a mounting pattern). The editor use cases come
 * through DI and route by `app.appKind` (R348, R353).
 */
export interface WorkflowEditorInitParams {
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts` (as Task 4 leaves it; the hunks avoid the lines Task 4 changes).

Before:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
```

After:

```ts
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { DeleteWorkflowUseCase } from "~/editor/useCases/deleteWorkflow/abstractions.js";
import { FolderExistsUseCase } from "~/editor/useCases/folderExists/abstractions.js";
import { GetWorkflowUseCase } from "~/editor/useCases/getWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "~/editor/useCases/inspectRouting/abstractions.js";
import { ListWorkflowModelsUseCase } from "~/editor/useCases/listWorkflowModels/abstractions.js";
import { StoreWorkflowUseCase } from "~/editor/useCases/storeWorkflow/abstractions.js";
```

Before:

```ts
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
```

After:

```ts
        private listWorkflowModelsUseCase: ListWorkflowModelsUseCase.Interface,
        private getWorkflowUseCase: GetWorkflowUseCase.Interface,
        private storeWorkflowUseCase: StoreWorkflowUseCase.Interface,
        private deleteWorkflowUseCase: DeleteWorkflowUseCase.Interface,
        private inspectRoutingUseCase: InspectRoutingUseCase.Interface,
        private folderExistsUseCase: FolderExistsUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
```

Before:

```ts
            | "identityContext"
```

After:

```ts
            | "listWorkflowModelsUseCase"
            | "getWorkflowUseCase"
            | "storeWorkflowUseCase"
            | "deleteWorkflowUseCase"
            | "inspectRoutingUseCase"
            | "folderExistsUseCase"
            | "identityContext"
```

Before:

```ts
            identityContext: false,
```

After:

```ts
            listWorkflowModelsUseCase: false,
            getWorkflowUseCase: false,
            storeWorkflowUseCase: false,
            deleteWorkflowUseCase: false,
            inspectRoutingUseCase: false,
            folderExistsUseCase: false,
            identityContext: false,
```

Before:

```ts
        const modelId = this.getModelId();
        return init.useCases.inspectRouting({
            stepConfig: params.stepConfig,
```

After:

```ts
        const modelId = this.getModelId();
        return this.inspectRoutingUseCase.execute({
            app: init.app.appKind,
            stepConfig: params.stepConfig,
```

Before:

```ts
            const page = await params.useCases.listModels({
                search: this.search,
```

After:

```ts
            const page = await this.listWorkflowModelsUseCase.execute({
                app: params.app.appKind,
                search: this.search,
```

Before:

```ts
            const workflow = await params.useCases.getWorkflow(row.workflow.id);
```

After:

```ts
            const workflow = await this.getWorkflowUseCase.execute({
                app: params.app.appKind,
                id: row.workflow.id
            });
```

Before:

```ts
            workflow = await params.useCases.storeWorkflow({
                data: this.draft.toInput(),
```

After:

```ts
            workflow = await this.storeWorkflowUseCase.execute({
                app: params.app.appKind,
                data: this.draft.toInput(),
```

Before:

```ts
            const other = await params.useCases.getWorkflow(workflowId);
```

After:

```ts
            const other = await this.getWorkflowUseCase.execute({
                app: params.app.appKind,
                id: workflowId
            });
```

Before:

```ts
            const workflow = await params.useCases.getWorkflow(id);
```

After:

```ts
            const workflow = await this.getWorkflowUseCase.execute({ app: params.app.appKind, id });
```

Before:

```ts
            await params.useCases.deleteWorkflow(this.draft.id);
```

After:

```ts
            await this.deleteWorkflowUseCase.execute({ app: params.app.appKind, id: this.draft.id });
```

Before:

```ts
                    return params.useCases.folderExists({ id: folder.id, type: folder.type });
```

After:

```ts
                    return this.folderExistsUseCase.execute({
                        app: params.app.appKind,
                        id: folder.id,
                        type: folder.type
                    });
```

In `dependencies` of `export const WorkflowEditorPresenter = Abstraction.createImplementation({ ... })` (Task 4's array, R352), insert the six tokens after `ListWorkflowUsersUseCase`.

Before:

```ts
        ListWorkflowUsersUseCase,
        IdentityContext,
```

After:

```ts
        ListWorkflowUsersUseCase,
        ListWorkflowModelsUseCase,
        GetWorkflowUseCase,
        StoreWorkflowUseCase,
        DeleteWorkflowUseCase,
        InspectRoutingUseCase,
        FolderExistsUseCase,
        IdentityContext,
```

The final array is R352's: `[ListStepTypesUseCase, ListAutomationDefinitionsUseCase, ListNotificationTransportsUseCase, ListAiModelsUseCase, ListAiToolsUseCase, ListWorkflowTeamsUseCase, ListWorkflowUsersUseCase, ListWorkflowModelsUseCase, GetWorkflowUseCase, StoreWorkflowUseCase, DeleteWorkflowUseCase, InspectRoutingUseCase, FolderExistsUseCase, IdentityContext, WorkflowEditorToasts]`, in the order of the constructor parameters. Then check that no runtime use of the bundle is left in the presenter (expect no output):

```bash
grep -n "useCases\.\|params\.useCases\|init\.useCases" packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts | grep -v reviewUseCases
```

Replace `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx` with:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * The shared editor view the CMS and WB packages mount. The app's review use cases and the app
 * adapter arrive as props and go to `presenter.init` (the 8a mounting pattern); the editor use
 * cases come through DI and route by the adapter's `appKind` (R348, R353).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { reviewUseCases, app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass singletons: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ reviewUseCases, app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, reviewUseCases, app]);

    return (
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<StepDrawer source={presenter} stepId={presenter.vm.openStepId} />}
        />
    );
});
```

Modify `packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.tsx`:

Before:

```tsx
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
```

After:

```tsx
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
```

Before:

```tsx
    breadcrumbName: string;
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
```

After:

```tsx
    breadcrumbName: string;
    reviewUseCases: IReviewReadUseCases;
```

Before:

```tsx
        content = (
            <WorkflowEditorView
                useCases={props.useCases}
                reviewUseCases={props.reviewUseCases}
                app={props.app}
            />
        );
```

After:

```tsx
        content = <WorkflowEditorView reviewUseCases={props.reviewUseCases} app={props.app} />;
```

Delete the shared bundle, its interface, its test and its fake (R356):

```bash
git rm packages/app-workflows/src/editor/useCases/IWorkflowEditorUseCases.ts packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.ts packages/app-workflows/src/editor/useCases/WorkflowEditorUseCases.test.ts packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts
```

Modify `packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.ts`:

Before:

```ts
import { CmsWorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
```

After:

```ts
import { WorkflowEditorAppGateway as GatewayAbstraction } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
```

Before:

```ts
export const CmsWorkflowEditorGateway = GatewayAbstraction.createImplementation({
```

After:

```ts
/*
 * The CMS registration of the shared `WorkflowEditorAppGateway` token (R347). It keeps its app name
 * (R344): the CMS and WB registrations of one token stay distinguishable.
 */
export const CmsWorkflowEditorGateway = GatewayAbstraction.createImplementation({
```

Replace `packages/app-headless-cms-workflows/src/features/editorGateway/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsWorkflowEditorGateway } from "./CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.js";

/*
 * Registers the CMS editor gateway under the shared `WorkflowEditorAppGateway` token (R347, R354);
 * the routing gateway of app-workflows picks it for `app: "cms"`. Nothing to resolve.
 */
export const CmsWorkflowEditorFeature = createFeature({
    name: "CmsWorkflows/WorkflowEditor",
    register(container) {
        container.register(CmsWorkflowEditorGateway).inSingletonScope();
    }
});
```

Replace `packages/app-headless-cms-workflows/src/features/editorMounting/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { CmsWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { CmsWorkflowEditorAppAdapter } from "./CmsWorkflowEditorAppAdapter.js";

export const CmsWorkflowEditorMountingFeature = createFeature({
    name: "CmsWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the model's folders through app-aco's gateway (R292). The Website
        // Builder registers the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(CmsWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            reviewUseCases: container.resolve(CmsReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

Replace `packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.tsx` with:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the CMS review use cases and adapter;
 * the editor use cases come through DI and route by the adapter's app (R353). Without the workflows
 * `editor` permission the menu item renders nothing and the route shows the no-access view (D162,
 * R331).
 */
export const CmsWorkflowEditor = () => {
    const { reviewUseCases, app } = useFeature(CmsWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.ContentModels.Workflows}
                appBreadcrumbName="cms"
                appBreadcrumbLabel="Headless CMS"
                breadcrumbName="cms.workflows"
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={Routes.ContentModels.Workflows}
            />
        </>
    );
};
```

Delete the per-app CMS editor tokens and bundle subclass:

```bash
git rm packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/abstractions.ts
git rm -r packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorUseCases
```

Modify `packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.ts`:

Before:

```ts
import { WbWorkflowEditorGateway as GatewayAbstraction } from "./abstractions.js";
```

After:

```ts
import { WorkflowEditorAppGateway as GatewayAbstraction } from "@webiny/app-workflows/editor/appGateway/abstractions.js";
```

Before:

```ts
export const WbWorkflowEditorGateway = GatewayAbstraction.createImplementation({
```

After:

```ts
/*
 * The Website Builder registration of the shared `WorkflowEditorAppGateway` token (R347). It keeps
 * its app name (R344): the CMS and WB registrations of one token stay distinguishable.
 */
export const WbWorkflowEditorGateway = GatewayAbstraction.createImplementation({
```

Replace `packages/app-website-builder-workflows/src/features/editorGateway/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbWorkflowEditorGateway } from "./WbWorkflowEditorGateway/WbWorkflowEditorGateway.js";

/*
 * Registers the Website Builder editor gateway under the shared `WorkflowEditorAppGateway` token
 * (R347, R354); the routing gateway of app-workflows picks it for `app: "wb"`. Nothing to resolve.
 */
export const WbWorkflowEditorFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WorkflowEditor",
    register(container) {
        container.register(WbWorkflowEditorGateway).inSingletonScope();
    }
});
```

Replace `packages/app-website-builder-workflows/src/features/editorMounting/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ListFoldersGqlGateway } from "@webiny/app-aco/features/folders/listFolders/ListFoldersGqlGateway.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
import { WbWorkflowEditorAppAdapter as AdapterAbstraction } from "./abstractions.js";
import { WbWorkflowEditorAppAdapter } from "./WbWorkflowEditorAppAdapter.js";

export const WbWorkflowEditorMountingFeature = createFeature({
    name: "WebsiteBuilderWorkflows/EditorMounting",
    register(container) {
        // The adapter lists the page folders through app-aco's gateway (R292). The CMS registers
        // the same implementation; the last registration wins and they are alike.
        container.register(ListFoldersGqlGateway);
        container.register(WbWorkflowEditorAppAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            reviewUseCases: container.resolve(WbReviewUseCases),
            app: container.resolve(AdapterAbstraction)
        };
    }
});
```

Replace `packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.tsx` with:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { WbWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the Website Builder review use cases
 * and adapter; the editor use cases come through DI and route by the adapter's app (R353). Without
 * the workflows `editor` permission the menu item renders nothing and the route shows the no-access
 * view (D162, R331).
 */
export const WebsiteBuilderWorkflowsMenu = () => {
    const { reviewUseCases, app } = useFeature(WbWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.Pages.Workflows}
                appBreadcrumbName="wb"
                appBreadcrumbLabel="Website Builder"
                breadcrumbName="wb.workflows"
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="websiteBuilder.pages.workflows"
                parent="wb"
                route={Routes.Pages.Workflows}
            />
        </>
    );
};
```

Delete the per-app WB editor tokens and bundle subclass:

```bash
git rm packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/abstractions.ts
git rm -r packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorUseCases
```

Check that nothing refers to what this task deleted (expect no output):

```bash
grep -rnE "IWorkflowEditorUseCases|\bWorkflowEditorUseCases\b|CmsWorkflowEditorUseCases|WbWorkflowEditorUseCases|createFakeEditorUseCases|fakeWorkflowEditorUseCases|editorGateway/CmsWorkflowEditorGateway/abstractions|editorGateway/WbWorkflowEditorGateway/abstractions" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

(If Task 3's config bridge `[AWE]/useCases/WorkflowConfigUseCases.ts` still names `WorkflowEditorUseCases` in a comment, that one hit is expected; Task 14 deletes the file.)

- [ ] **Step 4: Run the new and changed tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.overlap.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/mounting/components/WorkflowEditorRoute.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/CmsWorkflowEditorGateway/CmsWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/Routes/CmsWorkflowEditor.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/editorGateway/WbWorkflowEditorGateway/WbWorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Routes/WebsiteBuilderWorkflowsMenu.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: PASS for each. If the three-root test of `[WB]/index.test.tsx` fails with a missing registration while rendering (for example `No registration found for ... ModelsCache` or a CMS presenter), a CMS or app-workflows component rendered for real: check that the package-path `vi.mock` specifier of that component resolves to the same file as the root's `~/` import (both go through the tsconfig paths to `src/`), and stub the component the error names the same way.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/gateway/WorkflowEditorGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.testRouting.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorMounting/CmsWorkflowEditorAppAdapter.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorMounting/WbWorkflowEditorAppAdapter.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS; `app.test.tsx` resolves the editor presenter with the flag on (its new dependencies are registered by `WorkflowEditorServicesFeature`, Task 5); the three builds print no TypeScript error (they type-check the co-located tests, 8a R243).

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
git commit -m "refactor(app-workflows): inject the editor use cases and drop the per-app editor bundles" -m "The workflow editor presenter injects the six editor use cases and sends the adapter's app with every call; the editor view, route and init params no longer carry editor use cases. The shared WorkflowEditorUseCases bundle, its interface, test and fake are deleted. app-headless-cms-workflows and app-website-builder-workflows: the editor gateways register under the shared WorkflowEditorAppGateway token, the per-app editor tokens and bundle subclasses are deleted, and the mounting features resolve only the review use cases and the adapter." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes or fails, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports`, `.superpowers` (the rename script stays there); never push, amend or revert.

## Contract notes

- **Field names.** The presenter already has a public method `inspectRouting(params)` (the StepDrawer source, `abstractions.ts:312`), so the injected use case cannot be the field `inspectRouting`; the six editor fields carry the `UseCase` suffix (`inspectRoutingUseCase`, `getWorkflowUseCase`, ...). The controller ruling in `consistency-items.md` gives every injected use-case field this suffix, so Task 4's seven config fields are `listStepTypesUseCase` ... `listWorkflowUsersUseCase`; no hunk here anchors on a config field name.
- **Task 4 dependency.** The presenter and `editorPresenterSetup.ts` hunks anchor on lines Task 4 leaves alone (`private identityContext: ...`, `| "identityContext"`, `identityContext: false,`, the import of `IdentityContext`, `container.registerInstance(WorkflowEditorToasts, toasts);`) or on Task 4's own R352 array (`ListWorkflowUsersUseCase,` followed by `IdentityContext,`). The return statement of the setup anchors on Task 4's `container,` / `useCases,` entry lines; verify after Task 4 that the anchors are unique.
- **Script instead of 230 hunks.** The 15 presenter test files reach the editor fakes in about 230 places, mostly `useCases.x.mockResolvedValue(...)`, and many destructurings also name Task 4's config fakes. A deterministic script (given in full) does the renaming on whatever Task 4 left, and the hunks that change behaviour assertions (the routing key) are written out. The script was dry-run on the HEAD versions of the 15 files: no `useCases` access remained and every written-out hunk matched.
- **Kit types file.** R355 does not name a file for the per-use-case fake types; they live in `[AWET]/editorUseCaseFakes.ts` (types only, no vitest runtime import) so the kit can type its fakes without a generic helper.
- **`[CMS|WB]/features/editorGateway/feature.test.ts`.** R362 limits them to their own registration under the shared token. Their old behaviour cases (inspection variables, `false` folder, model list or Pages row, `savedOn` round trip, error conversion, transport) are kept and now run the shared use cases over the app's real gateway (Q74: same assertions, new path). The WB file's CMS-and-WB coexistence case is replaced by the three-root test in `[WB]/index.test.tsx`.
- **"Not built during the render" (R362).** Checked with a factory registration of the other app's stub under `WorkflowEditorAppGateway`: `@webiny/di` calls a factory each time it collects the multi-token, which happens only when the routing singleton is built, so `not.toHaveBeenCalled()` after the render and `toHaveBeenCalledTimes(1)` after the first `resolve` pin it. `resolveMultiple` lists instances first, then class registrations, then factories, so the stub comes after the real gateway; the apps are disjoint, so the order does not choose (A115).
- **Three-root test mocks.** `[WB]/index.test.tsx` stubs the UI components of `WorkflowsAdminApp` and `CmsWorkflows` through their package paths (the same components their own root tests stub through `~/`). verify: that vitest applies a `vi.mock("@webiny/app-headless-cms-workflows/Routes/index.js")` to the CMS root's `~/Routes/index.js` import (both resolve to `packages/app-headless-cms-workflows/src/Routes/index.ts(x)` through the tsconfig paths); Step 4 says what to do if one renders for real.
- **`[AW]/app.cleanup.test.tsx`** is not changed: R358 gives the list of deleted paths to Task 14, which can add the four `[AWE]` paths this task deletes.

## Review fixes (sub-phase review)

- **Behaviour bug in the script's output.** Two presenter-test fakes branch on the id `getWorkflow` receives (`WorkflowEditorPresenter.models.test.ts` `setupWithThreeModels`, `async (id: string)`; `WorkflowEditorPresenter.references.test.ts`, `async id =>`). With `execute({ app, id })` the branch never matched and the typed callback no longer type-checked. Added the two hunks that read `params.id`.
- **`editorPresenterSetup.ts` hunks made exact against Task 4's file:** the `vitest` import is added as a written hunk (Task 4's file has none), the fixture-import hedge is replaced by the fact (Task 4 imports none of the three builders), and the `return` change is a before/after hunk on Task 4's one-entry-per-line `container,` / `useCases,` lines instead of a rule about a one-line return that Task 4 no longer has.
- **No nested call arguments:** the setup builds `modelPage` and `inspection` before the fakes; the two flag-off index tests build the stub gateway (`wbGateway`, `cmsGateway`) before `registerInstance`.
- **Step 2** now also runs the WB gateway test, the WB mounting feature test and the WB menu route test (the expectation already described them failing); the "run in Step 4" remark is gone.
- **Consistency item (suffixed use-case fields):** the contract note on field names now states that Task 4's config fields carry the `UseCase` suffix too; no hunk here anchors on a config field name, so nothing else changes.
- **One test command at a time.** The test runner note now says the commands of each block run one at a time, in order.
