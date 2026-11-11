### Task 22b: Build `StepFormOptions` in the drawer view

R234, R293, R300, R303, R306; Review Focus 3, 6, 10. Every renderer and element of a step form reads its data and callbacks only from `StepFormOptionsContext` (Global Constraints, "Wiring"). 9a's `StepDrawerPresenter.formOptions` getter builds the list slices (teams, transports, automations, AI models, AI tools). 9b adds three slices that come from the drawer view model and three presenter commands: `ruleErrors` (the server rule errors of Task 16 and the callback that clears one), `ruleIssues` (the live rule issues of Task 16) and `testRouting` (the `TestRoutingVm` of Task 17 and its three callbacks). This task is the one place that assembles them: `buildStepFormOptions(vm, presenter)` takes the presenter's list slices as they are and adds the three view-model slices, with the callbacks bound as plain functions (no React nodes, no class instances, so MobX never deep-observes a fiber). `StepDrawer` calls it on every render and provides the result. The root test opens a People step in the real drawer, with the real `FormView` and the real People renderers, and proves that the pieces meet.

**Check first (stop if it fails):** after Tasks 14 to 18, `StepDrawerPresenter.formOptions` must return real `assignment` (`stepTeamIds` from the form's current `teams`, `strategy`), `users`, `targetMembers`, `folders` and `references` slices, not only the empty defaults of `createEmptyStepFormOptions`: built from `source.getUserOptions()`, `source.getTargetMemberOptions(stepTeamIds)`, `source.getFolderOptions()` plus `source.getFolderType()`, and `source.getReferences()`, with their `retry` bound to `source.retryUsers()`, `source.retryTargetMembers(stepTeamIds)`, the folder load retry and `source.retryReferences()`, and `searchUsers` / `searchTargetMembers` bound to the source. The consistency ruling gives this filling to Task 16 (Task 18 only defines the defaults). Check with:

```bash
cd /Users/brunozoric/work/webiny/webiny-js
grep -n "getUserOptions\|getTargetMemberOptions\|getFolderOptions\|getFolderType\|getReferences\|retryUsers\|retryReferences\|stepTeamIds" packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.ts
```

Every name must appear inside the `formOptions` getter. If one is missing, stop and report the gap to the controller (Task 16 owns it); do not improvise a second source of options here.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepDrawer/buildStepFormOptions.ts`
- Create: `[STEP]/stepDrawer/buildStepFormOptions.test.ts`
- Create: `packages/app-workflows/src/editor/testing/peopleDrawerRenderers.ts`
- Create: `[STEP]/stepDrawer/StepDrawer.people.test.tsx`
- Modify: `[STEP]/stepDrawer/StepDrawer.tsx`

**Interfaces:**
- Consumes (verified in the repo today): `StepDrawer` and `StepDrawerPresenterFeature` (`[STEP]/stepDrawer/`), `StepFormOptions`, `StepFormOptionsContext`, `FakeStepDrawerSource` (`[AWET]/fakeStepDrawerSource.ts`), `createReviewStep` (`[AWET]/draftFixtures.ts`), `createStepFormOptions`, the real `FormView` of `@webiny/app-admin` (it takes an optional `renderers` map and works without `AdminConfig`; checked by running it with tabs and an element renderer), `STEP_FORM_RENDERER` and the 9a renderers (`StepColourRenderer`, `TeamsPickerRenderer`, `TransportCheckboxesRenderer`).
- Consumes (from earlier tasks, verify each against the file as that task left it):
  - Task 16: `StepDrawerPresenter.ViewModel` has `ruleErrors: RuleErrorVm[]`, `ruleIssues: RuleIssue[]`, `warnings`, `errorTab`, `notice`; `IStepDrawerPresenter.clearRuleError(ruleId: string): void` (verified in the written Task 16: `clearRuleError(ruleId: string): void` is public on `StepDrawerPresenter.Interface`, next to `showErrorTab()`).
  - Task 17: `StepDrawerPresenter.ViewModel.testRouting: TestRoutingVm | null` (null for a step that is not a People step and for a read-only People step); presenter methods `setTestRequester(id: string | null): void`, `setTestFolder(id: string | null): void`, `runTest(): Promise<void>`.
  - Task 18, `StepFormOptions.ts` (verified against the written task file): `ruleErrors: StepFormRuleErrorsOptions { items: StepFormRuleError[]; clearRuleError(ruleId: string): void }` (`StepFormRuleError { ruleId; field; message }` is structurally Task 16's `RuleErrorVm`), `ruleIssues: StepFormRuleIssuesOptions { items: RuleIssue[] }`, `testRouting: StepFormTestRoutingOptions { vm: StepFormTestRoutingVm; setTestRequester; setTestFolder; runTest }` (`StepFormTestRoutingVm` is structurally Task 17's `TestRoutingVm`), and `createEmptyStepFormOptions()` whose idle `testRouting.vm` this task uses when the drawer has no Test routing state.
  - Tasks 14, 14b, 14c and 16: the fake source's setters and mocks, used by the root test instead of `vi.spyOn` (MobX makes the fake's methods non-writable, so a spy would fail): `FakeStepDrawerSource.setReferences(references)` (Task 14), `setUsers(state)`, `setMembers(state)`, `setFolders(state)`, the members `folderType` and `modelId`, and the mocks `inspectRouting` (Task 14b) and `resolveInspectionNames` (Task 14c, resolves empty maps by default), `errors` (9a).
  - Tasks 18 to 22 renderers: `AssignmentStrategyRenderer`, `RoutingRulesRenderer`, `UserPickerRenderer`, `FolderPickerRenderer` in `[STEP]/stepForm/renderers/` and `TestRoutingRenderer` (Task 22); renderer names `workflowAssignmentStrategy`, `workflowRoutingRules`, `workflowUserPicker`, `workflowFolderPicker`, `element:workflowTestRouting` (the contract's names).
  - Task 21: the rule card shows an issue message of kind `warning` under its fields and a server error message under the `Then assign to` field; the card header reads `Rule {n}`.
- Produces: `buildStepFormOptions(vm: StepFormOptionsVm, presenter: StepFormOptionsPresenter): StepFormOptions` (a null `vm.testRouting` keeps the presenter's idle Test routing state; the contract's `(vm: StepDrawerVm, presenter: IStepDrawerPresenter)`: the two named `Pick` types are what it reads, so tests need no full presenter), `[AWET]/peopleDrawerRenderers.ts` (`PEOPLE_DRAWER_RENDERERS`, reused by Task 23's tests).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`; type check by build (R243). The existing `StepDrawer.test.tsx` mocks `FormView` for the whole file, so the root test is a separate file with its own setup.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/buildStepFormOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestRoutingVm } from "~/editor/testing/testRoutingFixtures.js";
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepFormOptionsPresenter } from "./buildStepFormOptions.js";
import type { StepFormOptionsVm } from "./buildStepFormOptions.js";

