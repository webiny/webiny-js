### Task 1: admin-ui `RadioGroup`, `CheckboxGroup`, `Checkbox` fix, then switch the 9a forms back

R305; Q57; Review Focus 9; 9a R274 (Automation cards), R275 (AI tools). The three admin-ui presenters call `makeAutoObservable(this)`, which deep-observes everything they hold. `RadioGroupPresenter.params` and `CheckboxGroupPresenter.params` hold the items, and `CheckboxPresenter.params` holds the `label`; when an item `label` is a React element created in a render, its `_owner` fiber is a cycle and mobx recurses until `RangeError: Maximum call stack size exceeded`. The 9a forms worked around it (`DeprecatedRadioGroup` + `Radio` in `AutomationCardsRenderer`, per-item `CheckboxPrimitiveRenderer` in `AiToolsRenderer`). This task fixes the cause in its own commit, then removes the workarounds in a second commit.

- **Commit 1 (`fix(admin-ui)`), behaviour:**
  - `RadioGroupPresenter` holds `params` by reference. `CheckboxPresenter` holds `params` and `item` by reference. `CheckboxGroupPresenter` holds `params` and `items` by reference. Annotation: `observableRef` (mobx 7; `observable.ref` does not exist in the installed version 7.0.3, verified: it is `undefined`). The repo already uses `observableRef` in `packages/app-workflows/src/review/presentation/reviewerPicker/ReviewerPickerPresenter.ts` (`makeAutoObservable<..., "token" | "params" | "candidates">(this, { params: observableRef, ... })`).
  - `vm` stays a computed getter and `init` / `changeValue` / `changeChecked` stay auto actions, so the hooks (`useRadioGroup`, `useCheckbox`, `useCheckboxGroup`) keep working unchanged: they call `presenter.init(params)` in an effect and an `autorun` pushes `presenter.vm` into state. Because `params` / `items` / `item` are reassigned wholesale by `init` and by `CheckboxGroupPresenter.changeChecked`, a reference-observable still notifies the `autorun` on every change.
  - `RadioGroupRenderer` forwards `aria-label` and `aria-labelledby` to `RadioGroupRoot` (today they are dropped, so a `RadioGroup` cannot be named; the 9a Automation test `names the radio group by the Automation label` needs it). Only these two props are forwarded: spreading the rest would put the primitive's `onChange` on the DOM element.
  - No domain file (`RadioItem`, `CheckboxItem`, mappers) changes: they are class instances, which mobx does not convert, and they hold the `label` untouched.
- **Commit 2 (`refactor(app-workflows)`), behaviour:**
  - `AutomationCardsRenderer`: the list uses the stock `RadioGroup` with `items` (`id: "<field.name>-<option.id>"`, `value: option.id`, the same name-and-description JSX as `label`), `aria-labelledby={labelId}`, `value`, `disabled`, `onChange={id => automations.select(id)}`. Its own `FormComponentLabel` (with the `labelId`), the `FormComponentErrorMessage` under the list and the two warnings stay exactly as they are; `RadioGroup` gets no `label` and no `validation` prop, so it renders none of its own.
  - `AiToolsRenderer`: the rows use the stock `CheckboxGroup` with `items` (`id: "ai-tool-<name>"`, `value: name`, the same title, `Changes content` tag and description JSX as `label`), `value={ticked}`, `disabled`, `onChange={values => { field.onChange([...kept, ...values]); field.onBlur(); }}`. The outer `role="group"` wrapper with `aria-labelledby` / `aria-describedby`, its `FormComponentLabel`, the error message and the hint stay as they are. Names stored on the step that the list does not offer are still kept (`kept`) and never shown; the order of the written value is `[...kept, ...ticked-in-toggle-order]` as before.
  - `TransportCheckboxesRenderer.tsx` is not touched. No test file of `app-workflows` is edited: the six existing renderer test files are the unchanged behaviour spec (R305: "their tests keep passing"). They already render JSX labels, so they fail with the `RangeError` if commit 1 is missing.

