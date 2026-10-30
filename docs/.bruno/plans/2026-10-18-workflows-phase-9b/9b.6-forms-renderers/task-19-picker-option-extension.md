### Task 19: Picker option extension

R298, R307; UI-3, Q54, Q59.1; design `Picker.dc.html` (README 9: icon column, muted text, disabled rows, the clear option) and `research-spec.md` 4.4, 4.6; Review Focus 4. The shared picker (9a R282) learns what saved references and rule targets need: an option can be muted, disabled and carry an icon, and `WorkflowPicker` can show a first clear row (`anyLabel`) whose pick gives `null`. Existing behaviour does not change: an option with no new flags renders and picks as before.

- **`PickerOption` (R307)** gains `muted: boolean` (a reference that no longer resolves, shown in muted text), `disabled: boolean` (the row cannot be picked) and `icon: PickerOptionIcon | null`. `PickerOptionIcon` is the closed union `person`, `person_off`, `group`, `group_off`, `groups`, `folder`, `folder_open`, `lock`; the picker component maps each name to the admin icon (the model stays free of React). Deviation from the design (R307): no avatar and no right-hand note (the only note, `Unavailable`, is out by Q50); the icon column stays.
- **Command options (R307):** an option is disabled when `option.disabled` or it carries the unknown-item warning; `item` is still the whole option, so the renderer reads `muted` and `icon`. With `anyLabel` the first command option is the clear row: value `__any__` (`PICKER_ANY_VALUE`; cmdk would derive a value from the label text if the value were empty), label `anyLabel`, no icon, not disabled, never counted toward the 50-option limit. Its label is also the cmdk keyword, so typing `Any` finds it.
- **`WorkflowPicker.anyLabel?: string | null`** (optional, default `null`, so every existing caller compiles unchanged; Task 22 passes `null` or a label explicitly): the field shows `anyLabel` as its placeholder text while nothing is chosen and nothing is typed, and `anyLabel` wins over `placeholder` when both are set. Picking the clear row calls `onChange(null)`, like the empty value did.
- **Rendering:** `renderPickerOption` puts the icon in a left column when `icon` is not `null` and uses the muted text colour for a muted label; a muted or iconless option keeps the column-free layout of 9a. The icon is decorative (empty accessible label), carries `data-picker-icon="<name>"` so tests can tell the icons apart (the test setup stubs every SVG to the same element), and a muted option's icon is the light neutral colour.
- **Neutral loading label:** `PICKER_LOADING_LABEL` (`Searching…`, the design picker's own loading text) is the label Task 19b gives a saved reference that is not resolved yet or whose lookup failed (R298). It lives in `pickerTexts.ts` next to the other picker texts.
- **Existing literals:** every `PickerOption` literal in source gets the three fields (`resolvePickerSelection`, `toTeamPickerOption` with the `group` icon, `getAiModelOptions` with none); the tests build options with the new pure builder `createPickerOption` (all fields defaulted, `overrides` win), so a later field costs one edit.

**Files:** (`[PICK]` = `packages/app-workflows/src/components/picker`)
- Modify: `[PICK]/PickerOption.ts`
- Create: `[PICK]/PickerOptionIcon.ts`
- Modify: `[PICK]/pickerTexts.ts`
- Create: `[PICK]/PickerOptionIconView.tsx`
- Modify: `[PICK]/renderPickerOption.tsx`
- Modify: `[PICK]/toPickerCommandOptions.ts`
- Modify: `[PICK]/WorkflowPicker.tsx`
- Modify: `[PICK]/resolvePickerSelection.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts`
- Create: `packages/app-workflows/src/editor/testing/createPickerOption.ts`
- Create: `[PICK]/renderPickerOption.test.tsx`
- Modify: `[PICK]/toPickerCommandOptions.test.ts`, `[PICK]/WorkflowPicker.test.tsx`, `[PICK]/WorkflowMultiPicker.test.tsx`, `[PICK]/resolvePickerSelection.test.ts`, `[PICK]/usePickerRemountKey.test.ts`, `[PICK]/limitPickerOptions.test.ts`
- Modify: `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx`, `.../renderers/AiModelPickerRenderer.test.tsx`, `.../aiFormPure.test.ts`, `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts`

`WorkflowMultiPicker.tsx` needs no change: it calls `toPickerCommandOptions(chosen, shown, hasMore, query)` and the new fifth parameter defaults to `null`, so it never shows a clear row.

**Interfaces:**
- Consumes (verified in the repo today): `PickerOption`, `toPickerCommandOptions`, `PICKER_UNKNOWN_ITEM_WARNING`, `PICKER_MORE_MATCHES_TEXT`, `WorkflowPicker`, `renderPickerOption`, `limitPickerOptions`, `resolvePickerSelection`, `usePickerRemountKey` (all in `[PICK]`); admin-ui `AutoComplete` (`placeholder`, `options` with `{ label, value, disabled, item }`, `optionRenderer`), `Icon`, `Text`; `@webiny/icons` `person`, `person_off`, `group`, `group_off`, `groups`, `folder`, `folder_open`, `lock`; `renderWithAdminUi` (`~/review/testing/renderWithAdminUi.js`).
- Produces: `PickerOption { id; label; description; warning; muted: boolean; disabled: boolean; icon: PickerOptionIcon | null }`, `PickerOptionIcon`, `PICKER_ANY_VALUE`, `PICKER_LOADING_LABEL`, `WorkflowPicker.anyLabel`, `toPickerCommandOptions(chosen, shown, hasMore, query, anyLabel?)`, `PickerOptionIconView`, `createPickerOption(overrides?)` in `[AWET]/createPickerOption.ts` (pure, no vitest import).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/createPickerOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";

// A plain option with no description, warning, flag or icon; `overrides` win.
export const createPickerOption = (overrides: Partial<PickerOption> = {}): PickerOption => {
    return {
        id: "option-1",
        label: "Option",
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/components/picker/renderPickerOption.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { screen } from "@testing-library/react";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import type { PickerOption } from "./PickerOption.js";
import type { PickerOptionIcon } from "./PickerOptionIcon.js";
import { renderPickerOption } from "./renderPickerOption.js";

const renderOption = (option: PickerOption) => {
    return renderWithAdminUi(<>{renderPickerOption(option)}</>);
};

const ICON_NAMES: PickerOptionIcon[] = [
    "person",
    "person_off",
    "group",
    "group_off",
    "groups",
    "folder",
    "folder_open",
    "lock"
];

describe("renderPickerOption (R307)", () => {
    it("shows the label, the sub line and the warning", () => {
        renderOption(
            createPickerOption({
                label: "Press",
                description: "0 members",
                warning: "This team has no members"
            })
        );

        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("0 members")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("shows no sub line and no icon for a plain option", () => {
        renderOption(createPickerOption({ label: "Legal" }));

        expect(screen.getByText("Legal")).toBeTruthy();
        expect(document.querySelector("[data-picker-icon]")).toBeNull();
    });

    for (const name of ICON_NAMES) {
        it(`shows the ${name} icon in the icon column`, () => {
            renderOption(createPickerOption({ label: "Row", icon: name }));

            const icons = document.querySelectorAll("[data-picker-icon]");
            expect(icons).toHaveLength(1);
            expect(icons[0].getAttribute("data-picker-icon")).toBe(name);
        });
    }

    it("keeps the label next to the icon", () => {
        renderOption(createPickerOption({ label: "Restricted folder", icon: "lock" }));

        expect(screen.getByText("Restricted folder")).toBeTruthy();
        expect(document.querySelector('[data-picker-icon="lock"]')).not.toBeNull();
    });

    it("shows a muted label in the muted text colour and a normal one not", () => {
        renderOption(createPickerOption({ label: "Deleted user", muted: true, icon: "person_off" }));
        const muted = screen.getByText("Deleted user");

        expect(muted.className).toContain("text-neutral-strong");
    });

    it("does not mute a normal label", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));
        const normal = screen.getByText("Ivan Horvat");

        expect(normal.className).not.toContain("text-neutral-strong");
    });
});
```

Modify `packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts`: apply the literal hunk at the end of this step, then add these cases inside `describe("toPickerCommandOptions", ...)` after the last `it`, and add the import `import { PICKER_ANY_VALUE } from "./pickerTexts.js";` below the `toPickerCommandOptions` import:

```ts
    it("puts the clear row first when anyLabel is given, with the any value and no icon", () => {
        const commandOptions = toPickerCommandOptions([], [legal], false, "", "Any folder");

        expect(commandOptions[0]).toEqual({
            label: "Any folder",
            value: PICKER_ANY_VALUE,
            disabled: false,
            item: createPickerOption({ id: PICKER_ANY_VALUE, label: "Any folder" })
        });
        expect(commandOptions.map(option => option.value)).toEqual([PICKER_ANY_VALUE, "t1"]);
    });

    it("keeps the clear row ahead of a chosen item the search does not contain", () => {
        const commandOptions = toPickerCommandOptions([sales], [legal], false, "", "Any folder");

        expect(commandOptions.map(option => option.value)).toEqual([PICKER_ANY_VALUE, "t3", "t1"]);
    });

    it("does not count the clear row toward the hint line", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le", "Any folder");

        expect(commandOptions.map(option => option.label)).toEqual([
            "Any folder",
            "Legal",
            "More matches. Keep typing to narrow the list."
        ]);
    });

    it("has no clear row without anyLabel or with a null one", () => {
        const without = toPickerCommandOptions([], [legal], false, "");
        const withNull = toPickerCommandOptions([], [legal], false, "", null);

        expect(without.map(option => option.value)).toEqual(["t1"]);
        expect(withNull.map(option => option.value)).toEqual(["t1"]);
    });

    it("lists a disabled option as disabled and keeps muted and icon on the item", () => {
        const locked = createPickerOption({
            id: "f9",
            label: "Restricted folder",
            muted: true,
            disabled: true,
            icon: "lock"
        });

        const commandOptions = toPickerCommandOptions([locked], [legal], false, "");

        expect(commandOptions[0].disabled).toBe(true);
        expect(commandOptions[0].item).toEqual(locked);
        expect(commandOptions[1].disabled).toBe(false);
    });
```

Modify `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`: apply the literal hunk at the end of this step, then add these cases at the end of `describe("WorkflowPicker", ...)`, after `it("disables the input", ...)`:

```tsx
    it("shows anyLabel as the placeholder text, ahead of placeholder, while nothing is chosen (R307)", () => {
        renderWithAdminUi(
            <WorkflowPicker
                {...createProps({ anyLabel: "Any folder", placeholder: "Search folders" })}
            />
        );

        expect(screen.getByPlaceholderText("Any folder")).toBeTruthy();
        expect(screen.queryByPlaceholderText("Search folders")).toBeNull();
    });

    it("keeps the placeholder when there is no anyLabel", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ placeholder: "Search folders" })} />);

        expect(screen.getByPlaceholderText("Search folders")).toBeTruthy();
    });

    it("lists the clear row first and gives null when it is picked (R307)", async () => {
        const props = createProps({ anyLabel: "Any folder" });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        const rows = await screen.findAllByRole("option");
        const labels = rows.map(row => row.textContent ?? "").filter(text => text !== "");

        expect(labels[0]).toBe("Any folder");

        fireEvent.click(screen.getByText("Any folder"));

        expect(props.onChange).toHaveBeenCalledTimes(1);
        expect(props.onChange).toHaveBeenCalledWith(null);
    });

    it("finds the clear row by typing its label while a value is chosen (the list filters by the input text)", async () => {
        const props = createProps({ anyLabel: "Any folder", value: "t1", selected: LEGAL });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Any" } });
        fireEvent.click(await screen.findByText("Any folder"));

        expect(props.onChange).toHaveBeenCalledWith(null);
    });

    it("lists no clear row without anyLabel", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();
        await screen.findByText("Legal");

        const rows = screen.getAllByRole("option");
        const labels = rows.map(row => row.textContent ?? "").filter(text => text !== "");
        expect(labels).toHaveLength(3);
        expect(labels.join("|")).not.toContain("Any folder");
    });

    it("does not pick a disabled option", async () => {
        const locked = createPickerOption({
            id: "f9",
            label: "Restricted folder",
            muted: true,
            disabled: true,
            icon: "lock"
        });
        const props = createProps({ options: [LEGAL, locked] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Restricted folder"));

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("shows the icon and the muted label of an option in the list", async () => {
        const gone = createPickerOption({
            id: "u9",
            label: "Deleted user",
            muted: true,
            icon: "person_off"
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [gone] })} />);

        openList();
        const label = await screen.findByText("Deleted user");

        expect(label.className).toContain("text-neutral-strong");
        expect(document.querySelector('[data-picker-icon="person_off"]')).not.toBeNull();
    });
```

`toTeamPickerOption` has no test of its own: `StepDrawerPresenter.test.ts` asserts the whole team option, including the `group` icon, and `aiFormPure.test.ts` asserts the whole model options.

The literal edits of the existing tests (the options are built with `createPickerOption`; expectations that compare whole options now include `muted`, `disabled` and `icon`, and the team options of `StepDrawerPresenter.test.ts` carry `icon: "group"`, which `toTeamPickerOption` produces). For `toPickerCommandOptions.test.ts` also add `import { PICKER_ANY_VALUE } from "./pickerTexts.js";` below its `toPickerCommandOptions` import, for the new cases above:

Modify `packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts`:

```diff
--- a/packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts
+++ b/packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts
@@ -2,14 +2,15 @@
 import { expect } from "vitest";
 import { it } from "vitest";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import type { PickerOption } from "./PickerOption.js";
 import { resolvePickerSelection } from "./resolvePickerSelection.js";
 
-const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
-const press: PickerOption = {
+const legal = createPickerOption({ id: "t1", label: "Legal" });
+const press = createPickerOption({
     id: "t2",
     label: "Press",
     description: "3 members",
     warning: "This team has no members"
-};
+});
 
 describe("resolvePickerSelection", () => {
@@ -32,10 +33,9 @@
     it("returns an unknown item for an id nobody knows", () => {
         expect(resolvePickerSelection(["t9"], [legal], [press])).toEqual([
-            {
+            createPickerOption({
                 id: "t9",
                 label: "Unknown item",
-                description: null,
                 warning: "This item no longer exists."
-            }
+            })
         ]);
     });
```

Modify `packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts`:

```diff
--- a/packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts
+++ b/packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts
@@ -2,10 +2,10 @@
 import { expect } from "vitest";
 import { it } from "vitest";
-import type { PickerOption } from "./PickerOption.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
 
-const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
-const press: PickerOption = { id: "t2", label: "Press", description: null, warning: null };
-const sales: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };
+const legal = createPickerOption({ id: "t1", label: "Legal" });
+const press = createPickerOption({ id: "t2", label: "Press" });
+const sales = createPickerOption({ id: "t3", label: "Sales" });
 
 describe("toPickerCommandOptions", () => {
@@ -32,10 +32,9 @@
 
     it("lists an unknown item as disabled so it cannot be picked again", () => {
-        const unknown: PickerOption = {
+        const unknown = createPickerOption({
             id: "t9",
             label: "Unknown item",
-            description: null,
             warning: "This item no longer exists."
-        };
+        });
 
         const commandOptions = toPickerCommandOptions([unknown], [legal], false, "");
```

Modify `packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts`:

```diff
--- a/packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts
+++ b/packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts
@@ -3,9 +3,9 @@
 import { it } from "vitest";
 import { renderHook } from "@testing-library/react";
-import type { PickerOption } from "./PickerOption.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import { usePickerRemountKey } from "./usePickerRemountKey.js";
 
-const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
-const press: PickerOption = { id: "t2", label: "Press", description: null, warning: null };
+const legal = createPickerOption({ id: "t1", label: "Legal" });
+const press = createPickerOption({ id: "t2", label: "Press" });
 
 describe("usePickerRemountKey", () => {
```

Modify `packages/app-workflows/src/components/picker/limitPickerOptions.test.ts`:

```diff
--- a/packages/app-workflows/src/components/picker/limitPickerOptions.test.ts
+++ b/packages/app-workflows/src/components/picker/limitPickerOptions.test.ts
@@ -2,4 +2,5 @@
 import { expect } from "vitest";
 import { it } from "vitest";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import type { PickerOption } from "./PickerOption.js";
 import { limitPickerOptions } from "./limitPickerOptions.js";
@@ -7,5 +8,5 @@
 const createOptions = (count: number): PickerOption[] => {
     return Array.from({ length: count }, (_, index) => {
-        return { id: `id-${index}`, label: `Item ${index}`, description: null, warning: null };
+        return createPickerOption({ id: `id-${index}`, label: `Item ${index}` });
     });
 };
```

Modify `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`:

```diff
--- a/packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx
+++ b/packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx
@@ -12,13 +12,14 @@
 import type { PickerOption } from "./PickerOption.js";
 import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
-
-const LEGAL: PickerOption = { id: "t1", label: "Legal", description: "4 members", warning: null };
-const PRESS: PickerOption = {
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
+
+const LEGAL = createPickerOption({ id: "t1", label: "Legal", description: "4 members" });
+const PRESS = createPickerOption({
     id: "t2",
     label: "Press",
     description: "0 members",
     warning: "This team has no members"
-};
-const SALES: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };
+});
+const SALES = createPickerOption({ id: "t3", label: "Sales" });
 
 const createProps = (overrides: Partial<WorkflowPickerProps> = {}): WorkflowPickerProps => {
@@ -86,10 +87,5 @@
 
     it("shows the selected item's label although the search results do not contain it", () => {
-        const finance: PickerOption = {
-            id: "t9",
-            label: "Finance",
-            description: null,
-            warning: null
-        };
+        const finance = createPickerOption({ id: "t9", label: "Finance" });
         const props = createProps({ value: "t9", selected: finance, options: [LEGAL] });
         renderWithAdminUi(<WorkflowPicker {...props} />);
@@ -145,10 +141,5 @@
         expect(first.value).toBe("Unknown item");
 
-        const resolved: PickerOption = {
-            id: "t9",
-            label: "Finance",
-            description: null,
-            warning: null
-        };
+        const resolved = createPickerOption({ id: "t9", label: "Finance" });
         rerender(
             <AdminUiProvider>
@@ -166,5 +157,5 @@
     it("shows at most 50 options and the More matches line", async () => {
         const many = Array.from({ length: 60 }, (_, index): PickerOption => {
-            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
+            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
         });
         renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);
@@ -180,5 +171,5 @@
     it("keeps the More matches line while the user types", async () => {
         const many = Array.from({ length: 60 }, (_, index): PickerOption => {
-            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
+            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
         });
         renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);
```

Modify `packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx`:

```diff
--- a/packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx
+++ b/packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx
@@ -12,13 +12,14 @@
 import type { PickerOption } from "./PickerOption.js";
 import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
-
-const LEGAL: PickerOption = { id: "t1", label: "Legal", description: "4 members", warning: null };
-const PRESS: PickerOption = {
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
+
+const LEGAL = createPickerOption({ id: "t1", label: "Legal", description: "4 members" });
+const PRESS = createPickerOption({
     id: "t2",
     label: "Press",
     description: "0 members",
     warning: "This team has no members"
-};
-const SALES: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };
+});
+const SALES = createPickerOption({ id: "t3", label: "Sales" });
 
 const createProps = (
@@ -179,10 +180,5 @@
         expect(screen.getByText("Unknown item")).toBeTruthy();
 
-        const finance: PickerOption = {
-            id: "t9",
-            label: "Finance",
-            description: null,
-            warning: null
-        };
+        const finance = createPickerOption({ id: "t9", label: "Finance" });
         const second = createProps({ values: ["t9"], selected: [finance], options: [] });
         rerender(
@@ -228,5 +224,5 @@
     it("keeps the More matches line while the user types", async () => {
         const many = Array.from({ length: 60 }, (_, index): PickerOption => {
-            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
+            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
         });
         renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);
@@ -250,5 +246,5 @@
     it("shows at most 50 options and the More matches line", async () => {
         const many = Array.from({ length: 60 }, (_, index): PickerOption => {
-            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
+            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
         });
         renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx
+++ b/packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx
@@ -12,4 +12,5 @@
 import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
 import type { PickerOption } from "~/components/picker/PickerOption.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import { buildPeopleStepForm } from "../buildPeopleStepForm.js";
 import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
@@ -87,6 +88,6 @@
 });
 
-const TEAM_1: PickerOption = { id: "team-1", label: "Legal", description: null, warning: null };
-const TEAM_2: PickerOption = { id: "team-2", label: "Editors", description: null, warning: null };
+const TEAM_1 = createPickerOption({ id: "team-1", label: "Legal" });
+const TEAM_2 = createPickerOption({ id: "team-2", label: "Editors" });
 
 const createPeopleForm = (teams: string[]) => {
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx
+++ b/packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx
@@ -12,4 +12,5 @@
 import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
 import type { PickerOption } from "~/components/picker/PickerOption.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import type { StepFormAiModelsOptions } from "../StepFormOptions.js";
 import { buildAiStepForm } from "../buildAiStepForm.js";
@@ -62,10 +63,9 @@
 });
 
-const MODEL: PickerOption = {
+const MODEL = createPickerOption({
     id: "anthropic/claude-balanced",
     label: "Claude Balanced",
-    description: "Anthropic",
-    warning: null
-};
+    description: "Anthropic"
+});
 
 const aiModels = (overrides: Partial<StepFormAiModelsOptions> = {}): StepFormAiModelsOptions => {
@@ -130,11 +130,10 @@
 
     it("passes a retired model's label and warning through (QBZ-8)", () => {
-        const retired: PickerOption = {
+        const retired = createPickerOption({
             id: "anthropic/gone",
             label: "anthropic/gone (no longer offered)",
-            description: null,
             warning:
                 "The AI model “anthropic/gone” is no longer offered. Choose another model; until then this step fails when reached."
-        };
+        });
         renderModel("anthropic/gone", aiModels({ selected: retired }));
 
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts
+++ b/packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts
@@ -3,4 +3,5 @@
 import { it } from "vitest";
 import type { AiModel } from "~/editor/domain/types.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import { getAiModelOptions } from "./getAiModelOptions.js";
 
@@ -28,11 +29,10 @@
 
         expect(result.options).toEqual([
-            {
+            createPickerOption({
                 id: "anthropic/claude-balanced",
                 label: "Claude Balanced",
-                description: "Anthropic",
-                warning: null
-            },
-            { id: "openai/gpt-fast", label: "GPT Fast", description: "OpenAI", warning: null }
+                description: "Anthropic"
+            }),
+            createPickerOption({ id: "openai/gpt-fast", label: "GPT Fast", description: "OpenAI" })
         ]);
         expect(result.selected).toBeNull();
@@ -78,10 +78,11 @@
         });
 
-        expect(result.selected).toEqual({
-            id: "anthropic/gone",
-            label: "anthropic/gone (no longer offered)",
-            description: null,
-            warning: RETIRED_WARNING
-        });
+        expect(result.selected).toEqual(
+            createPickerOption({
+                id: "anthropic/gone",
+                label: "anthropic/gone (no longer offered)",
+                warning: RETIRED_WARNING
+            })
+        );
     });
 
@@ -94,10 +95,10 @@
         });
 
-        expect(result.selected).toEqual({
-            id: "anthropic/claude-balanced",
-            label: "anthropic/claude-balanced",
-            description: null,
-            warning: null
-        });
+        expect(result.selected).toEqual(
+            createPickerOption({
+                id: "anthropic/claude-balanced",
+                label: "anthropic/claude-balanced"
+            })
+        );
         expect(result.empty).toBe(false);
     });
```

Modify `packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts
+++ b/packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts
@@ -9,4 +9,5 @@
 import { createEditorOptions } from "~/editor/testing/createEditorOptions.js";
 import { createTeamOptions } from "~/editor/testing/createTeamOptions.js";
+import { createPickerOption } from "~/editor/testing/createPickerOption.js";
 import { createAiStep } from "~/editor/testing/draftFixtures.js";
 import { createAutomationStep } from "~/editor/testing/draftFixtures.js";
@@ -185,11 +186,11 @@
         const { teams } = presenter.formOptions;
         expect(teams.selected).toEqual([
-            { id: "team-1", label: "Legal", description: null, warning: null },
-            {
+            createPickerOption({ id: "team-1", label: "Legal", icon: "group" }),
+            createPickerOption({
                 id: "team-2",
                 label: "Editors",
-                description: null,
+                icon: "group",
                 warning: "This team has no members"
-            }
+            })
         ]);
         expect(teams.options.map(option => option.id)).toEqual(["team-1", "team-2"]);
@@ -205,10 +206,10 @@
 
         expect(presenter.formOptions.teams.selected).toEqual([
-            {
+            createPickerOption({
                 id: "team-2",
                 label: "Editors",
-                description: null,
+                icon: "group",
                 warning: "This team has no members"
-            }
+            })
         ]);
     });
@@ -744,10 +745,10 @@
         expect(presenter.formOptions.aiModels.failed).toBe(true);
         expect(presenter.formOptions.aiTools.failed).toBe(true);
-        expect(presenter.formOptions.aiModels.selected).toEqual({
-            id: "anthropic/claude-balanced",
-            label: "anthropic/claude-balanced",
-            description: null,
-            warning: null
-        });
+        expect(presenter.formOptions.aiModels.selected).toEqual(
+            createPickerOption({
+                id: "anthropic/claude-balanced",
+                label: "anthropic/claude-balanced"
+            })
+        );
 
         presenter.formOptions.aiModels.retry();
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/components/picker/renderPickerOption.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -40
```

Expected: in `renderPickerOption.test.tsx` the eight icon cases and the muted-colour case fail (no element with `data-picker-icon`, no `text-neutral-strong` on the label); the plain cases pass. In `toPickerCommandOptions.test.ts` the new clear-row and disabled-option cases fail (there is no clear row, `PICKER_ANY_VALUE` does not exist, a flagged option is not disabled). `WorkflowPicker.test.tsx` fails on the new cases (the placeholder is `Search folders`, there is no clear row, no `data-picker-icon`, the disabled option is picked); the old cases still pass. `WorkflowMultiPicker.test.tsx` passes (the builder is the only change). `resolvePickerSelection.test.ts`, `aiFormPure.test.ts` and `StepDrawerPresenter.test.ts` fail on the expected options having `muted`, `disabled` and `icon` that the code does not produce yet.

- [ ] **Step 3: Implement**

Replace `packages/app-workflows/src/components/picker/PickerOption.ts` in full:

```ts
import type { PickerOptionIcon } from "./PickerOptionIcon.js";

export interface PickerOption {
    id: string;
    label: string;
    description: string | null;
    warning: string | null;
    // A saved reference that no longer resolves (a deleted user or team): the label shows in muted text (R307).
    muted: boolean;
    // The row cannot be picked (a restricted folder, an unknown item).
    disabled: boolean;
    // The icon column of the row (R307); null for none.
    icon: PickerOptionIcon | null;
}
```

Create `packages/app-workflows/src/components/picker/PickerOptionIcon.ts`:

```ts
/*
 * The icons a picker row can show (R307): a closed union of names, mapped to the admin icons by
 * the picker component, so an option stays plain data (R234).
 */
export type PickerOptionIcon =
    | "person"
    | "person_off"
    | "group"
    | "group_off"
    | "groups"
    | "folder"
    | "folder_open"
    | "lock";
```

In `packages/app-workflows/src/components/picker/pickerTexts.ts`, append:

```ts

// The value of the clear row (`anyLabel`): cmdk derives a value from the label text when the value is empty (R307).
export const PICKER_ANY_VALUE = "__any__";

// The neutral label of a saved reference that is not resolved yet or whose lookup failed (R298); the design picker's loading text.
export const PICKER_LOADING_LABEL = "Searching…";
```

Create `packages/app-workflows/src/components/picker/PickerOptionIconView.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as FolderIcon } from "@webiny/icons/folder.svg";
import { ReactComponent as FolderOpenIcon } from "@webiny/icons/folder_open.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { ReactComponent as GroupOffIcon } from "@webiny/icons/group_off.svg";
import { ReactComponent as GroupsIcon } from "@webiny/icons/groups.svg";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import type { PickerOptionIcon } from "./PickerOptionIcon.js";

const ICONS: Record<PickerOptionIcon, React.ReactElement> = {
    person: <PersonIcon />,
    person_off: <PersonOffIcon />,
    group: <GroupIcon />,
    group_off: <GroupOffIcon />,
    groups: <GroupsIcon />,
    folder: <FolderIcon />,
    folder_open: <FolderOpenIcon />,
    lock: <LockIcon />
};

export interface PickerOptionIconViewProps {
    name: PickerOptionIcon;
    muted: boolean;
}

/*
 * The icon column of a picker row (R307). It is decorative: the label next to it says what the row
 * is, so the accessible label is empty. `data-picker-icon` names the icon for the tests.
 */
export const PickerOptionIconView = ({ name, muted }: PickerOptionIconViewProps) => {
    let color: "inherit" | "neutral-light" = "inherit";
    if (muted) {
        color = "neutral-light";
    }
    return <Icon icon={ICONS[name]} label={""} size={"sm"} color={color} data-picker-icon={name} />;
};
```

Replace `packages/app-workflows/src/components/picker/renderPickerOption.tsx` in full:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { PickerOption } from "./PickerOption.js";
import { PickerOptionIconView } from "./PickerOptionIconView.js";

// One option row of the list: the icon column, the label (muted for a muted option), the sub line and the option's warning.
export const renderPickerOption = (option: PickerOption): React.ReactNode => {
    let labelClass: string | undefined = undefined;
    if (option.muted) {
        labelClass = "text-neutral-strong";
    }

    const content = (
        <div className={"flex flex-col gap-xxs whitespace-normal"}>
            <Text size={"md"} className={labelClass}>
                {option.label}
            </Text>
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

    if (option.icon === null) {
        return content;
    }

    return (
        <div className={"flex items-start gap-sm"}>
            <PickerOptionIconView name={option.icon} muted={option.muted} />
            {content}
        </div>
    );
};
```

Replace `packages/app-workflows/src/components/picker/toPickerCommandOptions.ts` in full:

```ts
import type { PickerOption } from "./PickerOption.js";
import { PICKER_ANY_VALUE } from "./pickerTexts.js";
import { PICKER_MORE_MATCHES_TEXT } from "./pickerTexts.js";
import { PICKER_UNKNOWN_ITEM_WARNING } from "./pickerTexts.js";

export interface PickerCommandOption {
    label: string;
    value: string;
    disabled?: boolean;
    item?: PickerOption;
}

const MORE_MATCHES_VALUE_PREFIX = "picker-more-matches:";

// An unknown item is listed (so the input finds its label) but cannot be picked again, and neither can a disabled option.
const toCommandOption = (option: PickerOption): PickerCommandOption => {
    const disabled = option.disabled || option.warning === PICKER_UNKNOWN_ITEM_WARNING;
    return { label: option.label, value: option.id, disabled, item: option };
};

// The clear row (R307): no description, warning, flag or icon.
const toAnyOption = (label: string): PickerOption => {
    return {
        id: PICKER_ANY_VALUE,
        label,
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: null
    };
};

/*
 * The options the admin-ui list shows: the clear row when `anyLabel` is given, then the chosen
 * items that the current search does not contain (so a chip or the input keeps its label), then the
 * search results, then, when the search was cut, a disabled line with the "More matches" hint. The
 * list (cmdk 1.1.1) filters its items by the typed text with a fuzzy score of `value` plus keywords,
 * and a constant value scores 0 and disappears while typing, so the hint's value ends with the
 * query. This relies on cmdk's scoring; a sturdier fix (`forceMount` or `shouldFilter` through
 * admin-ui) is an admin-ui change. The clear row's label is its keyword (admin-ui adds it), so it
 * is found by typing it and hidden by typing something else.
 */
export const toPickerCommandOptions = (
    chosen: PickerOption[],
    shown: PickerOption[],
    hasMore: boolean,
    query: string,
    anyLabel: string | null = null
): PickerCommandOption[] => {
    const ids = shown.map(option => option.id);
    const shownIds = new Set(ids);
    const missing = chosen.filter(option => !shownIds.has(option.id));
    const commandOptions = [...missing, ...shown].map(toCommandOption);

    if (anyLabel !== null) {
        const anyOption = toAnyOption(anyLabel);
        const anyCommandOption = toCommandOption(anyOption);
        commandOptions.unshift(anyCommandOption);
    }

    if (hasMore) {
        const value = `${MORE_MATCHES_VALUE_PREFIX}${query}`;
        commandOptions.push({ label: PICKER_MORE_MATCHES_TEXT, value, disabled: true });
    }

    return commandOptions;
};
```

Replace `packages/app-workflows/src/components/picker/WorkflowPicker.tsx` in full:

```tsx
import React from "react";
import { useState } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { PickerOption } from "./PickerOption.js";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";
import { limitPickerOptions } from "./limitPickerOptions.js";
import { PICKER_ANY_VALUE } from "./pickerTexts.js";
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
    /*
     * The label of a first clear row (R307): picking it gives `null`, and the field shows it as its
     * placeholder text while nothing is chosen and nothing is typed. It wins over `placeholder`.
     */
    anyLabel?: string | null;
}

/*
 * The shared searchable single picker (R282, R307, UI-3) over admin-ui `AutoComplete`. `options`
 * are the search results (shown up to 50); `selected` is the chosen item with its label, so the
 * input keeps it when a search narrows the list. A chosen id nobody knows shows as "Unknown item".
 * The chosen item's warning shows under the input, because the single input has no renderer for it
 * (A100). An option can be muted, disabled and carry an icon; `anyLabel` adds the clear row.
 */
export const WorkflowPicker = (props: WorkflowPickerProps) => {
    const { value, selected, options, onSearch, onChange, placeholder, disabled, error } = props;
    const anyLabel = props.anyLabel ?? null;
    const [query, setQuery] = useState("");

    const limited = limitPickerOptions(options);
    const ids = value === null ? [] : [value];
    const chosen = resolvePickerSelection(ids, selected ? [selected] : [], options);
    const commandOptions = toPickerCommandOptions(
        chosen,
        limited.options,
        limited.hasMore,
        query,
        anyLabel
    );
    const emptyMessage = getPickerEmptyMessage(query);
    const validation = error === null ? undefined : { isValid: false, message: error };
    const warning = chosen.length > 0 ? chosen[0].warning : null;
    const remountKey = usePickerRemountKey(chosen);

    let shownPlaceholder = placeholder;
    if (anyLabel !== null) {
        shownPlaceholder = anyLabel;
    }

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
        if (id === "" || id === PICKER_ANY_VALUE) {
            onChange(null);
            return;
        }
        onChange(id);
    };

    return (
        <div className={"w-full"}>
            <AutoComplete
                key={remountKey}
                label={props.label}
                description={props.description}
                required={props.required}
                placeholder={shownPlaceholder}
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

The three source literals (the unknown item, the team option with the `group` icon, the AI model options) change as the hunks below show (`resolvePickerSelection.ts`, `toTeamPickerOption.ts`, `getAiModelOptions.ts`).

Modify `packages/app-workflows/src/components/picker/resolvePickerSelection.ts`:

```diff
--- a/packages/app-workflows/src/components/picker/resolvePickerSelection.ts
+++ b/packages/app-workflows/src/components/picker/resolvePickerSelection.ts
@@ -25,5 +25,8 @@
             label: PICKER_UNKNOWN_ITEM_LABEL,
             description: null,
-            warning: PICKER_UNKNOWN_ITEM_WARNING
+            warning: PICKER_UNKNOWN_ITEM_WARNING,
+            muted: false,
+            disabled: false,
+            icon: null
         };
     });
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts
+++ b/packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts
@@ -9,4 +9,12 @@
         warning = STEP_FORM_MESSAGES.teamHasNoMembers;
     }
-    return { id: team.id, label: team.name, description: null, warning };
+    return {
+        id: team.id,
+        label: team.name,
+        description: null,
+        warning,
+        muted: false,
+        disabled: false,
+        icon: "group"
+    };
 };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts`:

```diff
--- a/packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts
+++ b/packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts
@@ -17,5 +17,13 @@
 
 function toOption(model: AiModel): PickerOption {
-    return { id: model.id, label: model.name, description: model.providerName, warning: null };
+    return {
+        id: model.id,
+        label: model.name,
+        description: model.providerName,
+        warning: null,
+        muted: false,
+        disabled: false,
+        icon: null
+    };
 }
 
@@ -48,8 +56,19 @@
                 label: `${selectedId} (no longer offered)`,
                 description: null,
-                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`
+                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`,
+                muted: false,
+                disabled: false,
+                icon: null
             };
         } else {
-            selected = { id: selectedId, label: selectedId, description: null, warning: null };
+            selected = {
+                id: selectedId,
+                label: selectedId,
+                description: null,
+                warning: null,
+                muted: false,
+                disabled: false,
+                icon: null
+            };
         }
     }