const createVm = (): StepFormOptionsVm => {
    return {
        ruleErrors: [
            {
                ruleId: "r1",
                field: "target",
                message: "The target team is not one of the step's reviewing teams."
            }
        ],
        ruleIssues: [
            {
                ruleId: "r2",
                index: 1,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ],
        testRouting: createTestRoutingVm({ requesterId: "user-1", canRun: true, hint: null })
    };
};

const createPresenter = () => {
    const formOptions = createStepFormOptions();
    const presenter = {
        formOptions,
        setTestRequester: vi.fn(),
        setTestFolder: vi.fn(),
        runTest: vi.fn().mockResolvedValue(undefined),
        clearRuleError: vi.fn()
    } satisfies StepFormOptionsPresenter;
    return { presenter, formOptions };
};

describe("buildStepFormOptions (R234, R293, R300, R303)", () => {
    it("keeps every list slice of the presenter as it is", () => {
        const { presenter, formOptions } = createPresenter();

        const options = buildStepFormOptions(createVm(), presenter);

        expect(options.teams).toBe(formOptions.teams);
        expect(options.transports).toBe(formOptions.transports);
        expect(options.automations).toBe(formOptions.automations);
        expect(options.aiModels).toBe(formOptions.aiModels);
        expect(options.aiTools).toBe(formOptions.aiTools);
    });

    it("carries the rule errors and the live rule issues of the view model", () => {
        const { presenter } = createPresenter();
        const vm = createVm();

        const options = buildStepFormOptions(vm, presenter);

        expect(options.ruleErrors.items).toEqual(vm.ruleErrors);
        expect(options.ruleIssues.items).toEqual(vm.ruleIssues);
    });

    it("clears a rule error through the presenter", () => {
        const { presenter } = createPresenter();
        const options = buildStepFormOptions(createVm(), presenter);

        options.ruleErrors.clearRuleError("r1");

        expect(presenter.clearRuleError).toHaveBeenCalledTimes(1);
        expect(presenter.clearRuleError).toHaveBeenCalledWith("r1");
    });

    it("carries the Test routing state and binds its three callbacks to the presenter", () => {
        const { presenter } = createPresenter();
        const vm = createVm();
        const options = buildStepFormOptions(vm, presenter);

        expect(options.testRouting.vm).toBe(vm.testRouting);
        options.testRouting.setTestRequester("user-2");
        options.testRouting.setTestRequester(null);
        options.testRouting.setTestFolder("f1");
        const returned = options.testRouting.runTest();

        expect(presenter.setTestRequester.mock.calls).toEqual([["user-2"], [null]]);
        expect(presenter.setTestFolder.mock.calls).toEqual([["f1"]]);
        expect(presenter.runTest).toHaveBeenCalledTimes(1);
        expect(returned).toBeUndefined();
    });

    it("keeps the idle Test routing state of the presenter when the step has none", () => {
        const { presenter, formOptions } = createPresenter();
        const vm: StepFormOptionsVm = { ...createVm(), testRouting: null };

        const options = buildStepFormOptions(vm, presenter);

        expect(options.testRouting.vm).toBe(formOptions.testRouting.vm);
        expect(options.testRouting.vm.status).toBe("idle");
    });

    it("does not change the presenter's own options object", () => {
        const { presenter, formOptions } = createPresenter();
        const before = { ...formOptions };

        buildStepFormOptions(createVm(), presenter);

        expect(formOptions).toEqual(before);
    });

    it("uses the callbacks as plain functions that work when detached", () => {
        const { presenter } = createPresenter();
        const options = buildStepFormOptions(createVm(), presenter);
        const { setTestRequester, runTest } = options.testRouting;

        setTestRequester("user-3");
        runTest();

        expect(presenter.setTestRequester).toHaveBeenCalledWith("user-3");
        expect(presenter.runTest).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/testing/peopleDrawerRenderers.ts` (the real renderers of a People step form, keyed by the renderer names the form uses, for the tests that render the real `FormView`):

```ts
import type React from "react";
import type { FormModel } from "@webiny/app-admin";
import { AssignmentStrategyRenderer } from "~/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.js";
import { FolderPickerRenderer } from "~/editor/presentation/stepForm/renderers/FolderPickerRenderer.js";
import { RoutingRulesRenderer } from "~/editor/presentation/stepForm/renderers/RoutingRulesRenderer.js";
import { StepColourRenderer } from "~/editor/presentation/stepForm/renderers/StepColourRenderer.js";
import { TeamsPickerRenderer } from "~/editor/presentation/stepForm/renderers/TeamsPickerRenderer.js";
import { TestRoutingRenderer } from "~/editor/presentation/stepForm/renderers/TestRoutingRenderer.js";
import { TransportCheckboxesRenderer } from "~/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.js";
import { UserPickerRenderer } from "~/editor/presentation/stepForm/renderers/UserPickerRenderer.js";
import { STEP_FORM_RENDERER } from "~/editor/presentation/stepForm/stepFormRendererNames.js";

export type PeopleDrawerRenderers = Record<string, React.ComponentType<{ field: FormModel.FieldVM }>>;

/*
 * What `WorkflowEditorConfig` registers for the People step form, as the `renderers` map of
 * `FormView`. The stock switch of `allowManualPick` is not listed: `FormView` leaves a field
 * without a renderer out, which these tests do not need.
 */
export const PEOPLE_DRAWER_RENDERERS: PeopleDrawerRenderers = {
    [STEP_FORM_RENDERER.colour]: StepColourRenderer,
    [STEP_FORM_RENDERER.teams]: TeamsPickerRenderer,
    [STEP_FORM_RENDERER.transports]: TransportCheckboxesRenderer,
    workflowAssignmentStrategy: AssignmentStrategyRenderer,
    workflowRoutingRules: RoutingRulesRenderer,
    workflowUserPicker: UserPickerRenderer,
    workflowFolderPicker: FolderPickerRenderer,
    "element:workflowTestRouting": TestRoutingRenderer
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.people.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { RoutingInspection } from "~/editor/domain/types.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleReferences } from "~/editor/model/rules/RuleReferences.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { PEOPLE_DRAWER_RENDERERS } from "~/editor/testing/peopleDrawerRenderers.js";
import type { PeopleDrawerRenderers } from "~/editor/testing/peopleDrawerRenderers.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

interface RenderersHolder {
    renderers: PeopleDrawerRenderers;
}

interface PickerStubProps {
    label: string;
    value: string | null;
    options: PickerOption[];
    onChange(id: string | null): void;
}

const holder = vi.hoisted((): RenderersHolder => {
    return { renderers: {} };
});

/*
 * The real FormView with the real People renderers: the stub passes them as its `renderers` map
 * (read lazily, the map imports this module's own mock of app-admin). The picker is a stub that
 * lists its option labels and picks the first option on a click.
 */
vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const react = await import("react");
    const FormView = (props: React.ComponentProps<typeof actual.FormView>) => {
        return react.createElement(actual.FormView, { ...props, renderers: holder.renderers });
    };
    return { ...actual, FormView };
});

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: PickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": `picker-${props.label}`,
                    "data-options": props.options.map(option => option.label).join("|")
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
                )
            );
        }
    };
});

