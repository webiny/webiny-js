### Task 23: Drawer chrome

R302, R309, R312; Q51; Review Focus 3, 5, 10; design README 4 and `research-spec.md` 4.1, 4.3 and 7 (drawer chrome, banner, warnings block). The 560px drawer of 9a keeps its width, header and footer. The tabs themselves are FormModel layout tabs built by Task 18 and rendered by `FormView`; this task adds what sits around them: the error banner, the warnings block and the teams-off notice. All three are driven by fields of the drawer view model that Task 16 produces (`errorTab`, `warnings`, `notice`) and one presenter command (`showErrorTab()`); the only thing the view reads from the form is which tab is open.

- **Error banner (R302, QBZ-11):** `This step has an error on the {General|Assignment} tab.` with a button `Show`, shown when `vm.errorTab` is not null and the open tab is not that tab. `Show` calls `presenter.showErrorTab()`, which activates the tab (R302: `form.focusField`). When the error is on the open tab, or the form has no tabs, no banner shows. The `Test routing` tab never carries an error (R302), so on it the banner shows whenever an error exists.
- **Warnings block (R312, design 4.1):** an `Alert` (warning, subtle) with the heading `Check this step` and one line per `vm.warnings` entry (the 9a step warnings plus the `Rule {n}: ` rule warnings and live rule errors, Task 16). A line carries a severity (consistency ruling): a `warning` line reads as before, an `error` line (a live rule error, R299) is drawn destructive (`text-destructive-primary`, `data-severity="error"`) inside the same block, so a blocking problem does not look like a warning. It shows for every kind of step, and is hidden on the `Test routing` tab (design: `hasWarnings && tab !== 'test'`). With no warnings it does not show.
- **Notice (R309):** `vm.notice` (`This step needs teams, which are not enabled. It can't be edited.`, Task 16) as an info `Alert` at the top. A step with a notice has no tabs (Task 16/18), so the banner and the open-tab logic are inert.
- **Order at the top of the body:** licence alert, notice, top error, error banner, warnings block, then the form.
- **Opening on the Assignment tab:** `openStep` and the drawer's `open` pick the tab through the presenter (Task 15 and 16: `focusField("assignment.rules")` after the form is built); the view does nothing for it, and the chrome test proves it end to end.
- **Unchanged:** Done and the X still apply the edits and close, the drawer is 560px, the footer text and the sub line are as in 9a, and the form tabs are not re-implemented here.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepDrawer/stepDrawerTabs.ts`
- Create: `[STEP]/stepDrawer/getActiveTabId.ts`
- Create: `[STEP]/stepDrawer/getActiveTabId.test.ts`
- Create: `[STEP]/stepDrawer/StepDrawerBanners.tsx`
- Create: `[STEP]/stepDrawer/StepDrawerBanners.test.tsx`
- Create: `[STEP]/stepDrawer/StepDrawer.chrome.test.tsx`
- Modify: `[STEP]/stepDrawer/stepDrawerMessages.ts`
- Modify: `[STEP]/stepDrawer/StepDrawer.tsx`

**Interfaces:**
- Consumes (verified in the repo today): `StepDrawer`, `StepDrawerPresenterFeature`, `STEP_DRAWER_MESSAGES`, the `Alert` of admin-ui (`actions={<Alert.Action text onClick />}`), `FormModel.FormVM` and `FormModel.TabsNodeVM` (`layout: LayoutNodeVM[]`, a node `{ type: "tabs"; activeTabId; setActiveTab }`), `FakeStepDrawerSource` (`errors`, `readOnly`, `closeStep`), `createReviewStep`, `createAutomationStep`, `createTestFormModelFactory`, `renderWithAdminUi`. The real `FormView` renders without `AdminConfig`, and a mouse down on a tab trigger activates it (checked by running both).
- Consumes (from earlier tasks, verify each against the file as that task left it):
  - Task 16: `StepDrawerPresenter.ViewModel.errorTab: "general" | "assignment" | null`, `.notice: string | null`, `.warnings`, `.licenceAlert` and `.topError` (9a), `IStepDrawerPresenter.showErrorTab(): void`, and the fake source's `warnings` member with `setWarnings(lines)` (the test uses `setWarnings`, not `vi.spyOn`: MobX makes the fake's methods non-writable). Teams off: a read-only People step (`source.readOnly = true` on the fake, as Task 16's own tests do) gets `vm.notice` and a form without tabs (R309). The drawer builds `vm.warnings` from the source's lines minus its `Rule {n}: ` lines, plus the live rule lines, so a source line in the tests must not start with `Rule {n}: `.
  - Severity ruling (consistency-items.md): `StepWarningLine { text: string; severity: "error" | "warning" }`, created by Task 12 in `~/editor/model/StepWarningLine.ts`; `getStepWarnings`, `StepDrawerSource.getStepWarnings`, `FakeStepDrawerSource.warnings` / `setWarnings` and `vm.warnings` carry `StepWarningLine[]`. This plan imports the type from that path; verify it against Tasks 12 and 16 as they were written (cross-sub-phase item).
  - Task 18: the People form has the layout tabs `General`, `Assignment` and `Test routing`. The tab ids are assumed to be `general`, `assignment` and `testRouting` (the labels in the contract's order); `stepDrawerTabs.ts` below is the only file that names them. Verify the ids in `buildPeopleStepForm.ts` as Task 18 left it and change `STEP_DRAWER_TAB` if they differ.
  - Task 15: a `StepFieldError` carries `ruleId: string | null`; the field `config.assignment.rules.target` with a `ruleId` makes `errorTab` `"assignment"`; the field `title` makes it `"general"`.
- Produces: `StepDrawerBanners` component, `getActiveTabId`, `STEP_DRAWER_TAB`, `StepErrorTab`, `STEP_ERROR_TAB_LABELS`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`; type check by build (R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getActiveTabId.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { getActiveTabId } from "./getActiveTabId.js";

const createTabbedForm = () => {
    return createTestFormModelFactory().create({
        fields: registry => {
            return {
                title: registry.text().label("Title"),
                note: registry.text().label("Note")
            };
        },
        layout: layout => [
            layout
                .tabs("tabs")
                .tab("general", tab => {
                    tab.label("General").layout(inner => [inner.row("title")]);
                })
                .tab("assignment", tab => {
                    tab.label("Assignment").layout(inner => [inner.row("note")]);
                })
        ]
    });
};

describe("getActiveTabId", () => {
    it("is null with no form", () => {
        expect(getActiveTabId(null)).toBeNull();
    });

    it("is null for a form without tabs", () => {
        const form = createTestFormModelFactory().create({
            fields: registry => {
                return { title: registry.text().label("Title") };
            }
        });

        expect(getActiveTabId(form.vm)).toBeNull();
    });

    it("is the first tab of a fresh form", () => {
        const form = createTabbedForm();

        expect(getActiveTabId(form.vm)).toBe("general");
    });

    it("follows the tab the form activates", () => {
        const form = createTabbedForm();

        form.focusField("note");

        expect(getActiveTabId(form.vm)).toBe("assignment");
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerBanners.test.tsx`:

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
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepDrawerBanners } from "./StepDrawerBanners.js";
import type { StepDrawerBannersProps } from "./StepDrawerBanners.js";

const LEGAL_LINE: StepWarningLine = { text: "Legal has no members.", severity: "warning" };

const createProps = (overrides: Partial<StepDrawerBannersProps> = {}): StepDrawerBannersProps => {
    return {
        licenceAlert: null,
        notice: null,
        topError: null,
        errorTab: null,
        warnings: [],
        activeTabId: "general",
        onShowErrorTab: vi.fn(),
        ...overrides
    };
};

describe("StepDrawerBanners (R302, R309, R312)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders nothing for a step with nothing to say", () => {
        const { container } = renderWithAdminUi(<StepDrawerBanners {...createProps()} />);

        expect(container.querySelector("[role='alert']")).toBeNull();
    });

    it("shows the banner with Show when the error is on another tab", () => {
        const props = createProps({ errorTab: "assignment", activeTabId: "general" });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Show" }));

        expect(props.onShowErrorTab).toHaveBeenCalledTimes(1);
    });

    it("names the General tab for an error there", () => {
        renderWithAdminUi(
            <StepDrawerBanners {...createProps({ errorTab: "general", activeTabId: "assignment" })} />
        );

        expect(screen.getByText("This step has an error on the General tab.")).toBeTruthy();
    });

    it("shows the banner on the Test routing tab, which never holds an error", () => {
        renderWithAdminUi(
            <StepDrawerBanners {...createProps({ errorTab: "assignment", activeTabId: "testRouting" })} />
        );

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
    });

    it("shows no banner when the error is on the open tab", () => {
        renderWithAdminUi(
            <StepDrawerBanners {...createProps({ errorTab: "assignment", activeTabId: "assignment" })} />
        );

        expect(screen.queryByText(/This step has an error/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Show" })).toBeNull();
    });

    it("shows no banner when the form has no tabs", () => {
        renderWithAdminUi(
            <StepDrawerBanners {...createProps({ errorTab: "general", activeTabId: null })} />
        );

        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("shows no banner without an error", () => {
        renderWithAdminUi(<StepDrawerBanners {...createProps()} />);

        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("lists the warnings under the heading Check this step", () => {
        const warnings: StepWarningLine[] = [
            { text: "Legal has no members.", severity: "warning" },
            { text: "Rule 2: The folder no longer exists.", severity: "warning" }
        ];
        renderWithAdminUi(<StepDrawerBanners {...createProps({ warnings })} />);

        expect(screen.getByText("Check this step")).toBeTruthy();
        expect(screen.getByText("Legal has no members.")).toBeTruthy();
        expect(screen.getByText("Rule 2: The folder no longer exists.")).toBeTruthy();
        expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });

    it("draws an error line destructive and a warning line plain", () => {
        const warnings: StepWarningLine[] = [
            { text: "Rule 1: The assigned user was deleted.", severity: "error" },
            { text: "Rule 2: The folder no longer exists.", severity: "warning" }
        ];
        renderWithAdminUi(<StepDrawerBanners {...createProps({ warnings })} />);

        const error = screen.getByText("Rule 1: The assigned user was deleted.");
        const warning = screen.getByText("Rule 2: The folder no longer exists.");
        expect(error.getAttribute("data-severity")).toBe("error");
        expect(error.className).toContain("text-destructive-primary");
        expect(warning.getAttribute("data-severity")).toBe("warning");
        expect(warning.className).not.toContain("text-destructive-primary");
    });

    it("hides the warnings block on the Test routing tab", () => {
        const props = createProps({ warnings: [LEGAL_LINE], activeTabId: "testRouting" });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(screen.queryByText("Check this step")).toBeNull();
        expect(screen.queryByText("Legal has no members.")).toBeNull();
    });

    it("shows the warnings block when the form has no tabs", () => {
        const props = createProps({ warnings: [LEGAL_LINE], activeTabId: null });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(screen.getByText("Check this step")).toBeTruthy();
    });

    it("shows the notice, the top error and the licence alert", () => {
        const props = createProps({
            notice: "This step needs teams, which are not enabled. It can't be edited.",
            topError: "Could not save. Check the highlighted step.",
            licenceAlert: { title: "AI Power-Ups licence missing", text: "This step is read-only." }
        });
        renderWithAdminUi(<StepDrawerBanners {...props} />);

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(screen.getByText("Could not save. Check the highlighted step.")).toBeTruthy();
        expect(screen.getByText("AI Power-Ups licence missing")).toBeTruthy();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.chrome.test.tsx` (the real `FormView` with no field renderers: only the tabs and the chrome are under test; the field renderers are covered by Tasks 18 to 22b):

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
import { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { FormModelFeature } from "@webiny/app-admin/features/formModel/feature.js";
import { IdentityContextFeature } from "@webiny/app-admin/features/security/IdentityContext/feature.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { FakeStepDrawerSource } from "~/editor/testing/fakeStepDrawerSource.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { StepDrawer } from "./StepDrawer.js";

const RULE_ERROR: StepFieldError = {
    field: "config.assignment.rules.target",
    message: "The target team is not one of the step's reviewing teams.",
    ruleId: "r1"
};

const TITLE_ERROR: StepFieldError = {
    field: "title",
    message: "Enter a title for this step.",
    ruleId: null
};

const LEGAL_LINE: StepWarningLine = { text: "Legal has no members.", severity: "warning" };

const WEBHOOK_LINE: StepWarningLine = {
    text: "The automation “Send webhook” no longer exists.",
    severity: "warning"
};

const createPeopleStep = (): EditorStep => {
    return createReviewStep({
        config: {
            teams: ["team-1"],
            assignment: {
                strategy: "none",
                allowManualPick: false,
                rules: [{ id: "r1", conditions: {}, target: { type: "team", id: "team-1" } }]
            }
        }
    });
};

const createSetup = (step: EditorStep, configure?: (source: FakeStepDrawerSource) => void) => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    StepDrawerPresenterFeature.register(container);
    const source = new FakeStepDrawerSource([step]);
    if (configure) {
        configure(source);
    }
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
    return { source, open };
};

const tabOf = (name: RegExp): HTMLElement => {
    return screen.getByRole("tab", { name });
};

const activateTab = (name: RegExp) => {
    act(() => {
        fireEvent.mouseDown(tabOf(name));
    });
};

const isSelected = (name: RegExp): boolean => {
    return tabOf(name).getAttribute("aria-selected") === "true";
};

describe("StepDrawer chrome (R302, R309, R312)", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("shows the three tabs of a People step, with General open", () => {
        const { open } = createSetup(createPeopleStep());

        act(() => {
            open("step-1");
        });

        expect(screen.getAllByRole("tab")).toHaveLength(3);
        expect(isSelected(/General/)).toBe(true);
        expect(isSelected(/Assignment/)).toBe(false);
        expect(isSelected(/Test routing/)).toBe(false);
    });

    it("shows no tabs for an Automation step", () => {
        const { open } = createSetup(createAutomationStep({ id: "step-1" }));

        act(() => {
            open("step-1");
        });

        expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("opens on the Assignment tab for a rule error, with no banner", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });

        act(() => {
            open("step-1");
        });

        expect(isSelected(/Assignment/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("shows the banner on another tab and Show brings the error tab back", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });
        act(() => {
            open("step-1");
        });

        activateTab(/General/);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
        expect(isSelected(/General/)).toBe(true);

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "Show" }));
        });

        expect(isSelected(/Assignment/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();
    });

    it("opens on General for a General error and names it when another tab is open", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [TITLE_ERROR];
        });
        act(() => {
            open("step-1");
        });
        expect(isSelected(/General/)).toBe(true);
        expect(screen.queryByText(/This step has an error/)).toBeNull();

        activateTab(/Assignment/);

        expect(screen.getByText("This step has an error on the General tab.")).toBeTruthy();
    });

    it("shows the banner on the Test routing tab too", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.errors = [RULE_ERROR];
        });
        act(() => {
            open("step-1");
        });

        activateTab(/Test routing/);

        expect(screen.getByText("This step has an error on the Assignment tab.")).toBeTruthy();
    });

    it("shows the Check this step block on General and Assignment and hides it on Test routing", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.setWarnings([LEGAL_LINE]);
        });
        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Check this step")).toBeTruthy();
        expect(screen.getByText("Legal has no members.")).toBeTruthy();

        activateTab(/Test routing/);
        expect(screen.queryByText("Check this step")).toBeNull();

        activateTab(/Assignment/);
        expect(screen.getByText("Check this step")).toBeTruthy();
    });

    it("shows no block for a step without warnings", () => {
        const { open } = createSetup(createPeopleStep());

        act(() => {
            open("step-1");
        });

        expect(screen.queryByText("Check this step")).toBeNull();
    });

    it("shows the block for a step without tabs", () => {
        const { open } = createSetup(createAutomationStep({ id: "step-1" }), source => {
            source.setWarnings([WEBHOOK_LINE]);
        });

        act(() => {
            open("step-1");
        });

        expect(screen.getByText("Check this step")).toBeTruthy();
        expect(screen.getByText("The automation “Send webhook” no longer exists.")).toBeTruthy();
    });

    it("shows the teams-off notice and no tabs for a read-only People step", () => {
        const { open } = createSetup(createPeopleStep(), source => {
            source.readOnly = true;
        });

        act(() => {
            open("step-1");
        });

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });

    it("keeps the 560px drawer and Done applying and closing", async () => {
        const { open, source } = createSetup(createPeopleStep());
        act(() => {
            open("step-1");
        });

        expect(screen.getByRole("dialog").style.width).toBe("560px");
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Done" }));
        });

        expect(source.closeStep).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/getActiveTabId.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.chrome.test.tsx 2>&1 | tail -40
