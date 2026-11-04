### Task 22: `TestRoutingRenderer`

R300, R301, R306, R307, R315; Q55, Q59.2, Q59.3; D118; design README 4 and `research-spec.md` 4.5 and 7 (Test routing tab); Review Focus 6, 10. The Test routing tab holds the layout element `workflowTestRouting` (R293). Its renderer is a plain component that FormView calls as `<Renderer field={{...props}} />`: no form, no `createFieldRenderer`. It reads everything from `StepFormOptionsContext` (the `users`, `folders` and `testRouting` slices of Task 18, filled by Task 22b) and calls only the plain callbacks of the `testRouting` slice. The drawer presenter owns all state (R234, Task 17): the renderer renders the `TestRoutingVm` it is given and keeps only one trivial visual state, the folder search text (the folder list is complete, R292) and the label of the requester just picked (so the picker keeps the name when a search narrows the list).

- **Layout of the tab:** intro text; two inputs side by side (`Requester`, `Folder`); the `Test routing` button with the hint beside it; then, by status: `running` a three-bar skeleton in place of the result; `failed` the failure alert; `done` the result, preceded by the stale alert when `vm.stale`.
- **Inputs (R315):** both are `WorkflowPicker`s. Requester: label `Requester`, placeholder `Search users`, `anyLabel` `null`, options `users.items` through `toUserPickerOption`, `onSearch` is `users.searchUsers`. Folder: label `Folder`, placeholder `Search folders`, `anyLabel` `Root (no folder)` (R307: the clear row; the field shows `anyLabel` when nothing is chosen), options `folders.items` through `toFolderPickerOption`, filtered client side by the search text (case-insensitive, on the path). Choosing the clear row gives `null`. Both are disabled while `vm.status` is `running`. A list that failed to load shows the R281 banner `Could not load the step options.` with `Try again` in place of that picker (`users.retry`, `folders.retry`).
- **Button:** `Button` (secondary, play icon), text `vm.buttonLabel` (`Test routing` or `Testing…`), disabled when `!vm.canRun` or while running; click calls `testRouting.runTest()`. `vm.hint` (`Choose a requester to test.`) shows next to it when not null. The renderer never calls `runTest` by itself: a stale result is only re-run by the admin (R300).
- **Failure (R300, Q59.3):** `Alert` danger, text `vm.errorMessage` (already `Could not test routing: {server message}` or `Could not test routing: the server did not respond.`), action `Try again` (calls `runTest`, disabled when `!vm.canRun`). No result is shown.
- **Stale (R300):** `Alert` info with the update icon, text `Out of date: the configuration or test inputs changed since this result.`, action `Test again` (calls `runTest`, disabled when `!vm.canRun`). The old result stays below at 50% opacity (`data-stale="true"`).
- **Result (R301, design):** card with the owner tile (person icon or groups icon from `result.ownerIcon`), the label `Owner`, the value `result.ownerLabel` (a name or `Team pool`) and `result.reason` beneath; `Trace` with `No routing rules.` when the trace is empty, else one row per entry: tag (`Matched` success-light, `Not matched` neutral-muted, `Skipped` warning), `row.label` (`Rule {n}: {summary}`), `row.reason` beneath; a row with the outlined tag `Strategy` and `result.strategyLine`; `Skipped people` only when the list is not empty, one row `{name}: {reason}` per person with the name in bold. Every sentence is composed by Task 13 and shown verbatim.
- **Registration:** `[AW]/editor/WorkflowEditorConfig.tsx` registers the component as the field renderer named `element:workflowTestRouting` (FormView looks a layout element up as `element:${renderer}`, so the registered name is `element:` plus `STEP_FORM_RENDERER.testRouting`, the property Task 18 adds), and `WorkflowEditorConfig.test.tsx` lists it last.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepForm/renderers/testRouting/testRoutingMessages.ts`
- Create: `[STEP]/stepForm/renderers/testRouting/TestRoutingInputs.tsx`
- Create: `[STEP]/stepForm/renderers/testRouting/useTestRoutingInputs.ts`
- Create: `[STEP]/stepForm/renderers/testRouting/TestRoutingFailure.tsx`
- Create: `[STEP]/stepForm/renderers/testRouting/TestRoutingStale.tsx`
- Create: `[STEP]/stepForm/renderers/testRouting/TestRoutingResult.tsx`
- Create: `[STEP]/stepForm/renderers/TestRoutingRenderer.tsx`
- Create: `[STEP]/stepForm/renderers/TestRoutingRenderer.test.tsx`
- Create: `packages/app-workflows/src/editor/testing/testRoutingFixtures.ts`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): `useStepFormOptions` (`[STEP]/stepForm/useStepFormOptions.ts`), `StepFormOptionsContext`, `STEP_FORM_MESSAGES.optionsFailed` and `.tryAgain` (`[STEP]/stepForm/stepFormMessages.ts`), `StepFormListState` (`StepFormOptions.ts`), `WorkflowPicker` and `PickerOption` (`~/components/picker/`), `createStepFormOptions` (`~/editor/testing/createStepFormOptions.js`), `renderWithAdminUi` (`~/review/testing/renderWithAdminUi.js`), admin-ui `Alert`, `Button`, `FormComponentLabel`, `Skeleton`, `Tag`, `Text`, `cn`.
- Consumes (from earlier 9b tasks, verify each against the file as that task left it):
  - Task 13: `TestRoutingResultVm { ownerLabel; ownerIcon: "person" | "groups"; reason; trace: { ruleId; tag: "Matched" | "Not matched" | "Skipped"; label; reason }[]; strategyLine; skipped: { name; reason }[] }` in `~/editor/model/testRouting/TestRoutingResultVm.js`.
  - Task 17: `TestRoutingVm { requesterId; folderId; canRun; hint; buttonLabel; status; stale; result; errorMessage }`. Verified: Task 17 declares it in `[STEP]/stepDrawer/abstractions.ts` (import path used below) and `errorMessage` is the full text of R300.
  - Task 18, `StepFormOptions.ts` (verified against the written task file): `users: StepFormUsersOptions` (`StepFormListState` plus `items`, `selected`, `searchUsers(query)`), `folders: StepFormFoldersOptions` (`StepFormListState` plus `items: AppFolder[]` and `folderType: string`), `testRouting: StepFormTestRoutingOptions { vm: StepFormTestRoutingVm; setTestRequester; setTestFolder; runTest }`. `StepFormTestRoutingVm` mirrors Task 17's `TestRoutingVm` field for field, so the renderer and the fixtures use `TestRoutingVm` (structurally identical).
  - Task 19: `WorkflowPicker` has the optional prop `anyLabel?: string | null` (wins over `placeholder`) and `PickerOption` has `muted`, `disabled` and `icon: PickerOptionIcon | null` (R307).
  - Task 19b (all in `[STEP]/stepForm/`, verified against the written task file): `toUserPickerOption(user: WorkflowUserSummary, teamNames?: ReadonlyMap<string, string>): PickerOption` (called here with the user only: no sub line), `toFolderPickerOption(folder: AppFolder): PickerOption` (the folder option's label is the path) and `filterPickerOptions(options: PickerOption[], query: string): PickerOption[]` (client-side, case-insensitive on the label; imported here, not duplicated).
  - Task 6 `WorkflowUserSummary` in `~/editor/domain/types.js`; Task 8 `AppFolder` in `~/editor/WorkflowEditorAppAdapter.js`.
- Produces: element renderer `TestRoutingRenderer` (`element:workflowTestRouting`), `[AWET]/testRoutingFixtures.ts` (`createTestRoutingVm`, `createTestRoutingResultVm`, `createTestRoutingOptions`, reused by Task 22b and 23).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`; type check by build (R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/testRoutingFixtures.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import type { TestRoutingVm } from "~/editor/presentation/stepDrawer/abstractions.js";

export interface FakeTestRoutingOptions {
    vm: TestRoutingVm;
    setTestRequester: Mock<(id: string | null) => void>;
    setTestFolder: Mock<(id: string | null) => void>;
    runTest: Mock<() => void>;
}

// An idle Test routing tab: no requester, so the button is disabled and the hint shows.
export const createTestRoutingVm = (overrides: Partial<TestRoutingVm> = {}): TestRoutingVm => {
    return {
        requesterId: null,
        folderId: null,
        canRun: false,
        hint: "Choose a requester to test.",
        buttonLabel: "Test routing",
        status: "idle",
        stale: false,
        result: null,
        errorMessage: null,
        ...overrides
    };
};

// Rule 1 matched and chose a person, rule 2 was not evaluated, one person was skipped.
export const createTestRoutingResultVm = (
    overrides: Partial<TestRoutingResultVm> = {}
): TestRoutingResultVm => {
    return {
        ownerLabel: "Ivan Horvat",
        ownerIcon: "person",
        reason: "Assigned by rule 1",
        trace: [
            {
                ruleId: "r1",
                tag: "Matched",
                label: "Rule 1: If requester is in Marketing → Ivan Horvat",
                reason: "All conditions match."
            },
            {
                ruleId: "r2",
                tag: "Skipped",
                label: "Rule 2: Always → Editors team pool",
                reason: "An earlier rule matched."
            }
        ],
        strategyLine: "Not used: a rule chose the reviewer.",
        skipped: [{ name: "Ana Kovac", reason: "Excluded from reviews." }],
        ...overrides
    };
};

export const createTestRoutingOptions = (
    vm: Partial<TestRoutingVm> = {}
): FakeTestRoutingOptions => {
    return {
        vm: createTestRoutingVm(vm),
        setTestRequester: vi.fn(),
        setTestFolder: vi.fn(),
        runTest: vi.fn()
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import type { TestRoutingVm } from "~/editor/presentation/stepDrawer/abstractions.js";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestRoutingOptions } from "~/editor/testing/testRoutingFixtures.js";
import { createTestRoutingResultVm } from "~/editor/testing/testRoutingFixtures.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { TestRoutingRenderer } from "./TestRoutingRenderer.js";

interface PickerStubProps {
    label: string;
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    placeholder: string;
    anyLabel: string | null;
    disabled: boolean;
    onSearch(search: string): void;
    onChange(id: string | null): void;
}

// Stub of the shared picker: it exposes the props the renderer passes and three buttons.
vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: PickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": `picker-${props.label}`,
                    "data-value": props.value ?? "",
                    "data-selected": props.selected ? props.selected.label : "",
                    "data-options": props.options.map(option => option.label).join("|"),
                    "data-placeholder": props.placeholder,
                    "data-any-label": props.anyLabel ?? "",
                    "data-disabled": String(props.disabled)
                },
                react.createElement(
                    "button",
                    {
                        onClick: () => {
                            const first = props.options[0];
                            props.onChange(first ? first.id : null);
                        }
                    },
                    `pick first ${props.label}`
                ),
                react.createElement(
                    "button",
                    { onClick: () => props.onChange(null) },
                    `clear ${props.label}`
                ),
                react.createElement(
                    "button",
                    { onClick: () => props.onSearch("cam") },
                    `search ${props.label}`
                )
            );
        }
    };
});