```


- [ ] **Step 4: Run the new and changed tests, expect pass**

```bash
yarn test packages/app-workflows/src/components/picker/renderPickerOption.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/components/picker/limitPickerOptions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/components 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (a `PickerOption` literal missing the new fields anywhere in `app-workflows`, `app-headless-cms-workflows` or `app-website-builder-workflows` is a compile error: grep `PickerOption` and fix it with the three fields).

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
git commit -m "feat(app-workflows): let picker options be muted, disabled and iconed, and add the clear row" -m "A picker option can carry a muted label, a disabled flag and an icon from a closed set of names, and the single picker takes an anyLabel that adds a first clear row whose pick gives null and that shows as the field's placeholder text. Existing options and callers keep their behaviour; the option literals gain the new fields." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`WorkflowPicker.anyLabel` is optional (`anyLabel?: string | null`)**, not the required `string | null` of the contract's Interfaces entry. Optional keeps `TeamsPickerRenderer`, `AiModelPickerRenderer` and every picker test compiling unchanged; Task 22 (which assumes the prop is required) passes `anyLabel={null}` or a label explicitly, which compiles both ways.
- **`toPickerCommandOptions` takes the clear row as a fifth, defaulted parameter** (`anyLabel: string | null = null`), so `WorkflowMultiPicker` and the seven existing calls in `toPickerCommandOptions.test.ts` stay as they are.
- **With a value chosen the clear row is hidden until the text changes:** the admin-ui `AutoComplete` shows the chosen label in the input and its list filters by the input text (the same for every 9a picker), so the clear row appears once the admin deletes the text or types `Any`; the tests pin both (nothing chosen: first row; value chosen: found by typing). The list also holds one hidden placeholder item (`value="-"`) in front of the options, so role queries on the list must ignore options with no text.
- **No icon on the clear row:** the design gives `Anyone` and `Any folder` an icon (`groups`, `folder_open`); R307 and the contract give `anyLabel` no icon prop, so the row has none (the icon column is only for options).
- **Extra files not in the contract:** `PickerOptionIconView.tsx` (the name-to-icon mapping R307 puts in the picker component) and `editor/testing/createPickerOption.ts` (the test builder). `PICKER_LOADING_LABEL` is new copy sourced from the design picker's `Searching…` for R298's "neutral loading label"; it is used by Task 19b only.
- **Test icons:** `__tests__/setup/svgStub.tsx` renders every SVG as the same element, so the icon tests read `data-picker-icon` (a prop passed through `Icon` to the SVG), not the SVG itself.
- **Not covered here:** the picker's own `Searching…`/`Could not load results.` states stay what 9a ships (the controls of Task 19b show the R281 banner when a list fails).
- Size: large (one model change, one icon view, three source files, fifteen test files, mostly mechanical literal edits).

## Review fixes (sub-phase review)

- `toPickerCommandOptions`: `commandOptions.unshift(toCommandOption(anyOption))` (a call as an argument) now goes through a named constant.
- Verified against the repo: every `PickerOption` literal in `app-workflows/src` is covered by the hunks (`resolvePickerSelection.ts`, `toTeamPickerOption.ts`, `getAiModelOptions.ts` and the test files found by grep); no literal exists in the CMS or WB packages.
