### Task 7: Exclusions page presenter

R318, R319, R322, R323, R329, R332, R337; D106, D110, D124, Q61, Q62, Q64, Q66, Q68.4, Q68.6; Copy gap 3; design DS:50-99 and DS:237-241 (`research-spec.md` 4.2); Review Focus 1, 3, 6. The page presenter owns everything the Reviewer exclusions page shows: it loads the whole list once the view says the viewer has `editor`, keeps it as the last-loaded list, builds render-ready rows per tab and user filter, the filter options, the empty states and the dialog request, and is the `ExclusionsSource` the two dialog presenters (Tasks 9, 10) read and write through. No name lookup yet (Task 8): a user without a known name shows the raw id.

- **Init and gate (R329, R337):** `init({ canManage, timeZone })` first resets (`dispose`), stores both, and with `canManage: false` sets `status: "noAccess"` and makes no call at all. With `canManage` it loads.
- **Load (R317, R322, Copy gap 3):** `settingsUseCases.getSettings()` (the use case always sends `includeExpired: true`, Task 3). While it runs `status` is `loading`; success stores the returned list as the last-loaded list and sets `ready`; a `GraphQLOperationError` with code `SettingsErrorCode.NotAuthorized` sets `noAccess` (Q68.4); any other error (transport or server) sets `failed`. `reload()` loads again (the `Try again` button; a no-op without `canManage`). Every load carries a token; an older load's answer is dropped. `dispose()` drops a pending load and resets every field.
- **Dialog gate (R329, Review Focus 1):** `vm.canAdd` is `canManage && status === "ready"`. `openAdd()`, `openEdit(userId)` and `openRemove(userId)` are no-ops unless the status is `ready`; Edit and Remove also need the user in the list. `vm.dialog` is the `ExclusionDialogRequest` (`{ kind, userId }`, `userId` null for Add); `closeDialog()` clears it. `openRemove` while an Edit is open replaces it (the Edit dialog's `Remove entry`, R324).
- **Rows (R319, R320, R322, R323):** `now` is read when the VM is computed (`Date.now()`; the page does not tick). Rows exist only when `ready`: `filterExclusions(list, { tab, userId: userFilter, now })`, then `sortExclusions(filtered, labels)` with each user's label, then `buildExclusionRowVm(exclusion, name, now, timeZone)`: label, `muted` and the sub line `This user no longer exists` for a deleted user, the reason or the muted `No reason given`, `formatUntilLabel` / `formatUntilTitle` in the viewer's zone, `status` / `statusLabel` from `isExclusionActive`, `editLabel` `Edit exclusion for {Name}` and `removeLabel` `Remove exclusion for {Name}` (Q68.6).
- **Tabs, filter, empty (R322, R332):** `tabs` is `Active`, `Expired`, `All` (default `active`). The filter options are the users in the list (sorted like the rows), one `PickerOption` each (`person` icon, `person_off` and muted for a deleted user, `note: null`); a deleted or unresolved user's option carries the raw `userId` as `description`. `searchUserFilter(search)` narrows the options with `searchFilterOptions`; `setUserFilter(userId | null)` sets the filter and clears the search. `vm.empty` is `getExclusionsEmptyState({ total, tab, userFiltered })` when `ready` and no row is shown, else `null`.
- **Source (R318, R337):** `getExclusions()` returns the last-loaded list itself (no copy), `getTimeZone()` the init zone, `getUserName(userId)` the known name or `{ userId, label: userId, state: "unknown" }`. `applySaved({ settings, change, user })` adopts `settings.exclusions` as the last-loaded list, adds the picked `user`'s name (`found`), selects the `active` tab after an `add` (an edit or remove keeps the tab), and resets a user filter whose user is no longer in the list. It does not close the dialog (the dialog presenter calls `closeDialog()`).
- **Registration:** transient (`ExclusionsPagePresenterFeature`), registered in `[AW]/app.tsx` and asserted in `[AW]/app.test.tsx` with the flag on and off.

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsSource.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/abstractions.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/exclusionUserCopy.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/buildExclusionRowVm.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/feature.ts`
- Create: `packages/app-workflows/src/settings/testing/exclusionFixtures.ts`
- Create: `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts`
- Create: `packages/app-workflows/src/settings/testing/fakeExclusionsSource.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts`
- Modify: `packages/app-workflows/src/app.tsx`
- Modify: `packages/app-workflows/src/app.test.tsx`

**Interfaces:**
- Consumes: Task 2 (`WorkflowExclusion`, `WorkflowSettings` from `~/settings/domain/types.js`; `SettingsErrorCode` from `~/settings/domain/SettingsErrorCode.js`), Task 3 (`WorkflowSettingsUseCases` from `~/settings/useCases/WorkflowSettingsUseCases.js`; `createFakeSettingsUseCases` / `FakeWorkflowSettingsUseCases` from `~/settings/testing/fakeWorkflowSettingsUseCases.js`; `createExclusion` from `~/settings/testing/settingsFixtures.js`; `WorkflowSettingsServicesFeature` registered in `app.tsx`), Task 4 (`formatUntilLabel`, `formatUntilTitle`, `isExclusionActive` from `~/settings/model/time/<name>.js`), Task 5 (`ExclusionTab`, `ExclusionsEmptyVm`, `filterExclusions`, `sortExclusions`, `getExclusionsEmptyState`, `searchFilterOptions` from `~/settings/model/list/<name>.js`), Task 6 (`PickerOption.note`). Existing (verified): `WorkflowConfigUseCases` (`~/editor/useCases/WorkflowConfigUseCases.js`), `WorkflowUserSummary` (`~/editor/domain/types.js`), `PickerOption` (`~/components/picker/PickerOption.js`), `PickerOptionIcon` (`~/components/picker/PickerOptionIcon.js`), `GraphQLOperationError` (`@webiny/app/errors/index.js`), `createAbstraction` / `createFeature` (`@webiny/feature/admin`), `Container` (`@webiny/di`), `createFakeConfigUseCases` / `FakeWorkflowConfigUseCases` (`~/editor/testing/fakeWorkflowConfigUseCases.js`), `createDeferred` (`~/editor/testing/createDeferred.js`), `createWorkflowUserSummary` (`~/editor/testing/editorFixtures.js`), `makeAutoObservable` / `observableRef` (`mobx`).
- Produces: `ExclusionsPagePresenter` (abstraction `"Workflows/ExclusionsPagePresenter"`, namespace `Interface`, `ViewModel`), `ExclusionsPagePresenterFeature`, `ExclusionsPageInitParams { canManage: boolean; timeZone: string }`, `ExclusionsPageStatus`, `ExclusionDialogRequest { kind: "add" | "edit" | "remove"; userId: string | null }`, `ExclusionTabVm`, `ExclusionFilterVm`, `ExclusionRowVm`, `ExclusionsPageVm` (with `namesFailed` always `false` until Task 8), `ExclusionsSource`, `ExclusionUserName`, `ApplySavedParams`, `buildExclusionRowVm`, `DELETED_USER_LABEL`, `DELETED_USER_SUB_LINE`; test support `createFakeExclusionsSource` / `FakeExclusionsSource` / `FakeExclusionsSourceOptions`, `createExclusionsPageSetup` / `ExclusionsPageSetup`, `EXCLUSIONS_NOW`, `ZAGREB`, `NEW_YORK`, `TOKYO`, `createAnaExclusion`, `createBenExclusion`, `createCidExclusion`.

**Test runner note:** admin package, `yarn test <path>` only. `.tsx` tests import `React`. The presenter tests use `vi.useFakeTimers()` with `vi.setSystemTime(EXCLUSIONS_NOW)` (2026-10-19 12:00 in Zagreb): Ana's entry (end of 20 Oct in Zagreb) and Ben's (no end) are active, Cid's (end of 10 Oct) is expired. The row strings come from Task 4's helpers in the given zone, so they do not depend on the machine's zone.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/testing/exclusionFixtures.ts` (pure, no vitest):

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createExclusion } from "./settingsFixtures.js";

