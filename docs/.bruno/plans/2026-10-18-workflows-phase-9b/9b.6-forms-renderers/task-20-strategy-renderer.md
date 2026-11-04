### Task 20: Strategy renderer and toggle

R285, R293, R297, R305; D21, D104; Q57; design README 4 and `research-spec.md` 4.2 (Strategy, toggle), 7; Review Focus 9, 10. The Assignment tab's first two controls: the strategy as three radio cards and the `Let the requester pick a reviewer` switch. The strategy renderer is built on the stock admin-ui `RadioGroup` (Task 1 made it accept a React label); the toggle is the stock boolean `switch` renderer, which Task 18 already configured (label and hint on the field), so this task adds no toggle code, only the test that pins it.

- **Cards (R297, design `STRATS`):** stored `none`, `roundRobin`, `leastLoaded`; name and description verbatim: `None (team pool)` / `The step waits in the team pool until a team member starts it.`, `Round-robin` / `Takes turns across eligible team members.`, `Least-loaded` / `Picks the eligible member with the fewest open reviews.`. The field label is `Strategy`. Each card is a radio item whose label content is the card (name in semi-bold, description in the neutral text colour); the selected card has the accent border and the `primary-subtle` background (design: selected card bg `primary-subtle`, border primary). Card styling lives in the item's label content (R305), so the radio circle stays the stock one.
- **Behaviour:** a click writes the stored value to `assignment.strategy` (and blurs the field, like the other renderers). A stored strategy the editor does not know reads as `null` (Task 9, R314): no card is selected and nothing is rewritten until the admin picks one. A read-only step (the field is disabled) disables the radios. A server error on `config.assignment.strategy` (Task 15) shows under the cards through the field's validation. The group is named by the `Strategy` label (`aria-labelledby`, which the fixed `RadioGroup` forwards) and each radio by its card text.
- **Toggle (R297):** the stock `switch` renderer with the label `Let the requester pick a reviewer` and the hint as the field note (Task 18). Strategy and toggle are independent: choosing a strategy never touches the toggle and the toggle never touches the strategy.
- **No state in the renderer:** it reads only the field; the items are rebuilt per render (the stock group re-initialises from the new array and does not loop, the parent does not re-render from it).

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepForm/AssignmentStrategyCard.ts`
- Create: `[STEP]/stepForm/assignmentStrategyCards.ts`
- Create: `[STEP]/stepForm/renderers/assignmentStrategy/StrategyCardLabel.tsx`
- Create: `[STEP]/stepForm/renderers/AssignmentStrategyRenderer.tsx`
- Create: `[STEP]/stepForm/renderers/AssignmentStrategyRenderer.test.tsx`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, `WorkflowEditorConfig.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): admin-ui `RadioGroup` (`items`, `value`, `onChange`, `disabled`, `aria-labelledby` after Task 1; `RadioGroupPrimitiveProps` is exported), `FormComponentLabel`, `FormComponentErrorMessage`, `cn`; `createFieldRenderer`; `renderStepFormField`, `createTestFormModelFactory`, `createReviewStep`; the stock `SwitchRenderer` (`@webiny/app-admin/base/Base/FieldRenderers/SwitchRenderer.js`, verified: a `createFieldRenderer` over the admin-ui `Switch` with `label`, `note`, `disabled`, `validation`).
- Consumes (earlier tasks): Task 1 (`RadioGroup` accepts a React node label and forwards `aria-labelledby`); Task 18 (`STEP_FORM_RENDERER.assignmentStrategy`, the `workflowAssignmentStrategy` augmentation, `buildPeopleStepForm`, the form fields `assignment.strategy` and `assignment.allowManualPick` with their label, renderer and note, `ASSIGNMENT_FORM_MESSAGES.strategyLabel`, `getPeopleFormData`); Task 9 (`AssignmentStrategy`).
- Produces: renderer `workflowAssignmentStrategy` (`AssignmentStrategyRenderer`), `ASSIGNMENT_STRATEGY_CARDS` and `AssignmentStrategyCard { value: AssignmentStrategy; name: string; description: string }`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { SwitchRenderer } from "@webiny/app-admin/base/Base/FieldRenderers/SwitchRenderer.js";
import { createReviewStep } from "~/editor/testing/draftFixtures.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
import { getPeopleFormData } from "../getPeopleFormData.js";
import { ASSIGNMENT_STRATEGY_CARDS } from "../assignmentStrategyCards.js";
import { AssignmentStrategyRenderer } from "./AssignmentStrategyRenderer.js";

