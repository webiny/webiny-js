### Task 14b: Editor presenter: user, member and folder options, `getModelId`, `inspectRouting`

R286, R291, R292, R300, R307; D173; Q49, Q54, Q58; Review Focus 4, 5 and 8; the source accessors the drawer needs for the rule pickers and Test routing. The editor presenter gains:

- the **user search** of the requester picker, the Automation `user` hint and the Test routing requester: `listUsers({ search, ids: null, teamIds: null, limit: 50 })`, an empty search at once, a typed one debounced by 250 ms (R307, the 9a team search rule), a run token per list so a stale response is dropped;
- the **target member search** of the rule target picker: the same call scoped with `teamIds` (the step's reviewing teams, R286), keyed by the team set (the order of the ids does not matter), its own token, an empty team list or a teams-off step asks nothing (Q58);
- the **folder list** state Task 14 loads (once per model, `app.listFolders`): `getFolderOptions()` reports it, with the R281 banner already wired in Task 14;
- `getFolderType()` (the adapter's type for the open model), `getModelId()` (the selected row's bare `modelId`, R292, R300; `getNamespace()` is `cms.article` and is never used for it) and `inspectRouting(params)` (the editor presenter adds `modelId` and calls the app's use case);
- found users from every search join `RuleReferences` (Task 14), so a picked value is known locally and is never re-resolved (R298).

The search methods return nothing and update observable state; a failed search sets `failed` (the picker shows `Could not load results.` with Retry through the `retry` callback of Task 18's slices, which Task 22b binds to `retryUsers` and `retryTargetMembers`).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/getMemberKey.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts`
- Modify: `packages/app-workflows/src/editor/testing/routingStepFixtures.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/constants.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`
- Modify: `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`

**Interfaces:**
- Consumes: Task 14 (`references`, `addFoundUsers`, `loadFolders`, `foldersLoading`, `foldersFailed`, `folders`, the private `isReviewAvailable()` method over Task 12's `isReviewAvailable`, `createRoutingStep`, `createStoredRule`, `createListedUser`), Task 6 (`WorkflowUserSummary`, `config.listUsers`), Task 7 (`RoutingInspection` with `narrowedTeamId`, `candidateIds` and `candidateCount`, `RoutingStepConfig`, `IWorkflowEditorUseCases.inspectRouting(params: InspectRoutingParams)` with `InspectRoutingParams { stepConfig: RoutingStepConfig; requesterId: string; folderId: string | null; modelId: string | null }`, the `inspectRouting` mock of `createFakeEditorUseCases`), Task 8 (`AppFolder`, `WorkflowEditorAppAdapter.getFolderType(modelId: string | null): string`, `listFolders`, the `getFolderType` mock of `createFakeAppAdapter`), 9a (`searchTeams` as the model of the debounce and the token, `SEARCH_DEBOUNCE_MS`, `createDeferred`, `createEditorPresenterSetup`).
- Produces (added to `IWorkflowEditorPresenter` and `StepDrawerSource`): `getUserOptions(): UserOptionsState`, `searchUsers(search: string): void`, `retryUsers(): void`, `getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState`, `searchTargetMembers(stepTeamIds: string[], search: string): void`, `retryTargetMembers(stepTeamIds: string[]): void`, `getFolderOptions(): FolderOptionsState`, `getFolderType(): string`, `getModelId(): string | null`, `inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection>`; the types `UserOptionsState { items: WorkflowUserSummary[]; selected: WorkflowUserSummary[]; loading: boolean; failed: boolean }`, `FolderOptionsState { items: AppFolder[]; loading: boolean; failed: boolean }`, `DrawerInspectParams { stepConfig: RoutingStepConfig; requesterId: string; folderId: string | null }` (in `[STEP]/editor/abstractions.ts`); `FakeStepDrawerSource` members `users`, `members`, `folders`, `modelId`, `folderType` and mocks for every method above.

**Test runner note:** admin package, `yarn test <path>` only. Type check: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`.

- [ ] **Step 0: Preconditions**

Task 14 is committed. Check what this task relies on:

```bash
cd /Users/brunozoric/work/webiny/webiny-js
grep -n "getFolderType\|listFolders" packages/app-workflows/src/editor/testing/fakeEditorAppAdapter.ts
grep -n "inspectRouting" packages/app-workflows/src/editor/testing/fakeWorkflowEditorUseCases.ts
grep -n "loadFolders\|foldersLoading" packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts
```

`app.getFolderType`, `app.listFolders` and `useCases.inspectRouting` must be vitest mocks. If a fake names one differently, use its name below and record it under "Contract notes".

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/routingStepFixtures.ts` (Task 14): add the imports

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
```

and, at the end of the file, a builder for the answer of `inspectRouting` (Tasks 14c, 16 and 17 import it):

```ts
// An inspection where no rule matched and nobody was chosen: the step waits in the team pool.
export const createTestInspection = (
    overrides: Partial<RoutingInspection> = {}
): RoutingInspection => {
    return {
        owner: null,
        source: "pool",
        ruleId: null,
        strategy: "none",
        narrowedTeamId: null,
        candidateIds: [],
        candidateCount: 0,
        trace: [],
        skipped: [],
        ...overrides
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import { createStepTypes } from "~/editor/testing/draftFixtures.js";
import { createEditorPresenterSetup } from "~/editor/testing/editorPresenterSetup.js";
import { createEditorWorkflow } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelPage } from "~/editor/testing/editorFixtures.js";
import { createWorkflowModelRow } from "~/editor/testing/editorFixtures.js";
import { createListedUser } from "~/editor/testing/routingStepFixtures.js";
import { createTestInspection } from "~/editor/testing/routingStepFixtures.js";

afterEach(() => {
    vi.useRealTimers();
});

// Lets every pending promise continuation run (the tests use real timers except where they fake them).
const flush = (): Promise<void> => {
    return new Promise<void>(resolve => setTimeout(resolve, 0));
};

const ADA = createListedUser("user-1", "Ada Lovelace", ["team-1"]);
const GRACE = createListedUser("user-2", "Grace Hopper", ["team-2"]);

const openedSetup = async () => {
    const setup = createEditorPresenterSetup();
    setup.app.listFolders.mockResolvedValue([]);
    setup.useCases.folderExists.mockResolvedValue(true);
    await setup.presenter.init(setup.params);
    setup.config.listUsers.mockClear();
    return setup;
};

describe("WorkflowEditorPresenter: user search (R307)", () => {
    it("runs an empty search at once with the default limit and no team scope", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockResolvedValue({ users: [ADA, GRACE], missingIds: [] });

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toHaveLength(2));

        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: null,
            limit: 50
        });
        expect(setup.presenter.getUserOptions().loading).toBe(false);
        expect(setup.presenter.getUserOptions().failed).toBe(false);
    });

    it("debounces a typed search by 250 ms", async () => {
        const setup = await openedSetup();
        vi.useFakeTimers();

        setup.presenter.searchUsers("ad");
        setup.presenter.searchUsers("ada");
        await vi.advanceTimersByTimeAsync(249);
        expect(setup.config.listUsers).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);

        expect(setup.config.listUsers).toHaveBeenCalledTimes(1);
        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: "ada",
            ids: null,
            teamIds: null,
            limit: 50
        });
    });

    it("drops the answer of an older search", async () => {
        const setup = await openedSetup();
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);
        setup.config.listUsers.mockResolvedValueOnce({ users: [GRACE], missingIds: [] });

        setup.presenter.searchUsers("");
        setup.presenter.retryUsers();
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([GRACE]));
        slow.resolve({ users: [ADA], missingIds: [] });
        await flush();

        expect(setup.presenter.getUserOptions().items).toEqual([GRACE]);
        expect(setup.presenter.getUserOptions().loading).toBe(false);
    });

    it("keeps the found users as known, so a picked value is never looked up again", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockResolvedValue({ users: [ADA], missingIds: [] });

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([ADA]));

        expect(setup.presenter.getReferences().users.get("user-1")).toEqual({
            id: "user-1",
            label: "Ada Lovelace",
            state: "found"
        });
        expect(setup.presenter.getReferences().userTeamIds.get("user-1")).toEqual(["team-1"]);
        expect(setup.presenter.getUserOptions().selected).toEqual([ADA]);
    });

    it("reports a failed search and searches again on retry", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockRejectedValueOnce(new Error("down"));

        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().failed).toBe(true));
        expect(setup.presenter.getUserOptions().loading).toBe(false);

        setup.config.listUsers.mockResolvedValue({ users: [ADA], missingIds: [] });
        setup.presenter.retryUsers();
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([ADA]));
        expect(setup.presenter.getUserOptions().failed).toBe(false);
    });
});

