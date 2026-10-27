### Task 4: Shared Picker

R282, R268 (the `memberCount` warning source), R275 (AI models), R270 (teams); D66; A100; design `Picker.dc.html`, README section 9 (UI-3), `answers.md` (Picker rules), `.superpowers/sdd/p9a-plan/research2-admin.md` section 6, `contract-review-1.md` I6 and its "Picker" strings. Every Global Constraint of 8a, 8b and 9a applies; the admin code style binds every new file (one exported function per file, one named import per line, no nested call arguments, no multiline ternaries, comments end with a period).

The editor needs a searchable picker for teams (People step, Task 11) and AI models (Task 13), later users and folders (9b). The review UI's `ReviewerPicker` is single-select and reviewer-specific, so this task builds the shared one over the admin-ui `AutoComplete` and `MultiAutoComplete`: the parent owns the data (it searches the server, debounced by its presenter) and passes the current results; the picker owns only how they look. Nothing here knows teams or models.

- **Props (R282):** `WorkflowPicker` takes `{ value, selected, options, onSearch, onChange, placeholder, disabled, error, label }`; `WorkflowMultiPicker` takes `{ values, selected, options, onSearch, onChange, placeholder, disabled, error, label }`. `options` are the search results; `selected` are the chosen items with their labels, so the input or a chip keeps its label when a search narrows the list. `label` is required on both (Contract notes); both also take the optional `description` and `required`.
- **At most 50 options** are shown (`limitPickerOptions`, UI-3); when the results were cut, a last disabled line reads `More matches. Keep typing to narrow the list.` and stays while the user types.
- **Empty search:** with text typed and no result the list says `Nothing matches “{q}”.` (typographic quotes); with no text typed it says `No results.`, the admin-ui default text, given explicitly because the admin-ui list keeps the last message it was given when the prop turns `undefined`.
- **Unknown item:** a chosen id that is neither in `selected` nor in `options` shows as `Unknown item` with the warning `This item no longer exists.` (a chip with a warning icon and the text as its title in the multi picker; the text under the input in the single picker).
- **Warnings:** a per-option `warning` (teams with `memberCount` 0 carry `This team has no members`) is rendered through `optionRenderer` from the option's `item` in the list, and through `selectedOptionRenderer` on the chip (warning variant, warning icon, the text as the chip's title). `AutoCompletePrimitive` has no `selectedOptionRenderer` (A100), so the single picker shows the chosen item's warning as a line under the input.
- **Rows:** the label, the optional `description` as a smaller sub line, the optional warning with a warning icon.
- **No duplicates:** the multi picker passes `uniqueValues` (a chosen item is not offered again) and `handleChange` de-duplicates the ids it reports. A disabled multi picker's chips cannot be dismissed (`PickerChip` passes `disabled` to `Tag`). An `Unknown item` row is listed disabled, so the dead id cannot be picked again.
- **Selection:** the single picker calls `onChange(id)`, and `onChange(null)` when the input is cleared; the multi picker calls `onChange(ids)` with the new list for a pick and for a chip's dismiss button. `error` shows under the input as the field error; `disabled` disables the input.
- **The admin-ui multi picker never removes a chip or updates a chip's label when its props change** (it only adds), and the single one keeps the label it first showed. `usePickerRemountKey` (multi) and a key built from the chosen item (single) remount the admin-ui component when a chosen item was removed or its label or warning changed, so chips drop and an `Unknown item` chip becomes the real label once the parent resolves it; a pure addition keeps the component, so after a first pick in the single picker (nothing to one item) the same input element stays and focus is kept (a test pins it); replacing a chosen item with another remounts it.
- **The admin-ui list filters its items itself by the typed text** (cmdk), so the `More matches` line is given a value ending with the query, which keeps it visible while typing (proved by a test that fails with a constant value).

**Files:**
- Create: `packages/app-workflows/src/components/picker/PickerOption.ts`
- Create: `packages/app-workflows/src/components/picker/pickerTexts.ts`
- Create: `packages/app-workflows/src/components/picker/limitPickerOptions.ts`
- Create: `packages/app-workflows/src/components/picker/resolvePickerSelection.ts`
- Create: `packages/app-workflows/src/components/picker/getPickerEmptyMessage.ts`
- Create: `packages/app-workflows/src/components/picker/toPickerCommandOptions.ts`
- Create: `packages/app-workflows/src/components/picker/toPickerChosenEntry.ts`
- Create: `packages/app-workflows/src/components/picker/usePickerRemountKey.ts`
- Create: `packages/app-workflows/src/components/picker/renderPickerOption.tsx`
- Create: `packages/app-workflows/src/components/picker/PickerChip.tsx`
- Create: `packages/app-workflows/src/components/picker/WorkflowPicker.tsx`
- Create: `packages/app-workflows/src/components/picker/WorkflowMultiPicker.tsx`
- Create: `packages/app-workflows/src/components/picker/limitPickerOptions.test.ts`
- Create: `packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts`
- Create: `packages/app-workflows/src/components/picker/getPickerEmptyMessage.test.ts`
- Create: `packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts`
- Create: `packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts`
- Create: `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`
- Create: `packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx`