const createForm = (strategy: string | null, readOnly = false) => {
    const form = createTestFormModelFactory().create(buildPeopleStepForm({ readOnly }));
    const values = getPeopleFormData(createReviewStep());
    form.setData(
        { ...values, assignment: { ...values.assignment, strategy } },
        { dirty: false }
    );
    return form;
};

const renderStrategy = (form: ReturnType<typeof createForm>) => {
    renderStepFormField({ form, name: "assignment.strategy", Renderer: AssignmentStrategyRenderer });
};

const getRadio = (name: RegExp) => {
    return screen.getByRole("radio", { name });
};

describe("AssignmentStrategyRenderer (R297, R305)", () => {
    afterEach(() => {
        cleanup();
    });

    it("has the three cards, in the design order, with the design's names and descriptions", () => {
        expect(ASSIGNMENT_STRATEGY_CARDS).toEqual([
            {
                value: "none",
                name: "None (team pool)",
                description: "The step waits in the team pool until a team member starts it."
            },
            {
                value: "roundRobin",
                name: "Round-robin",
                description: "Takes turns across eligible team members."
            },
            {
                value: "leastLoaded",
                name: "Least-loaded",
                description: "Picks the eligible member with the fewest open reviews."
            }
        ]);
    });

    it("renders one radio per strategy with its name and description under the Strategy label", () => {
        renderStrategy(createForm("none"));

        expect(getRadio(/None \(team pool\)/)).toBeDefined();
        expect(getRadio(/Round-robin/)).toBeDefined();
        expect(getRadio(/Least-loaded/)).toBeDefined();
        expect(screen.getAllByRole("radio")).toHaveLength(3);
        expect(
            screen.getByText("The step waits in the team pool until a team member starts it.")
        ).toBeDefined();
        expect(screen.getByText("Takes turns across eligible team members.")).toBeDefined();
        expect(
            screen.getByText("Picks the eligible member with the fewest open reviews.")
        ).toBeDefined();
        expect(screen.getByText("Strategy")).toBeDefined();
    });

    it("names the radio group by the Strategy label", () => {
        renderStrategy(createForm("none"));

        expect(screen.getByRole("radiogroup", { name: "Strategy" })).toBeDefined();
    });

    it("selects the card of the stored strategy", () => {
        renderStrategy(createForm("roundRobin"));

        expect(getRadio(/None \(team pool\)/).getAttribute("aria-checked")).toBe("false");
        expect(getRadio(/Round-robin/).getAttribute("aria-checked")).toBe("true");
        expect(getRadio(/Least-loaded/).getAttribute("aria-checked")).toBe("false");
    });

    it("writes the stored value of the clicked card and selects it", () => {
        const form = createForm("none");
        renderStrategy(form);

        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("leastLoaded");
        expect(getRadio(/Least-loaded/).getAttribute("aria-checked")).toBe("true");
        expect(getRadio(/None \(team pool\)/).getAttribute("aria-checked")).toBe("false");
        expect(form.isDirty).toBe(true);
    });

    it("shows no card selected for a stored strategy the editor does not know, and rewrites nothing until one is picked (R314)", () => {
        const form = createForm(null);
        renderStrategy(form);

        for (const radio of screen.getAllByRole("radio")) {
            expect(radio.getAttribute("aria-checked")).toBe("false");
        }
        expect(form.field("assignment.strategy").getValue()).toBeNull();

        fireEvent.click(getRadio(/Round-robin/));

        expect(form.field("assignment.strategy").getValue()).toBe("roundRobin");
    });

    it("disables the cards and ignores a click when the step is read-only (R309)", () => {
        const form = createForm("none", true);
        renderStrategy(form);

        for (const radio of screen.getAllByRole("radio")) {
            const button: HTMLButtonElement = radio as HTMLButtonElement;
            expect(button.disabled).toBe(true);
        }
        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("none");
    });

    it("shows a server error of the strategy field under the cards", () => {
        const form = createForm("none");
        form.field("assignment.strategy").setValidation({
            isValid: false,
            message: "Strategy is not allowed."
        });
        renderStrategy(form);

        expect(screen.getByText("Strategy is not allowed.")).toBeDefined();
    });

    it("renders the toggle with its label and hint, independent of the strategy", () => {
        const form = createForm("roundRobin");
        renderStrategy(form);
        renderStepFormField({ form, name: "assignment.allowManualPick", Renderer: SwitchRenderer });

        expect(screen.getByText("Let the requester pick a reviewer")).toBeDefined();
        expect(
            screen.getByText(
                "The requester can choose a person from this step's eligible reviewers when requesting a review. Picks are checked again when the step is reached."
            )
        ).toBeDefined();

        const toggle = screen.getByRole("switch");
        expect(toggle.getAttribute("aria-checked")).toBe("false");

        fireEvent.click(toggle);

        expect(form.field("assignment.allowManualPick").getValue()).toBe(true);
        expect(form.field("assignment.strategy").getValue()).toBe("roundRobin");

        fireEvent.click(getRadio(/Least-loaded/));

        expect(form.field("assignment.strategy").getValue()).toBe("leastLoaded");
        expect(form.field("assignment.allowManualPick").getValue()).toBe(true);
        expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
    });
});
```

In `packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx` (the file as Task 19b leaves it), before:

```tsx
    it("registers the colour, teams, transport, automation, AI model, AI tools, user and folder renderers", () => {
```

After:

```tsx
    it("registers the colour, teams, transport, automation, AI model, AI tools, user, folder and strategy renderers", () => {
```

Before:

```tsx
            "workflowUserPicker",
            "workflowFolderPicker"
        ]);
```

After:

```tsx
            "workflowUserPicker",
            "workflowFolderPicker",
            "workflowAssignmentStrategy"
        ]);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: `AssignmentStrategyRenderer.test.tsx` fails with `Failed to resolve import "../assignmentStrategyCards.js"`. `WorkflowEditorConfig.test.tsx` fails on the renderer list (`workflowAssignmentStrategy` missing).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/AssignmentStrategyCard.ts`:

```ts
import type { AssignmentStrategy } from "~/editor/model/assignment/AssignmentStrategy.js";