describe("WorkflowEditorPresenter: target member search (R286, R307)", () => {
    it("scopes the search to the step's teams and answers per team set, whatever the order", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockResolvedValue({ users: [ADA], missingIds: [] });

        setup.presenter.searchTargetMembers(["team-1", "team-2"], "");
        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1", "team-2"]).items).toEqual([
                ADA
            ]);
        });

        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: null,
            ids: null,
            teamIds: ["team-1", "team-2"],
            limit: 50
        });
        expect(setup.presenter.getTargetMemberOptions(["team-2", "team-1"]).items).toEqual([ADA]);
        expect(setup.presenter.getTargetMemberOptions(["team-3"]).items).toEqual([]);
        expect(setup.presenter.getTargetMemberOptions(["team-3"]).loading).toBe(false);
    });

    it("passes the typed text after the debounce", async () => {
        const setup = await openedSetup();
        vi.useFakeTimers();

        setup.presenter.searchTargetMembers(["team-1"], "gra");
        await vi.advanceTimersByTimeAsync(250);

        expect(setup.config.listUsers).toHaveBeenCalledWith({
            search: "gra",
            ids: null,
            teamIds: ["team-1"],
            limit: 50
        });
    });

    it("asks nothing for a step without teams", async () => {
        const setup = await openedSetup();

        setup.presenter.searchTargetMembers([], "");

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.presenter.getTargetMemberOptions([]).items).toEqual([]);
        expect(setup.presenter.getTargetMemberOptions([]).loading).toBe(false);
    });

    it("drops the answer of an older member search and keeps the user search apart", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockResolvedValueOnce({ users: [GRACE], missingIds: [] });
        setup.presenter.searchUsers("");
        await vi.waitFor(() => expect(setup.presenter.getUserOptions().items).toEqual([GRACE]));
        const slow = createDeferred<WorkflowUserList>();
        setup.config.listUsers.mockReturnValueOnce(slow.promise);
        setup.config.listUsers.mockResolvedValueOnce({ users: [ADA], missingIds: [] });

        setup.presenter.searchTargetMembers(["team-1"], "");
        setup.presenter.retryTargetMembers(["team-1"]);
        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([ADA]);
        });
        slow.resolve({ users: [GRACE], missingIds: [] });
        await flush();

        expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([ADA]);
        expect(setup.presenter.getUserOptions().items).toEqual([GRACE]);
    });

    it("reports a failed member search", async () => {
        const setup = await openedSetup();
        setup.config.listUsers.mockRejectedValueOnce(new Error("down"));

        setup.presenter.searchTargetMembers(["team-1"], "");

        await vi.waitFor(() => {
            expect(setup.presenter.getTargetMemberOptions(["team-1"]).failed).toBe(true);
        });
    });

    it("makes no member lookup while the review step type is unavailable (teams off, R290)", async () => {
        const setup = createEditorPresenterSetup();
        setup.config.listStepTypes.mockResolvedValue(
            createStepTypes().map(item => {
                return item.type === "review"
                    ? { ...item, available: false, unavailableReason: "Teams are not enabled." }
                    : item;
            })
        );
        await setup.presenter.init(setup.params);
        setup.config.listUsers.mockClear();

        setup.presenter.searchTargetMembers(["team-1"], "");

        expect(setup.config.listUsers).not.toHaveBeenCalled();
        expect(setup.presenter.getTargetMemberOptions(["team-1"]).items).toEqual([]);
    });
});

