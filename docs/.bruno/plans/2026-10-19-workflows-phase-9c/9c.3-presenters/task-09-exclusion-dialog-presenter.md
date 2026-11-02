### Task 9: Add / Edit dialog presenter

R318, R319, R324, R325, R327, R328, R337, R338; D106, D110, D124, D125, Q62, Q63, Q64, Q65, Q68.2, Q68.3; QBZ-30, QBZ-32, QBZ-37, QBZ-91; design DS:139-173 and DS:226-251 (`research-spec.md` 4.3); Review Focus 1, 2, 4, 7, 10. One presenter serves the Add and the Edit dialog. It reads the last-loaded list, the zone and the names from the page (`ExclusionsSource`), searches users for Add, keeps the reason and the picked day, computes the date limits, notes and errors, and saves the whole list with exactly one change; on success it hands the server's record to the page, toasts and closes.

- **Init (R337):** `init({ source, mode, userId })` resets (`dispose`), stores the source and reads the zone with `source.getTimeZone()`. Add starts with no user, an empty reason and no date and runs the empty user search at once. Edit finds the entry by `userId` in `source.getExclusions()`, pre-fills its reason (`""` for none) and the local date of its `endsOn` in the viewer's zone (`getLocalDate`, `null` for none), and remembers whether it had expired when the dialog opened (`!isExclusionActive(entry, now)`).
- **Title and button (R324):** `Add exclusion` / `Edit exclusion`; confirm `Add exclusion` / `Save`, `Saving…` while saving.
- **User (R324, Q64, R325):** Add: options are the search results through `toExclusionUserOption(user, inList)`; a user already in the list is disabled with the note `In the list`, and `setUser` ignores it (picked duplicates are impossible, so there is no client duplicate error and no `Edit their entry`, R338). The search is `listUsers({ search, ids: null, teamIds: null, limit: USER_SEARCH_LIMIT })`, debounced `SEARCH_DEBOUNCE_MS` (an empty search runs at once), with a stale-response token; a failed search shows `Could not load users.` as the field error until the next search succeeds. Edit: the user is locked; `selected` is the page's name (`Deleted user` muted with `person_off` for a deleted user); no search runs. `Choose a user.` shows after a submit without a user and clears when one is picked.
- **Reason (R328):** kept as typed; the payload carries `normaliseReason(reason)` (trimmed, whitespace-only `null`, cut to 500). The view's `maxLength` is 500 (Task 12).
- **Until (R319, R337):** `vm.minDate` is `toLocalMidnight(getTodayLocalDate(now, timeZone))` in two statements; `dateHint` is `Optional. The exclusion ends at the end of that day ({tz}). Leave empty to keep it until you remove it.` with the viewer's zone; `showClear` while a date is set; `clearDate()` empties it; `setDate("")` is no date. `dateError` is `Pick today or a later date.` only when the date was changed (differs from the pre-filled date) and is before today in the zone (`isPastDate`); it blocks submit. The payload's `endsOn` is `resolveEndsOn({ pickedDate, originalDate, originalEndsOn, timeZone })`: the stored string unchanged when the date is unchanged, `null` when cleared, else the end of the newly picked local day.
- **Notes (R324):** one slot. Editing a deleted user's entry shows `deletedUser` `This user was deleted, so the entry has no effect. Remove it.` (it wins over the expired note); else editing an entry expired at open shows `expired` `This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again.`. `removeEntry()` calls `source.openRemove(userId)`, which replaces this dialog with the Remove dialog. Save stays allowed for a deleted user's entry (Q64).
- **Submit (R318, R325, R327):** ignored while saving. Clears the alert, validates (user, date), builds `upsertExclusion(source.getExclusions(), { userId, reason, endsOn })` (Add appends, Edit replaces in place) and calls `updateSettings({ exclusions })`. Success: `saving` off, `toasts.success("Exclusion added" | "Exclusion updated")`, `source.applySaved({ settings: <returned record>, change: mode, user: <picked user or null> })`, `source.closeDialog()`. Failure: a `GraphQLOperationError` shows `Could not save: {server message}`, anything else `The server did not respond, so nothing was changed. Try again.`; the dialog keeps every value; nothing is toasted. Editing a field keeps the alert.
- **Cancel (R325):** `cancel()` calls `source.closeDialog()` unless saving. `dispose()` drops a pending search and a pending save (a save that settles after dispose touches nothing) and resets every field.
- **Registration:** transient (`ExclusionDialogPresenterFeature`), registered in `[AW]/app.tsx`, asserted in `[AW]/app.test.tsx` with the flag on and off.

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/getExclusionSaveError.ts`
- Create: `packages/app-workflows/src/settings/presentation/getExclusionSaveError.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/abstractions.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/feature.ts`
- Create: `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 7 (`ExclusionsSource`, `ExclusionUserName` from `~/settings/presentation/exclusionsPage/ExclusionsSource.js` (the page's `getUserName` carries the `Deleted user` label); `createFakeExclusionsSource`, `FakeExclusionsSource`; `createAnaExclusion`, `createBenExclusion`, `createCidExclusion`, `EXCLUSIONS_NOW`, `ZAGREB`, `NEW_YORK`, `TOKYO`), Task 2 (`WorkflowExclusion`, `WorkflowSettings`, `SettingsErrorCode`), Task 3 (`WorkflowSettingsUseCases`, `createFakeSettingsUseCases` / `FakeWorkflowSettingsUseCases`, `createExclusion`), Task 4 (`getLocalDate`, `getTodayLocalDate`, `toLocalMidnight`, `isPastDate`, `isExclusionActive`, `resolveEndsOn` from `~/settings/model/time/<name>.js`), Task 5 (`normaliseReason`, `upsertExclusion` from `~/settings/model/list/<name>.js`), Task 6 (`PickerOption.note`). Existing (verified): `WorkflowConfigUseCases`, `WorkflowEditorToasts` (`~/editor/toasts/WorkflowEditorToasts.js`), `WorkflowUserSummary`, `SEARCH_DEBOUNCE_MS` (250) and `USER_SEARCH_LIMIT` (50) in `~/editor/presentation/editor/constants.js`, `GENERIC_ERROR` (`~/review/presentation/actionDialog/reviewErrorMessages.js`, `The server did not respond, so nothing was changed. Try again.`), `GraphQLOperationError`, `PickerOption`, `PickerOptionIcon`, `createFakeConfigUseCases`, `createFakeEditorToasts` / `FakeWorkflowEditorToasts` (`~/editor/testing/fakeWorkflowEditorToasts.js`), `createDeferred`, `createWorkflowUserSummary`, `Container`.
- Produces: `ExclusionDialogPresenter` (abstraction `"Workflows/ExclusionDialogPresenter"`, namespace `Interface`, `ViewModel`), `ExclusionDialogPresenterFeature`, `ExclusionDialogMode`, `ExclusionDialogInitParams { source: ExclusionsSource; mode: "add" | "edit"; userId: string | null }`, `ExclusionDialogUserVm`, `ExclusionDialogNoteVm`, `ExclusionDialogVm` (contract fields), methods `init`, `searchUsers`, `setUser`, `setReason`, `setDate`, `clearDate`, `submit`, `removeEntry`, `cancel`, `dispose`; `toExclusionUserOption(user: WorkflowUserSummary, inList: boolean): PickerOption`; `getExclusionSaveError(error: unknown): string` (Task 10); test support `createExclusionDialogSetup` / `ExclusionDialogSetup`.

**Test runner note:** admin package, `yarn test <path>` only. Fake timers with `vi.setSystemTime(EXCLUSIONS_NOW)` (2026-10-19 12:00 in Zagreb). Expected instants: end of 24 Oct 2026 in Zagreb (CEST) `2026-10-24T21:59:59.999Z`, of 30 Oct (CET, after the 25 Oct change) `2026-10-30T22:59:59.999Z`, of 1 Nov 2026 in New York (the DST end day) `2026-11-02T04:59:59.999Z` (Task 4's contract values). `minDate` is a local `Date`, so the tests read it with local getters and do not depend on the machine's zone.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/testing/exclusionDialogSetup.ts` (vitest):

```ts
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { createFakeEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import type { FakeWorkflowEditorToasts } from "~/editor/testing/fakeWorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { createFakeSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";

export interface ExclusionDialogSetup {
    presenter: ExclusionDialogPresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    config: FakeWorkflowConfigUseCases;
    toasts: FakeWorkflowEditorToasts;
}

// An Add / Edit dialog presenter over fakes; `updateSettings` echoes the list it was sent.
export const createExclusionDialogSetup = (): ExclusionDialogSetup => {
    const settings = createFakeSettingsUseCases();
    settings.updateSettings.mockImplementation(async data => data);
    const config = createFakeConfigUseCases();
    const toasts = createFakeEditorToasts();

    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowConfigUseCases, config);
    container.registerInstance(WorkflowEditorToasts, toasts);
    ExclusionDialogPresenterFeature.register(container);
    const presenter = container.resolve(ExclusionDialogPresenter);

    return { presenter, settings, config, toasts };
};
```

Create `packages/app-workflows/src/settings/presentation/getExclusionSaveError.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";

describe("getExclusionSaveError (R325, Q68.2)", () => {
    it("shows the server's message for a server error", () => {
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: SettingsErrorCode.Validation
        });

        expect(getExclusionSaveError(error)).toBe(
            "Could not save: This user is already in the list. Edit it instead."
        );
    });

    it("shows the server's message for NotAuthorized too", () => {
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });

        expect(getExclusionSaveError(error)).toBe("Could not save: Not authorized.");
    });

    it("shows the standard alert for a transport failure", () => {
        expect(getExclusionSaveError(new Error("Network down."))).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(getExclusionSaveError("boom")).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { toExclusionUserOption } from "~/settings/presentation/exclusionDialog/toExclusionUserOption.js";

describe("toExclusionUserOption (R324, Q64)", () => {
    const ivan = createWorkflowUserSummary({ id: "user-ivan", displayName: "Ivan Horvat" });

    it("lists a user who is not in the list as a pickable person", () => {
        expect(toExclusionUserOption(ivan, false)).toEqual({
            id: "user-ivan",
            label: "Ivan Horvat",
            description: null,
            warning: null,
            muted: false,
            disabled: false,
            icon: "person",
            note: null
        });
    });

    it("disables a user who is already in the list, with the note In the list", () => {
        const option = toExclusionUserOption(ivan, true);

        expect(option.disabled).toBe(true);
        expect(option.note).toBe("In the list");
        expect(option.muted).toBe(false);
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { TOKYO } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";

const ANA_USER = createWorkflowUserSummary({ id: "user-ana", displayName: "Ana Kovač", teamIds: [] });
const IVAN = createWorkflowUserSummary({ id: "user-ivan", displayName: "Ivan Horvat", teamIds: [] });

const createList = (): WorkflowExclusion[] => {
    return [createAnaExclusion(), createBenExclusion()];
};

const openAdd = async (
    setup: ExclusionDialogSetup,
    timeZone = ZAGREB
): Promise<FakeExclusionsSource> => {
    const source = createFakeExclusionsSource({ exclusions: createList(), timeZone });
    setup.presenter.init({ source, mode: "add", userId: null });
    await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(2));
    return source;
};

describe("ExclusionDialogPresenter: Add (R318, R324, R327, R328)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.config.listUsers.mockResolvedValue({ users: [ANA_USER, IVAN], missingIds: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("opens empty with the Add copy and runs the empty search at once", async () => {
        await openAdd(setup);
        const vm = setup.presenter.vm;

        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: null,
            limit: 50
        });
        expect(vm.title).toBe("Add exclusion");
        expect(vm.confirmLabel).toBe("Add exclusion");
        expect(vm.user.value).toBeNull();
        expect(vm.user.selected).toBeNull();
        expect(vm.user.locked).toBe(false);
        expect(vm.user.error).toBeNull();
        expect(vm.reason).toBe("");
        expect(vm.date).toBeNull();
        expect(vm.dateError).toBeNull();
        expect(vm.showClear).toBe(false);
        expect(vm.note).toBeNull();
        expect(vm.alert).toBeNull();
        expect(vm.saving).toBe(false);
    });

    it("names the viewer's zone in the date hint (R324)", async () => {
        await openAdd(setup);

        expect(setup.presenter.vm.dateHint).toBe(
            "Optional. The exclusion ends at the end of that day (Europe/Zagreb). Leave empty to keep it until you remove it."
        );
    });

    it("disables users already in the list with the note In the list (Q64)", async () => {
        await openAdd(setup);

        expect(setup.presenter.vm.user.options).toEqual([
            {
                id: "user-ana",
                label: "Ana Kovač",
                description: null,
                warning: null,
                muted: false,
                disabled: true,
                icon: "person",
                note: "In the list"
            },
            {
                id: "user-ivan",
                label: "Ivan Horvat",
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: "person",
                note: null
            }
        ]);
    });

    it("ignores a pick of a user who is already in the list", async () => {
        await openAdd(setup);

        setup.presenter.setUser("user-ana");

        expect(setup.presenter.vm.user.value).toBeNull();
    });

    it("shows the picked user as the selected option", async () => {
        await openAdd(setup);

        setup.presenter.setUser("user-ivan");

        expect(setup.presenter.vm.user.value).toBe("user-ivan");
        expect(setup.presenter.vm.user.selected).toMatchObject({
            id: "user-ivan",
            label: "Ivan Horvat",
            disabled: false,
            note: null
        });
    });

    it("sends the last-loaded list plus the new entry, appended (R318)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("  Holiday  ");
        setup.presenter.setDate("2026-10-24");

        await setup.presenter.submit();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).toHaveBeenCalledWith({
            exclusions: [
                createAnaExclusion(),
                createBenExclusion(),
                { userId: "user-ivan", reason: "Holiday", endsOn: "2026-10-24T21:59:59.999Z" }
            ]
        });
    });

    it("sends a whitespace-only reason and no date as null (Q65)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("   ");

        await setup.presenter.submit();

        const sent = setup.settings.updateSettings.mock.calls[0][0];
        expect(sent.exclusions[2]).toEqual({ userId: "user-ivan", reason: null, endsOn: null });
    });

    it("cuts a pasted reason to 500 characters after trimming (R328)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");
        const letters = "a".repeat(520);
        const pasted = ` ${letters}`;
        setup.presenter.setReason(pasted);

        await setup.presenter.submit();

        const sent = setup.settings.updateSettings.mock.calls[0][0];
        expect(sent.exclusions[2].reason).toHaveLength(500);
    });

    it("asks for a user on submit without one and clears the error on a pick", async () => {
        await openAdd(setup);

        await setup.presenter.submit();

        expect(setup.presenter.vm.user.error).toBe("Choose a user.");
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();

        setup.presenter.setUser("user-ivan");
        expect(setup.presenter.vm.user.error).toBeNull();
    });

    it("hands the saved record and the picked user to the page, toasts and closes (R318, R327)", async () => {
        const source = await openAdd(setup);
        const saved = {
            exclusions: [
                createAnaExclusion(),
                createBenExclusion(),
                { userId: "user-ivan", reason: null, endsOn: null }
            ]
        };
        setup.settings.updateSettings.mockResolvedValueOnce(saved);
        setup.presenter.setUser("user-ivan");

        await setup.presenter.submit();

        expect(source.applySaved).toHaveBeenCalledWith({ settings: saved, change: "add", user: IVAN });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion added");
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("offers today in the viewer's zone as the earliest day, at local midnight (R319, R337)", async () => {
        await openAdd(setup);

        const minDate = setup.presenter.vm.minDate;
        expect(minDate).toBeInstanceOf(Date);
        expect(minDate.getFullYear()).toBe(2026);
        expect(minDate.getMonth()).toBe(9);
        expect(minDate.getDate()).toBe(19);
        expect(minDate.getHours()).toBe(0);
        expect(minDate.getMinutes()).toBe(0);
    });

    it("takes today from the viewer's zone, not from UTC", async () => {
        // 20:00 UTC on 19 Oct is already 05:00 on 20 Oct in Tokyo.
        vi.setSystemTime(Date.parse("2026-10-19T20:00:00.000Z"));
        await openAdd(setup, TOKYO);

        expect(setup.presenter.vm.minDate.getDate()).toBe(20);
    });

    it("shows Clear only while a date is set and reads an empty date as none", async () => {
        await openAdd(setup);

        setup.presenter.setDate("2026-10-24");
        expect(setup.presenter.vm.date).toBe("2026-10-24");
        expect(setup.presenter.vm.showClear).toBe(true);

        setup.presenter.clearDate();
        expect(setup.presenter.vm.date).toBeNull();
        expect(setup.presenter.vm.showClear).toBe(false);

        setup.presenter.setDate("2026-10-24");
        setup.presenter.setDate("");
        expect(setup.presenter.vm.date).toBeNull();
    });

    it("blocks a past day in Add (the date is new, so it counts as changed)", async () => {
        await openAdd(setup);
        setup.presenter.setUser("user-ivan");

        setup.presenter.setDate("2026-10-18");

        expect(setup.presenter.vm.dateError).toBe("Pick today or a later date.");
        await setup.presenter.submit();
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();
    });
});