const IVAN: WorkflowUserSummary = { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] };
const ANA: WorkflowUserSummary = { id: "user-2", displayName: "Ana Kovac", teamIds: ["team-2"] };
const CAMPAIGNS: AppFolder = { id: "f1", path: "/Campaigns" };
const PARTNERS: AppFolder = { id: "f2", path: "/Partners" };
const ARCHIVE: AppFolder = { id: "f3", path: "/Campaign archive/2025" };

interface SetupParams {
    vm?: Partial<TestRoutingVm>;
    users?: WorkflowUserSummary[];
    usersFailed?: boolean;
    foldersFailed?: boolean;
}

const createSetup = (params: SetupParams = {}) => {
    const testRouting = createTestRoutingOptions(params.vm);
    const users = {
        loading: false,
        failed: params.usersFailed ?? false,
        retry: vi.fn(),
        items: params.users ?? [IVAN, ANA],
        selected: [],
        searchUsers: vi.fn()
    };
    const folders = {
        loading: false,
        failed: params.foldersFailed ?? false,
        retry: vi.fn(),
        items: [CAMPAIGNS, PARTNERS, ARCHIVE],
        folderType: "cms:article"
    };
    const options = createStepFormOptions({ users, folders, testRouting });
    return { options, testRouting, users, folders };
};