describe("WorkflowEditorPresenter: folder options (R292, Q54)", () => {
    it("lists the app's folders once per model and reports loading and failure", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.folderExists.mockResolvedValue(true);
        const slow = createDeferred<AppFolder[]>();
        setup.app.listFolders.mockReturnValue(slow.promise);

        const opening = setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().loading).toBe(true));
        slow.resolve([{ id: "f1", path: "/News" }]);
        await opening;
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().loading).toBe(false));

        expect(setup.presenter.getFolderOptions()).toEqual({
            items: [{ id: "f1", path: "/News" }],
            loading: false,
            failed: false
        });
        expect(setup.app.listFolders).toHaveBeenCalledTimes(1);
        expect(setup.app.listFolders).toHaveBeenCalledWith("article");
    });

    it("shows the options banner when the list fails and loads it again on Try again", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.app.listFolders.mockRejectedValueOnce(new Error("down"));

        await setup.presenter.init(setup.params);
        await vi.waitFor(() => expect(setup.presenter.getFolderOptions().failed).toBe(true));

        expect(setup.presenter.vm.optionsBanner).toEqual({
            message: "Could not load the step options."
        });

        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);
        await setup.presenter.retryOptions();

        expect(setup.presenter.getFolderOptions().items).toEqual([{ id: "f1", path: "/News" }]);
        expect(setup.presenter.getFolderOptions().failed).toBe(false);
        expect(setup.presenter.vm.optionsBanner).toBeNull();
    });

    it("does not load the list for a workflow without People steps until one is added", async () => {
        const setup = createEditorPresenterSetup();
        setup.useCases.getWorkflow.mockResolvedValue(createEditorWorkflow({ steps: [] }));
        setup.app.listFolders.mockResolvedValue([{ id: "f1", path: "/News" }]);

        await setup.presenter.init(setup.params);
        expect(setup.app.listFolders).not.toHaveBeenCalled();

        setup.presenter.addStep(0, "review");
        await vi.waitFor(() => expect(setup.app.listFolders).toHaveBeenCalledTimes(1));
        await vi.waitFor(() => {
            expect(setup.presenter.getFolderOptions().items).toEqual([{ id: "f1", path: "/News" }]);
        });
    });
});