holder.renderers = PEOPLE_DRAWER_RENDERERS;

const RULE_ID = "r1";

const createPeopleStep = () => {
    return createReviewStep({
        config: {
            teams: ["team-1"],
            assignment: {
                strategy: "roundRobin",
                allowManualPick: false,
                rules: [
                    {
                        id: RULE_ID,
                        conditions: {
                            folder: { id: "f1", type: "cms:article", includeDescendants: false }
                        },
                        target: { type: "team", id: "team-1" }
                    }
                ]
            }
        }
    });
};

const REFERENCES: RuleReferences = {
    users: new Map(),
    teams: new Map([["team-1", { id: "team-1", label: "Editors", state: "found" }]]),
    folders: new Map([["f1", { id: "f1", label: "Deleted folder", state: "deleted" }]]),
    userTeamIds: new Map()
};

const INSPECTION: RoutingInspection = {
    owner: { id: "user-1", displayName: "Ivan Horvat" },
    source: "rule",
    ruleId: RULE_ID,
    strategy: "roundRobin",
    narrowedTeamId: null,
    candidateIds: [],
    candidateCount: 0,
    trace: [{ ruleId: RULE_ID, outcome: "matched", reason: null, failedConditions: [] }],
    skipped: []
};

const IVAN: WorkflowUserSummary = { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] };
const PARTNERS: AppFolder = { id: "f2", path: "/Partners" };

