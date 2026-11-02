### Task 2: Settings presenters inject their use cases

R342, R343, R352 (settings rows), R355, R356; Q70, Q74; 9c R317-R327 (the behaviour these tests pin); 8a R234, R243; Review Focus 8 (`00-shared.md`). The Global Constraints of this plan apply, and with them those of 9c, 9b, 9a, 8b and 8a: one named import per line, no inline object types, namespace types, comments end with a period, targeted tests by path, the pre-commit chain, the two commit trailer lines.

The three settings presenters stop injecting the `WorkflowSettingsUseCases` bundle and inject the one use case each of them calls. `ExclusionsPagePresenter` calls `GetWorkflowSettingsUseCase`. `ExclusionDialogPresenter` and `RemoveExclusionDialogPresenter` call `UpdateWorkflowSettingsUseCase`. The user lookups (`listUsers`) stay on `WorkflowConfigUseCases`, in the bundle's old position after the settings use case, until Task 4 (R352). After this task nothing injects the `WorkflowSettingsUseCases` bridge. Task 14 deletes it.

- **Dependencies after this task (R352, settings part):**
  - `ExclusionsPagePresenter` `[GetWorkflowSettingsUseCase, WorkflowConfigUseCases]`.
  - `ExclusionDialogPresenter` `[UpdateWorkflowSettingsUseCase, WorkflowConfigUseCases, WorkflowEditorToasts]`.
  - `RemoveExclusionDialogPresenter` `[UpdateWorkflowSettingsUseCase, WorkflowEditorToasts]`.
- **Calls:** `this.settingsUseCases.getSettings()` becomes `this.getWorkflowSettingsUseCase.execute()`. Each `this.settings.updateSettings({ exclusions })` becomes `this.updateWorkflowSettingsUseCase.execute({ exclusions })`. Both private fields stay non-observable in `makeAutoObservable`.
- **Test kits (R355):** `createExclusionsPageSetup` registers one fresh `{ execute: vi.fn() }` under `GetWorkflowSettingsUseCase` and returns it as `getWorkflowSettings`. `createExclusionDialogSetup` does the same under `UpdateWorkflowSettingsUseCase` and returns `updateWorkflowSettings`. Their defaults stay what the bundle fake gave: the read resolves `{ exclusions }`, the page's save resolves `{ exclusions }`, and the dialog's save echoes the list it was sent. `config` stays the `createFakeConfigUseCases` fake until Task 4. `RemoveExclusionDialogPresenter.test.ts` builds its own `updateWorkflowSettings` fake the same way. No kit exposes an object that implements several operations.
- **Tests:** every behaviour assertion stays. Only the fake access changes: `settings.getSettings` becomes `getWorkflowSettings.execute`, and `setup.settings.updateSettings` becomes `setup.updateWorkflowSettings.execute`. One new case in `RemoveExclusionDialogPresenter.test.ts` proves that the presenter resolves over exactly its R352 dependencies. The two setups prove the same for the other two presenters, because they register only the R352 tokens and every test resolves through them.
- **Feature files:** the three presenter `feature.ts` files list no dependencies (they `register` the implementation, which declares its own), so they do not change.

