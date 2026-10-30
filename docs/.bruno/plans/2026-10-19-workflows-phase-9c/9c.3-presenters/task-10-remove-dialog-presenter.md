### Task 10: Remove dialog presenter

R318, R325, R326, R327; D106, D125, Q62, Q64, Q68.2; QBZ-74, QBZ-91; design DS:244 (`research-spec.md` 4.4); Copy gap 5 (the Remove button stays `Remove`, disabled while removing; the label lives in the view, Task 12); Review Focus 1, 4, 7. The Remove dialog presenter reads the entry's user from the page, sends the last-loaded list without that entry, and on success hands the server's record back to the page, toasts `Exclusion removed` and closes; on failure the dialog stays open with the alert and the row stays in the list.

- **Init:** `init({ source, userId })` resets (`dispose`) and stores both; the name comes from `source.getUserName(userId)` when the VM is computed.
- **VM (R326):** `title` `Remove exclusion?`; `body` `{Name} can be assigned automatically again. Nothing changes for work they already hold.` with the page's label (the raw id for an unresolved user), or for a deleted user `This user no longer exists, so removing the entry changes nothing else.`; `alert`; `removing`.
- **Confirm (R318, R325, R327):** ignored while removing. Clears the alert, sends `updateSettings({ exclusions: removeExclusion(source.getExclusions(), userId) })` (every other entry unchanged and in order). Success: `removing` off, `toasts.success("Exclusion removed")`, `source.applySaved({ settings: <returned record>, change: "remove", user: null })`, `source.closeDialog()`. Failure: `getExclusionSaveError(error)` (Task 9) as the alert, `removing` off; the page is not touched, so the row stays; nothing is toasted. A deleted user's entry is removed like any other (Q64).
- **Cancel (R325, R326):** `cancel()` (Cancel, the `Close` button and Escape) calls `source.closeDialog()` unless removing. `dispose()` drops a pending remove (a remove that settles after dispose touches nothing) and resets.
- **Registration:** transient (`RemoveExclusionDialogPresenterFeature`), registered in `[AW]/app.tsx`, asserted in `[AW]/app.test.tsx` with the flag on and off.

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/abstractions.ts`
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.ts`
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/feature.ts`
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 7 (`ExclusionsSource`, `ExclusionUserName`, `createFakeExclusionsSource`, `FakeExclusionsSource`, `createAnaExclusion`, `createBenExclusion`, `createCidExclusion`, `ZAGREB`), Task 9 (`getExclusionSaveError` from `~/settings/presentation/getExclusionSaveError.js`), Task 2 (`WorkflowSettings`, `SettingsErrorCode`), Task 3 (`WorkflowSettingsUseCases`, `createFakeSettingsUseCases` / `FakeWorkflowSettingsUseCases`), Task 5 (`removeExclusion` from `~/settings/model/list/removeExclusion.js`). Existing (verified): `WorkflowEditorToasts`, `createFakeEditorToasts` / `FakeWorkflowEditorToasts`, `createDeferred`, `GraphQLOperationError`, `Container`, `createAbstraction` / `createFeature`, `makeAutoObservable` / `observableRef` (`mobx`).
- Produces: `RemoveExclusionDialogPresenter` (abstraction `"Workflows/RemoveExclusionDialogPresenter"`, namespace `Interface`, `ViewModel`), `RemoveExclusionDialogPresenterFeature`, `RemoveExclusionDialogInitParams { source: ExclusionsSource; userId: string }`, `RemoveExclusionDialogVm { title: string; body: string; alert: string | null; removing: boolean }`, methods `init(params: RemoveExclusionDialogInitParams): void`, `confirm(): Promise<void>`, `cancel(): void`, `dispose(): void`.

**Test runner note:** admin package, `yarn test <path>` only. No clock is involved; no fake timers.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import { RemoveExclusionDialogPresenterFeature } from "~/settings/presentation/removeDialog/feature.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import { createFakeSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "~/settings/testing/fakeWorkflowSettingsUseCases.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";

const TRANSPORT_ALERT = "The server did not respond, so nothing was changed. Try again.";

const BEN_NAME: ExclusionUserName = { userId: "user-ben", label: "Ben Babić", state: "found" };

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

const openRemove = (
    setup: RemoveSetup,
    userId: string,
    names: ExclusionUserName[] = [BEN_NAME]
): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: [createAnaExclusion(), createBenExclusion(), createCidExclusion()],
        timeZone: ZAGREB,
        names
    });
    setup.presenter.init({ source, userId });
    return source;
};

describe("RemoveExclusionDialogPresenter (R318, R326, R327)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("asks to remove the named user", () => {
        openRemove(setup, "user-ben");

        expect(setup.presenter.vm).toEqual({
            title: "Remove exclusion?",
            body: "Ben Babić can be assigned automatically again. Nothing changes for work they already hold.",
            alert: null,
            removing: false
        });
    });

    it("names an unresolved user by the raw id", () => {
        openRemove(setup, "user-cid", []);

        expect(setup.presenter.vm.body).toBe(
            "user-cid can be assigned automatically again. Nothing changes for work they already hold."
        );
    });

    it("explains that removing a deleted user's entry changes nothing else (QBZ-91)", () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        expect(setup.presenter.vm.body).toBe(
            "This user no longer exists, so removing the entry changes nothing else."
        );
    });

    it("sends the list without the entry and every other entry unchanged, in order (R318)", async () => {
        openRemove(setup, "user-ben");

        await setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("removes a deleted user's entry (Q64)", async () => {
        openRemove(setup, "user-ben", [
            { userId: "user-ben", label: "Deleted user", state: "deleted" }
        ]);

        await setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledWith({
            exclusions: [createAnaExclusion(), createCidExclusion()]
        });
    });

    it("hands the saved record to the page, toasts Exclusion removed and closes (R327)", async () => {
        const source = openRemove(setup, "user-ben");
        const saved = { exclusions: [createAnaExclusion(), createCidExclusion()] };
        setup.settings.updateSettings.mockResolvedValueOnce(saved);

        await setup.presenter.confirm();

        expect(source.applySaved).toHaveBeenCalledWith({
            settings: saved,
            change: "remove",
            user: null
        });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion removed");
        expect(setup.presenter.vm.removing).toBe(false);
    });

    it("closes on Cancel", () => {
        const source = openRemove(setup, "user-ben");

        setup.presenter.cancel();

        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();
    });
});

describe("RemoveExclusionDialogPresenter: failures (R325, QBZ-74, Review Focus 7)", () => {
    let setup: RemoveSetup;

    beforeEach(() => {
        setup = createRemoveSetup();
    });

    it("shows the transport alert and keeps the row", async () => {
        const source = openRemove(setup, "user-ben");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(TRANSPORT_ALERT);
        expect(setup.presenter.vm.removing).toBe(false);
        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("shows the server's message for a server error (Q68.2)", async () => {
        openRemove(setup, "user-ben");
        const error = new GraphQLOperationError({
            message: "Could not save the workflow settings.",
            code: SettingsErrorCode.Persistence
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBe(
            "Could not save: Could not save the workflow settings."
        );
    });

    it("clears the alert with the next confirm", async () => {
        openRemove(setup, "user-ben");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));
        await setup.presenter.confirm();

        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        expect(setup.presenter.vm.alert).toBeNull();
        expect(setup.presenter.vm.removing).toBe(true);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;
    });

    it("ignores a second confirm while removing", async () => {
        openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);

        const first = setup.presenter.confirm();
        const second = setup.presenter.confirm();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await Promise.all([first, second]);
        expect(setup.toasts.success).toHaveBeenCalledTimes(1);
    });

    it("ignores Cancel, Close and Escape while removing", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.cancel();

        expect(source.closeDialog).not.toHaveBeenCalled();
        pending.reject(new Error("Network down."));
        await confirm;

        setup.presenter.cancel();
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
    });

    it("touches nothing when a remove settles after dispose", async () => {
        const source = openRemove(setup, "user-ben");
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const confirm = setup.presenter.confirm();

        setup.presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion(), createCidExclusion()] });
        await confirm;

        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.presenter.vm.removing).toBe(false);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add the import after Task 9's `import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";`:

```ts
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
```

Append at the end of the file:

```tsx
describe("WorkflowsAdminApp remove exclusion dialog presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the remove exclusion dialog presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(RemoveExclusionDialogPresenter);
        const second = container.resolve(RemoveExclusionDialogPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no remove exclusion dialog presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(RemoveExclusionDialogPresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: both FAIL to load (`Failed to resolve import "~/settings/presentation/removeDialog/abstractions.js"`).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/removeDialog/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

// The page as the source (R337) and the user whose entry is removed.
export interface RemoveExclusionDialogInitParams {
    source: ExclusionsSource;
    userId: string;
}

export interface RemoveExclusionDialogVm {
    // `Remove exclusion?`.
    title: string;
    // The R326 body, by user state.
    body: string;
    // The failed remove's alert (R325), else null.
    alert: string | null;
    removing: boolean;
}

export interface IRemoveExclusionDialogPresenter {
    readonly vm: RemoveExclusionDialogVm;
    init(params: RemoveExclusionDialogInitParams): void;
    confirm(): Promise<void>;
    // Cancel, `Close` and Escape; ignored while removing.
    cancel(): void;
    dispose(): void;
}

export const RemoveExclusionDialogPresenter = createAbstraction<IRemoveExclusionDialogPresenter>(
    "Workflows/RemoveExclusionDialogPresenter"
);

export namespace RemoveExclusionDialogPresenter {
    export type Interface = IRemoveExclusionDialogPresenter;
    export type ViewModel = RemoveExclusionDialogVm;
}
```