describe("WorkflowEditorPresenter: model id and folder type (R292, R300)", () => {
    it("returns the selected row's bare model id, null before a model is open", async () => {
        const setup = createEditorPresenterSetup();
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        expect(setup.presenter.getModelId()).toBeNull();

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getModelId()).toBe("article");
        expect(setup.presenter.getNamespace()).toBe("cms.article");
    });

    it("returns the row's own id for Website Builder, where the gateway ignores it", async () => {
        const setup = createEditorPresenterSetup({ appKind: "wb" });
        setup.useCases.listModels.mockResolvedValue(
            createWorkflowModelPage({
                rows: [
                    createWorkflowModelRow({
                        model: "wb.page",
                        modelId: "page",
                        name: "Pages",
                        workflow: { id: "workflow-1", name: "Pages review" }
                    })
                ]
            })
        );
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);

        await setup.presenter.init(setup.params);

        expect(setup.presenter.getModelId()).toBe("page");
    });

    it("asks the adapter for the folder type of the open model", async () => {
        const setup = createEditorPresenterSetup();
        setup.app.listFolders.mockResolvedValue([]);
        setup.useCases.folderExists.mockResolvedValue(true);
        setup.app.getFolderType.mockReturnValue("cms:article");
        await setup.presenter.init(setup.params);

        const type = setup.presenter.getFolderType();

        expect(type).toBe("cms:article");
        expect(setup.app.getFolderType).toHaveBeenCalledWith("article");
    });
});