**Interfaces:**
- Consumes: `@webiny/admin-ui` `AutoComplete`, `MultiAutoComplete`, `Tag`, `Text`, `Icon`, `AdminUiProvider` (`packages/admin-ui/src/AutoComplete/AutoComplete.tsx`, `packages/admin-ui/src/MultiAutoComplete/MultiAutoComplete.tsx`; props `options`, `value`/`values`, `onValueChange`/`onValuesChange`, `onValueSearch`, `optionRenderer`, `selectedOptionRenderer` (multi only), `emptyMessage`, `initialMessage`, `validation`, `label`, `description`, `required`, `disabled`, `placeholder`), `@webiny/icons/warning.svg` (aliased to `__tests__/setup/svgStub.tsx` by `vitest.config.ts`), `renderWithAdminUi` (`packages/app-workflows/src/review/testing/renderWithAdminUi.tsx`), `@testing-library/react` (already a devDependency), the jsdom setup `packages/app-workflows/__tests__/setup/setupDom.ts` (`ResizeObserver` and `scrollIntoView` stubs cmdk and Radix need).
- Produces (R282): `PickerOption { id: string; label: string; description: string | null; warning: string | null }`; `WorkflowPicker` props `{ value: string | null; selected: PickerOption | null; options: PickerOption[]; onSearch(search: string): void; onChange(id: string | null): void; placeholder: string; disabled: boolean; error: string | null; label: string }` (plus the optional `description`, `required`); `WorkflowMultiPicker` props `{ values: string[]; selected: PickerOption[]; options: PickerOption[]; onSearch(search: string): void; onChange(ids: string[]): void; placeholder: string; disabled: boolean; error: string | null; label: string }` (plus the same optionals); `limitPickerOptions(options: PickerOption[]): LimitedPickerOptions` with `LimitedPickerOptions { options: PickerOption[]; hasMore: boolean }` and the cap `PICKER_OPTION_LIMIT` = 50. Tasks 11 and 13 import them by deep path (`~/components/picker/WorkflowPicker.js` inside `app-workflows`); nothing is added to `[AW]/index.tsx`.

**Test runner note:** admin package, `yarn test <path>` only. `.tsx` tests import `React` and render through `renderWithAdminUi` (admin-ui form components need `AdminUiProvider`; a `rerender` must wrap again in `AdminUiProvider`). Co-located tests import `~/review/testing/renderWithAdminUi.js` (R243); no test imports from `__tests__/`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/components/picker/limitPickerOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { PickerOption } from "./PickerOption.js";
import { limitPickerOptions } from "./limitPickerOptions.js";

const createOptions = (count: number): PickerOption[] => {
    return Array.from({ length: count }, (_, index) => {
        return { id: `id-${index}`, label: `Item ${index}`, description: null, warning: null };
    });
};

describe("limitPickerOptions", () => {
    it("returns an empty list as it is", () => {
        expect(limitPickerOptions([])).toEqual({ options: [], hasMore: false });
    });

    it("returns 50 options or fewer as they are", () => {
        const options = createOptions(50);

        const limited = limitPickerOptions(options);

        expect(limited.options).toHaveLength(50);
        expect(limited.hasMore).toBe(false);
    });

    it("cuts more than 50 options to the first 50 and says there are more", () => {
        const options = createOptions(51);

        const limited = limitPickerOptions(options);

        expect(limited.options).toHaveLength(50);
        expect(limited.options[0].id).toBe("id-0");
        expect(limited.options[49].id).toBe("id-49");
        expect(limited.hasMore).toBe(true);
    });
});
```

Create `packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { PickerOption } from "./PickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";

const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
const press: PickerOption = {
    id: "t2",
    label: "Press",
    description: "3 members",
    warning: "This team has no members"
};

describe("resolvePickerSelection", () => {
    it("returns nothing for no ids", () => {
        expect(resolvePickerSelection([], [legal], [press])).toEqual([]);
    });

    it("prefers the selected item over the search result with the same id", () => {
        const renamed: PickerOption = { ...legal, label: "Legal team" };

        const chosen = resolvePickerSelection(["t1"], [legal], [renamed]);

        expect(chosen).toEqual([legal]);
    });

    it("falls back to the search result", () => {
        expect(resolvePickerSelection(["t2"], [legal], [press])).toEqual([press]);
    });

    it("returns an unknown item for an id nobody knows", () => {
        expect(resolvePickerSelection(["t9"], [legal], [press])).toEqual([
            {
                id: "t9",
                label: "Unknown item",
                description: null,
                warning: "This item no longer exists."
            }
        ]);
    });

    it("keeps the order of the ids", () => {
        const chosen = resolvePickerSelection(["t2", "t9", "t1"], [legal], [press]);

        expect(chosen.map(option => option.id)).toEqual(["t2", "t9", "t1"]);
    });
});
```

Create `packages/app-workflows/src/components/picker/getPickerEmptyMessage.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";

describe("getPickerEmptyMessage", () => {
    it("names the search text", () => {
        expect(getPickerEmptyMessage("leg")).toBe("Nothing matches “leg”.");
    });

    it("gives the library's own text when nothing was typed", () => {
        expect(getPickerEmptyMessage("")).toBe("No results.");
    });
});
```

Create `packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { PickerOption } from "./PickerOption.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";

const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
const press: PickerOption = { id: "t2", label: "Press", description: null, warning: null };
const sales: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };

describe("toPickerCommandOptions", () => {
    it("lists the search results with their option as the item", () => {
        const commandOptions = toPickerCommandOptions([], [legal, press], false, "");

        expect(commandOptions).toEqual([
            { label: "Legal", value: "t1", disabled: false, item: legal },
            { label: "Press", value: "t2", disabled: false, item: press }
        ]);
    });

    it("puts a chosen item the search does not contain first", () => {
        const commandOptions = toPickerCommandOptions([sales], [legal, press], false, "");

        expect(commandOptions.map(option => option.value)).toEqual(["t3", "t1", "t2"]);
    });

    it("does not repeat a chosen item the search contains", () => {
        const commandOptions = toPickerCommandOptions([press], [legal, press], false, "");

        expect(commandOptions.map(option => option.value)).toEqual(["t1", "t2"]);
    });

    it("lists an unknown item as disabled so it cannot be picked again", () => {
        const unknown: PickerOption = {
            id: "t9",
            label: "Unknown item",
            description: null,
            warning: "This item no longer exists."
        };

        const commandOptions = toPickerCommandOptions([unknown], [legal], false, "");

        expect(commandOptions[0].disabled).toBe(true);
        expect(commandOptions[1].disabled).toBe(false);
    });

    it("adds a disabled hint line when the search was cut", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le");

        expect(commandOptions).toHaveLength(2);
        expect(commandOptions[1].label).toBe("More matches. Keep typing to narrow the list.");
        expect(commandOptions[1].disabled).toBe(true);
        expect(commandOptions[1].item).toBeUndefined();
    });

    it("ends the hint's value with the query so the list's own filter keeps it", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le");

        expect(commandOptions[1].value.endsWith("le")).toBe(true);
    });

    it("adds no hint line when the search was not cut", () => {
        const commandOptions = toPickerCommandOptions([], [legal], false, "le");

        expect(commandOptions).toHaveLength(1);
    });
});
```

Create `packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { PickerOption } from "./PickerOption.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";

const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
const press: PickerOption = { id: "t2", label: "Press", description: null, warning: null };

describe("usePickerRemountKey", () => {
    it("keeps the key while the chosen items stay the same", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal }] });

        expect(result.current).toBe(first);
    });

    it("keeps the key when an item is added", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [legal, press] });

        expect(result.current).toBe(first);
    });

    it("changes the key when an item is removed", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal, press] }
        });
        const first = result.current;

        rerender({ chosen: [press] });

        expect(result.current).not.toBe(first);
    });

    it("changes the key when an item's label changes", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal, label: "Legal team" }] });

        expect(result.current).not.toBe(first);
    });

    it("changes the key when an item's warning changes", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal, warning: "This team has no members" }] });

        expect(result.current).not.toBe(first);
    });
});
```

Create `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { WorkflowPicker } from "./WorkflowPicker.js";
import type { WorkflowPickerProps } from "./WorkflowPicker.js";
import type { PickerOption } from "./PickerOption.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";

const LEGAL: PickerOption = { id: "t1", label: "Legal", description: "4 members", warning: null };
const PRESS: PickerOption = {
    id: "t2",
    label: "Press",
    description: "0 members",
    warning: "This team has no members"
};
const SALES: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };

const createProps = (overrides: Partial<WorkflowPickerProps> = {}): WorkflowPickerProps => {
    return {
        value: null,
        selected: null,
        options: [LEGAL, PRESS, SALES],
        onSearch: vi.fn(),
        onChange: vi.fn(),
        placeholder: "Search teams",
        disabled: false,
        error: null,
        label: "Team",
        ...overrides
    };
};

const openList = () => {
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    return input;
};