Create `packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { removeExclusion } from "~/settings/model/list/removeExclusion.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { RemoveExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import type { RemoveExclusionDialogInitParams } from "./abstractions.js";

const TITLE = "Remove exclusion?";
const DELETED_USER_BODY = "This user no longer exists, so removing the entry changes nothing else.";
const REMOVED_TOAST = "Exclusion removed";

const formatBody = (name: string): string => {
    return `${name} can be assigned automatically again. Nothing changes for work they already hold.`;
};

/*
 * The Remove exclusion dialog (R318, R325, R326, R327): sends the page's last-loaded list without
 * the entry and hands the server's record back; on failure the row stays and the alert shows.
 */
class RemoveExclusionDialogPresenterImpl implements Abstraction.Interface {
    private source: ExclusionsSource | null = null;
    private userId: string | null = null;
    private alert: string | null = null;
    private removing = false;
    // Every init and dispose starts a new run; a remove of an older run touches nothing.
    private runToken = 0;

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
            source: observableRef,
            runToken: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            title: TITLE,
            body: this.buildBody(),
            alert: this.alert,
            removing: this.removing
        };
    }

    init(params: RemoveExclusionDialogInitParams): void {
        this.dispose();
        this.source = params.source;
        this.userId = params.userId;
    }

    async confirm(): Promise<void> {
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null || this.removing) {
            return;
        }
        // The next confirm clears the alert (R325).
        this.alert = null;
        // The whole list from the last load without this entry (R318, D106).
        const list = source.getExclusions();
        const exclusions = removeExclusion(list, userId);
        const token = this.runToken;
        this.removing = true;

        let saved: WorkflowSettings;
        try {
            saved = await this.settings.updateSettings({ exclusions });
        } catch (error) {
            if (token === this.runToken) {
                this.applyFailure(error);
            }
            return;
        }
        if (token !== this.runToken) {
            return;
        }
        this.endRemoving();
        this.toasts.success(REMOVED_TOAST);
        source.applySaved({ settings: saved, change: "remove", user: null });
        source.closeDialog();
    }

    cancel(): void {
        // Cancel, Close and Escape do nothing while removing (R325, R326).
        if (this.removing) {
            return;
        }
        const source = this.source;
        if (source === null) {
            return;
        }
        source.closeDialog();
    }

    dispose(): void {
        this.runToken += 1;
        this.source = null;
        this.userId = null;
        this.alert = null;
        this.removing = false;
    }

    private buildBody(): string {
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null) {
            return "";
        }
        const name = source.getUserName(userId);
        if (name.state === "deleted") {
            return DELETED_USER_BODY;
        }
        return formatBody(name.label);
    }

    private applyFailure(error: unknown): void {
        // The dialog stays open and the row stays in the list (QBZ-74).
        this.removing = false;
        this.alert = getExclusionSaveError(error);
    }

    private endRemoving(): void {
        this.removing = false;
    }
}

export const RemoveExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: RemoveExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowEditorToasts]
});
```

Create `packages/app-workflows/src/settings/presentation/removeDialog/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { RemoveExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import { RemoveExclusionDialogPresenter } from "./RemoveExclusionDialogPresenter.js";

// Transient (R212): every dialog host gets its own presenter.
export const RemoveExclusionDialogPresenterFeature = createFeature({
    name: "Workflows/RemoveExclusionDialogPresenter",
    register(container) {
        container.register(RemoveExclusionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/app.tsx`. After Task 9's line

```ts
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
```

add

```ts
import { RemoveExclusionDialogPresenterFeature } from "~/settings/presentation/removeDialog/feature.js";
```

Replace

```tsx
            <RegisterFeature feature={ExclusionDialogPresenterFeature} />
```

with

```tsx
            <RegisterFeature feature={ExclusionDialogPresenterFeature} />
            <RegisterFeature feature={RemoveExclusionDialogPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/removeDialog/RemoveExclusionDialogPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/presentation/getExclusionSaveError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/removeExclusion.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
git commit -m "feat(app-workflows): add the remove exclusion dialog presenter" -m "Sends the last-loaded exclusion list without the entry, hands the saved record back to the page and toasts Exclusion removed; on failure the dialog stays open with the alert and the row stays." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No setup file:** the presenter has one test file, so its container setup stays in the test (`createRemoveSetup`); the shared fakes come from Tasks 3, 7 and the editor testing folder.
- **The VM has no button labels:** the contract's `RemoveExclusionDialogVm` carries only `title`, `body`, `alert` and `removing`; `Cancel`, `Remove` (disabled while removing, Copy gap 5) and `Close` are view copy (Task 12).
- **Unresolved user:** the body uses the page's label, which is the raw id while the name is unknown (R321); R326 gives only the found and deleted variants.
- **verify:** Task 5's `removeExclusion(list, userId)` returns a new array without that user's entry and keeps the others (same objects, same order).

## Review fixes (sub-phase review)

- `RemoveExclusionDialogPresenterImpl`: `source` is now `observableRef` (was `false`; `observableRef` import added), so the computed `vm` (the body reads `source.getUserName`) tracks the source set by `init`, as Task 9's dialog presenter does.
