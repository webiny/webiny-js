### Task 4: Config consumers inject their use cases

R352 (the config rows and the spelled-out arrays), R355, R356, R342; Q70, Q74; Review Focus 8. The workflow editor presenter and the two settings presenters stop injecting the `WorkflowConfigUseCases` bundle and inject the config use cases they call; their test kits register one fresh fake per injected use case and return it by use-case name. No value, VM, toast, request or error handling changes; every behaviour assertion of the presenter tests is kept and only its way to the fake changes.

- **Dependencies (R352), exactly:**
  - `WorkflowEditorPresenter`: `[ListStepTypesUseCase, ListAutomationDefinitionsUseCase, ListNotificationTransportsUseCase, ListAiModelsUseCase, ListAiToolsUseCase, ListWorkflowTeamsUseCase, ListWorkflowUsersUseCase, IdentityContext, WorkflowEditorToasts]`. Task 6 inserts the six editor use cases after `ListWorkflowUsersUseCase`.
  - `ExclusionsPagePresenter`: `[GetWorkflowSettingsUseCase, ListWorkflowUsersUseCase]`.
  - `ExclusionDialogPresenter`: `[UpdateWorkflowSettingsUseCase, ListWorkflowUsersUseCase, WorkflowEditorToasts]`.
  - `RemoveExclusionDialogPresenter` calls no lookup and does not change (Task 2 already gave it `[UpdateWorkflowSettingsUseCase, WorkflowEditorToasts]`).