describe("WorkflowPicker", () => {
    it("renders the label, the description and the placeholder", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ description: "Pick one." })} />);

        expect(screen.getAllByText("Team").length).toBeGreaterThan(0);
        expect(screen.getByText("Pick one.")).toBeTruthy();
        expect(screen.getByPlaceholderText("Search teams")).toBeTruthy();
    });

    it("lists the options with the label, the sub line and the warning", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();

        expect(await screen.findByText("Legal")).toBeTruthy();
        expect(screen.getByText("4 members")).toBeTruthy();
        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("calls onChange with the id of the picked option", async () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith("t3");
    });

    it("calls onSearch with the typed text", () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "leg" } });

        expect(props.onSearch).toHaveBeenCalledWith("leg");
    });

    it("shows the selected item's label although the search results do not contain it", () => {
        const finance: PickerOption = {
            id: "t9",
            label: "Finance",
            description: null,
            warning: null
        };
        const props = createProps({ value: "t9", selected: finance, options: [LEGAL] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Finance");
    });

    it("keeps the same input element after a pick, so focus stays", async () => {
        const Controlled = () => {
            const [value, setValue] = useState<string | null>(null);
            return <WorkflowPicker {...createProps({ value, onChange: setValue })} />;
        };
        renderWithAdminUi(<Controlled />);

        const input = openList();
        fireEvent.click(await screen.findByText("Sales"));

        const after: HTMLInputElement = screen.getByRole("combobox");
        expect(after).toBe(input);
        expect(after.value).toBe("Sales");
    });

    it("shows the label of the search result when no selected item is given", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t1" })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Legal");
    });

    it("shows an id nobody knows as Unknown item with its warning under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t9", options: [LEGAL] })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Unknown item");
        expect(screen.getByText("This item no longer exists.")).toBeTruthy();
    });

    it("shows the warning of the selected item under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t2", selected: PRESS })} />);

        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("updates the input when the selected item's label arrives later", () => {
        const { rerender } = renderWithAdminUi(
            <WorkflowPicker {...createProps({ value: "t9", options: [] })} />
        );
        const first: HTMLInputElement = screen.getByRole("combobox");
        expect(first.value).toBe("Unknown item");

        const resolved: PickerOption = {
            id: "t9",
            label: "Finance",
            description: null,
            warning: null
        };
        rerender(
            <AdminUiProvider>
                <WorkflowPicker
                    {...createProps({ value: "t9", selected: resolved, options: [] })}
                />
            </AdminUiProvider>
        );

        const second: HTMLInputElement = screen.getByRole("combobox");
        expect(second.value).toBe("Finance");
        expect(screen.queryByText("This item no longer exists.")).toBeNull();
    });

    it("shows at most 50 options and the More matches line", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);

        openList();

        expect(await screen.findByText("Team 0")).toBeTruthy();
        expect(screen.getByText("Team 49")).toBeTruthy();
        expect(screen.queryByText("Team 50")).toBeNull();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("keeps the More matches line while the user types", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Team 1" } });

        expect(await screen.findByText("Team 10")).toBeTruthy();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("shows no More matches line for 50 options or fewer", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();
        await screen.findByText("Legal");

        expect(screen.queryByText("More matches. Keep typing to narrow the list.")).toBeNull();
    });

    it("says nothing matches the search when the list is empty", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });

        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
    });

    it("forgets the search text when the list closes", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });
        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();

        fireEvent.keyDown(input, { key: "Escape" });
        fireEvent.keyDown(input, { key: "ArrowDown" });

        expect(screen.queryByText("Nothing matches “zzz”.")).toBeNull();
    });

    it("shows the error under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ error: "Choose an AI model." })} />);

        expect(screen.getByText("Choose an AI model.")).toBeTruthy();
    });

    it("disables the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ disabled: true })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.disabled).toBe(true);
    });
});
```

Create `packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { WorkflowMultiPicker } from "./WorkflowMultiPicker.js";
import type { WorkflowMultiPickerProps } from "./WorkflowMultiPicker.js";
import type { PickerOption } from "./PickerOption.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";

const LEGAL: PickerOption = { id: "t1", label: "Legal", description: "4 members", warning: null };
const PRESS: PickerOption = {
    id: "t2",
    label: "Press",
    description: "0 members",
    warning: "This team has no members"
};
const SALES: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };

const createProps = (
    overrides: Partial<WorkflowMultiPickerProps> = {}
): WorkflowMultiPickerProps => {
    return {
        values: [],
        selected: [],
        options: [LEGAL, PRESS, SALES],
        onSearch: vi.fn(),
        onChange: vi.fn(),
        placeholder: "Search teams",
        disabled: false,
        error: null,
        label: "Reviewing teams",
        ...overrides
    };
};

// A parent that owns the chosen ids and the chosen items, like a field renderer does.
const ControlledPicker = (props: { initial: string[]; options: PickerOption[] }) => {
    const [values, setValues] = useState(props.initial);
    const selected = props.options.filter(option => values.includes(option.id));
    return (
        <WorkflowMultiPicker
            {...createProps({ options: props.options })}
            values={values}
            selected={selected}
            onChange={setValues}
        />
    );
};

const openList = () => {
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    return input;
};