**Files:**
- Modify: `packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.ts`
- Modify: `packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.ts`
- Modify: `packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.ts`
- Modify: `packages/admin-ui/src/RadioGroup/primitives/RadioGroupPrimitive.tsx`
- Create: `packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.jsxLabel.test.ts`
- Create: `packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.jsxLabel.test.ts`
- Create: `packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.jsxLabel.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.tsx`

**Interfaces:**
- Consumes: mobx `makeAutoObservable`, `observableRef` (both from `"mobx"`, verified); admin-ui `RadioGroup`, `CheckboxGroup` (both exported from `@webiny/admin-ui`, verified: `RadioGroup/index.ts` and `CheckboxGroup/index.ts` are re-exported by `src/index.ts`); `RadioGroupPrimitiveProps` (extends the Radix `RadioGroupProps`, so `aria-label` and `aria-labelledby` are already typed); `CheckboxItemDto`, `RadioItemParams` (both accept `label: string | React.ReactNode`).
- Produces: no new export. `RadioGroup`, `CheckboxGroup`, `Checkbox` accept a JSX `label`; `RadioGroup` names its group through `aria-label` / `aria-labelledby`; `AutomationCardsRenderer` and `AiToolsRenderer` use the stock groups. 9b Tasks 20 and 21 build on them (R305).

**Test runner note:** admin-ui and admin packages: `yarn test <path>` only, one file per command. The new admin-ui tests are plain `.ts` presenter tests (no DOM; `@testing-library/react` is not a dependency of `admin-ui`). The jsx-label tests build the failing shape without a render: a React element copied with an `_owner` that is a self-referencing plain object, which is what a render-created element carries (an owner fiber that points back to itself through `return` and `child`).

## Commit 1: `fix(admin-ui)`

- [ ] **Step 1: Write the failing tests**

Create `packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.jsxLabel.test.ts`:

```ts
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { RadioGroupPresenter } from "./RadioGroupPresenter.js";

/*
 * A React element created during a render points at its owner fiber, and a fiber points back at
 * its parent and children. A deep observable walks that whole cycle and overflows the stack.
 */
const createCyclicLabel = () => {
    const fiber: Record<string, unknown> = { tag: 0 };
    fiber.return = fiber;
    fiber.child = fiber;
    const element = React.createElement("span", null, "Card");
    return { ...element, _owner: fiber };
};

describe("RadioGroupPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new RadioGroupPresenter();

        const init = () => {
            presenter.init({
                onValueChange: vi.fn(),
                items: [
                    { value: "a", label },
                    { value: "b", label: "Plain" }
                ]
            });
        };

        expect(init).not.toThrow();
        expect(presenter.vm.items).toHaveLength(2);
        expect(presenter.vm.items[0].label).toBe(label);
        expect(presenter.vm.items[1].label).toBe("Plain");
    });

    it("still reports a value change", () => {
        const onValueChange = vi.fn();
        const label = createCyclicLabel();
        const presenter = new RadioGroupPresenter();
        presenter.init({ onValueChange, items: [{ value: "a", label }] });

        presenter.changeValue("a");

        expect(onValueChange).toHaveBeenCalledWith("a");
    });

    it("recomputes the view model when init is called again", () => {
        const first = createCyclicLabel();
        const second = createCyclicLabel();
        const presenter = new RadioGroupPresenter();
        presenter.init({ items: [{ value: "a", label: first }] });
        presenter.init({
            items: [
                { value: "a", label: first },
                { value: "b", label: second }
            ]
        });

        expect(presenter.vm.items.map(item => item.value)).toEqual(["a", "b"]);
        expect(presenter.vm.items[1].label).toBe(second);
    });
});
```

Create `packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.jsxLabel.test.ts`:

```ts
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CheckboxPresenter } from "./CheckboxPresenter.js";

/*
 * A React element created during a render points at its owner fiber, and a fiber points back at
 * its parent and children. A deep observable walks that whole cycle and overflows the stack.
 */
const createCyclicLabel = () => {
    const fiber: Record<string, unknown> = { tag: 0 };
    fiber.return = fiber;
    fiber.child = fiber;
    const element = React.createElement("span", null, "Card");
    return { ...element, _owner: fiber };
};

describe("CheckboxPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();

        const init = () => {
            presenter.init({ onCheckedChange: vi.fn(), id: "box", label, checked: true });
        };

        expect(init).not.toThrow();
        expect(presenter.vm.item?.label).toBe(label);
        expect(presenter.vm.item?.hasLabel).toBe(true);
        expect(presenter.vm.item?.checked).toBe(true);
    });

    it("still reports a change", () => {
        const onCheckedChange = vi.fn();
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();
        presenter.init({ onCheckedChange, label });

        presenter.changeChecked(true);

        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("recomputes the item when init is called again", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();
        presenter.init({ onCheckedChange: vi.fn(), label, checked: false });
        presenter.init({ onCheckedChange: vi.fn(), label, checked: true });

        expect(presenter.vm.item?.checked).toBe(true);
    });
});
```

Create `packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.jsxLabel.test.ts`:

```ts
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CheckboxGroupPresenter } from "./CheckboxGroupPresenter.js";

/*
 * A React element created during a render points at its owner fiber, and a fiber points back at
 * its parent and children. A deep observable walks that whole cycle and overflows the stack.
 */
const createCyclicLabel = () => {
    const fiber: Record<string, unknown> = { tag: 0 };
    fiber.return = fiber;
    fiber.child = fiber;
    const element = React.createElement("span", null, "Card");
    return { ...element, _owner: fiber };
};

describe("CheckboxGroupPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxGroupPresenter();

        const init = () => {
            presenter.init({
                items: [
                    { value: "a", label },
                    { value: "b", label: "Plain" }
                ],
                values: ["a"],
                onCheckedChange: vi.fn()
            });
        };

        const ticked = () => presenter.vm.items.map(item => item.checked);

        expect(init).not.toThrow();
        expect(ticked()).toEqual([true, false]);
        expect(presenter.vm.items[0].label).toBe(label);
    });

    it("toggles a value on and reports the next values", () => {
        const onCheckedChange = vi.fn();
        const presenter = new CheckboxGroupPresenter();
        presenter.init({
            items: [
                { value: "a", label: createCyclicLabel() },
                { value: "b", label: createCyclicLabel() }
            ],
            values: ["a"],
            onCheckedChange
        });

        presenter.changeChecked("b");

        const ticked = presenter.vm.items.map(item => item.checked);
        expect(onCheckedChange).toHaveBeenCalledWith(["a", "b"]);
        expect(ticked).toEqual([true, true]);
    });

    it("toggles a value off and reports the remaining values", () => {
        const onCheckedChange = vi.fn();
        const presenter = new CheckboxGroupPresenter();
        presenter.init({
            items: [
                { value: "a", label: createCyclicLabel() },
                { value: "b", label: createCyclicLabel() }
            ],
            values: ["a", "b"],
            onCheckedChange
        });

        presenter.changeChecked("a");

        const ticked = presenter.vm.items.map(item => item.checked);
        expect(onCheckedChange).toHaveBeenCalledWith(["b"]);
        expect(ticked).toEqual([false, true]);
    });
});
```

- [ ] **Step 2: Run the tests and expect failure**

```bash
yarn test packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.jsxLabel.test.ts 2>&1 | tail -30
```

Expected: FAIL, every case with `RangeError: Maximum call stack size exceeded` (thrown from `mobx` `extendObservable` while `init` deep-converts the label). Then:

```bash
yarn test packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.jsxLabel.test.ts 2>&1 | tail -30
```

Expected: FAIL, the same `RangeError`.

```bash
yarn test packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.jsxLabel.test.ts 2>&1 | tail -30
```

Expected: FAIL, the same `RangeError`.

- [ ] **Step 3: Implement the fix**

Modify `packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.ts`. Imports, before:

```ts
import { makeAutoObservable } from "mobx";
import type { RadioGroupVm } from "../RadioGroupPrimitive.js";
```

After:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { RadioGroupVm } from "../RadioGroupPrimitive.js";
```

Constructor, before:

```ts
    constructor() {
        makeAutoObservable(this);
    }
```

After:

```ts
    constructor() {
        makeAutoObservable<RadioGroupPresenter<TValue>, "params">(this, {
            params: observableRef
        });
    }