- **Fields and calls:** each injected use case is a private constructor field named after the use-case class in camelCase with the `UseCase` suffix (controller ruling, consistency-items: `listStepTypesUseCase`, `listAutomationDefinitionsUseCase`, `listNotificationTransportsUseCase`, `listAiModelsUseCase`, `listAiToolsUseCase`, `listWorkflowTeamsUseCase`, `listWorkflowUsersUseCase`; Task 2's `getWorkflowSettingsUseCase` / `updateWorkflowSettingsUseCase`), kept out of the MobX observable map (`false`). Each `this.config.<method>(args)` becomes the use case's `execute(args)` with the same arguments: `listStepTypes()` → `this.listStepTypesUseCase.execute()`, `listAutomationDefinitions()` → `this.listAutomationDefinitionsUseCase.execute()`, `listNotificationTransports()` → `this.listNotificationTransportsUseCase.execute()`, `listAiModels()` → `this.listAiModelsUseCase.execute()`, `listAiTools()` → `this.listAiToolsUseCase.execute()`, `listTeams(p)` → `this.listWorkflowTeamsUseCase.execute(p)`, `listUsers(p)` → `this.listWorkflowUsersUseCase.execute(p)`. The `Promise.allSettled` groups, tokens, chunking and the R275 order (AI lists only after the step types show the AI editor) are untouched. The kits keep returning the fakes by use-case name without the suffix (`setup.listWorkflowUsers.execute`, R355).
- **Fakes (R355):** seven factories in `[AWC]/testing/`, one per use case, each `createFakeXUseCase(): FakeXUseCase` returning a fresh `{ execute: vi.fn() }` with the default the old aggregate fake gave that method: the three step types `review`, `automation`, `ai` (available, no config schema), no automation, the e-mail transport, no team (`{ teams: [], missingIds: [] }`), no user (`{ users: [], missingIds: [] }`), no AI model, no AI tool.
- **Kits:** `createEditorPresenterSetup` returns `listStepTypes`, `listAutomationDefinitions`, `listNotificationTransports`, `listAiModels`, `listAiTools`, `listWorkflowTeams`, `listWorkflowUsers` instead of `config`, with the overrides it set on `config` before (the `createStepTypes()` list, the webhook automation, one AI model, one AI tool, one team). `createExclusionsPageSetup` and `createExclusionDialogSetup` return `listWorkflowUsers` instead of `config`. The editor kit still returns `useCases` and `reviewUseCases` (Tasks 6 and 10 replace them).
- **Tests:** a Node script renames every fake access in the 15 presenter test files: `config.listX` → `<name>.execute`, `setup.config.listX` → `setup.<name>.execute`, and in each `const { ... } = createXSetup(` destructuring the `config` key becomes the names that test uses. Nothing else in a test changes. `createFakeConfigUseCases` and the bridge stay (Task 14 deletes them, R358); after this task nothing but `[AWE]/feature.ts`, `[AWE]/feature.test.ts`, `[AW]/app.test.tsx` and the bridge's own files names `WorkflowConfigUseCases`.

**Files:**
- Create: `packages/app-workflows/src/config/testing/fakeListStepTypesUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListAutomationDefinitionsUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListNotificationTransportsUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListWorkflowTeamsUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListWorkflowUsersUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListAiModelsUseCase.ts`
- Create: `packages/app-workflows/src/config/testing/fakeListAiToolsUseCase.ts`
- Modify (rewrite): `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts`
- Modify: `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts`
- Modify: `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`
- Modify (fake access only, by script): `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.{cards,flow,init,inspectionNames,options,references,ruleErrors,stepWarnings,teamSearch,teams}.test.ts`, `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.{add,edit,errors}.test.ts`, `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.{load,names}.test.ts`
- Unchanged, run: `WorkflowEditorPresenter.{delete,models,overlap,save,saveFailures}.test.ts` (they use the kit but no config fake), `ExclusionsPagePresenter.{dialogs,rows}.test.ts`, `RemoveExclusionDialogPresenter.test.ts`
- Not changed: the three presenters' `feature.ts` files (they register the presenter without listing dependencies).

**Interfaces:**
- Consumes: Task 3 (`ListStepTypesUseCase`, `ListAutomationDefinitionsUseCase`, `ListNotificationTransportsUseCase`, `ListWorkflowTeamsUseCase`, `ListWorkflowUsersUseCase`, `ListAiModelsUseCase`, `ListAiToolsUseCase` from `~/config/useCases/<folder>/abstractions.js`, each with `.Interface`; `ListWorkflowTeamsUseCase.Params = ListTeamsParams`, `ListWorkflowUsersUseCase.Params = ListUsersParams`; `WorkflowConfigServicesFeature` registered in `[AW]/app.tsx`). Task 2 (the settings presenters' fields `getWorkflowSettingsUseCase` / `updateWorkflowSettingsUseCase` and their `dependencies` `[GetWorkflowSettingsUseCase, WorkflowConfigUseCases]` / `[UpdateWorkflowSettingsUseCase, WorkflowConfigUseCases, WorkflowEditorToasts]`; the kits as Task 2 Step 1 writes them, returning `{ presenter, getWorkflowSettings, config }` and `{ presenter, updateWorkflowSettings, config, toasts }`; the test files after Task 2's renames). Existing, verified at HEAD with codegraph: `createEditorStepType`, `createNotificationTransport`, `createAiModel`, `createAiTool`, `createWorkflowTeamSummary` (`~/editor/testing/editorFixtures.js`), `createStepTypes`, `createWebhookAutomation` (`~/editor/testing/draftFixtures.js`), `createFakeEditorUseCases` / `FakeWorkflowEditorUseCases`, `createFakeEditorToasts` / `FakeWorkflowEditorToasts`, `createFakeAppAdapter` / `FakeEditorAppAdapter`, `createFakeUseCases` / `FakeReviewUseCases`, `createWorkflowsIdentityContext`, `WorkflowEditorAppKind` (`~/editor/model/getStepTypeOptions.js`), the domain types `EditorStepType`, `AutomationDefinition`, `NotificationTransport`, `WorkflowTeamList`, `WorkflowUserList`, `AiModel`, `AiTool`.
- Produces: the R352 config rows; `createFakeListStepTypesUseCase` / `FakeListStepTypesUseCase`, `createFakeListAutomationDefinitionsUseCase` / `FakeListAutomationDefinitionsUseCase`, `createFakeListNotificationTransportsUseCase` / `FakeListNotificationTransportsUseCase`, `createFakeListWorkflowTeamsUseCase` / `FakeListWorkflowTeamsUseCase`, `createFakeListWorkflowUsersUseCase` / `FakeListWorkflowUsersUseCase`, `createFakeListAiModelsUseCase` / `FakeListAiModelsUseCase`, `createFakeListAiToolsUseCase` / `FakeListAiToolsUseCase` (`[AWC]/testing/fake<Name>UseCase.ts`, reused by Task 6's editor kit); `EditorPresenterSetup` with the seven named fakes (Task 6 and Task 10 keep them); `ExclusionsPageSetup { presenter; getWorkflowSettings; listWorkflowUsers }`, `ExclusionDialogSetup { presenter; updateWorkflowSettings; listWorkflowUsers; toasts }`.

**Test runner note:** admin package: `yarn test <path>` only, one file per command. Type check by `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30` (8a R243).

- [ ] **Step 1: Write the failing tests**

Create the seven fakes.

`packages/app-workflows/src/config/testing/fakeListStepTypesUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { createEditorStepType } from "~/editor/testing/editorFixtures.js";

export interface FakeListStepTypesUseCase extends ListStepTypesUseCase.Interface {
    execute: Mock<ListStepTypesUseCase.Interface["execute"]>;
}

// The three step types, all available and without a config schema; tests override the answer.
export const createFakeListStepTypesUseCase = (): FakeListStepTypesUseCase => {
    const review = createEditorStepType({ type: "review", title: "Review" });
    const automation = createEditorStepType({ type: "automation", title: "Automation" });
    const ai = createEditorStepType({ type: "ai", title: "AI" });
    const stepTypes: EditorStepType[] = [review, automation, ai];
    return { execute: vi.fn().mockResolvedValue(stepTypes) };
};
```

`packages/app-workflows/src/config/testing/fakeListAutomationDefinitionsUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";

export interface FakeListAutomationDefinitionsUseCase
    extends ListAutomationDefinitionsUseCase.Interface {
    execute: Mock<ListAutomationDefinitionsUseCase.Interface["execute"]>;
}

// No automation; tests override the answer.
export const createFakeListAutomationDefinitionsUseCase =
    (): FakeListAutomationDefinitionsUseCase => {
        const none: AutomationDefinition[] = [];
        return { execute: vi.fn().mockResolvedValue(none) };
    };
```

`packages/app-workflows/src/config/testing/fakeListNotificationTransportsUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import type { NotificationTransport } from "~/editor/domain/types.js";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";

export interface FakeListNotificationTransportsUseCase
    extends ListNotificationTransportsUseCase.Interface {
    execute: Mock<ListNotificationTransportsUseCase.Interface["execute"]>;
}

// The e-mail transport; tests override the answer.
export const createFakeListNotificationTransportsUseCase =
    (): FakeListNotificationTransportsUseCase => {
        const email = createNotificationTransport();
        const transports: NotificationTransport[] = [email];
        return { execute: vi.fn().mockResolvedValue(transports) };
    };
```

`packages/app-workflows/src/config/testing/fakeListWorkflowTeamsUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";

export interface FakeListWorkflowTeamsUseCase extends ListWorkflowTeamsUseCase.Interface {
    execute: Mock<ListWorkflowTeamsUseCase.Interface["execute"]>;
}

// A team lookup that finds no team; tests override the answer.
export const createFakeListWorkflowTeamsUseCase = (): FakeListWorkflowTeamsUseCase => {
    const none: WorkflowTeamList = { teams: [], missingIds: [] };
    return { execute: vi.fn().mockResolvedValue(none) };
};
```

`packages/app-workflows/src/config/testing/fakeListWorkflowUsersUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";

export interface FakeListWorkflowUsersUseCase extends ListWorkflowUsersUseCase.Interface {
    execute: Mock<ListWorkflowUsersUseCase.Interface["execute"]>;
}

// A user lookup that finds nobody; tests override the answer.
export const createFakeListWorkflowUsersUseCase = (): FakeListWorkflowUsersUseCase => {
    const nobody: WorkflowUserList = { users: [], missingIds: [] };
    return { execute: vi.fn().mockResolvedValue(nobody) };
};
```

`packages/app-workflows/src/config/testing/fakeListAiModelsUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import type { AiModel } from "~/editor/domain/types.js";

export interface FakeListAiModelsUseCase extends ListAiModelsUseCase.Interface {
    execute: Mock<ListAiModelsUseCase.Interface["execute"]>;
}

// No AI model; tests override the answer.
export const createFakeListAiModelsUseCase = (): FakeListAiModelsUseCase => {
    const none: AiModel[] = [];
    return { execute: vi.fn().mockResolvedValue(none) };
};
```

`packages/app-workflows/src/config/testing/fakeListAiToolsUseCase.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import type { AiTool } from "~/editor/domain/types.js";

export interface FakeListAiToolsUseCase extends ListAiToolsUseCase.Interface {
    execute: Mock<ListAiToolsUseCase.Interface["execute"]>;
}

// No AI tool; tests override the answer.
export const createFakeListAiToolsUseCase = (): FakeListAiToolsUseCase => {
    const none: AiTool[] = [];
    return { execute: vi.fn().mockResolvedValue(none) };
};
```

Replace `packages/app-workflows/src/editor/testing/editorPresenterSetup.ts` with (only the config part changes; the editor and review bundles stay until Tasks 6 and 10):

```ts
import { Container } from "@webiny/di";
import type { IPermission } from "@webiny/app-admin/domain/Identity.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { createFakeListAiModelsUseCase } from "~/config/testing/fakeListAiModelsUseCase.js";
import type { FakeListAiModelsUseCase } from "~/config/testing/fakeListAiModelsUseCase.js";
import { createFakeListAiToolsUseCase } from "~/config/testing/fakeListAiToolsUseCase.js";
import type { FakeListAiToolsUseCase } from "~/config/testing/fakeListAiToolsUseCase.js";
import { createFakeListAutomationDefinitionsUseCase } from "~/config/testing/fakeListAutomationDefinitionsUseCase.js";
import type { FakeListAutomationDefinitionsUseCase } from "~/config/testing/fakeListAutomationDefinitionsUseCase.js";
import { createFakeListNotificationTransportsUseCase } from "~/config/testing/fakeListNotificationTransportsUseCase.js";
import type { FakeListNotificationTransportsUseCase } from "~/config/testing/fakeListNotificationTransportsUseCase.js";
import { createFakeListStepTypesUseCase } from "~/config/testing/fakeListStepTypesUseCase.js";
import type { FakeListStepTypesUseCase } from "~/config/testing/fakeListStepTypesUseCase.js";
import { createFakeListWorkflowTeamsUseCase } from "~/config/testing/fakeListWorkflowTeamsUseCase.js";
import type { FakeListWorkflowTeamsUseCase } from "~/config/testing/fakeListWorkflowTeamsUseCase.js";
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorInitParams } from "~/editor/presentation/editor/abstractions.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createAiModel } from "~/editor/testing/editorFixtures.js";
import { createAiTool } from "~/editor/testing/editorFixtures.js";
import { createWorkflowTeamSummary } from "~/editor/testing/editorFixtures.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { createFakeEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { FakeWorkflowEditorUseCases } from "~/editor/testing/fakeWorkflowEditorUseCases.js";
import type { WorkflowEditorAppKind } from "~/editor/model/getStepTypeOptions.js";
import { createFakeAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import type { FakeEditorAppAdapter } from "~/editor/testing/fakeEditorAppAdapter.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

export interface EditorPresenterSetupOptions {
    // Whether the viewer has the workflows `editor` permission; default true.
    editor?: boolean;
    reassign?: boolean;
    appKind?: WorkflowEditorAppKind;
}

export interface EditorPresenterSetup {
    presenter: WorkflowEditorPresenter.Interface;
    container: Container;
    useCases: FakeWorkflowEditorUseCases;
    listStepTypes: FakeListStepTypesUseCase;
    listAutomationDefinitions: FakeListAutomationDefinitionsUseCase;
    listNotificationTransports: FakeListNotificationTransportsUseCase;
    listAiModels: FakeListAiModelsUseCase;
    listAiTools: FakeListAiToolsUseCase;
    listWorkflowTeams: FakeListWorkflowTeamsUseCase;
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
    toasts: FakeWorkflowEditorToasts;
    reviewUseCases: FakeReviewUseCases;
    app: FakeEditorAppAdapter;
    params: WorkflowEditorInitParams;
}

/*
 * A presenter with one fake per injected use case (R355) and fakes for everything else it talks
 * to. Defaults: the viewer is an editor; one model row `Article` bound to the workflow `Article
 * review` with one People step on the team `Editors` (Task 5's fakes); all three step types, the AI
 * editor present with one model and one tool; one automation covering every model; the e-mail
 * transport; one team; no user.
 */
export const createEditorPresenterSetup = (
    options: EditorPresenterSetupOptions = {}
): EditorPresenterSetup => {
    const permission: IPermission = {
        name: "workflows",
        editor: options.editor ?? true,
        reassign: options.reassign ?? false
    };
    const useCases = createFakeEditorUseCases();

    const stepTypes = createStepTypes();
    const listStepTypes = createFakeListStepTypesUseCase();
    listStepTypes.execute.mockResolvedValue(stepTypes);

    const webhookAutomation = createWebhookAutomation();
    const listAutomationDefinitions = createFakeListAutomationDefinitionsUseCase();
    listAutomationDefinitions.execute.mockResolvedValue([webhookAutomation]);

    const listNotificationTransports = createFakeListNotificationTransportsUseCase();

    const aiModel = createAiModel();
    const listAiModels = createFakeListAiModelsUseCase();
    listAiModels.execute.mockResolvedValue([aiModel]);

    const aiTool = createAiTool();
    const listAiTools = createFakeListAiToolsUseCase();
    listAiTools.execute.mockResolvedValue([aiTool]);

    const team = createWorkflowTeamSummary();
    const teamList: WorkflowTeamList = { teams: [team], missingIds: [] };
    const listWorkflowTeams = createFakeListWorkflowTeamsUseCase();
    listWorkflowTeams.execute.mockResolvedValue(teamList);

    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();

    const toasts = createFakeEditorToasts();
    const reviewUseCases = createFakeUseCases();
    const app = createFakeAppAdapter(options.appKind ?? "cms");

    const identityContext = createWorkflowsIdentityContext({ permissions: [permission] });
    const container = new Container();
    container.registerInstance(IdentityContext, identityContext);
    container.registerInstance(ListStepTypesUseCase, listStepTypes);
    container.registerInstance(ListAutomationDefinitionsUseCase, listAutomationDefinitions);
    container.registerInstance(ListNotificationTransportsUseCase, listNotificationTransports);
    container.registerInstance(ListAiModelsUseCase, listAiModels);
    container.registerInstance(ListAiToolsUseCase, listAiTools);
    container.registerInstance(ListWorkflowTeamsUseCase, listWorkflowTeams);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
    container.registerInstance(WorkflowEditorToasts, toasts);
    WorkflowEditorPresenterFeature.register(container);
    const presenter = container.resolve(WorkflowEditorPresenter);

    const params: WorkflowEditorInitParams = { useCases, reviewUseCases, app };

    return {
        presenter,
        container,
        useCases,
        listStepTypes,
        listAutomationDefinitions,
        listNotificationTransports,
        listAiModels,
        listAiTools,
        listWorkflowTeams,
        listWorkflowUsers,
        toasts,
        reviewUseCases,
        app,
        params
    };
};
```

Modify `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts` (the file as Task 2 wrote it; only the config fake changes).

Before:

```ts
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
```

After:

```ts
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

Before:

```ts
    getWorkflowSettings: FakeGetWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
}
```

After:

```ts
    getWorkflowSettings: FakeGetWorkflowSettingsUseCase;
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
}
```

Before:

```ts
 * `listUsers` finds nobody.