// One radio card of the Strategy control (R297).
export interface AssignmentStrategyCard {
    // The stored strategy.
    value: AssignmentStrategy;
    name: string;
    description: string;
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/assignmentStrategyCards.ts`:

```ts
import type { AssignmentStrategyCard } from "./AssignmentStrategyCard.js";

// The strategy cards, in the design's order, with its names and descriptions (R297, `STRATS`).
export const ASSIGNMENT_STRATEGY_CARDS: AssignmentStrategyCard[] = [
    {
        value: "none",
        name: "None (team pool)",
        description: "The step waits in the team pool until a team member starts it."
    },
    {
        value: "roundRobin",
        name: "Round-robin",
        description: "Takes turns across eligible team members."
    },
    {
        value: "leastLoaded",
        name: "Least-loaded",
        description: "Picks the eligible member with the fewest open reviews."
    }
];
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/assignmentStrategy/StrategyCardLabel.tsx`:

```tsx
import React from "react";
import { cn } from "@webiny/admin-ui";
import type { AssignmentStrategyCard } from "../../AssignmentStrategyCard.js";

export interface StrategyCardLabelProps {
    card: AssignmentStrategyCard;
    selected: boolean;
}

// The content of a strategy radio item: the card (R305). The selected card has the accent border and the subtle primary background.
export const StrategyCardLabel = ({ card, selected }: StrategyCardLabelProps) => {
    const cardClass = cn(
        "flex flex-col gap-xxs rounded-md border-sm px-md py-sm",
        selected && "border-accent-default bg-primary-subtle",
        !selected && "border-neutral-muted bg-neutral-base"
    );

    return (
        <span className={cardClass}>
            <span className={"font-semibold"}>{card.name}</span>
            <span className={"text-sm text-neutral-strong"}>{card.description}</span>
        </span>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.tsx`:

```tsx
import React from "react";
import { FormComponentErrorMessage } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { RadioGroup } from "@webiny/admin-ui";
import type { RadioGroupPrimitiveProps } from "@webiny/admin-ui";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_STRATEGY_CARDS } from "../assignmentStrategyCards.js";
import { StrategyCardLabel } from "./assignmentStrategy/StrategyCardLabel.js";
import "../stepFormRendererNames.js";

const LABEL_ID = "assignment-strategy-label";
const ITEM_ID_PREFIX = "assignment-strategy";

/*
 * Strategy (R297, R305, D21): three radio cards over the stock `RadioGroup`, whose item labels are
 * the cards. The field value is the stored strategy; a stored value the editor does not know is
 * `null` and selects no card (R314). The group is named by the visible label.
 */
export const AssignmentStrategyRenderer = createFieldRenderer<"workflowAssignmentStrategy">(
    ({ field }) => {
        const value = typeof field.value === "string" ? field.value : "";
        const invalid = field.validation.isValid === false;

        const items: RadioGroupPrimitiveProps["items"] = [];
        for (const card of ASSIGNMENT_STRATEGY_CARDS) {
            items.push({
                id: `${ITEM_ID_PREFIX}-${card.value}`,
                value: card.value,
                label: <StrategyCardLabel card={card} selected={card.value === value} />
            });
        }

        const handleChange = (strategy: string) => {
            field.onChange(strategy);
            field.onBlur();
        };

        return (
            <div className={"flex w-full flex-col gap-sm"}>
                <FormComponentLabel
                    id={LABEL_ID}
                    text={field.label}
                    disabled={field.disabled}
                    invalid={invalid}
                />
                <RadioGroup
                    aria-labelledby={LABEL_ID}
                    items={items}
                    value={value}
                    disabled={field.disabled}
                    onChange={handleChange}
                />
                <FormComponentErrorMessage
                    text={field.validation.message}
                    invalid={invalid}
                    disabled={field.disabled}
                />
            </div>
        );
    }
);
```

In `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, add the import after the `FolderPickerRenderer` import:

```tsx
import { AssignmentStrategyRenderer } from "~/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.js";
```

and the entry after the folder entry. Before:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.folderPicker}
                component={FolderPickerRenderer}
            />
        </AdminConfig>
```

After:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.folderPicker}
                component={FolderPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.assignmentStrategy}
                component={AssignmentStrategyRenderer}
            />
        </AdminConfig>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AssignmentStrategyRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
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
git commit -m "feat(app-workflows): add the strategy radio cards to the Assignment tab" -m "The strategy renderer shows the three routing strategies as radio cards on the stock RadioGroup, with the design's names and descriptions. A stored strategy the editor does not know selects no card and stays as stored until one is picked. The requester-pick toggle is the stock switch renderer and is tested to stay independent of the strategy." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The toggle needs no code here:** the contract lists the toggle under this task, but the stock `switch` renderer renders the field Task 18 builds (label `Let the requester pick a reviewer`, the hint as the field `note`). This task registers nothing for it and tests it through the stock `SwitchRenderer` next to the strategy renderer.
- **The hint is the field's `note`, not its `description`:** the stock `Switch` shows `description` only as a hover hint on the label; `note` is the visible line under the switch, as in the design (the contract says "hint").
- **Task 1 is a prerequisite twice:** the cards put a React node in the item `label` (the stock `RadioGroup` overflowed the stack before the fix) and the group is named through `aria-labelledby` (the fixed `RadioGroupRenderer` forwards it). Without Task 1 these tests fail with `Maximum call stack size exceeded`.
- **No `useMemo` for the items:** the renderer is a function passed to `createFieldRenderer`, not a named component; building the items per render costs nothing (the group re-initialises and does not loop).
- Size: small (two data files, one label, one renderer, one test file).

## Review fixes (sub-phase review)

- No change to the task text. Verified against the repo: `RadioGroupPrimitiveProps` is exported from `@webiny/admin-ui`, `RadioItemParams.label` accepts a React node, the boolean field's default renderer is `switch` (so the toggle needs no code here), and the `WorkflowEditorConfig.test.tsx` renderer list is extended in the order Tasks 19b, 20, 21b, 22 add names.
