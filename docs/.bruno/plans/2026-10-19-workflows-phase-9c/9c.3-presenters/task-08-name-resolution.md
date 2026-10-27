### Task 8: Name resolution

R318, R321, R323, R332; D117, Q64, Q68.1, Q68.4; Copy gap 4 (the banner's `Try again` lives in the view, Task 11); Review Focus 4. After a load, and after a save that brings ids the page has no name for, the page presenter names the users of the list with the shared `WorkflowConfigUseCases.listUsers({ ids })` in chunks of `USER_IDS_LIMIT` (200): a returned user gives its display name, an id in `missingIds` becomes `Deleted user`, and ids still unknown after a failed call keep their raw id while `vm.namesFailed` shows the banner `Could not load user names.`. `retryNames()` asks only for the ids that are still unresolved.

- **When (R318, R321):** at the end of every successful load (`init`, `reload`) and after every `applySaved`, for the distinct user ids of the list with no name or an `unknown` one (`collectNameLookupIds`). A picked user arrives with its name through `applySaved` and is never looked up; ids already `found` or `deleted` are never asked again (no refresh).
- **How (R321):** inline in the presenter (no wrapper helper): `chunkIds(ids, USER_IDS_LIMIT)`, one `listUsers({ search: null, ids: chunk, teamIds: null, limit: null })` per chunk, run concurrently and settled with `Promise.allSettled`; every fulfilled answer is merged with `mergeUserNames`. A chunk that fails leaves its ids unknown and sets `namesFailed`; a successful run with nothing failed clears it.
- **`NotAuthorized` (Q68.4):** a chunk rejected with a `GraphQLOperationError` whose code is `SettingsErrorCode.NotAuthorized` switches the page to `noAccess` (and closes any dialog); nothing of that run is applied.
- **Stale runs (R321):** every lookup run carries `namesToken`; a load, a newer run (another save) and `dispose` start a new one, and an older run's answers are dropped.
- **Banner and retry:** `vm.namesFailed` is the banner flag (Task 11 renders `Could not load user names.` with `Try again`); `retryNames()` re-runs the lookup when the page is `ready` (it asks only for unresolved ids because resolved ones are skipped by `collectNameLookupIds`).
- **Rows:** labels, the deleted-user sub line, the filter options and the sort order follow the names as soon as they resolve (the VM reads the name map).

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.test.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/abstractions.ts`
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts`

**Interfaces:**
- Consumes: Task 7 (`ExclusionsPagePresenter`, `ExclusionUserName`, `DELETED_USER_LABEL`, `createExclusionsPageSetup`, `createAnaExclusion`, `createBenExclusion`, `createCidExclusion`, `EXCLUSIONS_NOW`, `ZAGREB`), Task 2 (`WorkflowExclusion`, `WorkflowSettings`, `SettingsErrorCode`), Task 3 (`createExclusion`). Existing (verified): `WorkflowUserList`, `WorkflowUserSummary` (`~/editor/domain/types.js`), `ListUsersParams` (`~/editor/gateway/IWorkflowConfigGateway.js`), `chunkIds` (`~/editor/presentation/editor/chunkIds.js`), `USER_IDS_LIMIT` (`~/editor/presentation/editor/constants.js`, 200), `createWorkflowUserSummary` (`~/editor/testing/editorFixtures.js`), `createDeferred` (`~/editor/testing/createDeferred.js`), `GraphQLOperationError` (`@webiny/app/errors/index.js`).
- Produces: `IExclusionsPagePresenter.retryNames(): Promise<void>`, the `vm.namesFailed` behaviour, `collectNameLookupIds(list: WorkflowExclusion[], known: ReadonlyMap<string, ExclusionUserName>): string[]`, `mergeUserNames(known: ReadonlyMap<string, ExclusionUserName>, result: WorkflowUserList): Map<string, ExclusionUserName>`.

**Test runner note:** admin package, `yarn test <path>` only. The presenter tests keep Task 7's fake timers (`EXCLUSIONS_NOW`) and use `vi.waitFor` for the lookup that `applySaved` starts without awaiting.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { collectNameLookupIds } from "~/settings/presentation/exclusionsPage/collectNameLookupIds.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const entry = (userId: string) => {
    return createExclusion({ userId, reason: null, endsOn: null });
};