describe("WorkflowMultiPicker", () => {
    it("renders the label, the description and the placeholder", () => {
        renderWithAdminUi(
            <WorkflowMultiPicker {...createProps({ description: "Members can review." })} />
        );

        expect(screen.getAllByText("Reviewing teams").length).toBeGreaterThan(0);
        expect(screen.getByText("Members can review.")).toBeTruthy();
        expect(screen.getByPlaceholderText("Search teams")).toBeTruthy();
    });

    it("shows a chip with the label for each selected item", () => {
        const props = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES], options: [] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        expect(screen.getByText("Legal")).toBeTruthy();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("keeps the chips when the search results do not contain the selected items", () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL], options: [SALES] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        expect(screen.getByText("Legal")).toBeTruthy();
    });

    it("shows an id nobody knows as an Unknown item chip with its warning", () => {
        const props = createProps({ values: ["t9"], selected: [], options: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        const chip = screen.getByText("Unknown item");

        expect(chip.closest("[title]")?.getAttribute("title")).toBe("This item no longer exists.");
    });

    it("shows the warning of a selected item on its chip", () => {
        const props = createProps({ values: ["t2"], selected: [PRESS], options: [] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        const chip = screen.getByText("Press");

        expect(chip.closest("[title]")?.getAttribute("title")).toBe("This team has no members");
    });

    it("lists the options with the label, the sub line and the warning", async () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps()} />);

        openList();

        expect(await screen.findByText("Legal")).toBeTruthy();
        expect(screen.getByText("4 members")).toBeTruthy();
        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("calls onChange with the ids including the picked option", async () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith(["t1", "t3"]);
    });

    it("calls onSearch with the typed text", () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "leg" } });

        expect(props.onSearch).toHaveBeenCalledWith("leg");
    });

    it("removes a chip through its dismiss button", () => {
        renderWithAdminUi(<ControlledPicker initial={["t1", "t3"]} options={[LEGAL, SALES]} />);

        const dismiss = screen.getAllByRole("button", { name: "Close" });
        fireEvent.click(dismiss[0]);

        expect(screen.queryByText("Legal")).toBeNull();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("calls onChange without the removed id", () => {
        const props = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);

        expect(props.onChange).toHaveBeenCalledWith(["t3"]);
    });

    it("drops a chip when the values change from outside", () => {
        const first = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES] });
        const { rerender } = renderWithAdminUi(<WorkflowMultiPicker {...first} />);
        expect(screen.getByText("Legal")).toBeTruthy();

        const second = createProps({ values: ["t3"], selected: [SALES] });
        rerender(
            <AdminUiProvider>
                <WorkflowMultiPicker {...second} />
            </AdminUiProvider>
        );

        expect(screen.queryByText("Legal")).toBeNull();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("updates a chip when the selected item's label arrives later", () => {
        const first = createProps({ values: ["t9"], selected: [], options: [] });
        const { rerender } = renderWithAdminUi(<WorkflowMultiPicker {...first} />);
        expect(screen.getByText("Unknown item")).toBeTruthy();

        const finance: PickerOption = {
            id: "t9",
            label: "Finance",
            description: null,
            warning: null
        };
        const second = createProps({ values: ["t9"], selected: [finance], options: [] });
        rerender(
            <AdminUiProvider>
                <WorkflowMultiPicker {...second} />
            </AdminUiProvider>
        );

        expect(screen.queryByText("Unknown item")).toBeNull();
        expect(screen.getByText("Finance")).toBeTruthy();
    });

    it("adds a chip for a picked option", async () => {
        renderWithAdminUi(<ControlledPicker initial={["t1"]} options={[LEGAL, SALES]} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(screen.getAllByText("Sales").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Legal").length).toBeGreaterThan(0);
    });

    it("does not offer an item that is already chosen, so no duplicate can be picked", async () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        await screen.findByText("Sales");

        expect(screen.getAllByText("Legal")).toHaveLength(1);
    });

    it("never reports an id twice", async () => {
        const props = createProps({ values: ["t1", "t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith(["t1", "t3"]);
    });

    it("keeps the More matches line while the user types", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
        });
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Team 1" } });

        expect(await screen.findByText("Team 10")).toBeTruthy();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("does not remove a chip of a disabled picker", () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL], disabled: true });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("shows at most 50 options and the More matches line", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
        });
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);

        openList();

        expect(await screen.findByText("Team 0")).toBeTruthy();
        expect(screen.getByText("Team 49")).toBeTruthy();
        expect(screen.queryByText("Team 50")).toBeNull();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("says nothing matches the search when the list is empty", async () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });

        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
    });

    it("shows the error under the input", () => {
        renderWithAdminUi(
            <WorkflowMultiPicker
                {...createProps({ error: "Choose at least one reviewing team." })}
            />
        );

        expect(screen.getByText("Choose at least one reviewing team.")).toBeTruthy();
    });

    it("disables the input", () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ disabled: true })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.disabled).toBe(true);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/components/picker/limitPickerOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/getPickerEmptyMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx 2>&1 | tail -30
```

Expected: every file fails with `Failed to resolve import` for its module (`./limitPickerOptions.js`, `./resolvePickerSelection.js`, `./getPickerEmptyMessage.js`, `./toPickerCommandOptions.js`, `./usePickerRemountKey.js`, `./WorkflowPicker.js`, `./WorkflowMultiPicker.js`); no test runs. Record the RED output.

- [ ] **Step 3: Implement**

Create the files in this order (each depends on the ones above it).

Create `packages/app-workflows/src/components/picker/PickerOption.ts`:

```ts
export interface PickerOption {
    id: string;
    label: string;
    description: string | null;
    warning: string | null;
}
```

Create `packages/app-workflows/src/components/picker/pickerTexts.ts`:

```ts
export const PICKER_MORE_MATCHES_TEXT = "More matches. Keep typing to narrow the list.";

export const PICKER_UNKNOWN_ITEM_LABEL = "Unknown item";

export const PICKER_UNKNOWN_ITEM_WARNING = "This item no longer exists.";
```

Create `packages/app-workflows/src/components/picker/limitPickerOptions.ts`:

```ts
import type { PickerOption } from "./PickerOption.js";

export const PICKER_OPTION_LIMIT = 50;

export interface LimitedPickerOptions {
    options: PickerOption[];
    hasMore: boolean;
}

// At most 50 options are visible (design UI-3); `hasMore` says some were cut.
export const limitPickerOptions = (options: PickerOption[]): LimitedPickerOptions => {
    if (options.length <= PICKER_OPTION_LIMIT) {
        return { options, hasMore: false };
    }
    return { options: options.slice(0, PICKER_OPTION_LIMIT), hasMore: true };
};
```

Create `packages/app-workflows/src/components/picker/resolvePickerSelection.ts`:

```ts
import type { PickerOption } from "./PickerOption.js";
import { PICKER_UNKNOWN_ITEM_LABEL } from "./pickerTexts.js";
import { PICKER_UNKNOWN_ITEM_WARNING } from "./pickerTexts.js";