```

Expected: `getActiveTabId.test.ts` fails with `Failed to resolve import "./getActiveTabId.js"`. `StepDrawerBanners.test.tsx` fails with `Failed to resolve import "./StepDrawerBanners.js"`. `StepDrawer.chrome.test.tsx` fails on the banner and block cases (`Unable to find an element with the text: This step has an error on the Assignment tab.`, `Check this step`, the notice); the tab cases pass, since the tabs come from Tasks 16 to 18. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerTabs.ts`:

```ts
// The ids of the People step's layout tabs (Task 18, `buildPeopleStepForm`).
export const STEP_DRAWER_TAB = {
    general: "general",
    assignment: "assignment",
    testRouting: "testRouting"
} as const;

// The tabs an error can sit on (R302): the Test routing tab never carries one.
export type StepErrorTab = "general" | "assignment";

export const STEP_ERROR_TAB_LABELS: Record<StepErrorTab, string> = {
    general: "General",
    assignment: "Assignment"
};
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/getActiveTabId.ts`:

```ts
import type { FormModel } from "@webiny/app-admin";

/*
 * The id of the tab the form has open, or null when the form has no tabs (an Automation or AI
 * step, a read-only step). The drawer view reads it inside its reactive component, so it follows
 * the form's tab changes (a click, or `focusField` activating the tab of an error).
 */
export const getActiveTabId = (form: FormModel.FormVM | null): string | null => {
    if (form === null) {
        return null;
    }
    for (const node of form.layout) {
        if (node.type === "tabs") {
            return node.activeTabId;
        }
    }
    return null;
};
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/stepDrawerMessages.ts`:

Before:
```ts
export const STEP_DRAWER_MESSAGES = {
    untitledStep: "Untitled step",
    footerText: "Edits stay in this workflow until you save it.",
    done: "Done"
} as const;
```
After:
```ts
export const STEP_DRAWER_MESSAGES = {
    untitledStep: "Untitled step",
    footerText: "Edits stay in this workflow until you save it.",
    done: "Done",
    warningsHeading: "Check this step",
    show: "Show",
    errorOnTab: (tab: string): string => `This step has an error on the ${tab} tab.`
} as const;
```

Create `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerBanners.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { StepDrawerAlertVm } from "./abstractions.js";
import { STEP_DRAWER_MESSAGES } from "./stepDrawerMessages.js";
import { STEP_DRAWER_TAB } from "./stepDrawerTabs.js";
import { STEP_ERROR_TAB_LABELS } from "./stepDrawerTabs.js";
import type { StepErrorTab } from "./stepDrawerTabs.js";

export interface StepDrawerBannersProps {
    licenceAlert: StepDrawerAlertVm | null;
    // The teams-off notice (R309).
    notice: string | null;
    topError: string | null;
    // The tab holding an error (R302), or null.
    errorTab: StepErrorTab | null;
    // The `Check this step` lines (R312), each with its severity.
    warnings: StepWarningLine[];
    // The tab the form has open, or null when the form has no tabs.
    activeTabId: string | null;
    onShowErrorTab(): void;
}

/*
 * What sits above the form in the step drawer, in the order of the design: the licence alert, the
 * teams-off notice, the error with no field, the banner for an error on another tab and the
 * `Check this step` block. Plain props, no state (the presenter owns it, R234).
 */
export const StepDrawerBanners = (props: StepDrawerBannersProps) => {
    const { licenceAlert, notice, topError, errorTab, warnings, activeTabId } = props;

    let showTabBanner = false;
    if (errorTab !== null && activeTabId !== null) {
        showTabBanner = activeTabId !== STEP_DRAWER_TAB[errorTab];
    }
    const showWarnings = warnings.length > 0 && activeTabId !== STEP_DRAWER_TAB.testRouting;

    return (
        <>
            {licenceAlert && (
                <Alert type={"warning"} variant={"subtle"}>
                    <strong>{licenceAlert.title}</strong> {licenceAlert.text}
                </Alert>
            )}
            {notice !== null && (
                <Alert type={"info"} variant={"subtle"}>
                    {notice}
                </Alert>
            )}
            {topError && (
                <Alert type={"danger"} variant={"subtle"}>
                    {topError}
                </Alert>
            )}
            {showTabBanner && errorTab !== null && (
                <Alert
                    type={"danger"}
                    variant={"subtle"}
                    actions={
                        <Alert.Action
                            text={STEP_DRAWER_MESSAGES.show}
                            onClick={props.onShowErrorTab}
                        />
                    }
                >
                    {STEP_DRAWER_MESSAGES.errorOnTab(STEP_ERROR_TAB_LABELS[errorTab])}
                </Alert>
            )}
            {showWarnings && (
                <Alert type={"warning"} variant={"subtle"}>
                    <strong>{STEP_DRAWER_MESSAGES.warningsHeading}</strong>
                    <ul className={"mt-xs flex flex-col gap-xxs"}>
                        {warnings.map((line, index) => (
                            <li
                                key={`${index}:${line.text}`}
                                data-severity={line.severity}
                                className={cn(line.severity === "error" && "text-destructive-primary")}
                            >
                                {line.text}
                            </li>
                        ))}
                    </ul>
                </Alert>
            )}
        </>
    );
};
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.tsx` (against the file as Task 22b leaves it).