describe("collectNameLookupIds (R321)", () => {
    it("returns every id of the list in order when nothing is known", () => {
        const list = [entry("user-b"), entry("user-a")];

        expect(collectNameLookupIds(list, new Map())).toEqual(["user-b", "user-a"]);
    });

    it("skips found and deleted users and keeps unknown ones", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-a", { userId: "user-a", label: "Ana", state: "found" });
        known.set("user-b", { userId: "user-b", label: "Deleted user", state: "deleted" });
        known.set("user-c", { userId: "user-c", label: "user-c", state: "unknown" });
        const list = [entry("user-a"), entry("user-b"), entry("user-c"), entry("user-d")];

        expect(collectNameLookupIds(list, known)).toEqual(["user-c", "user-d"]);
    });

    it("asks for an id once", () => {
        const list = [entry("user-a"), entry("user-a")];

        expect(collectNameLookupIds(list, new Map())).toEqual(["user-a"]);
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { mergeUserNames } from "~/settings/presentation/exclusionsPage/mergeUserNames.js";

describe("mergeUserNames (R321, D117)", () => {
    it("names found users and marks missing ids as Deleted user", () => {
        const ana = createWorkflowUserSummary({ id: "user-a", displayName: "Ana Kovač" });

        const names = mergeUserNames(new Map(), { users: [ana], missingIds: ["user-b"] });

        expect(names.get("user-a")).toEqual({ userId: "user-a", label: "Ana Kovač", state: "found" });
        expect(names.get("user-b")).toEqual({
            userId: "user-b",
            label: "Deleted user",
            state: "deleted"
        });
    });

    it("keeps the known names and returns a new map", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-c", { userId: "user-c", label: "Cid", state: "found" });

        const names = mergeUserNames(known, { users: [], missingIds: [] });

        expect(names).not.toBe(known);
        expect(names.get("user-c")?.label).toBe("Cid");
    });

    it("replaces an unknown name with the answer", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-a", { userId: "user-a", label: "user-a", state: "unknown" });
        const ana = createWorkflowUserSummary({ id: "user-a", displayName: "Ana Kovač" });

        const names = mergeUserNames(known, { users: [ana], missingIds: [] });

        expect(names.get("user-a")?.state).toBe("found");
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ListUsersParams } from "~/editor/gateway/IWorkflowConfigGateway.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { SettingsErrorCode } from "~/settings/domain/SettingsErrorCode.js";
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createAnaExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createBenExclusion } from "~/settings/testing/exclusionFixtures.js";
import { createCidExclusion } from "~/settings/testing/exclusionFixtures.js";
import { EXCLUSIONS_NOW } from "~/settings/testing/exclusionFixtures.js";
import { ZAGREB } from "~/settings/testing/exclusionFixtures.js";
import { createExclusionsPageSetup } from "~/settings/testing/exclusionsPageSetup.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const MANAGE = { canManage: true, timeZone: ZAGREB };

const NAMES: Record<string, string> = {
    "user-ana": "Ana Kovač",
    "user-ben": "Aaron Babić",
    "user-cid": "Cid Horvat"
};

// Answers an ids lookup: a known id with its name, `user-gone` as missing, anything else as `Name {id}`.
const answerLookup = async (params: ListUsersParams): Promise<WorkflowUserList> => {
    const ids = params.ids ?? [];
    const found = ids.filter(id => id !== "user-gone");
    const users = found.map(id => {
        const displayName = NAMES[id] ?? `Name ${id}`;
        return createWorkflowUserSummary({ id, displayName, teamIds: [] });
    });
    const missingIds = ids.filter(id => id === "user-gone");
    return { users, missingIds };
};

const createMany = (count: number): WorkflowExclusion[] => {
    const list: WorkflowExclusion[] = [];
    for (let index = 0; index < count; index += 1) {
        const userId = `user-${String(index).padStart(3, "0")}`;
        list.push(createExclusion({ userId, reason: null, endsOn: null }));
    }
    return list;
};

const notAuthorized = (): GraphQLOperationError => {
    return new GraphQLOperationError({
        message: "Not authorized.",
        code: SettingsErrorCode.NotAuthorized
    });
};

describe("ExclusionsPagePresenter: user names (R321, Review Focus 4)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(EXCLUSIONS_NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("looks the names up by id after the load and sorts the rows by them", async () => {
        const { presenter, config } = createExclusionsPageSetup([
            createAnaExclusion(),
            createBenExclusion()
        ]);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: ["user-ana", "user-ben"],
            teamIds: null,
            limit: null
        });
        // Sorted by name, not by id (Q66).
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Aaron Babić", "Ana Kovač"]);
        expect(presenter.vm.rows[0].editLabel).toBe("Edit exclusion for Aaron Babić");
        expect(presenter.vm.namesFailed).toBe(false);
    });

    it("asks in chunks of at most 200 ids and merges the answers", async () => {
        const { presenter, config } = createExclusionsPageSetup(createMany(450));
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        expect(config.listUsers).toHaveBeenCalledTimes(3);
        const sizes = config.listUsers.mock.calls.map(call => call[0].ids?.length);
        expect(sizes).toEqual([200, 200, 50]);
        expect(presenter.vm.rows).toHaveLength(450);
        expect(presenter.vm.rows[0].label).toBe("Name user-000");
        expect(presenter.vm.rows[449].label).toBe("Name user-449");
    });

    it("shows a missing id as Deleted user with the sub line, and its raw id in the filter", async () => {
        const gone = createExclusion({ userId: "user-gone", reason: null, endsOn: null });
        const { presenter, config } = createExclusionsPageSetup([gone]);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.init(MANAGE);

        const [row] = presenter.vm.rows;
        expect(row.label).toBe("Deleted user");
        expect(row.muted).toBe(true);
        expect(row.subLine).toBe("This user no longer exists");
        const [option] = presenter.vm.filter.options;
        expect(option.label).toBe("Deleted user");
        expect(option.description).toBe("user-gone");
        expect(option.icon).toBe("person_off");
        expect(option.muted).toBe(true);
        expect(presenter.getUserName("user-gone").state).toBe("deleted");
    });

    it("shows the banner and the raw ids when the lookup fails", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("ready");
        expect(presenter.vm.namesFailed).toBe(true);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["user-ana"]);
    });

    it("retries only the ids that are still unresolved", async () => {
        const { presenter, config } = createExclusionsPageSetup(createMany(250));
        config.listUsers.mockImplementationOnce(answerLookup);
        config.listUsers.mockRejectedValueOnce(new Error("Network down."));

        await presenter.init(MANAGE);

        expect(presenter.vm.namesFailed).toBe(true);
        config.listUsers.mockImplementation(answerLookup);

        await presenter.retryNames();

        expect(config.listUsers).toHaveBeenCalledTimes(3);
        const retried = config.listUsers.mock.calls[2][0].ids ?? [];
        expect(retried).toHaveLength(50);
        expect(retried[0]).toBe("user-200");
        expect(presenter.vm.namesFailed).toBe(false);
        expect(presenter.vm.rows[249].label).toBe("Name user-249");
    });

    it("does not retry before a list is loaded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);

        await presenter.retryNames();

        expect(config.listUsers).not.toHaveBeenCalled();
    });

    it("switches to no access when the lookup answers NotAuthorized (Q68.4)", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockRejectedValueOnce(notAuthorized());

        await presenter.init(MANAGE);

        expect(presenter.vm.status).toBe("noAccess");
        expect(presenter.vm.canAdd).toBe(false);
        expect(presenter.vm.rows).toEqual([]);
    });

    it("drops the answer of a lookup that a reload superseded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const first = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(first.promise);
        config.listUsers.mockImplementation(answerLookup);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        await presenter.reload();
        const stale = createWorkflowUserSummary({ id: "user-ana", displayName: "Stale Name" });
        first.resolve({ users: [stale], missingIds: [] });
        await init;

        expect(config.listUsers).toHaveBeenCalledTimes(2);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Ana Kovač"]);
    });

    it("drops the answer of a lookup that a newer save superseded", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const first = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(first.promise);
        config.listUsers.mockImplementation(answerLookup);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });
        await vi.waitFor(() => expect(presenter.getUserName("user-cid").label).toBe("Cid Horvat"));
        const stale = createWorkflowUserSummary({ id: "user-ana", displayName: "Stale Name" });
        first.resolve({ users: [stale], missingIds: [] });
        await init;

        expect(presenter.getUserName("user-ana").label).toBe("Ana Kovač");
    });

    it("never looks up the user picked in the Add dialog", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);
        const dan = createWorkflowUserSummary({ id: "user-dan", displayName: "Dan Novak" });

        presenter.applySaved({
            settings: {
                exclusions: [
                    createAnaExclusion(),
                    createExclusion({ userId: "user-dan", reason: null, endsOn: null })
                ]
            },
            change: "add",
            user: dan
        });
        await Promise.resolve();

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(presenter.vm.rows.map(row => row.label)).toEqual(["Ana Kovač", "Dan Novak"]);
    });

    it("looks up only the new ids a saved record brings", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);

        presenter.applySaved({
            settings: { exclusions: [createAnaExclusion(), createCidExclusion()] },
            change: "edit",
            user: null
        });

        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(2));
        expect(config.listUsers.mock.calls[1][0].ids).toEqual(["user-cid"]);
    });

    it("does not refresh known names on a reload", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        config.listUsers.mockImplementation(answerLookup);
        await presenter.init(MANAGE);

        await presenter.reload();

        expect(config.listUsers).toHaveBeenCalledTimes(1);
        expect(presenter.vm.namesFailed).toBe(false);
    });

    it("drops a pending lookup on dispose", async () => {
        const { presenter, config } = createExclusionsPageSetup([createAnaExclusion()]);
        const pending = createDeferred<WorkflowUserList>();
        config.listUsers.mockReturnValueOnce(pending.promise);

        const init = presenter.init(MANAGE);
        await vi.waitFor(() => expect(config.listUsers).toHaveBeenCalledTimes(1));
        presenter.dispose();
        const ana = createWorkflowUserSummary({ id: "user-ana", displayName: "Ana Kovač" });
        pending.resolve({ users: [ana], missingIds: [] });
        await init;

        expect(presenter.getUserName("user-ana").state).toBe("unknown");
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -40
```

Expected: the two pure files FAIL to load (`Failed to resolve import "./collectNameLookupIds.js"` / `mergeUserNames.js`); the presenter file FAILS: `listUsers` is never called, the labels stay the raw ids, and `presenter.retryNames is not a function`.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";

/*
 * The distinct user ids of the list the page still has to name (R321): no name yet, or still
 * `unknown` after a failed lookup. Found and deleted users are never asked again.
 */
export const collectNameLookupIds = (
    list: WorkflowExclusion[],
    known: ReadonlyMap<string, ExclusionUserName>
): string[] => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const exclusion of list) {
        const userId = exclusion.userId;
        if (seen.has(userId)) {
            continue;
        }
        seen.add(userId);
        const name = known.get(userId);
        if (name !== undefined && name.state !== "unknown") {
            continue;
        }
        ids.push(userId);
    }
    return ids;
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.ts`:

```ts
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { DELETED_USER_LABEL } from "./exclusionUserCopy.js";

/*
 * The known names plus one `listUsers({ ids })` answer (R321, D117): a returned user is found
 * with its display name, an id in `missingIds` is `Deleted user`. Returns a new map.
 */
export const mergeUserNames = (
    known: ReadonlyMap<string, ExclusionUserName>,
    result: WorkflowUserList
): Map<string, ExclusionUserName> => {
    const names = new Map(known);
    for (const user of result.users) {
        names.set(user.id, { userId: user.id, label: user.displayName, state: "found" });
    }
    for (const userId of result.missingIds) {
        names.set(userId, { userId, label: DELETED_USER_LABEL, state: "deleted" });
    }
    return names;
};
```

Modify `packages/app-workflows/src/settings/presentation/exclusionsPage/abstractions.ts`. Replace

```ts
    // `Try again` after a failed load.
    reload(): Promise<void>;
```

with

```ts
    // `Try again` after a failed load.
    reload(): Promise<void>;
    // `Try again` on the names banner: looks up only the ids that are still unresolved (R321).
    retryNames(): Promise<void>;
```

Modify `packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.ts` (the file as Task 7 left it).

Replace the imports

```ts
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
```

with

```ts
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { chunkIds } from "~/editor/presentation/editor/chunkIds.js";
import { USER_IDS_LIMIT } from "~/editor/presentation/editor/constants.js";
import { WorkflowConfigUseCases } from "~/editor/useCases/WorkflowConfigUseCases.js";
```

and

```ts
import { buildExclusionRowVm } from "./buildExclusionRowVm.js";
```

with

```ts
import { buildExclusionRowVm } from "./buildExclusionRowVm.js";
import { collectNameLookupIds } from "./collectNameLookupIds.js";
import { mergeUserNames } from "./mergeUserNames.js";
```

Replace

```ts
    // Every load and dispose starts a new one; an older answer is dropped.
    private loadToken = 0;
```

with

```ts
    // Every load and dispose starts a new one; an older answer is dropped.
    private loadToken = 0;
    // Every name lookup, load and dispose starts a new one; an older lookup's answer is dropped (R321).
    private namesToken = 0;
```

Replace

```ts
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
```

with

```ts
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
            exclusions: observableRef,
            names: observableRef,
            dialog: observableRef,
            loadToken: false,
            namesToken: false
        });
```

Replace

```ts
    async reload(): Promise<void> {
        if (!this.canManage) {
            return;
        }
        await this.load();
    }
```

with

```ts
    async reload(): Promise<void> {
        if (!this.canManage) {
            return;
        }
        await this.load();
    }

    async retryNames(): Promise<void> {
        if (this.status !== "ready") {
            return;
        }
        await this.resolveNames();
    }
```

Replace

```ts
        // After an add the new entry is active, so the Active tab shows it (Q66).
        if (params.change === "add") {
            this.tab = "active";
        }
        this.dropStaleFilter();
    }
```

with

```ts
        // After an add the new entry is active, so the Active tab shows it (Q66).
        if (params.change === "add") {
            this.tab = "active";
        }
        this.dropStaleFilter();
        // Names only for ids the saved record brings that the page does not know yet (R318).
        void this.resolveNames();
    }
```

Replace

```ts
    dispose(): void {
        this.loadToken += 1;
        this.canManage = false;
```

with

```ts
    dispose(): void {
        this.loadToken += 1;
        this.namesToken += 1;
        this.canManage = false;
```

Replace

```ts
    private async load(): Promise<void> {
        this.loadToken += 1;
        const token = this.loadToken;
        this.status = "loading";
```

with

```ts
    private async load(): Promise<void> {
        this.loadToken += 1;
        // A lookup of an earlier list is dropped; the new list starts its own.
        this.namesToken += 1;
        const token = this.loadToken;
        this.status = "loading";
```

Replace

```ts
        if (token !== this.loadToken) {
            return;
        }
        this.applyLoaded(settings);
    }
```

with

```ts
        if (token !== this.loadToken) {
            return;
        }
        this.applyLoaded(settings);
        await this.resolveNames();
    }

    /*
     * Names the users of the list (R321): the ids without a name, in chunks of 200, concurrently.
     * A failed chunk leaves its ids unknown and shows the banner; `NotAuthorized` shows no access.
     */
    private async resolveNames(): Promise<void> {
        const ids = collectNameLookupIds(this.exclusions, this.names);
        this.namesToken += 1;
        const token = this.namesToken;
        if (ids.length === 0) {
            this.namesFailed = false;
            return;
        }
        const chunks = chunkIds(ids, USER_IDS_LIMIT);
        const calls = chunks.map(chunk => {
            // A synchronous throw of the call becomes a rejection, which allSettled catches.
            return Promise.resolve().then(() => {
                return this.config.listUsers({
                    search: null,
                    ids: chunk,
                    teamIds: null,
                    limit: null
                });
            });
        });
        const answers = await Promise.allSettled(calls);
        if (token !== this.namesToken) {
            return;
        }
        this.applyNameAnswers(answers);
    }

    private applyNameAnswers(answers: PromiseSettledResult<WorkflowUserList>[]): void {
        let names = this.names;
        let failed = false;
        for (const answer of answers) {
            if (answer.status === "fulfilled") {
                names = mergeUserNames(names, answer.value);
                continue;
            }
            if (isNotAuthorized(answer.reason)) {
                this.status = "noAccess";
                this.dialog = null;
                return;
            }
            failed = true;
        }
        this.names = names;
        this.namesFailed = failed;
    }
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/collectNameLookupIds.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/mergeUserNames.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.names.test.ts 2>&1 | tail -40
```

Expected: PASS. Note for the first run: in "never looks up the user picked in the Add dialog", `applySaved` still calls `resolveNames`, which finds no id to ask (`user-dan` is known through the picked user) and returns without a call; the single `await Promise.resolve()` only lets a wrongly started call surface.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.load.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (Task 7's tests use the fake `listUsers` default `{ users: [], missingIds: [] }`, so their ids stay unknown and their labels stay the raw ids); no TypeScript errors.

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
git commit -m "feat(app-workflows): name the users of the reviewer exclusion list" -m "After a load or a save the page looks up the ids it cannot name in chunks of 200, shows missing ids as Deleted user, keeps raw ids with a banner when the lookup fails, retries only unresolved ids and drops answers of superseded runs." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The load awaits the lookup:** `init` and `reload` resolve after the names (the page is `ready` with raw ids while they load), so a test can await `init`. `applySaved` starts the lookup without awaiting (`void`), as it is a synchronous source method.
- **A run with nothing to ask** still starts a new token (it supersedes an older pending run, whose ids are then known or are asked again by the next run) and clears `namesFailed`.
- **`NotAuthorized` on the lookup closes any open dialog**, since `noAccess` hides the page body; the contract names only the status change.
- **No `partitionSettled` reuse:** the editor's helper drops the rejection reasons, and R321 needs the reason to tell `NotAuthorized` from a failure, so the loop over `allSettled` answers stays inline.

## Review fixes (sub-phase review)

- None. Checked against the contract (R317-R329, R332, R337), the controller rulings (row `muted` only for deleted users; `Interface extends ExclusionsSource`; feature resolves `{ presenter }`; Task 4 strings and Task 5 empty-state texts), Tasks 3-5 as written, Tasks 11-13's consumption, and the real files (`app.tsx`, `app.test.tsx`, `chunkIds`, `USER_IDS_LIMIT`, `ListUsersParams`, `GraphQLOperationError`, `createFakeConfigUseCases`, `observableRef`).