```

Modify `packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.ts`. Imports, before:

```ts
import { makeAutoObservable } from "mobx";
import type { CheckboxPrimitiveVm } from "../CheckboxPrimitive.js";
```

After:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { CheckboxPrimitiveVm } from "../CheckboxPrimitive.js";
```

Constructor, before:

```ts
    constructor() {
        makeAutoObservable(this);
    }
```

After:

```ts
    constructor() {
        makeAutoObservable<CheckboxPresenter, "params" | "item">(this, {
            params: observableRef,
            item: observableRef
        });
    }
```

Modify `packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.ts`. Imports, before:

```ts
import { makeAutoObservable } from "mobx";
import type { CheckboxGroupPrimitiveVm } from "../CheckboxGroupPrimitive.js";
```

After:

```ts
import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import type { CheckboxGroupPrimitiveVm } from "../CheckboxGroupPrimitive.js";
```

Constructor, before:

```ts
    constructor() {
        makeAutoObservable(this);
    }
```

After:

```ts
    constructor() {
        makeAutoObservable<CheckboxGroupPresenter<TValue>, "params" | "items">(this, {
            params: observableRef,
            items: observableRef
        });
    }
```

Modify `packages/admin-ui/src/RadioGroup/primitives/RadioGroupPrimitive.tsx` (`RadioGroupRenderer` forwards the two aria props; the primitive passes `{...props}` to the renderer already, so nothing else changes). Before:

```tsx
const RadioGroupRenderer = ({ items, changeValue, value, disabled }: RadioGroupRendererProps) => {
    return (
        <RadioGroupRoot
            value={value ?? ""}
            onValueChange={value => changeValue(value)}
            disabled={disabled}
        >
```

After:

```tsx
const RadioGroupRenderer = ({
    items,
    changeValue,
    value,
    disabled,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy
}: RadioGroupRendererProps) => {
    return (
        <RadioGroupRoot
            value={value ?? ""}
            onValueChange={value => changeValue(value)}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
        >
```

- [ ] **Step 4: Run the new tests and expect pass**

```bash
yarn test packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.jsxLabel.test.ts 2>&1 | tail -15
```

```bash
yarn test packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.jsxLabel.test.ts 2>&1 | tail -15
```

```bash
yarn test packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.jsxLabel.test.ts 2>&1 | tail -15
```

Expected: PASS for all three (3 + 3 + 3 tests).

- [ ] **Step 5: Run the existing tests covering the changed code and build**

```bash
yarn test packages/admin-ui/src/RadioGroup/primitives/presenters/RadioGroupPresenter.test.ts 2>&1 | tail -15
```

```bash
yarn test packages/admin-ui/src/Checkbox/primitives/presenters/CheckboxPresenter.test.ts 2>&1 | tail -15
```

```bash
yarn test packages/admin-ui/src/CheckboxGroup/primitives/presenters/CheckboxGroupPresenter.test.ts 2>&1 | tail -15
```

```bash
yarn build -p @webiny/admin-ui --no-cache 2>&1 | tail -30
```

Expected: the three existing presenter tests pass unchanged (they assert the formatted `vm` and the callbacks, which did not change); the build is clean (it type-checks the generic `makeAutoObservable<..., "params" | "item">` calls). The build also refreshes `dist`, which `app-workflows` resolves `@webiny/admin-ui` from, so run it before commit 2.

- [ ] **Step 6: Pre-commit chain and commit 1**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/admin-ui --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "fix(admin-ui): hold group items by reference so a React label does not overflow the stack" -m "RadioGroup, CheckboxGroup and Checkbox presenters deep-observed their params, and a React element label created in a render points at its owner fiber, a cycle, so mobx recursed until the stack overflowed. The presenters now keep params, item and items by reference. RadioGroup also forwards aria-label and aria-labelledby to its root so a group can be named." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Commit 2: `refactor(app-workflows)`

- [ ] **Step 7: Confirm the existing renderer tests are the spec and currently pass**

No test is written or edited in this commit. The six test files below render JSX labels through the real groups; they are the unchanged behaviour spec. Run them before editing (the current workaround code must be green):

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx 2>&1 | tail -15
```

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx 2>&1 | tail -15
```