Imports: `Alert` is no longer used by the file, the banners component and the helper come in.

Before:
```tsx
import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Drawer } from "@webiny/admin-ui";
```
After:
```tsx
import React from "react";
import { useEffect } from "react";
import { Drawer } from "@webiny/admin-ui";
```

Before:
```tsx
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { StepDrawerPresenterFeature } from "./feature.js";
```
After:
```tsx
import { buildStepFormOptions } from "./buildStepFormOptions.js";
import type { StepDrawerSource } from "./abstractions.js";
import type { StepKind } from "./abstractions.js";
import { StepDrawerPresenterFeature } from "./feature.js";
import { getActiveTabId } from "./getActiveTabId.js";
import { StepDrawerBanners } from "./StepDrawerBanners.js";
```

The active tab, next to the options:

Before:
```tsx
    const formOptions = buildStepFormOptions(vm, presenter);

    return (
```
After:
```tsx
    const formOptions = buildStepFormOptions(vm, presenter);
    const activeTabId = getActiveTabId(vm.form);

    return (
```

The body:

Before:
```tsx
                <div className={"flex flex-col gap-md"}>
                    {vm.licenceAlert && (
                        <Alert type={"warning"} variant={"subtle"}>
                            <strong>{vm.licenceAlert.title}</strong> {vm.licenceAlert.text}
                        </Alert>
                    )}
                    {vm.topError && (
                        <Alert type={"danger"} variant={"subtle"}>
                            {vm.topError}
                        </Alert>
                    )}
                    {vm.form && <FormView name={"Workflow step"} form={vm.form} />}
                </div>
```
After:
```tsx
                <div className={"flex flex-col gap-md"}>
                    <StepDrawerBanners
                        licenceAlert={vm.licenceAlert}
                        notice={vm.notice}
                        topError={vm.topError}
                        errorTab={vm.errorTab}
                        warnings={vm.warnings}
                        activeTabId={activeTabId}
                        onShowErrorTab={() => presenter.showErrorTab()}
                    />
                    {vm.form && <FormView name={"Workflow step"} form={vm.form} />}
                </div>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/getActiveTabId.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.chrome.test.tsx 2>&1 | tail -40
```