**Files:**
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`
- Modify: `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts`
- Modify (rewrite): `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts`
- Modify: `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts`
- Modify (fake access only): `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts`, `ExclusionsPagePresenter.dialogs.test.ts`
- Modify (fake access only): `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts`, `ExclusionDialogPresenter.edit.test.ts`, `ExclusionDialogPresenter.errors.test.ts`
- Unchanged, run: `ExclusionsPagePresenter.rows.test.ts`, `ExclusionsPagePresenter.names.test.ts` (they use the setup but not the settings fake)

**Interfaces:**
- Consumes: Task 1 (`GetWorkflowSettingsUseCase` and `UpdateWorkflowSettingsUseCase` from `~/settings/useCases/getWorkflowSettings/abstractions.js` and `~/settings/useCases/updateWorkflowSettings/abstractions.js`; `.Interface`, `UpdateWorkflowSettingsUseCase.Params = WorkflowSettings`). Existing, verified at HEAD: `WorkflowConfigUseCases` (`~/editor/useCases/abstractions.js`), `createFakeConfigUseCases` and `FakeWorkflowConfigUseCases` (`~/editor/testing/fakeWorkflowConfigUseCases.js`), `WorkflowEditorToasts` (`~/editor/toasts/abstractions.js`), `createFakeEditorToasts` and `FakeWorkflowEditorToasts` (`~/editor/testing/fakeWorkflowEditorToasts.js`), `ExclusionsPagePresenterFeature`, `ExclusionDialogPresenterFeature`, `RemoveExclusionDialogPresenterFeature`, `WorkflowExclusion` and `WorkflowSettings` (`~/settings/domain/types.js`).
- Produces: the R352 settings rows. `ExclusionsPageSetup { presenter; getWorkflowSettings: FakeGetWorkflowSettingsUseCase; config }` and `FakeGetWorkflowSettingsUseCase` (`[AWST]/exclusionsPageSetup.ts`). `ExclusionDialogSetup { presenter; updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase; config; toasts }` and `FakeUpdateWorkflowSettingsUseCase` (`[AWST]/exclusionDialogSetup.ts`). Task 4 replaces `config` in both kits with a `listWorkflowUsers` fake.

**Test runner note:** admin package. Run `yarn test <path>` one file at a time. Type-check with `yarn check:test:types -p app-workflows --report cli` together with the package build.

- [ ] **Step 1: Write the failing tests**

Replace `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
import { GetWorkflowSettingsUseCase } from "~/settings/useCases/getWorkflowSettings/abstractions.js";

export interface FakeGetWorkflowSettingsUseCase {
    execute: Mock<GetWorkflowSettingsUseCase.Interface["execute"]>;
}

export interface ExclusionsPageSetup {
    presenter: ExclusionsPagePresenter.Interface;
    getWorkflowSettings: FakeGetWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
}

/*
 * A page presenter over one fake per injected use case (R355): `getWorkflowSettings` resolves
 * `{ exclusions }` (the same array every time, so a test can check that the page keeps it), and
 * `listUsers` finds nobody.
 */