describe("ExclusionDialogPresenter: user search (R324, R325)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.config.listUsers.mockResolvedValue({ users: [ANA_USER, IVAN], missingIds: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("debounces a typed search by 250 ms and sends the last text", async () => {
        await openAdd(setup);
        setup.config.listUsers.mockClear();

        setup.presenter.searchUsers("iv");
        setup.presenter.searchUsers("iva");
        vi.advanceTimersByTime(249);
        expect(setup.config.listUsers).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: "iva",
            ids: null,
            teamIds: null,
            limit: 50
        });
    });

    it("drops the answer of an older search", async () => {
        await openAdd(setup);
        const older = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(older.promise);
        setup.config.listUsers.mockResolvedValueOnce({ users: [IVAN], missingIds: [] });

        setup.presenter.searchUsers("a");
        vi.advanceTimersByTime(250);
        setup.presenter.searchUsers("iv");
        vi.advanceTimersByTime(250);
        await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(1));
        older.resolve({ users: [ANA_USER, IVAN], missingIds: [] });
        await older.promise;
        await Promise.resolve();

        expect(setup.presenter.vm.user.options.map(option => option.id)).toEqual(["user-ivan"]);
    });

    it("shows Could not load users. when a search fails and clears it with the next search", async () => {
        await openAdd(setup);
        setup.config.listUsers.mockRejectedValueOnce(new Error("Network down."));

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.vm.user.error).toBe("Could not load users."));

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.vm.user.error).toBeNull());
        expect(setup.presenter.vm.user.options).toHaveLength(2);
    });

    it("drops a pending search on dispose", async () => {
        await openAdd(setup);
        setup.config.listUsers.mockClear();

        setup.presenter.searchUsers("iv");
        setup.presenter.dispose();
        vi.advanceTimersByTime(250);

        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { NEW_YORK } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const ANA_NAME: ExclusionUserName = { userId: "user-ana", label: "Ana Kovač", state: "found" };

const deletedName = (userId: string): ExclusionUserName => {
    return { userId, label: "Deleted user", state: "deleted" };
};

interface OpenEditParams {
    exclusions: WorkflowExclusion[];
    userId: string;
    names?: ExclusionUserName[];
    timeZone?: string;
}

const openEdit = (setup: ExclusionDialogSetup, params: OpenEditParams): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: params.exclusions,
        timeZone: params.timeZone ?? ZAGREB,
        names: params.names ?? [ANA_NAME]
    });
    setup.presenter.init({ source, mode: "edit", userId: params.userId });
    return source;
};