describe("WorkflowEditorPresenter: inspectRouting (R300)", () => {
    const stepConfig = {
        teams: ["team-1"],
        assignment: { strategy: "none", allowManualPick: false, rules: [] }
    };

    it("adds the model id and passes the answer through", async () => {
        const setup = await openedSetup();
        const inspection = createTestInspection();
        setup.useCases.inspectRouting.mockResolvedValue(inspection);

        const result = await setup.presenter.inspectRouting({
            stepConfig,
            requesterId: "user-1",
            folderId: "f1"
        });

        expect(setup.useCases.inspectRouting).toHaveBeenCalledWith({
            stepConfig,
            requesterId: "user-1",
            folderId: "f1",
            modelId: "article"
        });
        expect(result).toBe(inspection);
    });

    it("lets the use case's error through", async () => {
        const setup = await openedSetup();
        const failure = new GraphQLOperationError({
            message: "Rule needs a target.",
            code: "Workflows/Workflow/Validation",
            data: null
        });
        setup.useCases.inspectRouting.mockRejectedValue(failure);

        await expect(
            setup.presenter.inspectRouting({ stepConfig, requesterId: "user-1", folderId: null })
        ).rejects.toBe(failure);
    });

    it("rejects when the editor is not open", async () => {
        const setup = createEditorPresenterSetup();

        await expect(
            setup.presenter.inspectRouting({ stepConfig, requesterId: "user-1", folderId: null })
        ).rejects.toThrow("The editor is not open.");
        expect(setup.useCases.inspectRouting).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run the test and expect failure**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -30
```

Expected: the cases fail with `presenter.searchUsers is not a function` (and the same for the other new methods).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/getMemberKey.ts`:

```ts
// One key per set of teams, whatever the order of the ids (the member options are kept per set).
export const getMemberKey = (stepTeamIds: string[]): string => {
    const sorted = [...stepTeamIds].sort();
    return sorted.join(",");
};
```

Modify `constants.ts`: add after `USER_IDS_LIMIT`:

```ts
// How many users one picker search asks for (the server's default, R286).
export const USER_SEARCH_LIMIT = 50;
```

Modify `packages/app-workflows/src/editor/presentation/editor/abstractions.ts`. Imports:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { RoutingStepConfig } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
```

Types, after `WorkflowTeamOptions`:

```ts
// The user list of a picker: the last search's results, every user seen by id, and its state (R307).
export interface UserOptionsState {
    items: WorkflowUserSummary[];
    // Every user seen by id (resolved at load and from every search), so a chosen value keeps its name.
    selected: WorkflowUserSummary[];
    loading: boolean;
    failed: boolean;
}

// The app's folder list of the open model (R292).
export interface FolderOptionsState {
    items: AppFolder[];
    loading: boolean;
    failed: boolean;
}

// What the drawer sends to Test routing; the presenter adds the model id (R300).
export interface DrawerInspectParams {
    stepConfig: RoutingStepConfig;
    requesterId: string;
    folderId: string | null;
}
```

In `IWorkflowEditorPresenter`, after `retryReferences(): void;`:

```ts
    getUserOptions(): UserOptionsState;
    searchUsers(search: string): void;
    retryUsers(): void;
    // The members of the step's reviewing teams for the rule target picker (R286, R307).
    getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState;
    searchTargetMembers(stepTeamIds: string[], search: string): void;
    retryTargetMembers(stepTeamIds: string[]): void;
    getFolderOptions(): FolderOptionsState;
    // The folder type of the open model (`cms:<modelId>`, `wb:page`) from the app adapter (R292).
    getFolderType(): string;
    // The selected row's bare model id, never derived from the namespace (R292, R300).
    getModelId(): string | null;
    inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection>;
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/abstractions.ts`: add imports

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { DrawerInspectParams } from "~/editor/presentation/editor/abstractions.js";
import type { FolderOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { UserOptionsState } from "~/editor/presentation/editor/abstractions.js";
```

and in `StepDrawerSource`, after `retryReferences(): void;`:

```ts
    getUserOptions(): UserOptionsState;
    searchUsers(search: string): void;
    retryUsers(): void;
    getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState;
    searchTargetMembers(stepTeamIds: string[], search: string): void;
    retryTargetMembers(stepTeamIds: string[]): void;
    getFolderOptions(): FolderOptionsState;
    getFolderType(): string;
    getModelId(): string | null;
    inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection>;
```

Modify `packages/app-workflows/src/editor/testing/fakeStepDrawerSource.ts`: imports

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { DrawerInspectParams } from "~/editor/presentation/editor/abstractions.js";
import type { FolderOptionsState } from "~/editor/presentation/editor/abstractions.js";
import type { UserOptionsState } from "~/editor/presentation/editor/abstractions.js";
```

members (after `retryReferences`):

```ts
    users: UserOptionsState = { items: [], selected: [], loading: false, failed: false };
    members: UserOptionsState = { items: [], selected: [], loading: false, failed: false };
    folders: FolderOptionsState = { items: [], loading: false, failed: false };
    modelId: string | null = "article";
    folderType = "cms:article";
    searchUsers: Mock<(search: string) => void> = vi.fn();
    retryUsers: Mock<() => void> = vi.fn();
    searchTargetMembers: Mock<(stepTeamIds: string[], search: string) => void> = vi.fn();
    retryTargetMembers: Mock<(stepTeamIds: string[]) => void> = vi.fn();
    inspectRouting: Mock<(params: DrawerInspectParams) => Promise<RoutingInspection>> = vi.fn();
```

annotations (after `retryReferences: false,`):

```ts
            users: observableRef,
            members: observableRef,
            folders: observableRef,
            searchUsers: false,
            retryUsers: false,
            searchTargetMembers: false,
            retryTargetMembers: false,
            inspectRouting: false,
```

methods (after `setReferences`):

```ts
    getUserOptions(): UserOptionsState {
        return this.users;
    }

    getTargetMemberOptions(): UserOptionsState {
        return this.members;
    }

    getFolderOptions(): FolderOptionsState {
        return this.folders;
    }

    getFolderType(): string {
        return this.folderType;
    }

    getModelId(): string | null {
        return this.modelId;
    }

    setUsers(users: UserOptionsState): void {
        this.users = users;
    }

    setMembers(members: UserOptionsState): void {
        this.members = members;
    }

    setFolders(folders: FolderOptionsState): void {
        this.folders = folders;
    }
```

Modify `packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.ts`.

Imports:

```ts
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { addFoundUsers } from "./addFoundUsers.js";
import { getMemberKey } from "./getMemberKey.js";
import { USER_SEARCH_LIMIT } from "./constants.js";
import type { DrawerInspectParams } from "./abstractions.js";
import type { FolderOptionsState } from "./abstractions.js";
import type { UserOptionsState } from "./abstractions.js";
```

State, after `private folderLoad ...`:

```ts
    // The user search of the requester pickers, and the member search of the rule target picker.
    private userResults: WorkflowUserSummary[] = [];
    private usersLoading = false;
    private usersFailed = false;
    private lastUserSearch = "";
    private usersToken = 0;
    private userSearchTimer: ReturnType<typeof setTimeout> | null = null;
    private memberResults: WorkflowUserSummary[] = [];
    // The team set the member results belong to (`getMemberKey`).
    private memberKey = "";
    private membersLoading = false;
    private membersFailed = false;
    private lastMemberSearch = "";
    private membersToken = 0;
    private memberSearchTimer: ReturnType<typeof setTimeout> | null = null;
```

In `makeAutoObservable`, extend the generic list (after `| "folderLoad"`) with `| "userResults" | "lastUserSearch" | "usersToken" | "userSearchTimer" | "memberResults" | "lastMemberSearch" | "membersToken" | "memberSearchTimer"` (one per line) and replace the last option `folderLoad: false\n        });` with

```ts
            folderLoad: false,
            userResults: observableRef,
            lastUserSearch: false,
            usersToken: false,
            userSearchTimer: false,
            memberResults: observableRef,
            lastMemberSearch: false,
            membersToken: false,
            memberSearchTimer: false
        });