/*
 * The option of every chosen id, in order: the `selected` item with that id (it keeps its label
 * when a search narrows the list), else the search result with that id, else an unknown item.
 */
export const resolvePickerSelection = (
    ids: string[],
    selected: PickerOption[],
    options: PickerOption[]
): PickerOption[] => {
    return ids.map(id => {
        const known = selected.find(option => option.id === id);
        if (known) {
            return known;
        }
        const found = options.find(option => option.id === id);
        if (found) {
            return found;
        }
        return {
            id,
            label: PICKER_UNKNOWN_ITEM_LABEL,
            description: null,
            warning: PICKER_UNKNOWN_ITEM_WARNING
        };
    });
};
```

Create `packages/app-workflows/src/components/picker/getPickerEmptyMessage.ts`:

```ts
/*
 * The admin-ui list keeps the last empty message it was given when a prop turns `undefined`, so
 * with no search text this returns the library's own default text ("No results.") explicitly.
 */
export const getPickerEmptyMessage = (query: string): string => {
    if (query === "") {
        return "No results.";
    }
    return `Nothing matches “${query}”.`;
};
```

Create `packages/app-workflows/src/components/picker/toPickerCommandOptions.ts`:

```ts
import type { PickerOption } from "./PickerOption.js";
import { PICKER_MORE_MATCHES_TEXT } from "./pickerTexts.js";
import { PICKER_UNKNOWN_ITEM_WARNING } from "./pickerTexts.js";

export interface PickerCommandOption {
    label: string;
    value: string;
    disabled?: boolean;
    item?: PickerOption;
}

const MORE_MATCHES_VALUE_PREFIX = "picker-more-matches:";

// An unknown item is listed (so the input finds its label) but cannot be picked again.
const toCommandOption = (option: PickerOption): PickerCommandOption => {
    const disabled = option.warning === PICKER_UNKNOWN_ITEM_WARNING;
    return { label: option.label, value: option.id, disabled, item: option };
};

/*
 * The options the admin-ui list shows: the chosen items that the current search does not contain
 * first (so a chip or the input keeps its label), then the search results, then, when the search
 * was cut, a disabled line with the "More matches" hint. The list (cmdk 1.1.1) filters its items
 * by the typed text with a fuzzy score of `value` plus keywords, and a constant value scores 0 and
 * disappears while typing, so the hint's value ends with the query. This relies on cmdk's scoring;
 * a sturdier fix (`forceMount` or `shouldFilter` through admin-ui) is an admin-ui change.
 */
export const toPickerCommandOptions = (
    chosen: PickerOption[],
    shown: PickerOption[],
    hasMore: boolean,
    query: string
): PickerCommandOption[] => {
    const shownIds = new Set(shown.map(option => option.id));
    const missing = chosen.filter(option => !shownIds.has(option.id));
    const commandOptions = [...missing, ...shown].map(toCommandOption);

    if (hasMore) {
        const value = `${MORE_MATCHES_VALUE_PREFIX}${query}`;
        commandOptions.push({ label: PICKER_MORE_MATCHES_TEXT, value, disabled: true });
    }

    return commandOptions;
};
```

Create `packages/app-workflows/src/components/picker/toPickerChosenEntry.ts`:

```ts
import type { PickerOption } from "./PickerOption.js";

// What the admin-ui picker shows for a chosen item: its id, label and warning as one string.
export const toPickerChosenEntry = (option: PickerOption): string => {
    return JSON.stringify([option.id, option.label, option.warning]);
};
```

Create `packages/app-workflows/src/components/picker/usePickerRemountKey.ts`:

```ts
import { useState } from "react";
import type { PickerOption } from "./PickerOption.js";
import { toPickerChosenEntry } from "./toPickerChosenEntry.js";

/*
 * The admin-ui pickers keep its own chip list: it adds a chip for a new value, but never
 * removes a chip or updates a label when its props change. The key this hook returns changes when
 * a chosen item was removed or its label or warning changed, so the picker remounts and shows the
 * props again; a pure addition (the picker already added the chip itself) keeps the key.
 */
export const usePickerRemountKey = (chosen: PickerOption[]): number => {
    const entries = chosen.map(toPickerChosenEntry);
    const signature = entries.join(",");
    const [shown, setShown] = useState({ signature, entries, key: 0 });

    if (shown.signature !== signature) {
        const lost = shown.entries.some(entry => !entries.includes(entry));
        const key = lost ? shown.key + 1 : shown.key;
        setShown({ signature, entries, key });
        return key;
    }

    return shown.key;
};
```

Create `packages/app-workflows/src/components/picker/renderPickerOption.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";

// One option row of the list: the label, the sub line and the option's warning.
export const renderPickerOption = (option: PickerOption): React.ReactNode => {
    return (
        <div className={"flex flex-col gap-xxs whitespace-normal"}>
            <Text size={"md"}>{option.label}</Text>
            {option.description !== null && (
                <Text size={"sm"} className={"text-neutral-strong"}>
                    {option.description}
                </Text>
            )}
            {option.warning !== null && (
                <span className={"flex items-center gap-xs text-warning-xstrong"}>
                    <Icon
                        icon={<WarningIcon />}
                        label={"Warning"}
                        size={"sm"}
                        className={"fill-warning-xstrong"}
                    />
                    <Text size={"sm"}>{option.warning}</Text>
                </span>
            )}
        </div>
    );
};
```

Create `packages/app-workflows/src/components/picker/PickerChip.tsx`:

```tsx
import React from "react";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";