const sentList = (setup: ExclusionDialogSetup): WorkflowExclusion[] => {
    const [data] = setup.settings.updateSettings.mock.calls[0];
    return data.exclusions;
};

describe("ExclusionDialogPresenter: Edit (R318, R319, R324, D124)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("pre-fills the entry, locks the user and runs no search", () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });
        const vm = setup.presenter.vm;

        expect(vm.title).toBe("Edit exclusion");
        expect(vm.confirmLabel).toBe("Save");
        expect(vm.user).toEqual({
            value: "user-ana",
            selected: {
                id: "user-ana",
                label: "Ana Kovač",
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: "person",
                note: null
            },
            options: [],
            locked: true,
            error: null
        });
        expect(vm.reason).toBe("On leave");
        expect(vm.date).toBe("2026-10-20");
        expect(vm.note).toBeNull();
        expect(setup.config.listUsers).not.toHaveBeenCalled();
    });

    it("ignores searches and picks in Edit", () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.searchUsers("");
        setup.presenter.setUser(null);

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.presenter.vm.user.value).toBe("user-ana");
    });

    it("keeps the stored instant when the date is unchanged (D124)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion()],
            userId: "user-ana"
        });
        setup.presenter.setReason("Holiday");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            { userId: "user-ana", reason: "Holiday", endsOn: "2026-10-20T21:59:59.999Z" },
            createBenExclusion()
        ]);
    });

    it("keeps a stored instant that is not the end of a local day", async () => {
        // Saved by an admin in New York: 23:59 there is 06:59 the next morning in Zagreb.
        const dan = createExclusion({
            userId: "user-dan",
            reason: null,
            endsOn: "2026-10-21T04:59:00.000Z"
        });
        openEdit(setup, { exclusions: [dan], userId: "user-dan" });
        expect(setup.presenter.vm.date).toBe("2026-10-21");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            { userId: "user-dan", reason: null, endsOn: "2026-10-21T04:59:00.000Z" }
        ]);
    });

    it("recomputes a changed date as the end of that day in the viewer's zone", async () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.setDate("2026-10-22");
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBe("2026-10-22T21:59:59.999Z");
    });

    it("recomputes a changed date on the New York DST change day", async () => {
        const eve = createExclusion({
            userId: "user-eve",
            reason: null,
            endsOn: "2026-10-31T03:59:59.999Z"
        });
        openEdit(setup, { exclusions: [eve], userId: "user-eve", timeZone: NEW_YORK });
        expect(setup.presenter.vm.date).toBe("2026-10-30");

        setup.presenter.setDate("2026-11-01");
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBe("2026-11-02T04:59:59.999Z");
    });

    it("sends null when the date is cleared", async () => {
        openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });

        setup.presenter.clearDate();
        await setup.presenter.submit();

        expect(sentList(setup)[0].endsOn).toBeNull();
    });

    it("replaces the entry in place and keeps the others in order (R318)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion(), createCidExclusion()],
            userId: "user-ben"
        });
        setup.presenter.setReason("Moved");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            createAnaExclusion(),
            { userId: "user-ben", reason: "Moved", endsOn: null },
            createCidExclusion()
        ]);
    });

    it("keeps an expired entry's past date and blocks only a changed past date (QBZ-30)", async () => {
        openEdit(setup, { exclusions: [createCidExclusion()], userId: "user-cid" });
        expect(setup.presenter.vm.date).toBe("2026-10-10");
        expect(setup.presenter.vm.dateError).toBeNull();

        setup.presenter.setDate("2026-10-15");
        expect(setup.presenter.vm.dateError).toBe("Pick today or a later date.");
        await setup.presenter.submit();
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();

        setup.presenter.setDate("2026-10-19");
        expect(setup.presenter.vm.dateError).toBeNull();

        setup.presenter.setDate("2026-10-10");
        expect(setup.presenter.vm.dateError).toBeNull();
        await setup.presenter.submit();
        expect(sentList(setup)).toEqual([createCidExclusion()]);
    });

    it("shows the expired note for an entry that had expired when the dialog opened", () => {
        openEdit(setup, { exclusions: [createCidExclusion()], userId: "user-cid" });

        expect(setup.presenter.vm.note).toEqual({
            kind: "expired",
            text: "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again."
        });
    });

    it("shows the deleted-user note, which wins over the expired note (R324)", () => {
        openEdit(setup, {
            exclusions: [createCidExclusion()],
            userId: "user-cid",
            names: [deletedName("user-cid")]
        });

        expect(setup.presenter.vm.note).toEqual({
            kind: "deletedUser",
            text: "This user was deleted, so the entry has no effect. Remove it."
        });
    });

    it("shows a deleted user as a muted, locked Deleted user (QBZ-91)", () => {
        openEdit(setup, {
            exclusions: [createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });

        expect(setup.presenter.vm.user.selected).toMatchObject({
            id: "user-ben",
            label: "Deleted user",
            muted: true,
            icon: "person_off"
        });
        expect(setup.presenter.vm.user.locked).toBe(true);
    });

    it("saves a deleted user's entry with a changed reason and date (Q64)", async () => {
        openEdit(setup, {
            exclusions: [createAnaExclusion(), createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });
        setup.presenter.setReason("Left the company");
        setup.presenter.setDate("2026-10-30");

        await setup.presenter.submit();

        expect(sentList(setup)).toEqual([
            createAnaExclusion(),
            { userId: "user-ben", reason: "Left the company", endsOn: "2026-10-30T22:59:59.999Z" }
        ]);
    });

    it("asks the page to open the Remove dialog for Remove entry (R324)", () => {
        const source = openEdit(setup, {
            exclusions: [createBenExclusion()],
            userId: "user-ben",
            names: [deletedName("user-ben")]
        });

        setup.presenter.removeEntry();

        expect(source.openRemove).toHaveBeenCalledWith("user-ben");
    });

    it("hands the saved record to the page without a user, toasts and closes (R327)", async () => {
        const source = openEdit(setup, { exclusions: [createAnaExclusion()], userId: "user-ana" });
        const saved = { exclusions: [createAnaExclusion()] };
        setup.settings.updateSettings.mockResolvedValueOnce(saved);

        await setup.presenter.submit();

        expect(source.applySaved).toHaveBeenCalledWith({ settings: saved, change: "edit", user: null });
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.toasts.success).toHaveBeenCalledWith("Exclusion updated");
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import type { ExclusionDialogSetup } from "~/settings/testing/exclusionDialogSetup.js";
import { createFakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";
import type { FakeExclusionsSource } from "~/settings/testing/fakeExclusionsSource.js";

const TRANSPORT_ALERT = "The server did not respond, so nothing was changed. Try again.";
const IVAN = createWorkflowUserSummary({ id: "user-ivan", displayName: "Ivan Horvat", teamIds: [] });

const openEdit = (setup: ExclusionDialogSetup): FakeExclusionsSource => {
    const source = createFakeExclusionsSource({
        exclusions: [createAnaExclusion()],
        timeZone: ZAGREB
    });
    setup.presenter.init({ source, mode: "edit", userId: "user-ana" });
    return source;
};

describe("ExclusionDialogPresenter: failures (R325, Q68.2, Review Focus 7)", () => {
    let setup: ExclusionDialogSetup;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
        setup = createExclusionDialogSetup();
        setup.config.listUsers.mockResolvedValue({ users: [IVAN], missingIds: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the transport alert and keeps every entered value in Add", async () => {
        const source = createFakeExclusionsSource({
            exclusions: [createAnaExclusion()],
            timeZone: ZAGREB
        });
        setup.presenter.init({ source, mode: "add", userId: null });
        await vi.waitFor(() => expect(setup.presenter.vm.user.options).toHaveLength(1));
        setup.presenter.setUser("user-ivan");
        setup.presenter.setReason("Holiday");
        setup.presenter.setDate("2026-10-24");
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));

        await setup.presenter.submit();

        const vm = setup.presenter.vm;
        expect(vm.alert).toBe(TRANSPORT_ALERT);
        expect(vm.user.value).toBe("user-ivan");
        expect(vm.reason).toBe("Holiday");
        expect(vm.date).toBe("2026-10-24");
        expect(vm.saving).toBe(false);
        expect(vm.confirmLabel).toBe("Add exclusion");
        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.toasts.error).not.toHaveBeenCalled();
    });

    it("shows the server's message for a server error (Q68.2)", async () => {
        openEdit(setup);
        const error = new GraphQLOperationError({
            message: "This user is already in the list. Edit it instead.",
            code: SettingsErrorCode.Validation
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.submit();

        expect(setup.presenter.vm.alert).toBe(
            "Could not save: This user is already in the list. Edit it instead."
        );
    });

    it("shows a NotAuthorized refusal as a server error in the dialog", async () => {
        openEdit(setup);
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });
        setup.settings.updateSettings.mockRejectedValueOnce(error);

        await setup.presenter.submit();

        expect(setup.presenter.vm.alert).toBe("Could not save: Not authorized.");
    });

    it("keeps the alert while a field is edited and clears it with the next submit", async () => {
        openEdit(setup);
        setup.settings.updateSettings.mockRejectedValueOnce(new Error("Network down."));
        await setup.presenter.submit();

        setup.presenter.setReason("Holiday");
        expect(setup.presenter.vm.alert).toBe(TRANSPORT_ALERT);

        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();
        expect(setup.presenter.vm.alert).toBeNull();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await submit;
    });

    it("ignores a second submit while saving and shows Saving…", async () => {
        openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);

        const first = setup.presenter.submit();
        const second = setup.presenter.submit();

        expect(setup.settings.updateSettings).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.saving).toBe(true);
        expect(setup.presenter.vm.confirmLabel).toBe("Saving…");
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await Promise.all([first, second]);
        expect(setup.toasts.success).toHaveBeenCalledTimes(1);
    });

    it("ignores Cancel and Remove entry while saving", async () => {
        const source = openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.cancel();
        setup.presenter.removeEntry();

        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(source.openRemove).not.toHaveBeenCalled();
        pending.reject(new Error("Network down."));
        await submit;

        setup.presenter.cancel();
        expect(source.closeDialog).toHaveBeenCalledTimes(1);
    });

    it("closes on Cancel", () => {
        const source = openEdit(setup);

        setup.presenter.cancel();

        expect(source.closeDialog).toHaveBeenCalledTimes(1);
        expect(setup.settings.updateSettings).not.toHaveBeenCalled();
    });

    it("touches nothing when a save settles after dispose", async () => {
        const source = openEdit(setup);
        const pending = createDeferred<WorkflowSettings>();
        setup.settings.updateSettings.mockReturnValueOnce(pending.promise);
        const submit = setup.presenter.submit();

        setup.presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await submit;

        expect(source.applySaved).not.toHaveBeenCalled();
        expect(source.closeDialog).not.toHaveBeenCalled();
        expect(setup.toasts.success).not.toHaveBeenCalled();
        expect(setup.presenter.vm.saving).toBe(false);
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add the import after Task 7's `import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";`:

```ts
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
```

Append at the end of the file:

```tsx
describe("WorkflowsAdminApp exclusion dialog presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the exclusion dialog presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(ExclusionDialogPresenter);
        const second = container.resolve(ExclusionDialogPresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no exclusion dialog presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ExclusionDialogPresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/getExclusionSaveError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: every file FAILS to load (`Failed to resolve import` of `getExclusionSaveError.js`, `toExclusionUserOption.js`, `exclusionDialog/feature.js` through `exclusionDialogSetup.ts`, `exclusionDialog/abstractions.js` in `app.test.tsx`).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/getExclusionSaveError.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { GENERIC_ERROR } from "~/review/presentation/actionDialog/reviewErrorMessages.js";

/*
 * The dialog alert after a failed save (R325, Q68.2, QBZ-74): any server error (Validation,
 * Persistence, NotAuthorized) shows its message, a transport failure the standard alert.
 */
export const getExclusionSaveError = (error: unknown): string => {
    if (error instanceof GraphQLOperationError) {
        return `Could not save: ${error.message}`;
    }
    return GENERIC_ERROR;
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

export type ExclusionDialogMode = "add" | "edit";

// The page as the source (R337), the mode, and the entry's user for Edit (null for Add).
export interface ExclusionDialogInitParams {
    source: ExclusionsSource;
    mode: ExclusionDialogMode;
    userId: string | null;
}

export interface ExclusionDialogUserVm {
    value: string | null;
    selected: PickerOption | null;
    // The search results (Add); empty for Edit.
    options: PickerOption[];
    // Edit: the user cannot be changed.
    locked: boolean;
    // `Choose a user.` or `Could not load users.`, else null.
    error: string | null;
}

// The one note slot of the Edit dialog (R324); the view picks the icon by kind.
export interface ExclusionDialogNoteVm {
    kind: "expired" | "deletedUser";
    text: string;
}

export interface ExclusionDialogVm {
    title: string;
    user: ExclusionDialogUserVm;
    reason: string;
    // The picked day `yyyy-MM-dd`, or null.
    date: string | null;
    // Local midnight of today in the viewer's zone: the earliest pickable day (R319, R337).
    minDate: Date;
    // `Pick today or a later date.` for a changed date before today, else null.
    dateError: string | null;
    dateHint: string;
    showClear: boolean;
    note: ExclusionDialogNoteVm | null;
    // The failed save's alert (R325), else null.
    alert: string | null;
    // `Add exclusion`, `Save` or `Saving…`.
    confirmLabel: string;
    saving: boolean;
}

export interface IExclusionDialogPresenter {
    readonly vm: ExclusionDialogVm;
    init(params: ExclusionDialogInitParams): void;
    searchUsers(search: string): void;
    setUser(userId: string | null): void;
    setReason(reason: string): void;
    setDate(date: string | null): void;
    clearDate(): void;
    submit(): Promise<void>;
    // `Remove entry` on a deleted user's entry: the page swaps in the Remove dialog (R324).
    removeEntry(): void;
    cancel(): void;
    dispose(): void;
}

export const ExclusionDialogPresenter = createAbstraction<IExclusionDialogPresenter>(
    "Workflows/ExclusionDialogPresenter"
);

export namespace ExclusionDialogPresenter {
    export type Interface = IExclusionDialogPresenter;
    export type ViewModel = ExclusionDialogVm;
}
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";

const IN_THE_LIST = "In the list";

/*
 * A user search result of the Add dialog (R324, Q64): a user who already has an entry, active or
 * expired, is listed disabled with the note `In the list`.
 */
export const toExclusionUserOption = (user: WorkflowUserSummary, inList: boolean): PickerOption => {
    let note: string | null = null;
    if (inList) {
        note = IN_THE_LIST;
    }
    return {
        id: user.id,
        label: user.displayName,
        description: null,
        warning: null,
        muted: false,
        disabled: inList,
        icon: "person",
        note
    };
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { SEARCH_DEBOUNCE_MS } from "~/editor/presentation/editor/constants.js";
import { USER_SEARCH_LIMIT } from "~/editor/presentation/editor/constants.js";
import { WorkflowEditorToasts } from "~/editor/toasts/WorkflowEditorToasts.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { normaliseReason } from "~/settings/model/list/normaliseReason.js";
import { upsertExclusion } from "~/settings/model/list/upsertExclusion.js";
import { getLocalDate } from "~/settings/model/time/getLocalDate.js";
import { getTodayLocalDate } from "~/settings/model/time/getTodayLocalDate.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import { isPastDate } from "~/settings/model/time/isPastDate.js";
import { resolveEndsOn } from "~/settings/model/time/resolveEndsOn.js";
import { toLocalMidnight } from "~/settings/model/time/toLocalMidnight.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { getExclusionSaveError } from "~/settings/presentation/getExclusionSaveError.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { ExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import type { ExclusionDialogInitParams } from "./abstractions.js";
import type { ExclusionDialogMode } from "./abstractions.js";
import type { ExclusionDialogNoteVm } from "./abstractions.js";
import type { ExclusionDialogUserVm } from "./abstractions.js";
import { toExclusionUserOption } from "./toExclusionUserOption.js";

const ADD_EXCLUSION = "Add exclusion";
const EDIT_EXCLUSION = "Edit exclusion";
const SAVE = "Save";
const SAVING = "Saving…";
const CHOOSE_USER = "Choose a user.";
const PAST_DATE = "Pick today or a later date.";
const USERS_FAILED = "Could not load users.";
const EXPIRED_NOTE =
    "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again.";
const DELETED_USER_NOTE = "This user was deleted, so the entry has no effect. Remove it.";
const ADDED_TOAST = "Exclusion added";
const UPDATED_TOAST = "Exclusion updated";

const formatDateHint = (timeZone: string): string => {
    return `Optional. The exclusion ends at the end of that day (${timeZone}). Leave empty to keep it until you remove it.`;
};

// The locked User field of the Edit dialog: the page's name, muted with `person_off` when deleted (QBZ-91).
const toLockedUserOption = (name: ExclusionUserName): PickerOption => {
    const deleted = name.state === "deleted";
    let icon: PickerOptionIcon = "person";
    if (deleted) {
        icon = "person_off";
    }
    return {
        id: name.userId,
        label: name.label,
        description: null,
        warning: null,
        muted: deleted,
        disabled: false,
        icon,
        note: null
    };
};

/*
 * The Add and Edit exclusion dialog (R318, R319, R324, R325, R327): builds the whole list from the
 * page's last-loaded list with exactly one change, saves it, and hands the server's record back.
 */
class ExclusionDialogPresenterImpl implements Abstraction.Interface {
    private source: ExclusionsSource | null = null;
    private mode: ExclusionDialogMode = "add";
    private timeZone = "UTC";
    private userId: string | null = null;
    // The user picked in Add, handed to the page with the saved record.
    private pickedUser: WorkflowUserSummary | null = null;
    // The entry Edit opened, and its local date when the dialog opened.
    private original: WorkflowExclusion | null = null;
    private originalDate: string | null = null;
    private expiredAtOpen = false;
    private reason = "";
    private date: string | null = null;
    private userError: string | null = null;
    private alert: string | null = null;
    private saving = false;
    private results: WorkflowUserSummary[] = [];
    private searchFailed = false;
    // Every init and dispose starts a new run; a save of an older run touches nothing.
    private runToken = 0;
    private searchToken = 0;
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private settings: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface,
        private toasts: WorkflowEditorToasts.Interface
    ) {
        makeAutoObservable<
            ExclusionDialogPresenterImpl,
            | "settings"
            | "config"
            | "toasts"
            | "source"
            | "pickedUser"
            | "original"
            | "results"
            | "runToken"
            | "searchToken"
            | "searchTimer"
        >(this, {
            settings: false,
            config: false,
            toasts: false,
            source: observableRef,
            pickedUser: observableRef,
            original: observableRef,
            results: observableRef,
            runToken: false,
            searchToken: false,
            searchTimer: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const now = Date.now();
        const today = getTodayLocalDate(now, this.timeZone);
        // The earliest pickable day: today in the viewer's zone, as a local midnight (R337).
        const minDate = toLocalMidnight(today);
        return {
            title: this.mode === "add" ? ADD_EXCLUSION : EDIT_EXCLUSION,
            user: this.buildUserVm(),
            reason: this.reason,
            date: this.date,
            minDate,
            dateError: this.getDateError(today),
            dateHint: formatDateHint(this.timeZone),
            showClear: this.date !== null,
            note: this.buildNote(),
            alert: this.alert,
            confirmLabel: this.getConfirmLabel(),
            saving: this.saving
        };
    }

    init(params: ExclusionDialogInitParams): void {
        this.dispose();
        this.source = params.source;
        this.mode = params.mode;
        this.timeZone = params.source.getTimeZone();
        if (params.mode === "edit") {
            this.openEntry(params.userId);
            return;
        }
        this.searchUsers("");
    }

    searchUsers(search: string): void {
        if (this.mode !== "add") {
            return;
        }
        this.cancelSearchTimer();
        if (search === "") {
            void this.runUserSearch(search);
            return;
        }
        this.searchTimer = setTimeout(() => {
            this.searchTimer = null;
            void this.runUserSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    setUser(userId: string | null): void {
        if (this.mode !== "add") {
            return;
        }
        if (userId === null) {
            this.userId = null;
            this.pickedUser = null;
            return;
        }
        const user = this.results.find(item => item.id === userId);
        // A user in the list is disabled in the picker (Q64), so a pick of one is ignored.
        if (user === undefined || this.isListed(userId)) {
            return;
        }
        this.userId = userId;
        this.pickedUser = user;
        this.userError = null;
    }

    setReason(reason: string): void {
        this.reason = reason;
    }

    setDate(date: string | null): void {
        if (date === "") {
            this.date = null;
            return;
        }
        this.date = date;
    }

    clearDate(): void {
        this.date = null;
    }

    async submit(): Promise<void> {
        const source = this.source;
        if (source === null || this.saving) {
            return;
        }
        // The next submit clears the alert; editing a field does not (R325).
        this.alert = null;
        const userId = this.userId;
        if (userId === null) {
            this.userError = CHOOSE_USER;
            return;
        }
        const now = Date.now();
        const today = getTodayLocalDate(now, this.timeZone);
        if (this.getDateError(today) !== null) {
            return;
        }

        let originalEndsOn: string | null = null;
        if (this.original !== null) {
            originalEndsOn = this.original.endsOn;
        }
        const endsOn = resolveEndsOn({
            pickedDate: this.date,
            originalDate: this.originalDate,
            originalEndsOn,
            timeZone: this.timeZone
        });
        const reason = normaliseReason(this.reason);
        const entry: WorkflowExclusion = { userId, reason, endsOn };
        // The whole list from the last load plus exactly this change (R318, D106).
        const list = source.getExclusions();
        const exclusions = upsertExclusion(list, entry);
        const change = this.mode;
        const user = this.pickedUser;
        const toast = change === "add" ? ADDED_TOAST : UPDATED_TOAST;
        const token = this.runToken;
        this.saving = true;

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
        this.endSaving();
        this.toasts.success(toast);
        source.applySaved({ settings: saved, change, user });
        source.closeDialog();
    }

    removeEntry(): void {
        if (this.saving || this.mode !== "edit") {
            return;
        }
        const source = this.source;
        const userId = this.userId;
        if (source === null || userId === null) {
            return;
        }
        source.openRemove(userId);
    }

    cancel(): void {
        // Cancel, close and Escape do nothing while saving (R325).
        if (this.saving) {
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
        this.searchToken += 1;
        this.cancelSearchTimer();
        this.source = null;
        this.mode = "add";
        this.timeZone = "UTC";
        this.userId = null;
        this.pickedUser = null;
        this.original = null;
        this.originalDate = null;
        this.expiredAtOpen = false;
        this.reason = "";
        this.date = null;
        this.userError = null;
        this.alert = null;
        this.saving = false;
        this.results = [];
        this.searchFailed = false;
    }

    private openEntry(userId: string | null): void {
        const source = this.source;
        if (source === null || userId === null) {
            return;
        }
        const entry = source.getExclusions().find(item => item.userId === userId);
        if (entry === undefined) {
            return;
        }
        this.original = entry;
        this.userId = entry.userId;
        this.reason = entry.reason ?? "";
        let originalDate: string | null = null;
        if (entry.endsOn !== null) {
            originalDate = getLocalDate(entry.endsOn, this.timeZone);
        }
        this.originalDate = originalDate;
        this.date = originalDate;
        const now = Date.now();
        // The expired note belongs to an entry that had expired when the dialog opened (R324).
        this.expiredAtOpen = !isExclusionActive(entry, now);
    }

    private isListed(userId: string): boolean {
        const source = this.source;
        if (source === null) {
            return false;
        }
        return source.getExclusions().some(item => item.userId === userId);
    }

    // Only a changed date can be in the past: an unchanged expired date stays allowed (QBZ-30).
    private getDateError(today: string): string | null {
        const date = this.date;
        if (date === null || date === this.originalDate) {
            return null;
        }
        if (!isPastDate(date, today)) {
            return null;
        }
        return PAST_DATE;
    }

    private buildUserVm(): ExclusionDialogUserVm {
        const source = this.source;
        if (this.mode === "edit") {
            let selected: PickerOption | null = null;
            if (source !== null && this.userId !== null) {
                const name = source.getUserName(this.userId);
                selected = toLockedUserOption(name);
            }
            return { value: this.userId, selected, options: [], locked: true, error: null };
        }

        const listed = new Set<string>();
        if (source !== null) {
            for (const exclusion of source.getExclusions()) {
                listed.add(exclusion.userId);
            }
        }
        const options = this.results.map(user => {
            const inList = listed.has(user.id);
            return toExclusionUserOption(user, inList);
        });
        let selected: PickerOption | null = null;
        if (this.pickedUser !== null) {
            selected = toExclusionUserOption(this.pickedUser, false);
        }
        let error = this.userError;
        if (error === null && this.searchFailed) {
            error = USERS_FAILED;
        }
        return { value: this.userId, selected, options, locked: false, error };
    }

    // One note slot: a deleted user's note wins over the expired note (R324).
    private buildNote(): ExclusionDialogNoteVm | null {
        const source = this.source;
        if (this.mode !== "edit" || source === null || this.userId === null) {
            return null;
        }
        const name = source.getUserName(this.userId);
        if (name.state === "deleted") {
            return { kind: "deletedUser", text: DELETED_USER_NOTE };
        }
        if (this.expiredAtOpen) {
            return { kind: "expired", text: EXPIRED_NOTE };
        }
        return null;
    }

    private getConfirmLabel(): string {
        if (this.saving) {
            return SAVING;
        }
        if (this.mode === "add") {
            return ADD_EXCLUSION;
        }
        return SAVE;
    }

    private async runUserSearch(search: string): Promise<void> {
        this.searchToken += 1;
        const token = this.searchToken;
        this.searchFailed = false;
        let query: string | null = null;
        if (search !== "") {
            query = search;
        }
        try {
            const result = await this.config.listUsers({
                search: query,
                ids: null,
                teamIds: null,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.searchToken) {
                this.applyResults(result.users);
            }
        } catch {
            if (token === this.searchToken) {
                this.applySearchFailure();
            }
        }
    }

    private applyResults(users: WorkflowUserSummary[]): void {
        this.results = users;
        this.searchFailed = false;
    }

    private applySearchFailure(): void {
        // The next search retries (R325).
        this.searchFailed = true;
    }

    private applyFailure(error: unknown): void {
        // The dialog stays open with every entered value (R325, QBZ-37).
        this.saving = false;
        this.alert = getExclusionSaveError(error);
    }

    private endSaving(): void {
        this.saving = false;
    }

    private cancelSearchTimer(): void {
        if (this.searchTimer !== null) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
    }
}

export const ExclusionDialogPresenter = Abstraction.createImplementation({
    implementation: ExclusionDialogPresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases, WorkflowEditorToasts]
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ExclusionDialogPresenter as Abstraction } from "./abstractions.js";
import { ExclusionDialogPresenter } from "./ExclusionDialogPresenter.js";

// Transient (R212): every dialog host gets its own presenter.
export const ExclusionDialogPresenterFeature = createFeature({
    name: "Workflows/ExclusionDialogPresenter",
    register(container) {
        container.register(ExclusionDialogPresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/app.tsx`. After Task 7's line

```ts
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
```

add

```ts
import { ExclusionDialogPresenterFeature } from "~/settings/presentation/exclusionDialog/feature.js";
```

Replace

```tsx
            <RegisterFeature feature={ExclusionsPagePresenterFeature} />
```

with

```tsx
            <RegisterFeature feature={ExclusionsPagePresenterFeature} />
            <RegisterFeature feature={ExclusionDialogPresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/getExclusionSaveError.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/toExclusionUserOption.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.add.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.edit.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/ExclusionDialogPresenter.errors.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: `vi.waitFor` advances the fake clock by its interval on every check, which is harmless here (no debounce timer is pending in those waits). In "drops the answer of an older search", the two debounced searches run in order (`a` gets the deferred answer, `iv` the resolved one); if the run order differs, check that `searchToken` is bumped in `runUserSearch`, not in `searchUsers`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/model/list/upsertExclusion.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/resolveEndsOn.test.ts 2>&1 | tail -20
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
git commit -m "feat(app-workflows): add the add and edit exclusion dialog presenter" -m "Saves the whole last-loaded list with exactly one added or replaced entry, keeps an unchanged end date's stored instant, computes a changed date as the end of the picked local day, disables users already in the list, shows the expired and deleted-user notes, the dialog alerts and the toasts." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Extra files:** `[AWS]/presentation/getExclusionSaveError.ts` (+ test), the R325 alert text shared with Task 10 (it reuses the existing `GENERIC_ERROR` constant, which holds the exact standard text); `ExclusionDialogMode` in `abstractions.ts` (the contract writes the union inline); the vitest setup `[AWST]/exclusionDialogSetup.ts`.
- **`setDate("")` is no date:** the admin-ui `DatePicker` may report a cleared field as `""`; the contract's `setDate(date: string | null)` keeps both.
- **A past date in Add** counts as changed (the pre-filled date is `null`), so `Pick today or a later date.` also guards Add; the calendar's `minDate` (Task 12) normally prevents it.
- **Edit of an id that is not in the source's list** opens with no user and no values (`openEntry` finds nothing); the page never requests that (Task 7 opens Edit only for a listed user).
- **Dispose during a save** drops the result (no toast, no `applySaved`): the host unmounts with the page; the next load shows the server's state.
- **verify:** Task 4's `isPastDate(date, today)` is a strict "before" (`date < today`), so today is allowed; Task 4's `resolveEndsOn` returns `originalEndsOn` when `pickedDate === originalDate` (both `null` included); Task 5's `upsertExclusion` replaces by `userId` in place and appends otherwise.
- **Setup echo:** Task 3's fake `updateSettings` already echoes its input; `exclusionDialogSetup.ts` sets the same echo explicitly so the tests do not depend on that default.

## Review fixes (sub-phase review)

- `ExclusionDialogPresenterImpl`: `source` is now `observableRef` (was `false`), so the computed `vm` tracks the source set by `init`; with `false`, an Add dialog opened with the `UTC` zone changed no observable in `init` and a rendered view could keep the empty pre-init VM until the search answered (precedent: `ReassignDialogPresenter` keeps its `params` as `observableRef`).