const createSetup = () => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const presenter = StepDrawerPresenterFeature.resolve(container).presenter;
    const source = new FakeStepDrawerSource([createPeopleStep()]);
    source.errors = [
        {
            field: "config.assignment.rules.target",
            message: "The target team is not one of the step's reviewing teams.",
            ruleId: RULE_ID
        }
    ];
    source.setReferences(REFERENCES);
    source.setUsers({ items: [IVAN], selected: [], loading: false, failed: false });
    source.setMembers({ items: [IVAN], selected: [], loading: false, failed: false });
    source.setFolders({ items: [PARTNERS], loading: false, failed: false });
    source.folderType = "cms:article";
    source.modelId = "article";
    source.inspectRouting.mockResolvedValue(INSPECTION);

    const wrap = (stepId: string | null) => {
        return (
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <StepDrawer source={source} stepId={stepId} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
    };
    const view = render(wrap(null));
    const open = (stepId: string | null) => {
        view.rerender(wrap(stepId));
    };
    return { presenter, source, open };
};

const activateTab = (name: RegExp) => {
    act(() => {
        fireEvent.mouseDown(screen.getByRole("tab", { name }));
    });
};

describe("StepDrawer with the real People form (R234, R293, R300)", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows the General, Assignment and Test routing tabs", () => {
        const { open } = createSetup();

        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("tab", { name: /General/ })).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Assignment/ })).toBeTruthy();
        expect(screen.getByRole("tab", { name: /Test routing/ })).toBeTruthy();
    });

    it("shows a rule warning and a rule error on the Assignment tab", () => {
        const { open } = createSetup();
        act(() => {
            open("step-1");
        });

        activateTab(/Assignment/);

        expect(screen.getByText("Rule 1")).toBeTruthy();
        expect(screen.getByText("The folder no longer exists.")).toBeTruthy();
        expect(
            screen.getByText("The target team is not one of the step's reviewing teams.")
        ).toBeTruthy();
    });

    it("lists the users in the Requester picker of the Test routing tab", () => {
        const { open } = createSetup();
        act(() => {
            open("step-1");
        });

        activateTab(/Test routing/);

        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-options")).toBe("Ivan Horvat");
        const folder = screen.getByTestId("picker-Folder");
        expect(folder.getAttribute("data-options")).toBe("/Partners");
    });

    it("runs a test from the Test routing tab and shows the server's answer", async () => {
        const { open, source } = createSetup();
        act(() => {
            open("step-1");
        });
        activateTab(/Test routing/);

        const button = screen.getByRole("button", { name: "Test routing" }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        expect(screen.getByText("Choose a requester to test.")).toBeTruthy();

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));
        });
        await waitFor(() => {
            const enabled = screen.getByRole("button", { name: "Test routing" }) as HTMLButtonElement;
            expect(enabled.disabled).toBe(false);
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Test routing" }));
        });

        expect(source.inspectRouting).toHaveBeenCalledTimes(1);
        const params = source.inspectRouting.mock.calls[0][0];
        expect(params.requesterId).toBe("user-1");
        expect(params.folderId).toBeNull();
        expect(await screen.findByText("Assigned by rule 1")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("Matched")).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/buildStepFormOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.people.test.tsx 2>&1 | tail -40