// 2026-10-19 12:00 in Zagreb: Ana's and Ben's exclusions are active, Cid's has expired.
export const EXCLUSIONS_NOW = Date.parse("2026-10-19T10:00:00.000Z");

export const ZAGREB = "Europe/Zagreb";

export const NEW_YORK = "America/New_York";

export const TOKYO = "Asia/Tokyo";

// Until the end of 20 Oct 2026 in Zagreb (23:59:59.999 CEST).
export const createAnaExclusion = (): WorkflowExclusion => {
    return createExclusion({
        userId: "user-ana",
        reason: "On leave",
        endsOn: "2026-10-20T21:59:59.999Z"
    });
};

// Until removed, without a reason.
export const createBenExclusion = (): WorkflowExclusion => {
    return createExclusion({ userId: "user-ben", reason: null, endsOn: null });
};

// Ended with 10 Oct 2026 in Zagreb.
export const createCidExclusion = (): WorkflowExclusion => {
    return createExclusion({
        userId: "user-cid",
        reason: "Workload",
        endsOn: "2026-10-10T21:59:59.999Z"
    });
};
```

Create `packages/app-workflows/src/settings/testing/fakeExclusionsSource.ts` (vitest fake, used by Tasks 9 and 10):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";

export interface FakeExclusionsSourceOptions {
    exclusions?: WorkflowExclusion[];
    // Default `Europe/Zagreb`.
    timeZone?: string;
    // The names the page knows; any other id is unknown and labelled with the id.
    names?: ExclusionUserName[];
}

export interface FakeExclusionsSource extends ExclusionsSource {
    getExclusions: Mock<ExclusionsSource["getExclusions"]>;
    getTimeZone: Mock<ExclusionsSource["getTimeZone"]>;
    getUserName: Mock<ExclusionsSource["getUserName"]>;
    applySaved: Mock<ExclusionsSource["applySaved"]>;
    openRemove: Mock<ExclusionsSource["openRemove"]>;
    closeDialog: Mock<ExclusionsSource["closeDialog"]>;
}

// A page as the dialogs see it: a fixed list, zone and names, and recorded writes.
export const createFakeExclusionsSource = (
    options: FakeExclusionsSourceOptions = {}
): FakeExclusionsSource => {
    const exclusions = options.exclusions ?? [];
    const timeZone = options.timeZone ?? "Europe/Zagreb";
    const names = new Map<string, ExclusionUserName>();
    const knownNames = options.names ?? [];
    for (const name of knownNames) {
        names.set(name.userId, name);
    }

    const getUserName = (userId: string): ExclusionUserName => {
        const known = names.get(userId);
        if (known !== undefined) {
            return known;
        }
        return { userId, label: userId, state: "unknown" };
    };

    return {
        getExclusions: vi.fn(() => exclusions),
        getTimeZone: vi.fn(() => timeZone),
        getUserName: vi.fn(getUserName),
        applySaved: vi.fn(),
        openRemove: vi.fn(),
        closeDialog: vi.fn()
    };
};
```

Create `packages/app-workflows/src/settings/testing/exclusionsPageSetup.ts` (vitest; it builds the presenter from fakes):