export interface PickerChipProps {
    option: PickerOption;
    disabled: boolean;
    onRemove(id: string): void;
}

// A chosen item of the multi picker; an option with a warning gets a warning icon and the text as title.
export const PickerChip = ({ option, disabled, onRemove }: PickerChipProps) => {
    if (option.warning === null) {
        return (
            <Tag
                variant={"neutral-muted"}
                content={option.label}
                disabled={disabled}
                onDismiss={() => onRemove(option.id)}
            />
        );
    }

    return (
        <Tag
            variant={"warning"}
            title={option.warning}
            icon={<WarningIcon />}
            content={option.label}
            disabled={disabled}
            onDismiss={() => onRemove(option.id)}
        />
    );
};
```

Create `packages/app-workflows/src/components/picker/WorkflowPicker.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import { renderPickerOption } from "./renderPickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";

export interface WorkflowPickerProps {
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    onSearch(search: string): void;
    onChange(id: string | null): void;
    placeholder: string;
    disabled: boolean;
    error: string | null;
    label: string;
    description?: string;
    required?: boolean;
}

/*
 * The shared searchable single picker (R282, UI-3) over admin-ui `AutoComplete`. `options` are the
 * search results (shown up to 50); `selected` is the chosen item with its label, so the input keeps
 * it when a search narrows the list. A chosen id nobody knows shows as "Unknown item". The chosen
 * item's warning shows under the input, because the single input has no renderer for it (A100).
 */
export const WorkflowPicker = (props: WorkflowPickerProps) => {
    const { value, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const ids = value === null ? [] : [value];
    const chosen = resolvePickerSelection(ids, selected ? [selected] : [], options);
    const commandOptions = toPickerCommandOptions(chosen, limited.options, limited.hasMore, query);
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };
    const warning = chosen.length > 0 ? chosen[0].warning : null;
    const remountKey = usePickerRemountKey(chosen);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setQuery("");
        }
    };

    const handleSearch = (search: string) => {
        setQuery(search);
        onSearch(search);
    };

    const handleChange = (id: string) => {
        setQuery("");
        onChange(id === "" ? null : id);
    };

    return (
        <div className={"w-full"}>
            <AutoComplete
                key={remountKey}
                label={props.label}
                description={props.description}
                required={props.required}
                placeholder={placeholder}
                disabled={disabled}
                options={commandOptions}
                value={value ?? undefined}
                emptyMessage={emptyMessage}
                initialMessage={emptyMessage}
                optionRenderer={renderPickerOption}
                validation={validation}
                onOpenChange={handleOpenChange}
                onValueSearch={handleSearch}
                onValueChange={handleChange}
            />
            {warning !== null && (
                <Text size={"sm"} className={"text-warning-xstrong"}>
                    {warning}
                </Text>
            )}
        </div>
    );
};
```

Create `packages/app-workflows/src/components/picker/WorkflowMultiPicker.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { PickerChip } from "./PickerChip.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import { renderPickerOption } from "./renderPickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";

export interface WorkflowMultiPickerProps {
    values: string[];
    selected: PickerOption[];
    options: PickerOption[];
    onSearch(search: string): void;
    onChange(ids: string[]): void;
    placeholder: string;
    disabled: boolean;
    error: string | null;
    label: string;
    description?: string;
    required?: boolean;
}

/*
 * The shared searchable multi picker (R282, UI-3) over admin-ui `MultiAutoComplete`. `options` are
 * the search results (shown up to 50); `selected` are the chosen items with their labels, so a chip
 * keeps its label when a search narrows the list. A chosen id nobody knows is a chip "Unknown item"
 * with a warning; an option with a warning shows it on its chip and in the list.
 */