```

Expected: `buildStepFormOptions.test.ts` fails with `Failed to resolve import "./buildStepFormOptions.js"`. `StepDrawer.people.test.tsx` fails: the requester picker has no options and the Test routing button never enables, because `StepDrawer` still provides the presenter's own `formOptions` without the `testRouting` slice (a `TypeError` reading `vm` of `undefined` in `TestRoutingRenderer`, or the empty defaults). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/buildStepFormOptions.ts`:

```ts
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepDrawerPresenter } from "./abstractions.js";

// The three view-model fields the view-level options carry.
export type StepFormOptionsVm = Pick<
    StepDrawerPresenter.ViewModel,
    "ruleErrors" | "ruleIssues" | "testRouting"
>;

// The presenter members the view-level options read and call.
export type StepFormOptionsPresenter = Pick<
    StepDrawerPresenter.Interface,
    "formOptions" | "setTestRequester" | "setTestFolder" | "runTest" | "clearRuleError"
>;

/*
 * The one value every renderer of a step form reads (R234): the presenter's list slices as they are,
 * plus the slices that come from the drawer view model (`ruleErrors`, `ruleIssues`, `testRouting`)
 * with their callbacks bound as plain functions. Nothing here is a React node or a class instance,
 * so MobX never deep-observes a fiber. The drawer view calls it on every render.
 */
export const buildStepFormOptions = (
    vm: StepFormOptionsVm,
    presenter: StepFormOptionsPresenter
): StepFormOptions => {
    const base = presenter.formOptions;

    const ruleErrors: StepFormOptions["ruleErrors"] = {
        items: vm.ruleErrors,
        clearRuleError: ruleId => presenter.clearRuleError(ruleId)
    };

    const ruleIssues: StepFormOptions["ruleIssues"] = {
        items: vm.ruleIssues
    };

    const testRouting: StepFormOptions["testRouting"] = {
        vm: vm.testRouting ?? base.testRouting.vm,
        setTestRequester: id => presenter.setTestRequester(id),
        setTestFolder: id => presenter.setTestFolder(id),
        runTest: () => {
            void presenter.runTest();
        }
    };

    return { ...base, ruleErrors, ruleIssues, testRouting };
};
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.tsx`.