```ts
import { Container } from "@webiny/di";
import { createFakeConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import type { FakeWorkflowConfigUseCases } from "~/editor/testing/fakeWorkflowConfigUseCases.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { createFakeSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";
import type { FakeWorkflowSettingsUseCases } from "./fakeWorkflowSettingsUseCases.js";

export interface ExclusionsPageSetup {
    presenter: ExclusionsPagePresenter.Interface;
    settings: FakeWorkflowSettingsUseCases;
    config: FakeWorkflowConfigUseCases;
}

/*
 * A page presenter over fakes: `getSettings` resolves `{ exclusions }` (the same array every time,
 * so a test can check that the page keeps it), and `listUsers` finds nobody.
 */
export const createExclusionsPageSetup = (
    exclusions: WorkflowExclusion[] = []
): ExclusionsPageSetup => {
    const settings = createFakeSettingsUseCases();
    settings.getSettings.mockResolvedValue({ exclusions });
    settings.updateSettings.mockResolvedValue({ exclusions });
    const config = createFakeConfigUseCases();

    const container = new Container();
    container.registerInstance(WorkflowSettingsUseCases, settings);
    container.registerInstance(WorkflowConfigUseCases, config);
    ExclusionsPagePresenterFeature.register(container);
    const presenter = container.resolve(ExclusionsPagePresenter);

    return { presenter, settings, config };
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

describe("ExclusionsPagePresenter: load and gate (R317, R322, R329)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("loads nothing and shows no access without the editor permission", async () => {
        const { presenter, settings, config } = createExclusionsPageSetup([createAnaExclusion()]);

        await presenter.init({ canManage: false, timeZone: ZAGREB });

        expect(settings.getSettings).not.toHaveBeenCalled();
        expect(config.listUsers).not.toHaveBeenCalled();
        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();
    });

    it("does not load on reload without the editor permission", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        await presenter.init({ canManage: false, timeZone: ZAGREB });

        await presenter.reload();

        expect(settings.getSettings).not.toHaveBeenCalled();
        expect(presenter.vm.status).toBe("noAccess");
    });

    it("is loading until the settings arrive, then ready", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        const pending = createDeferred<WorkflowSettings>();
        settings.getSettings.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();

        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.canAdd).toBe(true);
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("asks the use case once, which always includes expired entries (Task 3)", async () => {
        const { presenter, settings } = createExclusionsPageSetup();

        await presenter.init(MANAGE);

        expect(settings.getSettings).toHaveBeenCalledTimes(1);
        expect(settings.getSettings).toHaveBeenCalledWith();
    });

    it("shows the load error for a transport failure and loads again on reload", async () => {
        const { presenter, settings } = createExclusionsPageSetup([createAnaExclusion()]);
        settings.getSettings.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("failed");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.vm.empty).toBeNull();

        await presenter.reload();

        expect(settings.getSettings).toHaveBeenCalledTimes(2);
        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("shows the same load error for a server error (Copy gap 3)", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        const error = new GraphQLOperationError({
            message: "Could not read the settings.",
            code: SettingsErrorCode.Persistence
        });
        settings.getSettings.mockRejectedValueOnce(error);

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("failed");
    });

    it("shows no access when the server answers NotAuthorized (Q68.4)", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        const error = new GraphQLOperationError({
            message: "Not authorized.",
            code: SettingsErrorCode.NotAuthorized
        });
        settings.getSettings.mockRejectedValueOnce(error);

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
    });

    it("drops the answer of an older load after a reload", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        const first = createDeferred<WorkflowSettings>();
        settings.getSettings.mockReturnValueOnce(first.promise);
        settings.getSettings.mockResolvedValueOnce({ exclusions: [createBenExclusion()] });

        const init = presenter.init(MANAGE);
        await presenter.reload();
        first.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ben"]);
    });

    it("resets on dispose and ignores a load that settles afterwards", async () => {
        const { presenter, settings } = createExclusionsPageSetup();
        const pending = createDeferred<WorkflowSettings>();
        settings.getSettings.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);
        presenter.dispose();
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;

        expect(presenter.vm.status).toBe("loading");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
        expect(presenter.getExclusions()).toEqual([]);
        expect(presenter.getTimeZone()).toBe("UTC");
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { buildExclusionRowVm } from "~/settings/presentation/exclusionsPage/buildExclusionRowVm.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { NEW_YORK } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";
import type { ExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const EVERYONE = "Everyone in reviewing teams can be assigned automatically.";

const createReadyPage = async (
    exclusions: WorkflowExclusion[],
    timeZone = ZAGREB
): Promise<ExclusionsPageSetup> => {
    const setup = createExclusionsPageSetup(exclusions);
    await setup.presenter.init({ canManage: true, timeZone });
    return setup;
};

const createThree = (): WorkflowExclusion[] => {
    return [createCidExclusion(), createAnaExclusion(), createBenExclusion()];
};

describe("ExclusionsPagePresenter: rows (R322, R323)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("offers the Active, Expired and All tabs and starts on Active", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.tab).toBe("active");
        expect(presenter.vm.tabs).toEqual([
            { id: "active", label: "Active" },
            { id: "expired", label: "Expired" },
            { id: "all", label: "All" }
        ]);
    });

    it("shows the active entries on Active, sorted by label", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana", "user-ben"]);
    });

    it("shows the expired entries on Expired and every entry on All", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.setTab("expired");
        expect(presenter.vm.tab).toBe("expired");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-cid"]);

        presenter.setTab("all");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual([
            "user-ana",
            "user-ben",
            "user-cid"
        ]);
    });

    it("builds render-ready rows: raw id for an unknown name, reason, until and status", async () => {
        const { presenter } = await createReadyPage(createThree());
        presenter.setTab("all");

        const [ana, ben, cid] = presenter.vm.rows;

        expect(ana).toEqual({
            userId: "user-ana",
            label: "user-ana",
            muted: false,
            subLine: null,
            reason: "On leave",
            reasonMuted: false,
            untilLabel: "End of 20 Oct 2026",
            untilTitle: "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)",
            status: "active",
            statusLabel: "Active",
            editLabel: "Edit exclusion for user-ana",
            removeLabel: "Remove exclusion for user-ana"
        });
        expect(ben.reason).toBe("No reason given");
        expect(ben.reasonMuted).toBe(true);
        expect(ben.untilLabel).toBe("Until removed");
        expect(ben.untilTitle).toBe("Until removed");
        expect(cid.status).toBe("expired");
        expect(cid.statusLabel).toBe("Expired");
        expect(cid.untilLabel).toBe("End of 10 Oct 2026");
    });

    it("shows the end in the viewer's zone (D110, QBZ-95)", async () => {
        const { presenter } = await createReadyPage(createThree(), NEW_YORK);

        const ana = presenter.vm.rows.find(row => row.userId === "user-ana");

        expect(ana?.untilLabel).toBe("20 Oct 2026, 17:59");
    });

    it("is active until the instant its end passes (endsOn > now)", async () => {
        const { presenter } = await createReadyPage([createAnaExclusion()]);

        vi.setSystemTime(Date.parse("2026-10-20T21:59:59.998Z"));
        expect(presenter.vm.rows.map(row => row.status)).toEqual(["active"]);

        vi.setSystemTime(Date.parse("2026-10-20T21:59:59.999Z"));
        expect(presenter.vm.rows).toEqual([]);
        presenter.setTab("expired");
        expect(presenter.vm.rows.map(row => row.statusLabel)).toEqual(["Expired"]);
    });

    it("sorts by the name once one is known (Q66)", async () => {
        const { presenter } = await createReadyPage(createThree());
        const zed = createWorkflowUserSummary({ id: "user-zed", displayName: "Aaron Zec" });
        const exclusions = [
            ...createThree(),
            { userId: "user-zed", reason: null, endsOn: null }
        ];

        presenter.applySaved({ settings: { exclusions }, change: "add", user: zed });

        expect(presenter.vm.rows.map(row => row.label)).toEqual([
            "Aaron Zec",
            "user-ana",
            "user-ben"
        ]);
    });

    it("applies the user filter after the tab", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.setUserFilter("user-ana");
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);

        presenter.setTab("expired");
        expect(presenter.vm.rows).toEqual([]);

        presenter.setUserFilter(null);
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-cid"]);
    });

    it("lists the users in the list as filter options, the raw id under an unresolved name (R332)", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.filter).toEqual({
            value: null,
            selected: null,
            options: [
                {
                    id: "user-ana",
                    label: "user-ana",
                    description: "user-ana",
                    warning: null,
                    muted: false,
                    disabled: false,
                    icon: "person",
                    note: null
                },
                {
                    id: "user-ben",
                    label: "user-ben",
                    description: "user-ben",
                    warning: null,
                    muted: false,
                    disabled: false,
                    icon: "person",
                    note: null
                },
                {
                    id: "user-cid",
                    label: "user-cid",
                    description: "user-cid",
                    warning: null,
                    muted: false,
                    disabled: false,
                    icon: "person",
                    note: null
                }
            ]
        });
    });

    it("gives a found user's option no description", async () => {
        const { presenter } = await createReadyPage(createThree());
        const ana = createWorkflowUserSummary({ id: "user-ana", displayName: "Ana Kovač" });

        presenter.applySaved({ settings: { exclusions: createThree() }, change: "edit", user: ana });

        const option = presenter.vm.filter.options.find(item => item.id === "user-ana");
        expect(option?.label).toBe("Ana Kovač");
        expect(option?.description).toBeNull();
    });

    it("narrows the filter options by the search and shows the chosen user", async () => {
        const { presenter } = await createReadyPage(createThree());

        presenter.searchUserFilter("BEN");
        expect(presenter.vm.filter.options.map(option => option.id)).toEqual(["user-ben"]);

        presenter.setUserFilter("user-ben");
        expect(presenter.vm.filter.value).toBe("user-ben");
        expect(presenter.vm.filter.selected?.id).toBe("user-ben");
        // Choosing clears the search, so every user is listed again.
        expect(presenter.vm.filter.options).toHaveLength(3);
    });

    it("has no empty state while rows show", async () => {
        const { presenter } = await createReadyPage(createThree());

        expect(presenter.vm.empty).toBeNull();
    });

    it("shows `No exclusions` with Add for an empty list", async () => {
        const { presenter } = await createReadyPage([]);

        expect(presenter.vm.empty).toEqual({
            icon: "person_off",
            title: "No exclusions",
            text: EVERYONE,
            showAdd: true
        });
    });

    it("shows `No expired exclusions` without Add on an empty Expired tab", async () => {
        const { presenter } = await createReadyPage([createAnaExclusion()]);

        presenter.setTab("expired");

        expect(presenter.vm.empty).toEqual({
            icon: "history",
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        });
    });

    it("shows `No active exclusions` with Add on an empty Active tab", async () => {
        const { presenter } = await createReadyPage([createCidExclusion()]);

        expect(presenter.vm.empty).toEqual({
            icon: "person_off",
            title: "No active exclusions",
            text: EVERYONE,
            showAdd: true
        });
    });

    it("shows `No exclusions for this user` without Add when a user filter empties the tab", async () => {
        const { presenter } = await createReadyPage([createCidExclusion()]);

        presenter.setUserFilter("user-cid");

        expect(presenter.vm.empty).toEqual({
            icon: "person_off",
            title: "No exclusions for this user",
            text: EVERYONE,
            showAdd: false
        });
    });
});

describe("buildExclusionRowVm (R323, QBZ-91)", () => {
    it("mutes a deleted user's row and adds the sub line", () => {
        const row = buildExclusionRowVm(
            createAnaExclusion(),
            { userId: "user-ana", label: "Deleted user", state: "deleted" },
            EXCLUSIONS_NOW,
            ZAGREB
        );

        expect(row.label).toBe("Deleted user");
        expect(row.muted).toBe(true);
        expect(row.subLine).toBe("This user no longer exists");
        expect(row.editLabel).toBe("Edit exclusion for Deleted user");
        expect(row.removeLabel).toBe("Remove exclusion for Deleted user");
    });

    it("names a found user", () => {
        const row = buildExclusionRowVm(
            createBenExclusion(),
            { userId: "user-ben", label: "Ben Babić", state: "found" },
            EXCLUSIONS_NOW,
            ZAGREB
        );

        expect(row.label).toBe("Ben Babić");
        expect(row.muted).toBe(false);
        expect(row.subLine).toBeNull();
        expect(row.editLabel).toBe("Edit exclusion for Ben Babić");
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

const expectNoDialogOpens = (presenter: ExclusionsPagePresenter.Interface): void => {
    presenter.openAdd();
    presenter.openEdit("user-ana");
    presenter.openRemove("user-ana");
    expect(presenter.vm.dialog).toBeNull();
};

describe("ExclusionsPagePresenter: dialog gate (R329, Review Focus 1)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("offers no Add and opens no dialog while the list loads", async () => {
        const { presenter, settings } = createExclusionsPageSetup([createAnaExclusion()]);
        const pending = createDeferred<WorkflowSettings>();
        settings.getSettings.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
        pending.resolve({ exclusions: [createAnaExclusion()] });
        await init;
    });

    it("offers no Add and opens no dialog after a failed load", async () => {
        const { presenter, settings } = createExclusionsPageSetup([createAnaExclusion()]);
        settings.getSettings.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
    });

    it("offers no Add and opens no dialog without access", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);

        await presenter.init({ canManage: false, timeZone: ZAGREB });

        expect(presenter.vm.canAdd).toBe(false);
        expectNoDialogOpens(presenter);
    });

    it("opens Add, Edit and Remove once the list is loaded, and closes them", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);

        presenter.openAdd();
        expect(presenter.vm.dialog).toEqual({ kind: "add", userId: null });

        presenter.openEdit("user-ana");
        expect(presenter.vm.dialog).toEqual({ kind: "edit", userId: "user-ana" });

        presenter.openRemove("user-ana");
        expect(presenter.vm.dialog).toEqual({ kind: "remove", userId: "user-ana" });

        presenter.closeDialog();
        expect(presenter.vm.dialog).toBeNull();
    });

    it("opens no Edit or Remove for a user who is not in the list", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);

        presenter.openEdit("user-zed");
        presenter.openRemove("user-zed");

        expect(presenter.vm.dialog).toBeNull();
    });
});

describe("ExclusionsPagePresenter: the dialogs' source (R318, R322, R337)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("hands out the loaded list itself, the zone and the user names", async () => {
        const list = [createAnaExclusion()];
        const { presenter } = createExclusionsPageSetup(list);
        await presenter.init(MANAGE);

        expect(presenter.getExclusions()).toBe(list);
        expect(presenter.getTimeZone()).toBe(ZAGREB);
        expect(presenter.getUserName("user-ana")).toEqual({
            userId: "user-ana",
            label: "user-ana",
            state: "unknown"
        });
    });

    it("adopts the saved record after an add, selects Active and knows the picked user", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion(), createCidExclusion()]);
        await presenter.init(MANAGE);
        presenter.setTab("expired");
        const dan = createWorkflowUserSummary({ id: "user-dan", displayName: "Dan Novak" });
        const saved = {
            exclusions: [
                createAnaExclusion(),
                createCidExclusion(),
                { userId: "user-dan", reason: null, endsOn: null }
            ]
        };

        presenter.applySaved({ settings: saved, change: "add", user: dan });

        expect(presenter.getExclusions()).toBe(saved.exclusions);
        expect(presenter.vm.tab).toBe("active");
        expect(presenter.getUserName("user-dan")).toEqual({
            userId: "user-dan",
            label: "Dan Novak",
            state: "found"
        });
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Dan Novak", "user-ana"]);
    });

    it("keeps the tab after an edit and after a remove", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion(), createCidExclusion()]);
        await presenter.init(MANAGE);
        presenter.setTab("expired");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });
        expect(presenter.vm.tab).toBe("expired");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "remove",
            user: null
        });
        expect(presenter.vm.tab).toBe("expired");
    });

    it("resets a user filter whose user left the list", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion(), createBenExclusion()]);
        await presenter.init(MANAGE);
        presenter.setUserFilter("user-ben");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "remove",
            user: null
        });

        expect(presenter.vm.filter.value).toBeNull();
        expect(presenter.vm.rows.map(row => row.userId)).toEqual(["user-ana"]);
    });

    it("keeps a user filter whose user is still in the list", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion(), createBenExclusion()]);
        await presenter.init(MANAGE);
        presenter.setUserFilter("user-ben");

        presenter.applySaved({
            settings: { exclusions: [createBenExclusion()] },
            change: "remove",
            user: null
        });

        expect(presenter.vm.filter.value).toBe("user-ben");
    });

    it("does not close the dialog in applySaved (the dialog presenter does)", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);
        presenter.openEdit("user-ana");

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion()] },
            change: "edit",
            user: null
        });

        expect(presenter.vm.dialog).toEqual({ kind: "edit", userId: "user-ana" });
    });

    it("replaces an open Edit with Remove through openRemove (Remove entry, R324)", async () => {
        const { presenter } = createExclusionsPageSetup([createAnaExclusion()]);
        await presenter.init(MANAGE);
        presenter.openEdit("user-ana");

        presenter.openRemove("user-ana");

        expect(presenter.vm.dialog).toEqual({ kind: "remove", userId: "user-ana" });
    });
});
```