const wrap = (options: StepFormOptions) => {
    return (
        <StepFormOptionsContext.Provider value={options}>
            <TestRoutingRenderer field={{}} />
        </StepFormOptionsContext.Provider>
    );
};

const renderTab = (params: SetupParams = {}) => {
    const setup = createSetup(params);
    const view = renderWithAdminUi(wrap(setup.options));
    return { ...setup, view };
};

const runButton = (name: string): HTMLButtonElement => {
    return screen.getByRole("button", { name }) as HTMLButtonElement;
};

describe("TestRoutingRenderer (R300, R301, R315)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the intro, the two inputs with their labels and the disabled button with the hint", () => {
        renderTab();

        expect(
            screen.getByText(
                "Test who would get this step, using the configuration on screen, including unsaved changes. Nothing is assigned and nobody is notified."
            )
        ).toBeTruthy();
        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-placeholder")).toBe("Search users");
        expect(requester.getAttribute("data-any-label")).toBe("");
        expect(requester.getAttribute("data-options")).toBe("Ivan Horvat|Ana Kovac");
        const folder = screen.getByTestId("picker-Folder");
        expect(folder.getAttribute("data-placeholder")).toBe("Search folders");
        expect(folder.getAttribute("data-any-label")).toBe("Root (no folder)");
        expect(folder.getAttribute("data-options")).toBe(
            "/Campaigns|/Partners|/Campaign archive/2025"
        );
        expect(runButton("Test routing").disabled).toBe(true);
        expect(screen.getByText("Choose a requester to test.")).toBeTruthy();
    });

    it("enables the button once it can run, hides the hint and runs on click", () => {
        const { testRouting } = renderTab({
            vm: { requesterId: "user-1", canRun: true, hint: null }
        });

        expect(screen.queryByText("Choose a requester to test.")).toBeNull();
        const button = runButton("Test routing");
        expect(button.disabled).toBe(false);
        fireEvent.click(button);

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("never runs by itself, also for a stale result", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                stale: true,
                result: createTestRoutingResultVm()
            }
        });

        expect(testRouting.runTest).not.toHaveBeenCalled();
    });

    it("sends the picked requester and folder, and null for the clear rows", () => {
        const { testRouting } = renderTab();

        fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));
        fireEvent.click(screen.getByRole("button", { name: "pick first Folder" }));
        fireEvent.click(screen.getByRole("button", { name: "clear Requester" }));
        fireEvent.click(screen.getByRole("button", { name: "clear Folder" }));

        expect(testRouting.setTestRequester.mock.calls).toEqual([["user-1"], [null]]);
        expect(testRouting.setTestFolder.mock.calls).toEqual([["f1"], [null]]);
    });

    it("searches users on the server and folders on the loaded list", () => {
        const { users } = renderTab();

        fireEvent.click(screen.getByRole("button", { name: "search Requester" }));
        expect(users.searchUsers).toHaveBeenCalledWith("cam");

        fireEvent.click(screen.getByRole("button", { name: "search Folder" }));
        expect(screen.getByTestId("picker-Folder").getAttribute("data-options")).toBe(
            "/Campaigns|/Campaign archive/2025"
        );
        expect(users.searchUsers).toHaveBeenCalledTimes(1);
    });

    it("shows the chosen requester and folder with their labels", () => {
        renderTab({ vm: { requesterId: "user-2", folderId: "f2", canRun: true, hint: null } });

        expect(screen.getByTestId("picker-Requester").getAttribute("data-value")).toBe("user-2");
        expect(screen.getByTestId("picker-Requester").getAttribute("data-selected")).toBe(
            "Ana Kovac"
        );
        expect(screen.getByTestId("picker-Folder").getAttribute("data-selected")).toBe(
            "/Partners"
        );
    });

    it("keeps the label of the picked requester when a search narrows the list", () => {
        const { options, view } = renderTab();
        fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));

        const narrowed = createSetup({
            users: [ANA],
            vm: { requesterId: "user-1", canRun: true, hint: null }
        });
        view.rerender(wrap({ ...options, ...narrowed.options }));

        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-options")).toBe("Ana Kovac");
        expect(requester.getAttribute("data-selected")).toBe("Ivan Horvat");
    });

    it("shows Testing… with disabled inputs, a disabled button and a skeleton while running", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "running",
                buttonLabel: "Testing…"
            }
        });

        expect(runButton("Testing…").disabled).toBe(true);
        expect(screen.getByTestId("picker-Requester").getAttribute("data-disabled")).toBe("true");
        expect(screen.getByTestId("picker-Folder").getAttribute("data-disabled")).toBe("true");
        expect(screen.getByTestId("test-routing-skeleton")).toBeTruthy();
        expect(screen.queryByTestId("test-routing-result")).toBeNull();
    });

    it("keeps the inputs enabled when idle", () => {
        renderTab();

        expect(screen.getByTestId("picker-Requester").getAttribute("data-disabled")).toBe("false");
        expect(screen.getByTestId("picker-Folder").getAttribute("data-disabled")).toBe("false");
        expect(screen.queryByTestId("test-routing-skeleton")).toBeNull();
    });

    it("renders the owner, the trace, the strategy line and the skipped people", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                result: createTestRoutingResultVm()
            }
        });

        const result = screen.getByTestId("test-routing-result");
        expect(result.getAttribute("data-stale")).toBe("false");
        expect(screen.getByText("Owner")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("Assigned by rule 1")).toBeTruthy();
        expect(screen.getByText("Trace")).toBeTruthy();
        expect(screen.getByText("Matched")).toBeTruthy();
        expect(screen.getByText("Rule 1: If requester is in Marketing → Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("All conditions match.")).toBeTruthy();
        expect(screen.getByText("Skipped")).toBeTruthy();
        expect(screen.getByText("Rule 2: Always → Editors team pool")).toBeTruthy();
        expect(screen.getByText("An earlier rule matched.")).toBeTruthy();
        expect(screen.getByText("Strategy")).toBeTruthy();
        expect(screen.getByText("Not used: a rule chose the reviewer.")).toBeTruthy();
        expect(screen.getByText("Skipped people")).toBeTruthy();
        const skipped = screen.getByTestId("test-routing-skipped-0");
        expect(skipped.textContent).toBe("Ana Kovac: Excluded from reviews.");
    });

    it("shows the Not matched tag", () => {
        renderTab({
            vm: {
                status: "done",
                result: createTestRoutingResultVm({
                    trace: [
                        {
                            ruleId: "r1",
                            tag: "Not matched",
                            label: "Rule 1: If requester is Ana Kovac → Ivan Horvat",
                            reason: "Requester is not Ana Kovac."
                        }
                    ]
                })
            }
        });

        expect(screen.getByText("Not matched")).toBeTruthy();
        expect(screen.getByText("Requester is not Ana Kovac.")).toBeTruthy();
    });

    it("says No routing rules. for an empty trace and hides Skipped people when nobody was skipped", () => {
        renderTab({
            vm: {
                status: "done",
                result: createTestRoutingResultVm({
                    ownerLabel: "Team pool",
                    ownerIcon: "groups",
                    trace: [],
                    skipped: []
                })
            }
        });

        expect(screen.getByText("No routing rules.")).toBeTruthy();
        expect(screen.queryByText("Skipped people")).toBeNull();
        expect(screen.getByText("Team pool")).toBeTruthy();
        const tile = screen.getByTestId("test-routing-owner-icon");
        expect(tile.getAttribute("data-owner-icon")).toBe("groups");
    });

    it("marks a person owner with the person icon", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        const tile = screen.getByTestId("test-routing-owner-icon");
        expect(tile.getAttribute("data-owner-icon")).toBe("person");
    });

    it("shows the stale alert with Test again, keeps the old result dimmed and re-runs only on click", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                stale: true,
                result: createTestRoutingResultVm()
            }
        });

        expect(
            screen.getByText(
                "Out of date: the configuration or test inputs changed since this result."
            )
        ).toBeTruthy();
        const result = screen.getByTestId("test-routing-result");
        expect(result.getAttribute("data-stale")).toBe("true");
        expect(result.className).toContain("opacity-50");
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();

        fireEvent.click(runButton("Test again"));

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("disables Test again while the requester is cleared", () => {
        renderTab({ vm: { status: "done", stale: true, result: createTestRoutingResultVm() } });

        expect(runButton("Test again").disabled).toBe(true);
    });

    it("shows no stale alert for a fresh result", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        expect(screen.queryByText(/Out of date/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Test again" })).toBeNull();
    });

    it("shows a validation failure with Try again and no result", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "failed",
                errorMessage: "Could not test routing: The target team is not one of the step's reviewing teams."
            }
        });

        expect(
            screen.getByText(
                "Could not test routing: The target team is not one of the step's reviewing teams."
            )
        ).toBeTruthy();
        expect(screen.queryByTestId("test-routing-result")).toBeNull();
        fireEvent.click(runButton("Try again"));

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("shows the transport failure text", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "failed",
                errorMessage: "Could not test routing: the server did not respond."
            }
        });

        expect(
            screen.getByText("Could not test routing: the server did not respond.")
        ).toBeTruthy();
    });

    it("shows the options banner in place of a requester list that failed to load", () => {
        const { users } = renderTab({ usersFailed: true });

        expect(screen.queryByTestId("picker-Requester")).toBeNull();
        expect(screen.getByTestId("picker-Folder")).toBeTruthy();
        expect(screen.getByText("Could not load the step options.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(users.retry).toHaveBeenCalledTimes(1);
    });

    it("shows the options banner in place of a folder list that failed to load", () => {
        const { folders } = renderTab({ foldersFailed: true });

        expect(screen.queryByTestId("picker-Folder")).toBeNull();
        expect(screen.getByTestId("picker-Requester")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(folders.retry).toHaveBeenCalledTimes(1);
    });
});
```

Add the registration expectation. In `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx` the expected list gets the element renderer as its last entry. The exact hunk is in Step 3.

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: `TestRoutingRenderer.test.tsx` fails with `Failed to resolve import "./TestRoutingRenderer.js"`. `WorkflowEditorConfig.test.tsx` still passes (the registration is added in Step 3, together with its expectation). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/testRouting/testRoutingMessages.ts`:

```ts
// Copy of the Test routing tab (design README 4, research-spec.md 4.5 and 7, R300).
export const TEST_ROUTING_TAB_MESSAGES = {
    intro: "Test who would get this step, using the configuration on screen, including unsaved changes. Nothing is assigned and nobody is notified.",
    requesterLabel: "Requester",
    requesterPlaceholder: "Search users",
    folderLabel: "Folder",
    folderPlaceholder: "Search folders",
    rootFolder: "Root (no folder)",
    owner: "Owner",
    trace: "Trace",
    noRules: "No routing rules.",
    strategy: "Strategy",
    skippedPeople: "Skipped people",
    stale: "Out of date: the configuration or test inputs changed since this result.",
    testAgain: "Test again"
} as const;
```

Create `.../testRouting/TestRoutingInputs.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { STEP_FORM_MESSAGES } from "../../stepFormMessages.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingPickerProps {
    value: string | null;
    // The chosen option with its label, so the field keeps it when a search narrows the list.
    selected: PickerOption | null;
    options: PickerOption[];
    // The list failed to load: the picker is replaced by the options banner.
    failed: boolean;
    retry(): void;
    onSearch(query: string): void;
    onChange(id: string | null): void;
}

export interface TestRoutingInputsProps {
    requester: TestRoutingPickerProps;
    folder: TestRoutingPickerProps;
    // A test is running: both inputs are disabled (R300).
    disabled: boolean;
}

interface PickerFailureProps {
    label: string;
    retry(): void;
}

const PickerFailure = ({ label, retry }: PickerFailureProps) => {
    return (
        <div className={"w-full"}>
            <FormComponentLabel text={label} />
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={<Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={retry} />}
            >
                {STEP_FORM_MESSAGES.optionsFailed}
            </Alert>
        </div>
    );
};

// The Requester and Folder pickers of the Test routing tab (R315). Plain props, no state.
export const TestRoutingInputs = (props: TestRoutingInputsProps) => {
    const { requester, folder, disabled } = props;

    let requesterField: React.ReactNode = (
        <WorkflowPicker
            label={TEST_ROUTING_TAB_MESSAGES.requesterLabel}
            placeholder={TEST_ROUTING_TAB_MESSAGES.requesterPlaceholder}
            anyLabel={null}
            value={requester.value}
            selected={requester.selected}
            options={requester.options}
            onSearch={requester.onSearch}
            onChange={requester.onChange}
            disabled={disabled}
            error={null}
        />
    );
    if (requester.failed) {
        requesterField = (
            <PickerFailure label={TEST_ROUTING_TAB_MESSAGES.requesterLabel} retry={requester.retry} />
        );
    }

    let folderField: React.ReactNode = (
        <WorkflowPicker
            label={TEST_ROUTING_TAB_MESSAGES.folderLabel}
            placeholder={TEST_ROUTING_TAB_MESSAGES.folderPlaceholder}
            anyLabel={TEST_ROUTING_TAB_MESSAGES.rootFolder}
            value={folder.value}
            selected={folder.selected}
            options={folder.options}
            onSearch={folder.onSearch}
            onChange={folder.onChange}
            disabled={disabled}
            error={null}
        />
    );
    if (folder.failed) {
        folderField = (
            <PickerFailure label={TEST_ROUTING_TAB_MESSAGES.folderLabel} retry={folder.retry} />
        );
    }

    return (
        <div className={"grid grid-cols-2 gap-md"}>
            {requesterField}
            {folderField}
        </div>
    );
};
```

Create `.../testRouting/useTestRoutingInputs.ts` (the one place that reads the Task 18 slices for the inputs):

```ts
import { useState } from "react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { toFolderPickerOption } from "../../toFolderPickerOption.js";
import { toUserPickerOption } from "../../toUserPickerOption.js";
import { useStepFormOptions } from "../../useStepFormOptions.js";
import { filterPickerOptions } from "../../filterPickerOptions.js";
import type { TestRoutingInputsProps } from "./TestRoutingInputs.js";

/*
 * Turns the `users`, `folders` and `testRouting` slices into the props of the two inputs (R315).
 * Users are searched on the server through `users.searchUsers`; the folder list is complete, so
 * its search is a client-side filter over it (R292). Two trivial visual states: the folder search
 * text, and the option just picked as requester, which keeps its label when the next search no
 * longer lists the person.
 */
export const useTestRoutingInputs = (): TestRoutingInputsProps => {
    const { users, folders, testRouting } = useStepFormOptions();
    const [picked, setPicked] = useState<PickerOption | null>(null);
    const [folderQuery, setFolderQuery] = useState("");

    const requesterOptions = users.items.map(user => toUserPickerOption(user));
    const heldOptions = users.selected.map(user => toUserPickerOption(user));
    const requesterId = testRouting.vm.requesterId;
    let requesterSelected: PickerOption | null = null;
    if (requesterId !== null) {
        const known = [...requesterOptions, ...heldOptions];
        requesterSelected = known.find(option => option.id === requesterId) ?? null;
        if (requesterSelected === null && picked !== null && picked.id === requesterId) {
            requesterSelected = picked;
        }
    }

    const allFolders = folders.items.map(folder => toFolderPickerOption(folder));
    const folderOptions = filterPickerOptions(allFolders, folderQuery);
    const folderId = testRouting.vm.folderId;
    let folderSelected: PickerOption | null = null;
    if (folderId !== null) {
        folderSelected = allFolders.find(option => option.id === folderId) ?? null;
    }

    const handleRequester = (id: string | null): void => {
        const chosen = requesterOptions.find(option => option.id === id) ?? null;
        setPicked(chosen);
        testRouting.setTestRequester(id);
    };

    const handleFolder = (id: string | null): void => {
        setFolderQuery("");
        testRouting.setTestFolder(id);
    };

    return {
        requester: {
            value: requesterId,
            selected: requesterSelected,
            options: requesterOptions,
            failed: users.failed,
            retry: users.retry,
            onSearch: query => users.searchUsers(query),
            onChange: handleRequester
        },
        folder: {
            value: folderId,
            selected: folderSelected,
            options: folderOptions,
            failed: folders.failed,
            retry: folders.retry,
            onSearch: query => setFolderQuery(query),
            onChange: handleFolder
        },
        disabled: testRouting.vm.status === "running"
    };
};
```

Create `.../testRouting/TestRoutingFailure.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { STEP_FORM_MESSAGES } from "../../stepFormMessages.js";

export interface TestRoutingFailureProps {
    // The full text, `Could not test routing: ...` (R300).
    message: string;
    canRun: boolean;
    onRetry(): void;
}

export const TestRoutingFailure = (props: TestRoutingFailureProps) => {
    return (
        <Alert
            type={"danger"}
            variant={"subtle"}
            actions={
                <Alert.Action
                    text={STEP_FORM_MESSAGES.tryAgain}
                    disabled={!props.canRun}
                    onClick={props.onRetry}
                />
            }
        >
            {props.message}
        </Alert>
    );
};
```

Create `.../testRouting/TestRoutingStale.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { ReactComponent as UpdateIcon } from "@webiny/icons/update.svg";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingStaleProps {
    canRun: boolean;
    onRetest(): void;
}

// A shown result no longer matches the configuration or the inputs (R300); it is never re-run by itself.
export const TestRoutingStale = (props: TestRoutingStaleProps) => {
    return (
        <Alert
            type={"info"}
            variant={"subtle"}
            icon={<UpdateIcon />}
            actions={
                <Alert.Action
                    text={TEST_ROUTING_TAB_MESSAGES.testAgain}
                    disabled={!props.canRun}
                    onClick={props.onRetest}
                />
            }
        >
            {TEST_ROUTING_TAB_MESSAGES.stale}
        </Alert>
    );
};
```

Create `.../testRouting/TestRoutingResult.tsx`:

```tsx
import React from "react";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as GroupsIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import type { TestRoutingResultVm } from "~/editor/model/testRouting/TestRoutingResultVm.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRoutingMessages.js";

export interface TestRoutingResultProps {
    result: TestRoutingResultVm;
    // The result no longer matches the configuration: shown at reduced emphasis (R300).
    stale: boolean;
}

const TAG_VARIANTS = {
    Matched: "success-light",
    "Not matched": "neutral-muted",
    Skipped: "warning"
} as const;

// The result card of the Test routing tab (design README 4, R301). Every text arrives composed.
export const TestRoutingResult = ({ result, stale }: TestRoutingResultProps) => {
    const ownerIcon = result.ownerIcon === "groups" ? <GroupsIcon /> : <PersonIcon />;
    const cardClass = cn(
        "flex flex-col gap-md rounded-lg border-sm border-neutral-muted bg-neutral-base p-md",
        stale && "opacity-50"
    );

    return (
        <div data-testid={"test-routing-result"} data-stale={String(stale)} className={cardClass}>
            <div className={"flex items-center gap-sm"}>
                <span
                    data-testid={"test-routing-owner-icon"}
                    data-owner-icon={result.ownerIcon}
                    className={
                        "flex size-9 shrink-0 items-center justify-center rounded bg-neutral-dimmed text-neutral-strong"
                    }
                >
                    {ownerIcon}
                </span>
                <div className={"flex flex-col"}>
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {TEST_ROUTING_TAB_MESSAGES.owner}
                    </Text>
                    <Text as={"p"} className={"font-semibold"}>
                        {result.ownerLabel}
                    </Text>
                    <Text as={"p"} size={"sm"} className={"text-neutral-strong"}>
                        {result.reason}
                    </Text>
                </div>
            </div>
            <div className={"flex flex-col gap-sm"}>
                <Text as={"p"} className={"font-semibold"}>
                    {TEST_ROUTING_TAB_MESSAGES.trace}
                </Text>
                {result.trace.length === 0 && (
                    <Text as={"p"} size={"sm"} className={"text-neutral-strong"}>
                        {TEST_ROUTING_TAB_MESSAGES.noRules}
                    </Text>
                )}
                {result.trace.map((row, index) => (
                    <div key={`${row.ruleId}:${index}`} className={"flex items-start gap-sm"}>
                        <Tag variant={TAG_VARIANTS[row.tag]} content={row.tag} />
                        <div className={"flex min-w-0 flex-col"}>
                            <Text as={"p"} size={"sm"}>
                                {row.label}
                            </Text>
                            <Text as={"p"} size={"sm"} className={"text-neutral-strong"}>
                                {row.reason}
                            </Text>
                        </div>
                    </div>
                ))}
            </div>
            <div className={"flex items-center gap-sm"}>
                <Tag variant={"neutral-base-outline"} content={TEST_ROUTING_TAB_MESSAGES.strategy} />
                <Text size={"sm"}>{result.strategyLine}</Text>
            </div>
            {result.skipped.length > 0 && (
                <div className={"flex flex-col gap-xs"}>
                    <Text as={"p"} className={"font-semibold"}>
                        {TEST_ROUTING_TAB_MESSAGES.skippedPeople}
                    </Text>
                    {result.skipped.map((person, index) => (
                        <Text
                            as={"p"}
                            size={"sm"}
                            key={`${person.name}:${index}`}
                            data-testid={`test-routing-skipped-${index}`}
                        >
                            <span className={"font-semibold"}>{person.name}</span>
                            {`: ${person.reason}`}
                        </Text>
                    ))}
                </div>
            )}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { TestRoutingFailure } from "./testRouting/TestRoutingFailure.js";
import { TestRoutingInputs } from "./testRouting/TestRoutingInputs.js";
import { TestRoutingResult } from "./testRouting/TestRoutingResult.js";
import { TestRoutingStale } from "./testRouting/TestRoutingStale.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRouting/testRoutingMessages.js";
import { useTestRoutingInputs } from "./testRouting/useTestRoutingInputs.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

export interface TestRoutingRendererProps {
    // FormView passes the element's props; the Test routing element has none.
    field: unknown;
}

/*
 * The Test routing tab (R300, R301, R315): the layout element `workflowTestRouting`. It renders the
 * drawer presenter's `TestRoutingVm` and calls its plain callbacks; the state, the run token and
 * the composed result sentences live in the presenter and the model (R234). It never runs a test by
 * itself: the admin presses `Test routing`, `Test again` or `Try again`.
 */
export const TestRoutingRenderer = (_props: TestRoutingRendererProps) => {
    const { testRouting } = useStepFormOptions();
    const inputs = useTestRoutingInputs();
    const vm = testRouting.vm;
    const running = vm.status === "running";
    const runDisabled = !vm.canRun || running;
    const handleRun = (): void => {
        testRouting.runTest();
    };

    let outcome: React.ReactNode = null;
    if (running) {
        outcome = (
            <div
                data-testid={"test-routing-skeleton"}
                aria-busy={"true"}
                className={"flex flex-col gap-sm"}
            >
                <Skeleton type={"text"} size={"md"} />
                <Skeleton type={"text"} size={"md"} />
                <Skeleton type={"text"} size={"md"} />
            </div>
        );
    }
    if (vm.status === "failed" && vm.errorMessage !== null) {
        outcome = (
            <TestRoutingFailure
                message={vm.errorMessage}
                canRun={vm.canRun}
                onRetry={handleRun}
            />
        );
    }
    if (vm.status === "done" && vm.result !== null) {
        let staleNotice: React.ReactNode = null;
        if (vm.stale) {
            staleNotice = <TestRoutingStale canRun={vm.canRun} onRetest={handleRun} />;
        }
        outcome = (
            <div className={"flex flex-col gap-sm"}>
                {staleNotice}
                <TestRoutingResult result={vm.result} stale={vm.stale} />
            </div>
        );
    }

    return (
        <div data-testid={"test-routing"} className={"flex flex-col gap-md"}>
            <Text as={"p"} size={"sm"}>
                {TEST_ROUTING_TAB_MESSAGES.intro}
            </Text>
            <TestRoutingInputs
                requester={inputs.requester}
                folder={inputs.folder}
                disabled={inputs.disabled}
            />
            <div className={"flex items-center gap-md"}>
                <Button
                    variant={"secondary"}
                    icon={<PlayArrowIcon />}
                    text={vm.buttonLabel}
                    disabled={runDisabled}
                    onClick={handleRun}
                />
                {vm.hint !== null && (
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {vm.hint}
                    </Text>
                )}
            </div>
            {outcome}
        </div>
    );
};
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`. Add the import after the last renderer import the earlier tasks left (before it, the file ends its imports with the `AiToolsRenderer` line in 9a):

Before:
```tsx
import { AiToolsRenderer } from "~/editor/presentation/stepForm/renderers/AiToolsRenderer.js";
```
After (add one line below it; keep every import the earlier 9b tasks added):
```tsx
import { AiToolsRenderer } from "~/editor/presentation/stepForm/renderers/AiToolsRenderer.js";
import { TestRoutingRenderer } from "~/editor/presentation/stepForm/renderers/TestRoutingRenderer.js";
```

Add the registration as the last child of `<AdminConfig>`:

Before:
```tsx
        </AdminConfig>
```
After:
```tsx
            <AdminConfig.Form.FieldRenderer
                name={`element:${STEP_FORM_RENDERER.testRouting}`}
                component={TestRoutingRenderer}
            />
        </AdminConfig>
```

Modify `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx`: the exact-list assertion gets the new name as its last entry. The closing line of the array, `        ]);` (8 spaces), occurs once in the file. Edit the previous last name so it gets a comma, and append the new name:

Before (the last name is whatever Tasks 18 to 21b left; `"workflowRoutingRules"` is shown):
```tsx
            "workflowRoutingRules"
        ]);
```
After:
```tsx
            "workflowRoutingRules",
            "element:workflowTestRouting"
        ]);
```
Rename the test title to end with `, the Test routing element renderer`.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: the stub picker lists the option labels, so the requester options must read `Ivan Horvat|Ana Kovac` (the label `toUserPickerOption` gives is the display name) and the folder options the paths; if Task 19b labels differ, fix the expected strings in the test, not the renderer. The folder-failed and users-failed cases click the only `Try again` on screen (the Test routing failure alert is not shown in them).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -20
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in `app-workflows` (the build is the type check for this package, 8a R243).

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
git commit -m "feat(app-workflows): add the Test routing tab renderer" -m "The Test routing layout element renders the drawer presenter's Test routing state: the Requester and Folder pickers, the button with its hint, a skeleton while running, the failure and out-of-date alerts with their retry buttons, and the result card with the owner, trace, strategy line and skipped people. It never runs a test by itself." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Slice shapes are assumed.** The contract names the Task 18 slices `users`, `folders` and `testRouting` and the callbacks `searchUsers`, `setTestRequester`, `setTestFolder`, `runTest`, but not their field names. This task assumes the three shapes written under Interfaces (`users.items`/`selected`, `folders.items`, `testRouting.vm`). Only `useTestRoutingInputs.ts`, `TestRoutingRenderer.tsx` (the `testRouting` reads) and `testRoutingFixtures.ts` depend on them; if Task 18 chose other field names, change those files only.
- **Folder search is client side.** The `folders` slice has no search callback and R292 says the folder list is complete, so the renderer filters it with Task 19b's `filterPickerOptions` (imported from `stepForm/`, not duplicated; consistency ruling).
- **`TestRoutingVm` location.** Task 17 lists `TestRoutingVm` under `abstractions.ts`; this plan imports it from `[STEP]/stepDrawer/abstractions.js`.
- **`anyLabel` wins over `placeholder` (R307)**, so the folder field shows `Root (no folder)` rather than `Search folders` when nothing is chosen; both strings are passed because the contract lists both.
- **Registered name.** `STEP_FORM_RENDERER.testRouting` is `"workflowTestRouting"` (Task 18); `FormView` resolves a layout element through `fieldRenderers[`element:${renderer}`]`, so the registration and the test list use `element:workflowTestRouting`. `TEST_ROUTING_TAB_MESSAGES` is named apart from Task 17's presenter `TEST_ROUTING_MESSAGES`.
- Size: medium (one renderer, four small components, one hook, one pure helper, one fixture file, tests).

## Review fixes (sub-phase review)

- Replaced the duplicated `filterPickerOptions` (file, test, steps) with the import of Task 19b's `stepForm/filterPickerOptions.js` (consistency ruling).
- Registration name fixed: FormView looks a layout element up as `element:${renderer}`, so `WorkflowEditorConfig` registers `element:${STEP_FORM_RENDERER.testRouting}` (the plain name would never resolve).
- Interfaces resolved against 9b.5/9b.6: Task 18 slice shapes (`folders.folderType`, `StepFormTestRoutingVm` mirror), `toUserPickerOption` optional second parameter, `anyLabel` optional, `PickerOption.icon` union; the folders fixture gets `folderType`.
- Renamed the tab copy constant to `TEST_ROUTING_TAB_MESSAGES` (Task 17 owns `TEST_ROUTING_MESSAGES`).