```

After:

```ts
 * `listWorkflowUsers` finds nobody.
```

Before:

```ts
    const config = createFakeConfigUseCases();

    const container = new Container();
    container.registerInstance(GetWorkflowSettingsUseCase, getWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
```

After:

```ts
    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();

    const container = new Container();
    container.registerInstance(GetWorkflowSettingsUseCase, getWorkflowSettings);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
```

Before:

```ts
    return { presenter, getWorkflowSettings, config };
```

After:

```ts
    return { presenter, getWorkflowSettings, listWorkflowUsers };
```

Modify `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts` (the file as Task 2 wrote it).

Before:

```ts
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
```

After:

```ts
import { createFakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
import type { FakeListWorkflowUsersUseCase } from "~/config/testing/fakeListWorkflowUsersUseCase.js";
```

Before:

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
```

After:

```ts
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

Before:

```ts
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
```

After:

```ts
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    listWorkflowUsers: FakeListWorkflowUsersUseCase;
    toasts: FakeWorkflowEditorToasts;
```

Before:

```ts
    const config = createFakeConfigUseCases();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
```

After:

```ts
    const listWorkflowUsers = createFakeListWorkflowUsersUseCase();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(ListWorkflowUsersUseCase, listWorkflowUsers);
```

Before:

```ts
    return { presenter, updateWorkflowSettings, config, toasts };
```

After:

```ts
    return { presenter, updateWorkflowSettings, listWorkflowUsers, toasts };
```

Rename the fake access in the presenter tests. Save this script as `.superpowers/sdd/layers-exec/renameConfigFakes.mjs` (`.superpowers` is excluded from git; the script is never committed):

```js
import fs from "node:fs";

// Old config bundle method -> the name of the use-case fake the setup kits return.
const RENAMES = {
    listStepTypes: "listStepTypes",
    listAutomationDefinitions: "listAutomationDefinitions",
    listNotificationTransports: "listNotificationTransports",
    listTeams: "listWorkflowTeams",
    listUsers: "listWorkflowUsers",
    listAiModels: "listAiModels",
    listAiTools: "listAiTools"
};

const DESTRUCTURE =
    /const \{([^}]*)\} = (create(?:EditorPresenter|ExclusionsPage|ExclusionDialog)Setup)\(/g;
const BARE_ACCESS = /(?<![.\w])config\.(list[A-Za-z]+)\b/g;
const OWNED_ACCESS = /\b(\w+)\.config\.(list[A-Za-z]+)\b/g;

const toName = method => {
    const name = RENAMES[method];
    if (!name) {
        throw new Error(`Unknown config method "${method}".`);
    }
    return name;
};

// A destructuring's region runs to the next kit call, so each test renames only what it uses.
const rewrite = source => {
    const text = source.replace(OWNED_ACCESS, (match, owner, method) => {
        return `${owner}.${toName(method)}.execute`;
    });
    const matches = [...text.matchAll(DESTRUCTURE)];
    let result = "";
    let cursor = 0;
    matches.forEach((match, index) => {
        const regionEnd = index + 1 < matches.length ? matches[index + 1].index : text.length;
        const keys = match[1];
        let head = match[0];
        let region = text.slice(match.index + match[0].length, regionEnd);
        if (/\bconfig\b/.test(keys)) {
            const names = [];
            region = region.replace(BARE_ACCESS, (access, method) => {
                const name = toName(method);
                if (!names.includes(name)) {
                    names.push(name);
                }
                return `${name}.execute`;
            });
            if (names.length === 0) {
                throw new Error(`A destructuring takes config but never uses it: ${head}`);
            }
            const newKeys = keys.replace(/\bconfig\b/, names.join(", "));
            head = `const {${newKeys}} = ${match[2]}(`;
        }
        result += text.slice(cursor, match.index) + head + region;
        cursor = regionEnd;
    });
    result += text.slice(cursor);
    return result;
};

const files = process.argv.slice(2);
let failed = false;
for (const file of files) {
    const source = fs.readFileSync(file, "utf-8");
    const output = rewrite(source);
    if (/(?<![.\w])config\.list|\.config\.list/.test(output)) {
        console.error(`${file}: a config fake access is left.`);
        failed = true;
    }
    fs.writeFileSync(file, output);
}
if (failed) {
    process.exit(1);
}
```

Run it on the 15 files (the script exits non-zero and names the file if any config access is left):

```bash
mkdir -p .superpowers/sdd/layers-exec
node .superpowers/sdd/layers-exec/renameConfigFakes.mjs \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts
git diff --stat -- packages/app-workflows/src/editor/presentation/editor packages/app-workflows/src/settings/presentation
```

Expected (checked on copies of the files at HEAD with Task 2's renames applied): the script exits 0 and every changed line is replaced in place, 229 lines in these 15 files (`git diff --stat` shows each file's count as insertions and the same number of deletions): `cards` 3, `flow` 16, `init` 25, `inspectionNames` 16, `options` 22, `references` 32, `ruleErrors` 2, `stepWarnings` 3, `teamSearch` 29, `teams` 20, `ExclusionDialogPresenter.add` 12, `.edit` 2, `.errors` 1, `ExclusionsPagePresenter.load` 2, `.names` 44. For example, `WorkflowEditorPresenter.teams.test.ts` lines 40-41 now read:

```ts
        const { presenter, params, useCases, listAutomationDefinitions, listWorkflowTeams } = createEditorPresenterSetup();
        listAutomationDefinitions.execute.mockResolvedValue([
```

and `ExclusionDialogPresenter.edit.test.ts` line 87:

```ts
        expect(setup.listWorkflowUsers.execute).not.toHaveBeenCalled();
```

`yarn format:fix` (Step 6) wraps the long destructurings. Only fake access changes: no expected value, no call argument, no test name.

- [ ] **Step 2: Run the tests, expect failure**

One command at a time:

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -50
```

Expected: every case fails in its kit while resolving the presenter: the kits no longer register `Workflows/WorkflowConfigUseCases`, which the three presenters still list in `dependencies` (a `@webiny/di` resolve error naming that token).

- [ ] **Step 3: Implement**

**3a. `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`.**

Before (line 42):

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
```

After:

```ts
import { ListAiModelsUseCase } from "~/config/useCases/listAiModels/abstractions.js";
import { ListAiToolsUseCase } from "~/config/useCases/listAiTools/abstractions.js";
import { ListAutomationDefinitionsUseCase } from "~/config/useCases/listAutomationDefinitions/abstractions.js";
import { ListNotificationTransportsUseCase } from "~/config/useCases/listNotificationTransports/abstractions.js";
import { ListStepTypesUseCase } from "~/config/useCases/listStepTypes/abstractions.js";
import { ListWorkflowTeamsUseCase } from "~/config/useCases/listWorkflowTeams/abstractions.js";
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

Before (constructor and the first observable-map key):

```ts
    constructor(
        private config: WorkflowConfigUseCases.Interface,
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            WorkflowEditorPresenterImpl,
            | "config"
            | "identityContext"
```

After:

```ts
    constructor(
        private listStepTypesUseCase: ListStepTypesUseCase.Interface,
        private listAutomationDefinitionsUseCase: ListAutomationDefinitionsUseCase.Interface,
        private listNotificationTransportsUseCase: ListNotificationTransportsUseCase.Interface,
        private listAiModelsUseCase: ListAiModelsUseCase.Interface,
        private listAiToolsUseCase: ListAiToolsUseCase.Interface,
        private listWorkflowTeamsUseCase: ListWorkflowTeamsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface,
        private identityContext: IdentityContext.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            WorkflowEditorPresenterImpl,
            | "listStepTypesUseCase"
            | "listAutomationDefinitionsUseCase"
            | "listNotificationTransportsUseCase"
            | "listAiModelsUseCase"
            | "listAiToolsUseCase"
            | "listWorkflowTeamsUseCase"
            | "listWorkflowUsersUseCase"
            | "identityContext"
```

Before (line 254):

```ts
        >(this, {
            config: false,
            identityContext: false,
```

After:

```ts
        >(this, {
            listStepTypesUseCase: false,
            listAutomationDefinitionsUseCase: false,
            listNotificationTransportsUseCase: false,
            listAiModelsUseCase: false,
            listAiToolsUseCase: false,
            listWorkflowTeamsUseCase: false,
            listWorkflowUsersUseCase: false,
            identityContext: false,
```

Before (the registration, line 2006):

```ts
export const WorkflowEditorPresenter = Abstraction.createImplementation({
    implementation: WorkflowEditorPresenterImpl,
    dependencies: [WorkflowConfigUseCases, IdentityContext, WorkflowEditorToasts]
});
```

After:

```ts
export const WorkflowEditorPresenter = Abstraction.createImplementation({
    implementation: WorkflowEditorPresenterImpl,
    dependencies: [
        ListStepTypesUseCase,
        ListAutomationDefinitionsUseCase,
        ListNotificationTransportsUseCase,
        ListAiModelsUseCase,
        ListAiToolsUseCase,
        ListWorkflowTeamsUseCase,
        ListWorkflowUsersUseCase,
        IdentityContext,
        WorkflowEditorToasts
    ]
});
```

**3b. `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`** (the file as Task 2 left it).

Before (line 8):

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
```

After:

```ts
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

Before:

```ts
        private getWorkflowSettingsUseCase: GetWorkflowSettingsUseCase.Interface,
        private config: WorkflowConfigUseCases.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            | "getWorkflowSettingsUseCase"
            | "config"
```

After:

```ts
        private getWorkflowSettingsUseCase: GetWorkflowSettingsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            | "getWorkflowSettingsUseCase"
            | "listWorkflowUsersUseCase"
```

Before:

```ts
            getWorkflowSettingsUseCase: false,
            config: false,
```

After:

```ts
            getWorkflowSettingsUseCase: false,
            listWorkflowUsersUseCase: false,
```

Before:

```ts
    dependencies: [GetWorkflowSettingsUseCase, WorkflowConfigUseCases]
```

After:

```ts
    dependencies: [GetWorkflowSettingsUseCase, ListWorkflowUsersUseCase]
```

**3c. `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`** (the file as Task 2 left it).

Before (line 8):

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
```

After:

```ts
import { ListWorkflowUsersUseCase } from "~/config/useCases/listWorkflowUsers/abstractions.js";
```

Before:

```ts
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface,
        private config: WorkflowConfigUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "updateWorkflowSettingsUseCase"
            | "config"
```

After:

```ts
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface,
        private listWorkflowUsersUseCase: ListWorkflowUsersUseCase.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "updateWorkflowSettingsUseCase"
            | "listWorkflowUsersUseCase"
```

Before:

```ts
            updateWorkflowSettingsUseCase: false,
            config: false,
```

After:

```ts
            updateWorkflowSettingsUseCase: false,
            listWorkflowUsersUseCase: false,
```

Before:

```ts
    dependencies: [UpdateWorkflowSettingsUseCase, WorkflowConfigUseCases, WorkflowEditorToasts]
```

After:

```ts
    dependencies: [UpdateWorkflowSettingsUseCase, ListWorkflowUsersUseCase, WorkflowEditorToasts]
```

**3d. The call sites.** The three presenters call the bundle in 14 places (`WorkflowEditorPresenter.ts` lines 744, 755, 1165-1167, 1180-1181, 1322, 1782, 1788, 1904, 1944, 1978; `ExclusionsPagePresenter.ts` line 277; `ExclusionDialogPresenter.ts` line 411). Each call keeps its arguments; only the receiver and method change. Apply exactly:

```bash
perl -pi -e 's/this\.config\.listStepTypes\(/this.listStepTypesUseCase.execute(/g; s/this\.config\.listAutomationDefinitions\(/this.listAutomationDefinitionsUseCase.execute(/g; s/this\.config\.listNotificationTransports\(/this.listNotificationTransportsUseCase.execute(/g; s/this\.config\.listAiModels\(/this.listAiModelsUseCase.execute(/g; s/this\.config\.listAiTools\(/this.listAiToolsUseCase.execute(/g; s/this\.config\.listTeams\(/this.listWorkflowTeamsUseCase.execute(/g; s/this\.config\.listUsers\(/this.listWorkflowUsersUseCase.execute(/g' \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts
grep -n "this\.config\b\|WorkflowConfigUseCases" \
  packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts
```

Expected: the grep prints nothing. For example, `WorkflowEditorPresenter.ts` `loadOptions` now reads:

```ts
    private async loadOptions(): Promise<void> {
        const token = this.beginOptionsLoad();
        const [types, automations, transports] = await Promise.allSettled([
            this.listStepTypesUseCase.execute(),
            this.listAutomationDefinitionsUseCase.execute(),
            this.listNotificationTransportsUseCase.execute()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyCoreOptions(types, automations, transports);

        // The AI lists exist only with the AI editor (R275); without it they are not requested.
        if (!isAiEditable(this.stepTypes.items)) {
            this.applyAiNotRequested();
            return;
        }
        const [models, tools] = await Promise.allSettled([
            this.listAiModelsUseCase.execute(),
            this.listAiToolsUseCase.execute()
        ]);
        if (token !== this.optionsToken) {
            return;
        }
        this.applyAiOptions(models, tools);
    }
```

and `ExclusionDialogPresenter.ts` `runUserSearch`:

```ts
        try {
            const result = await this.listWorkflowUsersUseCase.execute({
                search: query,
                ids: null,
                teamIds: null,
                limit: USER_SEARCH_LIMIT
            });
```

- [ ] **Step 4: Run the changed tests, expect pass**

One command at a time:

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.cards.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.flow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.init.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.inspectionNames.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ruleErrors.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.stepWarnings.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teams.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -50
```

Expected: every file passes with the same number of cases as before the task.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

The presenter tests that use the kits without a config fake, the remove dialog, the composition root and the bridge's feature test, one command at a time:

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.delete.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.models.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.overlap.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.save.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.saveFailures.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; the build prints no TypeScript error (it type-checks the kits, the fakes and the renamed tests). `app.test.tsx` resolves the real `WorkflowEditorPresenter`, `ExclusionsPagePresenter` and `ExclusionDialogPresenter` over the real config use cases of `WorkflowConfigServicesFeature`, which proves the new `dependencies` resolve in the composition root.

Check that no consumer reaches the bundle any more (Review Focus 8):

```bash
grep -rln "WorkflowConfigUseCases\|createFakeConfigUseCases\|FakeWorkflowConfigUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

Expected, exactly these files (all deleted or trimmed by Task 14, R358, R364): `packages/app-workflows/src/app.test.tsx`, `packages/app-workflows/src/editor/feature.ts`, `packages/app-workflows/src/editor/feature.test.ts`, `packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts`, `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts`, `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts`, `packages/app-workflows/src/editor/useCases/abstractions.ts`.

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
git commit -m "refactor(app-workflows): inject the config use cases into the editor and settings presenters" -m "WorkflowEditorPresenter injects the seven config use cases, ExclusionsPagePresenter and ExclusionDialogPresenter inject ListWorkflowUsersUseCase, in place of the WorkflowConfigUseCases bundle. The editor and settings test kits register one fake per injected use case and return it by name; the presenter tests change only how they reach the fakes. The bundle stays registered as a bridge until the cleanup." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports`, `.superpowers` (the rename script stays there) or the script itself; never push, amend or revert.

## Contract notes

- **Field names with the `UseCase` suffix** (`this.listWorkflowUsersUseCase.execute(...)`) follow the controller's cross-sub-phase ruling (consistency-items) and Task 2's settings presenters (`this.getWorkflowSettingsUseCase.execute()`); the contract names only the tokens. None of the seven names is already a member of the three presenters (checked at HEAD). The kits' return keys stay unsuffixed (R355).
- **Per-use-case fake factories in `[AWC]/testing/`** instead of fakes written inline in each kit (Task 2's form for the settings fakes): the seven config fakes are shared by three kits (and Task 6's editor kit), so one factory per use case keeps the old defaults in one place. Each factory returns one fresh single-operation fake per call, which is what R355 asks; none implements several operations.
- **Settings kit and presenter hunks are written against Task 2's text** (`task-02-settings-presenters.md` Step 1 and Step 3): the before blocks quote the lines Task 2 leaves (the fields `getWorkflowSettingsUseCase`, `updateWorkflowSettingsUseCase`, `config` in its old position, R352; the kit keys `getWorkflowSettings`, `updateWorkflowSettings`). If Task 2 changes during review, only the neighbouring settings lines of these hunks move; the config lines do not.
- **The rename script** is a one-off tool, not a committed file: it is the exact form of a mechanical rename over 229 lines, verified on copies of the 15 files at HEAD with Task 2's renames applied. Its counts are in Step 1.
- **No explicit "dependencies equal R352" test** is added: the kits register only the R352 tokens (a presenter asking for more fails to resolve, as Step 2 shows), and every injected use case is exercised by an existing behaviour test (fewer would fail it). `app.test.tsx` resolves the three presenters in the real composition root.
- Size: medium-large (seven small fakes, one kit rewrite, two kit and three presenter hunk sets, a scripted rename over 15 test files).

## Review fixes (sub-phase review)

- Consistency ruling (injected use-case fields keep the `UseCase` suffix): `WorkflowEditorPresenter` fields, `makeAutoObservable` keys and calls are now `listStepTypesUseCase`, `listAutomationDefinitionsUseCase`, `listNotificationTransportsUseCase`, `listAiModelsUseCase`, `listAiToolsUseCase`, `listWorkflowTeamsUseCase`, `listWorkflowUsersUseCase` (Step 3a, the 3d perl replacements and both example excerpts); the settings presenters' new field is `listWorkflowUsersUseCase` (3b, 3c).
- The 3b and 3c "before" hunks now quote Task 2's renamed fields (`getWorkflowSettingsUseCase`, `updateWorkflowSettingsUseCase`), so they apply to the file as Task 2 leaves it.
- The "Fields and calls" bullet, the Task 2 entry under Consumes and the two field-name contract notes now state the suffixed form; the kits' return keys and the test rename script stay unsuffixed (R355).
- Checked against HEAD, no other change: the import on line 42, the constructor, `config: false` on line 254, the registration on line 2006-2009 and the 14 `this.config.*` call sites of `WorkflowEditorPresenter.ts`; the two settings presenters' only `this.config` calls (lines 277, 411); the old aggregate fake's defaults match the seven new factories; the editor kit's overrides are kept.