Modify `packages/app-workflows/src/app.test.tsx`. Add the import after `import { ActiveReviewWarningPresenter } from "~/review/trash/ActiveReviewWarningPresenter.js";` (keep any import Task 3 added there):

```ts
import { ActiveReviewWarningPresenter } from "~/review/trash/ActiveReviewWarningPresenter.js";
import { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
```

Append at the end of the file:

```tsx
describe("WorkflowsAdminApp exclusions page presenter", () => {
    beforeEach(() => {
        flags.isEnabled.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("registers the exclusions page presenter transient when the flag is on", () => {
        const container = mount(true);

        const first = container.resolve(ExclusionsPagePresenter);
        const second = container.resolve(ExclusionsPagePresenter);
        expect(first).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("registers no exclusions page presenter when the flag is off (R211)", () => {
        const container = mount(false);

        expect(() => container.resolve(ExclusionsPagePresenter)).toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: the three presenter files FAIL to load (`Failed to resolve import "~/settings/presentation/exclusionsPage/feature.js"` from `exclusionsPageSetup.ts`, and `buildExclusionRowVm.js`); `app.test.tsx` FAILS to load (`abstractions.js` missing).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsSource.ts`:

```ts
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";

// A user of the list as the page names it (R321): found by `listUsers`, deleted, or not known yet.
export interface ExclusionUserName {
    userId: string;
    // The display name, `Deleted user`, or the raw id while unknown.
    label: string;
    state: "found" | "deleted" | "unknown";
}

// What a dialog hands back after a successful save (R318).
export interface ApplySavedParams {
    // The record the server returned; it becomes the last-loaded list.
    settings: WorkflowSettings;
    change: "add" | "edit" | "remove";
    // The user picked in the Add dialog, so its name is known without a lookup; null otherwise.
    user: WorkflowUserSummary | null;
}

/*
 * What the dialog presenters read from and write to the page (R318, R337): the last-loaded list
 * (a dialog builds its whole-list payload from it), the viewer's zone, the user names, and the
 * writes after a save. The page presenter implements it.
 */
export interface ExclusionsSource {
    getExclusions(): WorkflowExclusion[];
    getTimeZone(): string;
    getUserName(userId: string): ExclusionUserName;
    applySaved(params: ApplySavedParams): void;
    // Replaces the open dialog with the Remove dialog of that user (`Remove entry`, R324).
    openRemove(userId: string): void;
    closeDialog(): void;
}
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import type { ExclusionsSource } from "./ExclusionsSource.js";

// What the view passes in (R337): the viewer's `editor` flag and the resolved timezone.
export interface ExclusionsPageInitParams {
    canManage: boolean;
    timeZone: string;
}

export type ExclusionsPageStatus = "loading" | "ready" | "failed" | "noAccess";

// The open dialog: Add has no user; Edit and Remove name the entry by its user (R234).
export interface ExclusionDialogRequest {
    kind: "add" | "edit" | "remove";
    userId: string | null;
}

export interface ExclusionTabVm {
    id: ExclusionTab;
    label: "Active" | "Expired" | "All";
}

// The `Filter by user` picker (R332): the users in the list, filtered on the client.
export interface ExclusionFilterVm {
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
}

export interface ExclusionRowVm {
    userId: string;
    // The display name, `Deleted user` or the raw id.
    label: string;
    // A deleted user (QBZ-91).
    muted: boolean;
    // `This user no longer exists` for a deleted user, else null.
    subLine: string | null;
    // The reason or `No reason given`.
    reason: string;
    reasonMuted: boolean;
    // `Until removed`, `End of {date}` or `{date}, {HH:mm}` in the viewer's zone (R320).
    untilLabel: string;
    // The hover text with the zone (R320).
    untilTitle: string;
    status: "active" | "expired";
    statusLabel: "Active" | "Expired";
    // `Edit exclusion for {Name}` and `Remove exclusion for {Name}` (Q68.6).
    editLabel: string;
    removeLabel: string;
}

export interface ExclusionsPageVm {
    status: ExclusionsPageStatus;
    // The header's `Add exclusion`: only with `editor` and a loaded list (R329).
    canAdd: boolean;
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    filter: ExclusionFilterVm;
    rows: ExclusionRowVm[];
    // The empty state when the list is loaded and no row shows, else null (R322).
    empty: ExclusionsEmptyVm | null;
    // The name lookup failed: the banner `Could not load user names.` (R321).
    namesFailed: boolean;
    dialog: ExclusionDialogRequest | null;
}

export interface IExclusionsPagePresenter extends ExclusionsSource {
    readonly vm: ExclusionsPageVm;
    init(params: ExclusionsPageInitParams): Promise<void>;
    // `Try again` after a failed load.
    reload(): Promise<void>;
    setTab(tab: ExclusionTab): void;
    setUserFilter(userId: string | null): void;
    searchUserFilter(search: string): void;
    openAdd(): void;
    openEdit(userId: string): void;
    dispose(): void;
}

export const ExclusionsPagePresenter = createAbstraction<IExclusionsPagePresenter>(
    "Workflows/ExclusionsPagePresenter"
);

export namespace ExclusionsPagePresenter {
    export type Interface = IExclusionsPagePresenter;
    export type ViewModel = ExclusionsPageVm;
}
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/exclusionUserCopy.ts`:

```ts
// The label of a user `listUsers` reports missing (D117, QBZ-91, Q64).
export const DELETED_USER_LABEL = "Deleted user";

// The sub line of a deleted user's row (QBZ-91).
export const DELETED_USER_SUB_LINE = "This user no longer exists";
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/buildExclusionRowVm.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { formatUntilLabel } from "~/settings/model/time/formatUntilLabel.js";
import { formatUntilTitle } from "~/settings/model/time/formatUntilTitle.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import type { ExclusionRowVm } from "./abstractions.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { DELETED_USER_SUB_LINE } from "./exclusionUserCopy.js";

const NO_REASON = "No reason given";

/*
 * One table row (R323): the user's label (muted with a sub line when deleted), the reason or
 * `No reason given`, the until label and hover in the viewer's zone, the status at `now`, and the
 * accessible names of the row actions.
 */
export const buildExclusionRowVm = (
    exclusion: WorkflowExclusion,
    name: ExclusionUserName,
    now: number,
    timeZone: string
): ExclusionRowVm => {
    const active = isExclusionActive(exclusion, now);
    const deleted = name.state === "deleted";

    let subLine: string | null = null;
    if (deleted) {
        subLine = DELETED_USER_SUB_LINE;
    }

    let reason = NO_REASON;
    let reasonMuted = true;
    if (exclusion.reason !== null && exclusion.reason !== "") {
        reason = exclusion.reason;
        reasonMuted = false;
    }

    const untilLabel = formatUntilLabel(exclusion.endsOn, timeZone);
    const untilTitle = formatUntilTitle(exclusion.endsOn, timeZone);

    return {
        userId: exclusion.userId,
        label: name.label,
        muted: deleted,
        subLine,
        reason,
        reasonMuted,
        untilLabel,
        untilTitle,
        status: active ? "active" : "expired",
        statusLabel: active ? "Active" : "Expired",
        editLabel: `Edit exclusion for ${name.label}`,
        removeLabel: `Remove exclusion for ${name.label}`
    };
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { WorkflowSettings } from "~/settings/domain/types.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { filterExclusions } from "~/settings/model/list/filterExclusions.js";
import { getExclusionsEmptyState } from "~/settings/model/list/getExclusionsEmptyState.js";
import { searchFilterOptions } from "~/settings/model/list/searchFilterOptions.js";
import { sortExclusions } from "~/settings/model/list/sortExclusions.js";
import { WorkflowSettingsUseCases } from "~/settings/useCases/WorkflowSettingsUseCases.js";
import { ExclusionsPagePresenter as Abstraction } from "./abstractions.js";
import type { ExclusionDialogRequest } from "./abstractions.js";
import type { ExclusionFilterVm } from "./abstractions.js";
import type { ExclusionRowVm } from "./abstractions.js";
import type { ExclusionTabVm } from "./abstractions.js";
import type { ExclusionsPageInitParams } from "./abstractions.js";
import type { ExclusionsPageStatus } from "./abstractions.js";
import type { ApplySavedParams } from "./ExclusionsSource.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { buildExclusionRowVm } from "./buildExclusionRowVm.js";

const TABS: ExclusionTabVm[] = [
    { id: "active", label: "Active" },
    { id: "expired", label: "Expired" },
    { id: "all", label: "All" }
];

// A user the page has no name for yet: the row shows the raw id (R321).
const toUnknownName = (userId: string): ExclusionUserName => {
    return { userId, label: userId, state: "unknown" };
};

/*
 * A user of the list as an option of `Filter by user` (R332): a deleted or unresolved user carries
 * the raw id as its description, so several `Deleted user` options can be told apart.
 */
const toFilterOption = (name: ExclusionUserName): PickerOption => {
    let description: string | null = null;
    if (name.state !== "found") {
        description = name.userId;
    }
    let icon: PickerOptionIcon = "person";
    if (name.state === "deleted") {
        icon = "person_off";
    }
    return {
        id: name.userId,
        label: name.label,
        description,
        warning: null,
        muted: name.state === "deleted",
        disabled: false,
        icon,
        note: null
    };
};

const isNotAuthorized = (error: unknown): boolean => {
    if (!(error instanceof GraphQLOperationError)) {
        return false;
    }
    return error.code === SettingsErrorCode.NotAuthorized;
};

/*
 * The Reviewer exclusions page (R318, R322, R329): loads the whole list once the viewer may manage
 * it, keeps it as the last-loaded list, and builds the rows, tabs, filter and empty states. The
 * dialogs read and write through it as their `ExclusionsSource`.
 */
class ExclusionsPagePresenterImpl implements Abstraction.Interface {
    private canManage = false;
    private timeZone = "UTC";
    private status: ExclusionsPageStatus = "loading";
    // The list from the last load or the last successful save (R318).
    private exclusions: WorkflowExclusion[] = [];
    private names = new Map<string, ExclusionUserName>();
    private namesFailed = false;
    private tab: ExclusionTab = "active";
    private userFilter: string | null = null;
    private filterSearch = "";
    private dialog: ExclusionDialogRequest | null = null;
    // Every load and dispose starts a new one; an older answer is dropped.
    private loadToken = 0;

    constructor(
        private settingsUseCases: WorkflowSettingsUseCases.Interface,
        private config: WorkflowConfigUseCases.Interface
    ) {
        makeAutoObservable<
            ExclusionsPagePresenterImpl,
            "settingsUseCases" | "config" | "exclusions" | "names" | "dialog" | "loadToken"
        >(this, {
            settingsUseCases: false,
            config: false,
            exclusions: observableRef,
            names: observableRef,
            dialog: observableRef,
            loadToken: false
        });
    }

    get vm(): Abstraction.ViewModel {
        // The status is computed for the moment the view model is read; the page does not tick (R319).
        const now = Date.now();
        const rows = this.buildRows(now);
        return {
            status: this.status,
            canAdd: this.canManage && this.status === "ready",
            tab: this.tab,
            tabs: TABS,
            filter: this.buildFilter(),
            rows,
            empty: this.buildEmpty(rows.length),
            namesFailed: this.namesFailed,
            dialog: this.dialog
        };
    }

    async init(params: ExclusionsPageInitParams): Promise<void> {
        this.dispose();
        this.canManage = params.canManage;
        this.timeZone = params.timeZone;
        if (!params.canManage) {
            this.status = "noAccess";
            return;
        }
        await this.load();
    }

    async reload(): Promise<void> {
        if (!this.canManage) {
            return;
        }
        await this.load();
    }

    setTab(tab: ExclusionTab): void {
        this.tab = tab;
    }

    setUserFilter(userId: string | null): void {
        this.userFilter = userId;
        this.filterSearch = "";
    }

    searchUserFilter(search: string): void {
        this.filterSearch = search;
    }

    openAdd(): void {
        // Nothing opens before a list is loaded: a save from an unloaded list would wipe the record (R329).
        if (this.status !== "ready") {
            return;
        }
        this.dialog = { kind: "add", userId: null };
    }

    openEdit(userId: string): void {
        if (!this.canOpen(userId)) {
            return;
        }
        this.dialog = { kind: "edit", userId };
    }

    openRemove(userId: string): void {
        if (!this.canOpen(userId)) {
            return;
        }
        this.dialog = { kind: "remove", userId };
    }

    closeDialog(): void {
        this.dialog = null;
    }

    getExclusions(): WorkflowExclusion[] {
        return this.exclusions;
    }

    getTimeZone(): string {
        return this.timeZone;
    }

    getUserName(userId: string): ExclusionUserName {
        const known = this.names.get(userId);
        if (known !== undefined) {
            return known;
        }
        return toUnknownName(userId);
    }

    applySaved(params: ApplySavedParams): void {
        this.exclusions = params.settings.exclusions;
        const user = params.user;
        if (user !== null) {
            const names = new Map(this.names);
            names.set(user.id, { userId: user.id, label: user.displayName, state: "found" });
            this.names = names;
        }
        // After an add the new entry is active, so the Active tab shows it (Q66).
        if (params.change === "add") {
            this.tab = "active";
        }
        this.dropStaleFilter();
    }

    dispose(): void {
        this.loadToken += 1;
        this.canManage = false;
        this.timeZone = "UTC";
        this.status = "loading";
        this.exclusions = [];
        this.names = new Map();
        this.namesFailed = false;
        this.tab = "active";
        this.userFilter = null;
        this.filterSearch = "";
        this.dialog = null;
    }

    private async load(): Promise<void> {
        this.loadToken += 1;
        const token = this.loadToken;
        this.status = "loading";
        this.dialog = null;
        let settings: WorkflowSettings;
        try {
            settings = await this.settingsUseCases.getSettings();
        } catch (error) {
            if (token === this.loadToken) {
                this.applyLoadFailure(error);
            }
            return;
        }
        if (token !== this.loadToken) {
            return;
        }
        this.applyLoaded(settings);
    }

    private applyLoaded(settings: WorkflowSettings): void {
        this.exclusions = settings.exclusions;
        this.status = "ready";
        this.dropStaleFilter();
    }

    private applyLoadFailure(error: unknown): void {
        if (isNotAuthorized(error)) {
            this.status = "noAccess";
            return;
        }
        // A transport failure and any other server error show the same load error (Copy gap 3).
        this.status = "failed";
    }

    // A filter whose user is no longer in the list shows all users again (R322).
    private dropStaleFilter(): void {
        const filter = this.userFilter;
        if (filter !== null && !this.hasEntry(filter)) {
            this.userFilter = null;
        }
    }

    private hasEntry(userId: string): boolean {
        return this.exclusions.some(exclusion => exclusion.userId === userId);
    }

    private canOpen(userId: string): boolean {
        return this.status === "ready" && this.hasEntry(userId);
    }

    private buildLabels(list: WorkflowExclusion[]): Map<string, string> {
        const labels = new Map<string, string>();
        for (const exclusion of list) {
            const name = this.getUserName(exclusion.userId);
            labels.set(exclusion.userId, name.label);
        }
        return labels;
    }

    private buildRows(now: number): ExclusionRowVm[] {
        if (this.status !== "ready") {
            return [];
        }
        const filtered = filterExclusions(this.exclusions, {
            tab: this.tab,
            userId: this.userFilter,
            now
        });
        const labels = this.buildLabels(filtered);
        const sorted = sortExclusions(filtered, labels);
        return sorted.map(exclusion => {
            const name = this.getUserName(exclusion.userId);
            return buildExclusionRowVm(exclusion, name, now, this.timeZone);
        });
    }

    private buildFilter(): ExclusionFilterVm {
        if (this.status !== "ready") {
            return { value: this.userFilter, selected: null, options: [] };
        }
        const labels = this.buildLabels(this.exclusions);
        const sorted = sortExclusions(this.exclusions, labels);
        const all = sorted.map(exclusion => {
            const name = this.getUserName(exclusion.userId);
            return toFilterOption(name);
        });
        const options = searchFilterOptions(all, this.filterSearch);
        let selected: PickerOption | null = null;
        const chosen = all.find(option => option.id === this.userFilter);
        if (chosen !== undefined) {
            selected = chosen;
        }
        return { value: this.userFilter, selected, options };
    }

    private buildEmpty(rowCount: number): ExclusionsEmptyVm | null {
        if (this.status !== "ready" || rowCount > 0) {
            return null;
        }
        return getExclusionsEmptyState({
            total: this.exclusions.length,
            tab: this.tab,
            userFiltered: this.userFilter !== null
        });
    }
}

export const ExclusionsPagePresenter = Abstraction.createImplementation({
    implementation: ExclusionsPagePresenterImpl,
    dependencies: [WorkflowSettingsUseCases, WorkflowConfigUseCases]
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { ExclusionsPagePresenter as Abstraction } from "./abstractions.js";
import { ExclusionsPagePresenter } from "./ExclusionsPagePresenter.js";

// Transient (R212): every `useFeature` resolve is a new presenter, so views never share state.
export const ExclusionsPagePresenterFeature = createFeature({
    name: "Workflows/ExclusionsPagePresenter",
    register(container) {
        container.register(ExclusionsPagePresenter);
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
```