export const createExclusionsPageSetup = (
    exclusions: WorkflowExclusion[] = []
): ExclusionsPageSetup => {
    const getWorkflowSettings: FakeGetWorkflowSettingsUseCase = {
        execute: vi.fn().mockResolvedValue({ exclusions })
    };
    const config = createFakeConfigUseCases();

    const container = new Container();
    container.registerInstance(GetWorkflowSettingsUseCase, getWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
    ExclusionsPagePresenterFeature.register(container);
    const presenter = container.resolve(ExclusionsPagePresenter);

    return { presenter, getWorkflowSettings, config };
};
```

The old kit also set `updateSettings.mockResolvedValue({ exclusions })`. The page presenter never calls a save (its dialogs do), so that default has no counterpart here.

Replace `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/abstractions.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";

export interface FakeUpdateWorkflowSettingsUseCase {
    execute: Mock<UpdateWorkflowSettingsUseCase.Interface["execute"]>;
}

export interface ExclusionDialogSetup {
    presenter: ExclusionDialogPresenter.Interface;
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// The server returns the saved record (A108); the fake answers the list it was sent.
const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

// An Add / Edit dialog presenter over one fake per injected use case (R355).
export const createExclusionDialogSetup = (): ExclusionDialogSetup => {
    const updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase = {
        execute: vi.fn(echoSettings)
    };
    const config = createFakeConfigUseCases();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    ExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(ExclusionDialogPresenter);

    return { presenter, updateWorkflowSettings, config, toasts };
};
```

Modify `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts`.

Before (imports):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
```

After:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
```

Before (imports):

```ts
import { createFakeSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

After:

```ts
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";
```

Before (the setup):

```ts
interface RemoveSetup {
    presenter: RemoveExclusionDialogPresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// A Remove dialog presenter over fakes; `updateSettings` echoes the list it was sent.
const createRemoveSetup = (): RemoveSetup => {
    const settings = createFakeSettingsUseCases();
    settings.updateSettings.mockImplementation(async data => data);
    const toasts = createFakeEditorToasts();
    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowEditorToasts, toasts);
    RemoveExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(RemoveExclusionDialogPresenter);
    return { presenter, settings, toasts };
};
```

After:

```ts
interface FakeUpdateWorkflowSettingsUseCase {
    execute: Mock<UpdateWorkflowSettingsUseCase.Interface["execute"]>;
}

interface RemoveSetup {
    presenter: RemoveExclusionDialogPresenter.Interface;
    updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase;
    toasts: FakeWorkflowEditorToasts;
}

// The server returns the saved record (A108); the fake answers the list it was sent.
const echoSettings = (settings: WorkflowSettings): Promise<WorkflowSettings> => {
    return Promise.resolve(settings);
};

/*
 * A Remove dialog presenter over one fake per injected use case (R355). The container holds
 * exactly the presenter's R352 dependencies, so resolving it proves it needs nothing else.
 */
const createRemoveSetup = (): RemoveSetup => {
    const updateWorkflowSettings: FakeUpdateWorkflowSettingsUseCase = {
        execute: vi.fn(echoSettings)
    };
    const toasts = createFakeEditorToasts();
    const container = new Container();
    container.registerInstance(UpdateWorkflowSettingsUseCase, updateWorkflowSettings);
    container.registerInstance(WorkflowEditorToasts, toasts);
    RemoveExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(RemoveExclusionDialogPresenter);
    return { presenter, updateWorkflowSettings, toasts };
};
```

Before (the first case of the describe block):

```ts
    it("asks to remove the named user", () => {
```

After:

```ts
    it("resolves over UpdateWorkflowSettingsUseCase and the toasts only (R352)", () => {
        expect(setup.presenter).toBeDefined();
        expect(setup.updateWorkflowSettings.execute).not.toHaveBeenCalled();
    });

    it("asks to remove the named user", () => {
```

The file still uses `WorkflowSettings` (already imported as a type, line 12) in the echo above.

Then change the fake access in the remaining test files. These are exact, whole-token replacements, applied with `perl` so the word boundaries are the same on macOS and Linux:

```bash
perl -pi -e 's/setup\.settings\.updateSettings\b/setup.updateWorkflowSettings.execute/g' \
  packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts

perl -pi -e 's/const \{ presenter, settings, config \} = /const { presenter, getWorkflowSettings, config } = /g; s/const \{ presenter, settings \} = /const { presenter, getWorkflowSettings } = /g; s/\bsettings\.getSettings\b/getWorkflowSettings.execute/g' \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts \
  packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts
```

What the replacements touch (checked against HEAD):
- `RemoveExclusionDialogPresenter.test.ts`: lines 104, 105, 117, 125, 145, 158, 176, 187, 191, 203, 208, 217, 233.
- `ExclusionDialogPresenter.add.test.ts`: lines 150, 151, 167, 180, 190, 205, 264.
- `ExclusionDialogPresenter.edit.test.ts`: lines 45, 189, 270.
- `ExclusionDialogPresenter.errors.test.ts`: lines 60, 83, 98, 107, 114, 124, 129, 140, 158, 186, 204, 210.
- `ExclusionsPagePresenter.load.test.ts`: the destructuring on lines 30, 43, 53, 73, 82, 100, 113, 127, 142, and `settings.getSettings` on lines 34, 48, 55, 77, 78, 83, 94, 105, 118, 129, 130, 144.
- `ExclusionsPagePresenter.dialogs.test.ts`: the destructuring on lines 38, 51, and `settings.getSettings` on lines 40, 52.

A `settings:` object key (`applySaved({ settings: ... })`, `settingsSaved({ settings: ... })`) and the copy text `"Could not read the settings."` are not touched. Check that nothing of the old fake is left:

```bash
grep -rn "settings\.getSettings\|settings\.updateSettings\|createFakeSettingsUseCases\|WorkflowSettingsUseCases" packages/app-workflows/src/settings/presentation packages/app-workflows/src/settings/testing
```

Expected: only `packages/app-workflows/src/settings/testing/fakeWorkflowSettingsUseCases.ts` itself (it stays until Task 14, R358) and the three presenter sources, which Step 3 changes.

For example, `ExclusionsPagePresenter.load.test.ts` lines 72-79 now read:

```ts
    it("asks the use case once, which always includes expired entries (Task 3)", async () => {
        const { presenter, getWorkflowSettings } = createExclusionsPageSetup();

        await presenter.init(MANAGE);

        expect(getWorkflowSettings.execute).toHaveBeenCalledTimes(1);
        expect(getWorkflowSettings.execute).toHaveBeenCalledWith();
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -30
```

Expected: every case fails in its setup. The presenters still depend on `WorkflowSettingsUseCases`, which none of the containers registers any more, so `container.resolve(...)` throws a DI error naming `Workflows/WorkflowSettingsUseCases`. Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`.

Before (imports, line 18):

```ts
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

After:

```ts
import { GetWorkflowSettingsUseCase } from "~/settings/useCases/getWorkflowSettings/abstractions.js";
```

Before (constructor):

```ts
    constructor(
        private settingsUseCases: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            | "settingsUseCases"
            | "config"
            | "exclusions"
            | "names"
            | "dialog"
            | "loadToken"
            | "namesToken"
        >(this, {
            settingsUseCases: false,
            config: false,
```

After:

```ts
    constructor(
        private getWorkflowSettingsUseCase: GetWorkflowSettingsUseCase.Interface,
        private config: WorkflowConfigUseCases.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            | "getWorkflowSettingsUseCase"
            | "config"
            | "exclusions"
            | "names"
            | "dialog"
            | "loadToken"
            | "namesToken"
        >(this, {
            getWorkflowSettingsUseCase: false,
            config: false,
```

Before (the load):

```ts
        let settings: WorkflowSettings;
        try {
            settings = await this.settingsUseCases.getSettings();
        } catch (error) {
```

After:

```ts
        let settings: WorkflowSettings;
        try {
            settings = await this.getWorkflowSettingsUseCase.execute();
        } catch (error) {
```

Before (the registration):

```ts
export const ExclusionsPagePresenter = Abstraction.createImplementation({
    implementation: ExclusionsPagePresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases]
});
```

After:

```ts
export const ExclusionsPagePresenter = Abstraction.createImplementation({
    implementation: ExclusionsPagePresenterImpl,
    dependencies: [GetWorkflowSettingsUseCase, WorkflowConfigUseCases]
});
```

Modify `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`.

Before (imports, line 22):

```ts
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

After:

```ts
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";
```

Before (constructor):

```ts
    constructor(
        private settings: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "settings"
            | "config"
```

After:

```ts
    constructor(
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface,
        private config: WorkflowConfigUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "updateWorkflowSettingsUseCase"
            | "config"
```

Before:

```ts
        >(this, {
            settings: false,
            config: false,
            toasts: false,
```

After:

```ts
        >(this, {
            updateWorkflowSettingsUseCase: false,
            config: false,
            toasts: false,
```

Before (the save):

```ts
        let saved: WorkflowSettings;
        try {
            saved = await this.settings.updateSettings({ exclusions });
        } catch (error) {
```

After:

```ts
        let saved: WorkflowSettings;
        try {
            saved = await this.updateWorkflowSettingsUseCase.execute({ exclusions });
        } catch (error) {
```

Before (the registration):

```ts
export const ExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: ExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases, WorkflowEditorToasts]
});
```

After:

```ts
export const ExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: ExclusionDialogPresenterImpl,
    dependencies: [UpdateWorkflowSettingsUseCase, WorkflowConfigUseCases, WorkflowEditorToasts]
});
```

Modify `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.ts`.

Before (imports, line 8):

```ts
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

After:

```ts
import { UpdateWorkflowSettingsUseCase } from "~/settings/useCases/updateWorkflowSettings/abstractions.js";
```

Before (constructor):

```ts
    constructor(
        private settings: WorkflowSettingsUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            RemoveExclusionDialogPresenterImpl,
            "settings" | "toasts" | "source" | "runToken"
        >(this, {
            settings: false,
            toasts: false,
```

After:

```ts
    constructor(
        private updateWorkflowSettingsUseCase: UpdateWorkflowSettingsUseCase.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            RemoveExclusionDialogPresenterImpl,
            "updateWorkflowSettingsUseCase" | "toasts" | "source" | "runToken"
        >(this, {
            updateWorkflowSettingsUseCase: false,
            toasts: false,
```

Before (the save):

```ts
        let saved: WorkflowSettings;
        try {
            saved = await this.settings.updateSettings({ exclusions });
        } catch (error) {
```

After:

```ts
        let saved: WorkflowSettings;
        try {
            saved = await this.updateWorkflowSettingsUseCase.execute({ exclusions });
        } catch (error) {
```

Before (the registration):

```ts
export const RemoveExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: RemoveExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowEditorToasts]
});
```

After:

```ts
export const RemoveExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: RemoveExclusionDialogPresenterImpl,
    dependencies: [UpdateWorkflowSettingsUseCase, WorkflowEditorToasts]
});
```

- [ ] **Step 4: Run the tests, expect pass**

Run one command after the other:

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -30
```

Expected: all pass, with the same number of cases as before plus the one new R352 case in `RemoveExclusionDialogPresenter.test.ts`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPageDialogs.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/mounting/ExclusionsSettings.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

`app.test.tsx` resolves the three presenters on the real `WorkflowsAdminApp` container, which proves that `WorkflowSettingsServicesFeature` registers what they now inject. The component tests use fake presenters and must stay green. Then check the R352 settings rows and that the bridge has no consumer left:

```bash
grep -rn "WorkflowSettingsUseCases" packages/app-workflows/src --include=*.ts --include=*.tsx
```

Expected: only `settings/useCases/abstractions.ts`, `settings/useCases/IWorkflowSettingsUseCases.ts` (the name contains the string), `settings/useCases/WorkflowSettingsUseCases.ts`, `settings/feature.ts`, `settings/feature.test.ts`, `app.test.tsx` and `settings/testing/fakeWorkflowSettingsUseCases.ts`. These are the bridge, its registration, its two root assertions and its fake, which Task 14 deletes (R358). No presenter.

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
git commit -m "refactor(app-workflows): inject the settings use cases into the settings presenters" -m "ExclusionsPagePresenter injects GetWorkflowSettingsUseCase. ExclusionDialogPresenter and RemoveExclusionDialogPresenter inject UpdateWorkflowSettingsUseCase. The user lookups stay on WorkflowConfigUseCases for now. The test kits register one fake per injected use case. No behaviour change." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file or fails, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. Never push, amend or revert.

## Contract notes

- **Field names:** the contract fixes the dependency arrays (R352), not the private field names. Per the controller's cross-sub-phase ruling (consistency-items), every injected use-case field is the use-case class name in camelCase with the `UseCase` suffix (`getWorkflowSettingsUseCase`, `updateWorkflowSettingsUseCase`), the same form in L1-L4. The kits keep returning the fakes by use-case name without the suffix (`getWorkflowSettings`, `updateWorkflowSettings`, R355 `setup.listWorkflowUsers.execute` form).
- **Fake types:** `FakeGetWorkflowSettingsUseCase` and `FakeUpdateWorkflowSettingsUseCase` are exported from the setup that builds them. `RemoveExclusionDialogPresenter.test.ts` keeps its own local setup, as it does today, with a local `FakeUpdateWorkflowSettingsUseCase` interface. No new testing file and no aggregate fake.
- **`createFakeSettingsUseCases`** has no importer after this task but is not deleted here. R358 gives its deletion to Task 14.
- **R352 proof:** Review Focus 8 asks that each presenter's dependencies equal its row. The setups register exactly those tokens (plus `WorkflowConfigUseCases`, which the row keeps until Task 4), so a presenter that injected anything else would fail every test at `resolve`. The Remove test also states it as its own case.
- Size: small to medium (three presenter hunks, two rewritten kits, one test-setup hunk, mechanical fake-access edits in five test files).

## Review fixes (sub-phase review)

- Consistency ruling (injected use-case fields keep the `UseCase` suffix): the presenter fields, their `makeAutoObservable` keys and calls are now `getWorkflowSettingsUseCase` (`ExclusionsPagePresenter`) and `updateWorkflowSettingsUseCase` (`ExclusionDialogPresenter`, `RemoveExclusionDialogPresenter`) in the Calls bullet and every Step 3 "after" hunk. The kits' return keys stay `getWorkflowSettings` / `updateWorkflowSettings` (R355 by-name form), so the test renames are unchanged.
- The "Field names" contract note now states the ruling.
- Checked against HEAD, no other change: every "before" hunk of the three presenters, the two kits and `RemoveExclusionDialogPresenter.test.ts`; the perl renames cover every `settings` fake access in the five test files (no other `settings` destructuring or access exists); the Step 5 component test paths exist.
