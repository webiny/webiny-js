### Task 17: Step type picker

R269 (the types, their order, the disabled reasons), R275 (AI cards disabled without the editor); D35, D91, D122, QBZ-44, QBZ-97; design README UI-12 and 3, `research-spec.md` 4.1, 4.2 and 4.3 (type cards), `research2-admin.md` 5; Review Focus 5 (unavailable types cannot be added: Task 8 decides availability, this task renders it and cannot add a disabled card). A modal with one card per step type, in the order the server listed them. A card shows the type's icon, its UI name (`label`) and its description; a type that is not addable is disabled and shows its reason. Choosing an addable card calls `presenter.addStep(index, type)` with the position the presenter stored when the picker opened (`vm.typePicker.index`, set by `openTypePicker(index)`, Task 16); the presenter inserts the step and opens it (R284: `addStep` sets `vm.openStepId`, the view's drawer follows), as the prototype does; the layout holds no logic. The presenter owns the open state and the options (`vm.typePicker`, built from Task 8's `getStepTypeOptions`).

- **Modal (README UI-12):** title `Add step`, description `Choose who or what does this step. You can't change the type later.`
- **Cards:**
  - People: `Members of one or more teams review.`; Automation: `Runs a code-defined automation, such as Send webhook.`; AI: `An AI model reviews against your written instructions.` These are Task 8's `description`; a type with no description (an unknown server type) shows only its label.
  - Disabled (not `addable`): the card is a disabled button and shows `reason` under the description: AI `Requires the AI Power-Ups licence.`, Automation `No automations are available for this model.` (CMS) or `No automations are available for pages.` (WB, QBZ-44), any other unavailable type the server's `unavailableReason` (all computed by `getStepTypeOptions`, R269). A disabled card never calls `onPick`.
  - The icon comes from `getStepTypeIcon(type)` (Task 16): `group`, `bolt`, `auto_awesome`; an unknown type has none.
- **Closing:** the modal's close button or Escape calls `onClose` (`presenter.closeTypePicker()`); no insertion happens.
- **Layout:** the layout renders the picker only while `vm.typePicker` is not null, so the modal is always open when mounted. Picking calls `presenter.addStep(vm.typePicker.index, type)`; the presenter closes the picker and opens the new step itself.

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`

**Interfaces:**
- Consumes: Task 16 (`getStepTypeIcon`, `WorkflowEditorLayout`, the layout flow test file, `createEditorViewModel`, `createFakeEditorViewPresenter`, `createFakeSortable`), Task 8 (`StepTypeOption { type, label, description: string | null, addable, reason: string | null }` from `[AWE]/model/getStepTypeOptions.ts`), Task 9 (`TypePickerVm { index, options: StepTypeOption[] }` and `vm.typePicker`; `closeTypePicker()`, `addStep(index, type): string | null`, which adds the step when the type is addable, closes the picker, opens the new step (R284) and returns its id). Existing (verified): admin-ui `Dialog` (props `open`, `onOpenChange`, `title`, `description`, `children`; Radix, closes on Escape), `Text`, `cn`.
- Produces: `StepTypePicker`, the picker slot of the layout.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The Radix dialog renders into `document.body`; query it through `screen`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepTypePicker } from "./StepTypePicker.js";
import type { StepTypePickerProps } from "./StepTypePicker.js";

const PEOPLE: StepTypeOption = {
    type: "review",
    label: "People",
    description: "Members of one or more teams review.",
    addable: true,
    reason: null
};

const AUTOMATION: StepTypeOption = {
    type: "automation",
    label: "Automation",
    description: "Runs a code-defined automation, such as Send webhook.",
    addable: true,
    reason: null
};

const AI: StepTypeOption = {
    type: "ai",
    label: "AI",
    description: "An AI model reviews against your written instructions.",
    addable: true,
    reason: null
};

const createProps = (overrides: Partial<StepTypePickerProps> = {}): StepTypePickerProps => {
    return {
        options: [PEOPLE, AUTOMATION, AI],
        onPick: vi.fn(),
        onClose: vi.fn(),
        ...overrides
    };
};

describe("StepTypePicker", () => {
    it("shows the title, the hint and one card per type in the given order", () => {
        renderWithAdminUi(<StepTypePicker {...createProps()} />);

        expect(screen.getByText("Add step")).toBeTruthy();
        expect(
            screen.getByText("Choose who or what does this step. You can't change the type later.")
        ).toBeTruthy();

        const cards = screen.getAllByTestId(/^step-type-/);
        expect(cards.map(card => card.getAttribute("data-testid"))).toEqual([
            "step-type-review",
            "step-type-automation",
            "step-type-ai"
        ]);
        expect(screen.getByText("Members of one or more teams review.")).toBeTruthy();
        expect(screen.getByText("Runs a code-defined automation, such as Send webhook.")).toBeTruthy();
        expect(screen.getByText("An AI model reviews against your written instructions.")).toBeTruthy();
    });

    it("picks an addable type", () => {
        const props = createProps();
        renderWithAdminUi(<StepTypePicker {...props} />);

        fireEvent.click(screen.getByTestId("step-type-automation"));

        expect(props.onPick).toHaveBeenCalledTimes(1);
        expect(props.onPick).toHaveBeenCalledWith("automation");
        expect(props.onClose).not.toHaveBeenCalled();
    });

    it("lists AI as disabled with the licence reason and cannot pick it", () => {
        const ai: StepTypeOption = {
            ...AI,
            addable: false,
            reason: "Requires the AI Power-Ups licence."
        };
        const props = createProps({ options: [PEOPLE, AUTOMATION, ai] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("Requires the AI Power-Ups licence.")).toBeTruthy();
        const card = screen.getByTestId("step-type-ai");
        expect(card.hasAttribute("disabled")).toBe(true);
        fireEvent.click(card);
        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("lists Automation as disabled with the model reason", () => {
        const automation: StepTypeOption = {
            ...AUTOMATION,
            addable: false,
            reason: "No automations are available for this model."
        };
        const props = createProps({ options: [PEOPLE, automation, AI] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("No automations are available for this model.")).toBeTruthy();
        expect(screen.getByTestId("step-type-automation").hasAttribute("disabled")).toBe(true);
        expect(screen.getByTestId("step-type-review").hasAttribute("disabled")).toBe(false);
    });

    it("shows the Website Builder reason as the presenter gives it", () => {
        const automation: StepTypeOption = {
            ...AUTOMATION,
            addable: false,
            reason: "No automations are available for pages."
        };
        renderWithAdminUi(<StepTypePicker {...createProps({ options: [PEOPLE, automation] })} />);

        expect(screen.getByText("No automations are available for pages.")).toBeTruthy();
    });

    it("shows no reason on an addable card", () => {
        renderWithAdminUi(<StepTypePicker {...createProps()} />);

        expect(screen.queryByText("Requires the AI Power-Ups licence.")).toBeNull();
        expect(screen.queryByText("No automations are available for this model.")).toBeNull();
    });

    it("lists an unknown type disabled with the server's reason and no description", () => {
        const custom: StepTypeOption = {
            type: "custom",
            label: "Custom check",
            description: null,
            addable: false,
            reason: "Requires the custom add-on."
        };
        const props = createProps({ options: [PEOPLE, custom] });
        renderWithAdminUi(<StepTypePicker {...props} />);

        expect(screen.getByText("Custom check")).toBeTruthy();
        expect(screen.getByText("Requires the custom add-on.")).toBeTruthy();
        const card = screen.getByTestId("step-type-custom");
        expect(card.hasAttribute("disabled")).toBe(true);
        fireEvent.click(card);
        expect(props.onPick).not.toHaveBeenCalled();
    });

    it("closes on Escape without picking", async () => {
        const props = createProps();
        renderWithAdminUi(<StepTypePicker {...props} />);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
        expect(props.onPick).not.toHaveBeenCalled();
    });
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`. Add `import { waitFor } from "@testing-library/react";` below `import { within } from "@testing-library/react";` at the top of that file, and add cases at the end of the `describe("WorkflowEditorLayout flow", ...)` block (before its closing `});`):

```tsx
    it("shows no type picker while the view model has none", () => {
        renderLayout();

        expect(screen.queryByTestId("step-type-review")).toBeNull();
    });

    it("shows the type picker for the presenter's options", () => {
        renderLayout({
            typePicker: {
                index: 1,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: "Members of one or more teams review.",
                        addable: true,
                        reason: null
                    },
                    {
                        type: "ai",
                        label: "AI",
                        description: "An AI model reviews against your written instructions.",
                        addable: false,
                        reason: "Requires the AI Power-Ups licence."
                    }
                ]
            }
        });

        expect(screen.getByTestId("step-type-review")).toBeTruthy();
        expect(screen.getByText("Requires the AI Power-Ups licence.")).toBeTruthy();
    });

    it("adds the picked type at the stored position", () => {
        const presenter = renderLayout({
            typePicker: {
                index: 1,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: null,
                        addable: true,
                        reason: null
                    }
                ]
            }
        });

        fireEvent.click(screen.getByTestId("step-type-review"));

        expect(presenter.addStep).toHaveBeenCalledTimes(1);
        expect(presenter.addStep).toHaveBeenCalledWith(1, "review");
    });

    it("closes the type picker through the presenter", async () => {
        const presenter = renderLayout({
            typePicker: {
                index: 0,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: null,
                        addable: true,
                        reason: null
                    }
                ]
            }
        });

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(presenter.closeTypePicker).toHaveBeenCalledTimes(1));
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
```

Expected: `StepTypePicker.test.tsx` fails with `Failed to resolve import` for `./StepTypePicker.js`. In `WorkflowEditorLayoutFlow.test.tsx` the picker cases fail (`step-type-review` is not rendered); the old cases still pass. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.tsx`:

```tsx
import React from "react";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { StepTypeOption } from "~/editor/model/getStepTypeOptions.js";
import { getStepTypeIcon } from "./getStepTypeIcon.js";

export interface StepTypePickerProps {
    options: StepTypeOption[];
    onPick(type: string): void;
    onClose(): void;
}

interface TypeCardProps {
    option: StepTypeOption;
    onPick(type: string): void;
}

const TypeCard = ({ option, onPick }: TypeCardProps) => {
    const disabled = !option.addable;
    const cardClass = cn(
        "flex w-full items-start gap-sm rounded-lg border-sm p-md text-left",
        !disabled && "border-neutral-muted hover:border-accent-default hover:bg-neutral-light",
        disabled && "border-neutral-dimmed bg-neutral-light cursor-not-allowed"
    );

    let description: React.ReactNode = null;
    if (option.description !== null) {
        description = (
            <Text as="span" size="sm" className="text-neutral-strong">
                {option.description}
            </Text>
        );
    }

    let reason: React.ReactNode = null;
    if (option.reason !== null) {
        reason = (
            <Text as="span" size="sm" className="text-neutral-primary">
                {option.reason}
            </Text>
        );
    }

    return (
        <button
            type="button"
            data-testid={`step-type-${option.type}`}
            disabled={disabled}
            className={cardClass}
            onClick={() => onPick(option.type)}
        >
            <span
                aria-hidden="true"
                className="shrink-0 flex items-center justify-center size-xl rounded-md bg-neutral-dimmed"
            >
                {getStepTypeIcon(option.type)}
            </span>
            <span className="flex flex-col gap-xxs">
                <Text as="span" size="md" className="font-semibold">
                    {option.label}
                </Text>
                {description}
                {reason}
            </span>
        </button>
    );
};

/*
 * The step type picker (design README UI-12): one card per type from `listStepTypes`, in the order
 * returned. A type that cannot be added is a disabled card with its reason (D122, QBZ-97).
 */
export const StepTypePicker = ({ options, onPick, onClose }: StepTypePickerProps) => {
    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    onClose();
                }
            }}
            title="Add step"
            description="Choose who or what does this step. You can't change the type later."
        >
            <div className="flex flex-col gap-sm">
                {options.map(option => (
                    <TypeCard key={option.type} option={option} onPick={onPick} />
                ))}
            </div>
        </Dialog>
    );
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`. Add the import after `import { NoWorkflowState } from "./NoWorkflowState.js";`:

```tsx
import { StepTypePicker } from "./StepTypePicker.js";
```

Insert before the final `return (` (the one that starts `    return (\n        <div data-testid="workflow-editor"`):

```tsx
    let picker: React.ReactNode = null;
    if (vm.typePicker !== null) {
        const index = vm.typePicker.index;
        picker = (
            <StepTypePicker
                options={vm.typePicker.options}
                onPick={type => presenter.addStep(index, type)}
                onClose={() => presenter.closeTypePicker()}
            />
        );
    }

```

and replace the line

```tsx
            {drawer}
```

with

```tsx
            {drawer}
            {picker}
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (a) the picker is a Radix dialog, so a disabled card is a native `disabled` button and `fireEvent.click` on it does nothing; (b) if Escape does not reach `onOpenChange` in jsdom, dispatch it on the dialog element instead of `document` (`fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })`); (c) the fake presenter's `addStep` returns `null`; the layout ignores the return value.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepTypePicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. A type error on `presenter.addStep(index, type)` means Task 9's `addStep` signature differs (it is `addStep(index, type): string | null`).

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
git commit -m "feat(app-workflows): add the step type picker" -m "A modal lists every step type in the order the server returned, with its icon, name and description. A type that cannot be added is a disabled card with its reason; choosing an addable type asks the presenter to insert a step at the stored position and opens the new step in the drawer." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No new DI feature, nothing to register.** The picker is a component; its open state and options live in the editor presenter (`vm.typePicker`, Task 9).
- **Opening the new step is the presenter's (R284):** `addStep(index, type)` inserts the step, sets `vm.openStepId` and closes the picker; the view's `<StepDrawer source={presenter} stepId={vm.openStepId} />` follows. The layout calls `addStep` and nothing else; the return value (`string | null`) is unused.
- **Modal title `Add step`** is derived (accepted by the user, Q48): the design names the modal "Step-type picker" and uses `Add step` as the button label that opens it (`research-spec.md` 4.1, 4.3); no other string was proposed.
- **Disabled-reason copy is not written here:** `getStepTypeOptions` (Task 8) holds the strings and its tests pin them; the picker renders `reason` as given, and the test uses the same texts as literals.