```

Public methods, after `retryReferences()`:

```ts
    getUserOptions(): UserOptionsState {
        return {
            items: this.userResults,
            selected: this.getKnownUsers(),
            loading: this.usersLoading,
            failed: this.usersFailed
        };
    }

    searchUsers(search: string): void {
        this.cancelUserSearchTimer();
        this.lastUserSearch = search;
        if (search === "") {
            void this.runUserSearch(search);
            return;
        }
        this.userSearchTimer = setTimeout(() => {
            this.userSearchTimer = null;
            void this.runUserSearch(search);
        }, SEARCH_DEBOUNCE_MS);
    }

    retryUsers(): void {
        void this.runUserSearch(this.lastUserSearch);
    }

    getTargetMemberOptions(stepTeamIds: string[]): UserOptionsState {
        const current = this.memberKey === getMemberKey(stepTeamIds);
        return {
            items: current ? this.memberResults : [],
            selected: this.getKnownUsers(),
            loading: current && this.membersLoading,
            failed: current && this.membersFailed
        };
    }

    searchTargetMembers(stepTeamIds: string[], search: string): void {
        this.cancelMemberSearchTimer();
        this.lastMemberSearch = search;
        if (search === "") {
            void this.runMemberSearch(stepTeamIds, search);
            return;
        }
        this.memberSearchTimer = setTimeout(() => {
            this.memberSearchTimer = null;
            void this.runMemberSearch(stepTeamIds, search);
        }, SEARCH_DEBOUNCE_MS);
    }

    retryTargetMembers(stepTeamIds: string[]): void {
        void this.runMemberSearch(stepTeamIds, this.lastMemberSearch);
    }

    getFolderOptions(): FolderOptionsState {
        return {
            items: this.folders,
            loading: this.foldersLoading,
            failed: this.foldersFailed
        };
    }

    getFolderType(): string {
        const params = this.params;
        if (params === null) {
            return "";
        }
        const modelId = this.getModelId();
        return params.app.getFolderType(modelId);
    }

    getModelId(): string | null {
        const row = this.selectedRow;
        return row === null ? null : row.modelId;
    }

    async inspectRouting(params: DrawerInspectParams): Promise<RoutingInspection> {
        const init = this.params;
        if (init === null) {
            throw new Error("The editor is not open.");
        }
        const modelId = this.getModelId();
        return init.useCases.inspectRouting({
            stepConfig: params.stepConfig,
            requesterId: params.requesterId,
            folderId: params.folderId,
            modelId
        });
    }