export const WorkflowMultiPicker = (props: WorkflowMultiPickerProps) => {
    const { values, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const chosen = resolvePickerSelection(values, selected, options);
    const remountKey = usePickerRemountKey(chosen);
    const commandOptions = toPickerCommandOptions(chosen, limited.options, limited.hasMore, query);
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setQuery("");
        }
    };

    const handleSearch = (search: string) => {
        setQuery(search);
        onSearch(search);
    };

    const handleChange = (ids: string[]) => {
        setQuery("");
        onChange([...new Set(ids)]);
    };

    const handleRemove = (id: string) => {
        const remaining = values.filter(value => value !== id);
        handleChange(remaining);
    };

    const renderChip = (option: PickerOption) => {
        return (
            <PickerChip
                key={option.id}
                option={option}
                disabled={disabled}
                onRemove={handleRemove}
            />
        );
    };

    return (
        <MultiAutoComplete
            key={remountKey}
            uniqueValues
            label={props.label}
            description={props.description}
            required={props.required}
            placeholder={placeholder}
            disabled={disabled}
            options={commandOptions}
            values={values}
            emptyMessage={emptyMessage}
            initialMessage={emptyMessage}
            optionRenderer={renderPickerOption}
            selectedOptionRenderer={renderChip}
            validation={validation}
            onOpenChange={handleOpenChange}
            onValueSearch={handleSearch}
            onValuesChange={handleChange}
        />
    );
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/components/picker/limitPickerOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/getPickerEmptyMessage.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx 2>&1 | tail -30
```

Expected: PASS (3 in limitPickerOptions.test.ts, 5 in resolvePickerSelection.test.ts, 2 in getPickerEmptyMessage.test.ts, 7 in toPickerCommandOptions.test.ts, 5 in usePickerRemountKey.test.ts, 17 in WorkflowPicker.test.tsx, 21 in WorkflowMultiPicker.test.tsx). Notes to check on the first run: opening the list in jsdom needs `fireEvent.focus(input)` then `fireEvent.keyDown(input, { key: "ArrowDown" })` (the `ReviewerPicker` test does the same); a picked option is chosen with `fireEvent.click` on its text. The four tests that prove the remount key (the multi picker's `removes a chip through its dismiss button`, `drops a chip when the values change from outside` and `updates a chip when the selected item's label arrives later`, and the single picker's `updates the input when the selected item's label arrives later`) fail when `key` is a constant; the test `keeps the More matches line while the user types` fails when the hint line's value does not end with the query.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/reviewerPicker/components/ReviewerPicker.test.tsx 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (the build type-checks the co-located tests; the new files add no dependency, `@webiny/admin-ui`, `@webiny/icons` and `@testing-library/react` are already in `packages/app-workflows/package.json`).

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
git commit -m "feat(app-workflows): add the shared searchable Picker and MultiPicker" -m "WorkflowPicker and WorkflowMultiPicker sit on the admin-ui AutoComplete and MultiAutoComplete: at most 50 options with the 'More matches' line, 'Nothing matches' for an empty search, selected items that keep their label, an 'Unknown item' for an id nobody knows, and a per-option warning in the list and on the chip." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`label` (required), `description` and `required` (optional) props are added** to both pickers (the contract's Interfaces entry was updated to list `label`). `AutoCompletePrimitive` passes `String(label)` to the command menu as its accessible name, so a picker without one is named `undefined`, and the field renderers of Tasks 11 and 13 need to show the field's label, its visible description (`field.description`; the admin-ui `hint` prop is only a tooltip icon, so it is not used) and the required marker. Tasks 11 and 13 pass `label={field.label}`, `description={field.description}`, `required={field.required}`.
- **The list can show more than 50 rows**: chosen items the search does not contain are put first (with the check mark) outside the 50 cap; accepted.
- **The "More matches" value trick relies on cmdk 1.1.1's fuzzy scoring** (a constant value scores 0 and is filtered out while typing); a sturdier fix (`forceMount` or a `shouldFilter` pass-through) is an admin-ui change for its own step, and a code comment says so. A real fix for the stale chips (the admin-ui presenters should resync on prop change) is also an admin-ui change.
- **Extra files:** the contract lists four (`PickerOption.ts`, `limitPickerOptions.ts`, `WorkflowPicker.tsx`, `WorkflowMultiPicker.tsx`); one exported function per file adds `pickerTexts.ts` (the three fixed strings), `resolvePickerSelection.ts`, `getPickerEmptyMessage.ts`, `toPickerCommandOptions.ts`, `toPickerChosenEntry.ts`, `usePickerRemountKey.ts`, `renderPickerOption.tsx` and `PickerChip.tsx`. None is exported outside `components/picker`.
- **No `selectedOptionRenderer` on the single picker** (A100, as the contract says): its warning is the line under the input. `AutoCompletePrimitive` also finds the shown label only among `options`, which is why `toPickerCommandOptions` puts the chosen items the search does not contain into the list (first, with the check mark), for both pickers.
- **`CommandOptionDto` is not exported by `@webiny/admin-ui`**, so `toPickerCommandOptions` returns its own named `PickerCommandOption { label; value; disabled?; item? }`, structurally the same.
- **Server search is filtered again by the list**: the admin-ui list (cmdk) filters its items by the typed text against the option label, so a result the server returned for a reason other than its label (a description match) is hidden. The design says search matches the label and keywords, never the sub line (UI-4), so this is accepted. The presenter that uses the picker still searches the server, debounced by 250 ms (contract review 1, I7), because each team search scans the tenant's users for `memberCount`.
- **Copy:** `More matches. Keep typing to narrow the list.`, `Nothing matches “{q}”.`, `Unknown item`, `This item no longer exists.` are from `research2-admin.md` 6 and `contract-review-1.md`; `This team has no members` is the caller's `warning` text (Tasks 11, 9a Task 8), not hard-coded here. The only other string is the icon's accessible label `Warning`, which is not visible copy. With no text typed and no results the picker passes `No results.` (admin-ui's own default text, not new copy; the design gives none), for both the empty and the initial message, because the list keeps the last message it was given when a prop turns `undefined`.
- **A chip's warning text is its `title`** (a tooltip); the design asks for a warning icon on the chip and the warning on the step card and in the drawer (UI-5), which Tasks 8 and 14 provide.
- **The picker keeps the typed text in a `useState`** (to word `Nothing matches` and to build the hint's value); it is one visual detail of a presentational component, reset when an option is picked or removed and when the list closes (M4-2; text left in the input after Escape then shows `No results.`), and the parent's presenter owns the real search state through `onSearch`.
- Size: medium (eight small helpers, two components, seven test files).