Import, after the `SwitchAutomationDialog` import:

Before:
```tsx
import { SwitchAutomationDialog } from "~/editor/presentation/stepForm/components/SwitchAutomationDialog.js";
import type { StepDrawerSource } from "./abstractions.js";
```
After:
```tsx
import { SwitchAutomationDialog } from "~/editor/presentation/stepForm/components/SwitchAutomationDialog.js";
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepDrawerSource } from "./abstractions.js";
```

Provider value:

Before:
```tsx
    if (!vm.open) {
        return null;
    }

    return (
        <StepFormOptionsContext.Provider value={presenter.formOptions}>
```
After:
```tsx
    if (!vm.open) {
        return null;
    }

    const formOptions = buildStepFormOptions(vm, presenter);

    return (
        <StepFormOptionsContext.Provider value={formOptions}>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/buildStepFormOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.people.test.tsx 2>&1 | tail -40
```

Expected: PASS. Notes for the first run of the root test: (1) the drawer opens on the Assignment tab because the fake source carries a rule error (Task 16); the helper `activateTab` selects a tab with a mouse down, which is what Radix tabs react to. (2) The inspection fixture uses `source: "rule"` and a `matched` trace entry with no reason, so Task 13 composes `Assigned by rule 1` and the tag `Matched`; if Task 13 words the reason line differently, change the expected string to what the composer returns for this fixture (the sentence list is R301). (3) The test stubs `WorkflowPicker`, so the Requester picker's options are the labels `toUserPickerOption` gives; the expected text is the display name.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the 9a `StepDrawer.test.tsx` still reads `presenter.formOptions.automations.select`, which this task did not change); no TypeScript errors in `app-workflows`.

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
git commit -m "feat(app-workflows): provide the rule and Test routing state to the step form renderers" -m "The drawer view builds the step form options from the presenter's list slices and the drawer view model: the rule errors with the callback that clears one, the live rule issues and the Test routing state with its callbacks, all as plain data and plain functions. A root test opens a People step in the real drawer with the real form and renderers." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The contract's file `StepDrawer.test.tsx` is not used for the root test.** That file mocks `FormView` for the whole file (a stub that lists field names), which cannot render tabs and renderers. The root test is `StepDrawer.people.test.tsx`; `StepDrawer.test.tsx` is unchanged.
- **Signature.** The contract writes `buildStepFormOptions(vm: StepDrawerVm, presenter: IStepDrawerPresenter)`. The code types the parameters as `Pick`s of those two (`StepFormOptionsVm`, `StepFormOptionsPresenter`), which the full objects satisfy, so the unit test needs no 700-line presenter.
- **"Builds the whole value".** The presenter's `formOptions` getter keeps building the list slices (it needs the private source and form state); this task adds only the three slices that come from the view model. The source-backed slices `assignment`, `users`, `targetMembers`, `folders`, `references` must already be in the getter (Task 16 owns the filling by the consistency ruling); see "Check first".
- **Presenter method names and slice shapes** are verified against the written Tasks 16, 17 and 18 (listed under Interfaces). `vm.testRouting` is nullable in Task 17; a null falls back to the presenter's idle default.
- Size: medium (one pure builder, a two-line view change, one renderer map, a four-case root test with the real form).

## Review fixes (sub-phase review)

- `vm.testRouting` is `TestRoutingVm | null` in Task 17: `buildStepFormOptions` falls back to the presenter's idle state, with a unit test.
- Root test no longer uses `vi.spyOn` on the MobX fake source (its methods are non-writable); it uses the fake's setters and mocks (`setReferences`, `setUsers`, `setMembers`, `setFolders`, `folderType`, `modelId`, `inspectRouting`) and drops the `getStepWarnings` string stub (the severity ruling changes its shape; the rule lines come from the live issues).
- "Check first" made concrete (grep, adds the `assignment` slice and the `retry` bindings) and tied to the ruling that Task 16 owns the filling; the types and method names marked "assumed" are now verified against Tasks 16, 17, 18.