Expected: PASS (8 and 11 tests).

- [ ] **Step 8: Switch the two renderers back**

Modify `packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.tsx`. Imports, before:

```tsx
import { DeprecatedRadioGroup } from "@webiny/admin-ui";
import { Radio } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
```

After:

```tsx
import { RadioGroup } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
```

The list, before:

```tsx
                {automations.options.length > 0 && (
                    <DeprecatedRadioGroup
                        aria-labelledby={labelId}
                        value={value ?? ""}
                        disabled={field.disabled}
                        onValueChange={id => automations.select(id)}
                    >
                        {automations.options.map(option => (
                            <Radio
                                key={option.id}
                                id={`${field.name}-${option.id}`}
                                value={option.id}
                                label={
                                    <span className={"flex flex-col"}>
                                        <span className={"font-semibold"}>{option.name}</span>
                                        {option.description && (
                                            <span className={"text-sm"}>{option.description}</span>
                                        )}
                                    </span>
                                }
                            />
                        ))}
                    </DeprecatedRadioGroup>
                )}
```

After:

```tsx
                {automations.options.length > 0 && (
                    <RadioGroup
                        aria-labelledby={labelId}
                        value={value ?? ""}
                        disabled={field.disabled}
                        items={automations.options.map(option => ({
                            id: `${field.name}-${option.id}`,
                            value: option.id,
                            label: (
                                <span className={"flex flex-col"}>
                                    <span className={"font-semibold"}>{option.name}</span>
                                    {option.description && (
                                        <span className={"text-sm"}>{option.description}</span>
                                    )}
                                </span>
                            )
                        }))}
                        onChange={id => automations.select(id)}
                    />
                )}
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.tsx`. Import, before:

```tsx
import { CheckboxPrimitiveRenderer } from "@webiny/admin-ui";
```

After:

```tsx
import { CheckboxGroup } from "@webiny/admin-ui";
```

The component comment, before:

```tsx
 * on `config.tools` shows under the list through the field's validation. The rows use the
 * presenter-less `CheckboxPrimitiveRenderer`: the admin-ui `Checkbox` and `CheckboxGroup`
 * deep-observe a JSX label and overflow the stack.
 */
```

After:

```tsx
 * on `config.tools` shows under the list through the field's validation. The rows use the stock
 * `CheckboxGroup`.
 */
```

The toggle handler, before:

```tsx
    const onToggle = (name: string, checked: boolean) => {
        const next = ticked.filter(item => item !== name);
        if (checked) {
            next.push(name);
        }
        field.onChange([...kept, ...next]);
        field.onBlur();
    };
```

After:

```tsx
    const onChange = (values: string[]) => {
        field.onChange([...kept, ...values]);
        field.onBlur();
    };
```

The rows, before:

```tsx
            {aiTools.options.map(option => {
                return (
                    <CheckboxPrimitiveRenderer
                        key={option.name}
                        id={`ai-tool-${option.name}`}
                        value={option.name}
                        hasLabel={true}
                        indeterminate={false}
                        disabled={field.disabled}
                        checked={ticked.includes(option.name)}
                        changeChecked={checked => onToggle(option.name, checked)}
                        label={
                            <span className={"flex flex-col gap-xs"}>
                                <span className={"flex items-center gap-sm"}>
                                    <span>{option.title}</span>
                                    {option.changesContent && (
                                        <Tag
                                            variant={"neutral-light"}
                                            content={AI_FORM_MESSAGES.changesContentTag}
                                            icon={<EditNoteIcon />}
                                        />
                                    )}
                                </span>
                                <span className={"text-sm"}>{option.description}</span>
                            </span>
                        }
                    />
                );
            })}
```

After:

```tsx
            <CheckboxGroup
                disabled={field.disabled}
                value={ticked}
                onChange={onChange}
                items={aiTools.options.map(option => ({
                    id: `ai-tool-${option.name}`,
                    value: option.name,
                    label: (
                        <span className={"flex flex-col gap-xs"}>
                            <span className={"flex items-center gap-sm"}>
                                <span>{option.title}</span>
                                {option.changesContent && (
                                    <Tag
                                        variant={"neutral-light"}
                                        content={AI_FORM_MESSAGES.changesContentTag}
                                        icon={<EditNoteIcon />}
                                    />
                                )}
                            </span>
                            <span className={"text-sm"}>{option.description}</span>
                        </span>
                    )
                }))}
            />
```

`ticked` and `kept` keep their current definitions (`ticked` lists the stored names the list offers; `kept` lists the stored names it does not).

- [ ] **Step 9: Run the renderer tests, the whole renderer folder and build**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AutomationCardsRenderer.test.tsx 2>&1 | tail -15
```

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiToolsRenderer.test.tsx 2>&1 | tail -15
```

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TransportCheckboxesRenderer.test.tsx 2>&1 | tail -15
```

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all PASS with no test edited (Automation: label and stored selection, group named by the `Automation` label, select without changing the field, empty and loading and failed states, warnings, server error; AI tools: titles, descriptions and `aria-checked`, the single `Changes content` tag, the hint and the group's `aria-describedby`, read-only disables every checkbox and ignores a click, tick keeps `gone`, untick removes only the clicked tool, stored unknown name never shown, server error shown); the build is clean. If the `names the radio group by the Automation label` case fails, commit 1 is not built into `dist`: rerun `yarn build -p @webiny/admin-ui --no-cache`.

- [ ] **Step 10: Pre-commit chain and commit 2**

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
git commit -m "refactor(app-workflows): use the stock RadioGroup and CheckboxGroup in the automation and AI tools forms" -m "The admin-ui groups accept a React label again, so the automation cards go back from DeprecatedRadioGroup to RadioGroup and the AI tools rows from per-item CheckboxPrimitiveRenderer to CheckboxGroup. Rendering, accessible names and the stored-value behaviour are unchanged." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`observableRef`, not `observable.ref`.** The contract says "`observable.ref` / annotation overrides"; in the installed mobx 7.0.3 `observable.ref` is `undefined` and `makeAutoObservable` throws `Invalid annotation`. The annotation is the named export `observableRef` (as `ReviewerPickerPresenter` already does).
- **Item domains do not change.** The contract allows touching `domains/` "if they need it"; they do not (class instances are not converted by mobx and keep the label as given).
- **`RadioGroupPrimitive.tsx` is added to commit 1's files.** The contract lists only the three presenters, but the stock `RadioGroup` drops `aria-labelledby`, so `AutomationCardsRenderer`'s test `names the radio group by the Automation label` cannot keep passing after the switch-back without forwarding it. Verified: with the presenters fixed and the renderer switched but `RadioGroupRenderer` unchanged, exactly that one test fails (7 of 8 pass). Only `aria-label` and `aria-labelledby` are forwarded.
- **Tests are presenter-level.** `admin-ui` has no DOM test dependency (no `@testing-library/react`, and `renderToStaticMarkup` fails on the decoratable components' `useSyncExternalStore`), so the "JSX label renders" case is a presenter test with a render-shaped cyclic element; it fails with `Maximum call stack size exceeded` without the fix (verified). The end-to-end render of a JSX label through the real groups is covered by the unchanged `AutomationCardsRenderer` and `AiToolsRenderer` tests of commit 2.
- **`AutomationCardsRenderer` keeps its own label and error message** and passes the stock `RadioGroup` no `label` / `validation`, so nothing is rendered twice and the 9a markup order (label, list, error, warnings) is unchanged.
- **Verified end to end before writing this plan:** the fix, the aria forwarding and both renderer rewrites were applied in the working tree and all 48 tests of the six renderer files passed; all changes were then reverted so the tree is clean for the implementer.

## Review fixes (sub-phase review)

None needed. Checked against the repo: the three presenter files, their `makeAutoObservable(this)` constructors, the private `params` / `item` / `items` fields, `RadioGroupRenderer`'s current text, the `AutomationCardsRenderer` and `AiToolsRenderer` hunks (before text matches the current files), the existing `*.test.ts` presenter test files, the `RadioGroup` / `CheckboxGroup` exports, and the commit trailers.