Modify `packages/app-workflows/src/app.tsx`. After the line

```ts
import { WorkflowEditorConfig } from "~/editor/WorkflowEditorConfig.js";
```

add (keep any import Task 3 added):

```ts
import { ExclusionsPagePresenterFeature } from "~/settings/presentation/exclusionsPage/feature.js";
```

Replace

```tsx
            <RegisterFeature feature={StepDrawerPresenterFeature} />
```

with

```tsx
            <RegisterFeature feature={StepDrawerPresenterFeature} />
            <RegisterFeature feature={ExclusionsPagePresenterFeature} />
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: the exact `untilLabel` / `untilTitle` strings come from Task 4's helpers; if Task 4's tests pin a different form for the same instant (they must not, R320), the helper is wrong, not this test. `searchFilterOptions` (Task 5) matches a case-insensitive substring of the label (R332), so `BEN` finds `user-ben`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/model/list/filterExclusions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/getExclusionsEmptyState.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -20
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
git commit -m "feat(app-workflows): add the reviewer exclusions page presenter" -m "Loads the whole exclusion list once the viewer may manage it, shows rows per Active, Expired and All tab with a client user filter, empty states and statuses in the viewer's zone, opens dialogs only for a loaded list and serves the dialogs as their source." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Extra files** (not listed in the contract's Interfaces entry, all inside the task's folders): `exclusionUserCopy.ts` (the `Deleted user` label and the `This user no longer exists` sub line, shared by Tasks 7, 8 and 9 so the strings live once), `ExclusionsPageStatus` in `abstractions.ts` (the contract writes the union inline in the VM; the alias is the same union), and the test support `[AWST]/exclusionFixtures.ts` (pure) and `[AWST]/exclusionsPageSetup.ts` (vitest), reused by Task 8.
- **`buildExclusionRowVm` signature:** positional `(exclusion, name, now, timeZone)`; the contract names only the file. Positional arguments avoid a fifth params-type file.
- **`applySaved` does not close the dialog**; the dialog presenters call `source.closeDialog()` after it (Tasks 9, 10). `ExclusionsSource` keeps the contract's method list.
- **`config` dependency** is declared now (contract) and first used by Task 8's name lookup; `tsconfig.build.json` has `noUnusedLocals: false`, so the build accepts it.
- **Task 3's fake** (checked against `9c.2-settings-services/task-03-settings-use-cases.md`): `createFakeSettingsUseCases` / `FakeWorkflowSettingsUseCases` with `getSettings` and `updateSettings` as vitest `Mock`s (`updateSettings` echoes its input by default).
- **verify:** Task 3's `createExclusion(overrides: Partial<WorkflowExclusion>)` in `[AWST]/settingsFixtures.ts`; the fixtures pass all three fields, so its defaults do not matter.
- **verify:** Task 5's `ExclusionsEmptyVm` field order and texts are R322's; the empty-state tests assert R322's strings exactly.
- **Filter option icon:** `person` for found and unknown users, `person_off` (muted) for a deleted user, matching the 9b reference pickers (R298, R307); R332 names only the description rule.

## Review fixes (sub-phase review)

- None. Checked against the contract (R317-R329, R332, R337), the controller rulings (row `muted` only for deleted users; `Interface extends ExclusionsSource`; feature resolves `{ presenter }`; Task 4 strings and Task 5 empty-state texts), Tasks 3-5 as written, Tasks 11-13's consumption, and the real files (`app.tsx`, `app.test.tsx`, `chunkIds`, `USER_IDS_LIMIT`, `ListUsersParams`, `GraphQLOperationError`, `createFakeConfigUseCases`, `observableRef`).