```

`dispose()`: after `this.referencesToken += 1;` add `this.usersToken += 1; this.membersToken += 1; this.cancelUserSearchTimer(); this.cancelMemberSearchTimer();` and after the `this.folderLoad = null;` block add:

```ts
        this.userResults = [];
        this.usersLoading = false;
        this.usersFailed = false;
        this.lastUserSearch = "";
        this.memberResults = [];
        this.memberKey = "";
        this.membersLoading = false;
        this.membersFailed = false;
        this.lastMemberSearch = "";
```

Private methods, before `runTeamSearch`:

```ts
    private cancelUserSearchTimer(): void {
        if (this.userSearchTimer !== null) {
            clearTimeout(this.userSearchTimer);
            this.userSearchTimer = null;
        }
    }

    private cancelMemberSearchTimer(): void {
        if (this.memberSearchTimer !== null) {
            clearTimeout(this.memberSearchTimer);
            this.memberSearchTimer = null;
        }
    }

    // Every found user the maps hold, as the pickers' `selected` list.
    private getKnownUsers(): WorkflowUserSummary[] {
        const users: WorkflowUserSummary[] = [];
        for (const label of this.references.users.values()) {
            if (label.state !== "found") {
                continue;
            }
            const teamIds = this.references.userTeamIds.get(label.id) ?? [];
            users.push({ id: label.id, displayName: label.label, teamIds });
        }
        return users;
    }

    private async runUserSearch(search: string): Promise<void> {
        this.usersToken += 1;
        const token = this.usersToken;
        this.usersLoading = true;
        this.usersFailed = false;
        const query = search === "" ? null : search;
        try {
            const result = await this.config.listUsers({
                search: query,
                ids: null,
                teamIds: null,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.usersToken) {
                this.applyUserResults(result.users);
            }
        } catch {
            if (token === this.usersToken) {
                this.applyUserSearchFailure();
            }
        }
    }

    private applyUserResults(users: WorkflowUserSummary[]): void {
        this.userResults = users;
        this.references = addFoundUsers(this.references, users);
        this.usersLoading = false;
    }

    private applyUserSearchFailure(): void {
        this.usersLoading = false;
        this.usersFailed = true;
    }

    private async runMemberSearch(stepTeamIds: string[], search: string): Promise<void> {
        this.membersToken += 1;
        const token = this.membersToken;
        this.memberKey = getMemberKey(stepTeamIds);
        this.membersFailed = false;
        // No teams (or teams off, R290): nobody can be a member, so nothing is asked.
        if (stepTeamIds.length === 0 || !this.isReviewAvailable()) {
            this.applyMemberResults([]);
            return;
        }
        this.membersLoading = true;
        const query = search === "" ? null : search;
        try {
            const result = await this.config.listUsers({
                search: query,
                ids: null,
                teamIds: stepTeamIds,
                limit: USER_SEARCH_LIMIT
            });
            if (token === this.membersToken) {
                this.applyMemberResults(result.users);
            }
        } catch {
            if (token === this.membersToken) {
                this.applyMemberSearchFailure();
            }
        }
    }

    private applyMemberResults(users: WorkflowUserSummary[]): void {
        this.memberResults = users;
        this.references = addFoundUsers(this.references, users);
        this.membersLoading = false;
    }

    private applyMemberSearchFailure(): void {
        this.membersLoading = false;
        this.membersFailed = true;
    }
```

- [ ] **Step 4: Run the test and expect it to pass**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.options.test.ts 2>&1 | tail -40
```

Expected: all pass.

- [ ] **Step 5: Run the tests covering the changed code, then the type check**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.references.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/editor/WorkflowEditorPresenter.teamSearch.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: pass, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
cd /Users/brunozoric/work/webiny/webiny-js
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
git restore --source=HEAD --staged --worktree .gitleaks.toml
git commit -m "feat(app-workflows): user, member and folder options and inspectRouting in the editor presenter" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
- The contract lists no retry for the user and member lists, but the picker's `Could not load results.` + Retry needs one (the 9a team lists have `retryTeams`). `retryUsers()` and `retryTargetMembers(stepTeamIds)` are added; Task 18's `users` and `targetMembers` slice `retry` callbacks and Task 22b bind to them.
- `UserOptionsState`, `FolderOptionsState` and `DrawerInspectParams` are declared in `[STEP]/editor/abstractions.ts` (next to `WorkflowTeamOptions`) and imported by the drawer's `abstractions.ts`, so the editor presenter does not import from the drawer.
- `UserOptionsState.selected` holds every user the maps know as found (not only the ones a form holds); the drawer presenter filters it to the held ids as it does for teams.
- The folder list loading and its banner live in Task 14 (the resolution needs them first); this task only exposes the state.

**Review fixes (sub-phase review):**
- The `makeAutoObservable` hunk now states how to extend the last option (Task 14 ends the list without a trailing comma) so the hunk applies.
- Consumes entries name Task 12's `isReviewAvailable` behind Task 14's private method, and Task 7's final `RoutingInspection` fields.