Expected: PASS. Notes for the first run: (1) `getActiveTabId.test.ts` relies on `focusField` activating the tab that holds the field (R302, research-admin section 5). (2) The chrome test needs `Show` to land on the Assignment tab through `presenter.showErrorTab()` (Task 16 calls `focusField("assignment.rules")`) and the drawer to open on it for a rule error (R302). (3) The teams-off case assumes Task 16 derives the notice from a read-only People step; if it needs another signal on the fake (for example a `review` row that is not available in `source.getOptions()`), set that in the test's `configure` callback instead of `source.readOnly`. (4) A `listitem` count of 2 needs the `ul` of the block to be the only list in the alert.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, including the 9a `StepDrawer.test.tsx` (licence alert and top error cases keep their texts and order) and the Task 22b root test; no TypeScript errors in `app-workflows`.

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
git commit -m "feat(app-workflows): add the error tab banner and the Check this step block to the step drawer" -m "The drawer shows 'This step has an error on the {tab} tab.' with a Show button when the error is on another tab, the 'Check this step' block with the step and rule warnings (hidden on the Test routing tab) and the teams-off notice. The presenter owns what they say; the view only reads which tab is open." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The open tab is read from the form.** The contract gives the VM `errorTab` and says the banner shows "when the open tab is not the one with the error", but no VM field for the open tab. The view reads it from the form's tabs node (`getActiveTabId`) inside the reactive component, so the banner follows clicks and `focusField`. If Task 16 prefers to expose `activeTab` on the VM, replace the one `getActiveTabId(vm.form)` line.
- **Tab ids are assumed** (`general`, `assignment`, `testRouting`); `stepDrawerTabs.ts` is the single place to change if Task 18 chose others.
- **No tab-chrome code.** The contract says "tabs come from the form layout"; nothing in this task builds tabs. The `Test routing` tab never carries an error mark (R302).
- **`StepDrawer.test.tsx` is unchanged;** the chrome cases are in `StepDrawer.chrome.test.tsx` because that file needs the real `FormView` (the existing file stubs it for the whole file).
- **`showErrorTab` is called through the presenter** (`presenter.showErrorTab()`, Task 16), as the contract says.
- Size: medium (two small helpers, one banners component, a three-hunk view change, three test files).

## Review fixes (sub-phase review)

- Severity ruling applied: `warnings` is `StepWarningLine[]`; an `error` line is drawn destructive in the `Check this step` block (`data-severity`, `text-destructive-primary`), with a banners test.
- The chrome test no longer uses `vi.spyOn` on the MobX fake (non-writable methods): it uses `FakeStepDrawerSource.setWarnings`, and its source lines no longer start with `Rule {n}: ` (Task 16 strips those from the source's lines and rebuilds them from the live issues, so the old `Rule 1: ...` expectation could not pass).
- `Alert` import removal checked against the 9a file; `STEP_ERROR_TAB_LABELS` listed under Produces; Task 16's `licenceAlert`, `notice`, `showErrorTab` names verified.
