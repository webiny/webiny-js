### Task 6: `WorkflowPicker` note

R332 (the right-hand note), Q64 (users already in the list are disabled with the note `In the list`), QBZ-78 (a long note on a disabled row truncates, full text in `title`), design README 9 (the picker's right-hand note); inherited R307 (the 9b option shape: `muted`, `disabled`, `icon`); Review Focus 4 through Task 9's disabled "In the list" option (`00-shared.md`). The 9c Global Constraints apply unchanged (read: one named import per line, no multiline ternaries, `cn`-free static class strings as the picker files already use, targeted tests, the pre-commit chain).

The shared picker's option gets the optional right-hand note that 9b left out (R307's deviation): `PickerOption.note: string | null`. Task 9 sets it to `In the list` on users who already have an entry (and disables them); every other option has `note: null`. The picker's behaviour does not change: the note is display only, the search keyword stays the label (admin-ui passes `keywords={[item.label]}`), and the chosen input still shows the label alone.

- **Shape:** `note: string | null` on `PickerOption` (required, like the 9b fields, so every literal states it).
- **Rendering (`renderPickerOption`):** with a note, the row becomes a flex row: the existing content (icon column, label, sub line, warning) on the left in a `min-w-0 flex-1` block, and the note on the right as admin-ui `Text` `size="sm"` in the muted colour `text-neutral-strong`, `ml-auto`, capped with `max-w-[50%]` and `truncate` (about half the row width, ending in `…`), with `title` set to the full note and `data-picker-note` for tests. The note is inside the option element, so it is part of the row's text and so of its accessible name. A disabled option keeps its note. Without a note the markup is exactly as today.
- **Every existing literal** gets `note: null`: `[AWET]/createPickerOption.ts` (the tests' builder), `components/picker/resolvePickerSelection.ts` (the Unknown item), `components/picker/toPickerCommandOptions.ts` (the clear row), the step-form mappers `toReferencePickerOption.ts`, `toUserPickerOption.ts`, `toTeamPickerOption.ts`, `toFolderPickerOption.ts`, and `getAiModelOptions.ts` (three literals), `getUnresolvedReferenceOption.ts`, `getRuleTargetOptions.ts` (the team pool). Found by `grep -rn "muted: \(false\|true\)" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src` plus the `toReferencePickerOption` `base` spread; the CMS and WB packages have none. Every test option is built with `createPickerOption`, so no test literal needs a hunk.

Copy used: none new (`In the list` is set by Task 9; this task's tests use it as sample text from Q64).

**Files:** (`[PICK]` = `packages/app-workflows/src/components/picker`, `[STEP]` = `packages/app-workflows/src/editor/presentation/stepForm`)
- Modify: `[PICK]/PickerOption.ts`
- Modify: `[PICK]/renderPickerOption.tsx`
- Modify: `[PICK]/toPickerCommandOptions.ts`
- Modify: `[PICK]/resolvePickerSelection.ts`
- Modify: `packages/app-workflows/src/editor/testing/createPickerOption.ts`
- Modify: `[STEP]/toReferencePickerOption.ts`
- Modify: `[STEP]/toUserPickerOption.ts`
- Modify: `[STEP]/toTeamPickerOption.ts`
- Modify: `[STEP]/toFolderPickerOption.ts`
- Modify: `[STEP]/getAiModelOptions.ts`
- Modify: `[STEP]/getUnresolvedReferenceOption.ts`
- Modify: `[STEP]/getRuleTargetOptions.ts`
- Modify: `[PICK]/renderPickerOption.test.tsx`
- Modify: `[PICK]/WorkflowPicker.test.tsx`

**Interfaces:**
- Consumes (verified with codegraph and the source): `PickerOption` (`[PICK]/PickerOption.ts`), `renderPickerOption`, `PickerOptionIconView`, `WorkflowPicker` and its props, `toPickerCommandOptions`, `resolvePickerSelection`, `createPickerOption` (`~/editor/testing/createPickerOption.js`), `renderWithAdminUi` (`~/review/testing/renderWithAdminUi.js`), admin-ui `Text` (`size`, `className`, any HTML attribute such as `title`), admin-ui `AutoComplete` list (`AutoCompleteList.tsx` renders `optionRenderer(item.item)` inside the cmdk `Command.Item`, which sets `aria-disabled` for a disabled item).
- Produces (matches the contract): `PickerOption.note: string | null`, the note rendering in `renderPickerOption`, `createPickerOption` defaulting `note: null`. Consumed by Task 5 (`searchFilterOptions` test options), Task 7 (filter options) and Task 9 (`toExclusionUserOption` sets `note: "In the list"`).

**Test runner note:** admin package, `yarn test <path>` only, one file per command; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/editor/testing/createPickerOption.ts` (the builder every picker test uses; with the field here, every existing `toEqual(createPickerOption(...))` assertion also checks that the producer sets `note: null`).

Before:

```ts
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

After:

```ts
// A plain option with no description, warning, flag, icon or note; `overrides` win.
export const createPickerOption = (overrides: Partial<PickerOption> = {}): PickerOption => {
    return {
        id: "option-1",
        label: "Option",
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        note: null,
        ...overrides
    };
};
```

Modify `packages/app-workflows/src/components/picker/renderPickerOption.test.tsx`: add the cases at the end of `describe("renderPickerOption (R307)", ...)`.

Before:

```tsx
    it("does not mute a normal label", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));
        const normal = screen.getByText("Ivan Horvat");

        expect(normal.className).not.toContain("text-neutral-strong");
    });
});
```

After:

```tsx
    it("does not mute a normal label", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));
        const normal = screen.getByText("Ivan Horvat");

        expect(normal.className).not.toContain("text-neutral-strong");
    });

    it("shows no note for an option without one", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", icon: "person" }));

        expect(document.querySelector("[data-picker-note]")).toBeNull();
    });

    it("shows the note on the right in muted small text with the full text in its title (R332)", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", note: "In the list" }));
        const note = screen.getByText("In the list");

        expect(note.getAttribute("data-picker-note")).not.toBeNull();
        expect(note.getAttribute("title")).toBe("In the list");
        expect(note.className).toContain("ml-auto");
        expect(note.className).toContain("text-sm");
        expect(note.className).toContain("text-neutral-strong");
    });

    it("caps a long note at about half the row and keeps the full text in its title (QBZ-78)", () => {
        const long = "In the list since the start of the quarter, until someone removes the entry";
        renderOption(createPickerOption({ label: "Ivan Horvat", note: long }));
        const note = screen.getByText(long);

        expect(note.className).toContain("max-w-[50%]");
        expect(note.className).toContain("truncate");
        expect(note.getAttribute("title")).toBe(long);
    });

    it("puts the note in the row's text after the label, so it is part of the accessible name", () => {
        renderOption(createPickerOption({ label: "Ivan Horvat", note: "In the list" }));
        const note = screen.getByText("In the list");
        const row = note.parentElement;

        expect(row?.textContent).toBe("Ivan HorvatIn the list");
    });

    it("keeps the note on a disabled row and next to the icon column", () => {
        renderOption(
            createPickerOption({
                label: "Ivan Horvat",
                disabled: true,
                icon: "person",
                note: "In the list"
            })
        );

        expect(screen.getByText("In the list")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(document.querySelector('[data-picker-icon="person"]')).not.toBeNull();
    });
});
```

Modify `packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx`: add the case at the end of `describe("WorkflowPicker", ...)`.

Before:

```tsx
        expect(label.className).toContain("text-neutral-strong");
        expect(document.querySelector('[data-picker-icon="person_off"]')).not.toBeNull();
    });
});
```

After:

```tsx
        expect(label.className).toContain("text-neutral-strong");
        expect(document.querySelector('[data-picker-icon="person_off"]')).not.toBeNull();
    });

    it("lists a disabled option with its note in the row's text and does not pick it (R332)", async () => {
        const listed = createPickerOption({
            id: "u1",
            label: "Ivan Horvat",
            disabled: true,
            note: "In the list"
        });
        const props = createProps({ options: [LEGAL, listed] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        const label = await screen.findByText("Ivan Horvat");
        const rows = screen.getAllByRole("option");
        const row = rows.find(candidate => candidate.contains(label));

        expect(row?.textContent).toContain("Ivan Horvat");
        expect(row?.textContent).toContain("In the list");
        expect(row?.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(label);
        expect(props.onChange).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/components/picker/renderPickerOption.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/resolvePickerSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/toPickerCommandOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerOptionMappers.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/aiFormPure.test.ts 2>&1 | tail -30
```

Expected failures:
- `renderPickerOption.test.tsx`: the note cases fail (`Unable to find an element with the text: In the list`); "shows no note" passes.
- `WorkflowPicker.test.tsx`: the new case fails (`expected 'Ivan Horvat' to contain 'In the list'`).
- The other five files: every `toEqual(createPickerOption(...))` against a producer fails with the diff `+ "note": null` (the producers do not set it yet), e.g. "returns an unknown item for an id nobody knows", "puts the clear row first …", the `toUserPickerOption` / `toReferencePickerOption` / `toFolderPickerOption` cases, the pool and member cases, the retired-model case.

Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/components/picker/PickerOption.ts`.

Before:

```ts
    // The icon column of the row (R307); null for none.
    icon: PickerOptionIcon | null;
}
```

After:

```ts
    // The icon column of the row (R307); null for none.
    icon: PickerOptionIcon | null;
    /*
     * A short note on the right of the row (R332), e.g. `In the list`: muted small text, cut at
     * about half the row with the full text in `title`, part of the row's text; null for none.
     */
    note: string | null;
}
```

Modify `packages/app-workflows/src/components/picker/renderPickerOption.tsx`.

Before:

```tsx
// One option row of the list: the icon column, the label (muted for a muted option), the sub line and the option's warning.
export const renderPickerOption = (option: PickerOption): React.ReactNode => {
```

After:

```tsx
/*
 * One option row of the list: the icon column, the label (muted for a muted option), the sub line,
 * the option's warning and, on the right, its note (R332). The note stays inside the option, so it
 * is part of the row's accessible name, also on a disabled row.
 */
export const renderPickerOption = (option: PickerOption): React.ReactNode => {
```

Before:

```tsx
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

After:

```tsx
    let row: React.ReactNode = content;
    if (option.icon !== null) {
        row = (
            <div className={"flex items-start gap-sm"}>
                <PickerOptionIconView name={option.icon} muted={option.muted} />
                {content}
            </div>
        );
    }

    if (option.note === null) {
        return row;
    }

    return (
        <div className={"flex w-full items-start gap-sm"}>
            <div className={"min-w-0 flex-1"}>{row}</div>
            <Text
                size={"sm"}
                title={option.note}
                data-picker-note={""}
                className={"ml-auto max-w-[50%] shrink-0 truncate text-neutral-strong"}
            >
                {option.note}
            </Text>
        </div>
    );
};
```

Modify `packages/app-workflows/src/components/picker/toPickerCommandOptions.ts`.

Before:

```ts
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
```

After:

```ts
// The clear row (R307): no description, warning, flag, icon or note.
const toAnyOption = (label: string): PickerOption => {
    return {
        id: PICKER_ANY_VALUE,
        label,
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        note: null
    };
};
```

Modify `packages/app-workflows/src/components/picker/resolvePickerSelection.ts`.

Before:

```ts
            warning: PICKER_UNKNOWN_ITEM_WARNING,
            muted: false,
            disabled: false,
            icon: null
        };
```

After:

```ts
            warning: PICKER_UNKNOWN_ITEM_WARNING,
            muted: false,
            disabled: false,
            icon: null,
            note: null
        };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/toReferencePickerOption.ts`.

Before:

```ts
    const base = { id: label.id, label: label.label, description: null, warning: null };
```

After:

```ts
    const base = {
        id: label.id,
        label: label.label,
        description: null,
        warning: null,
        note: null
    };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/toUserPickerOption.ts`.

Before:

```ts
        muted: false,
        disabled: false,
        icon: "person"
    };
```

After:

```ts
        muted: false,
        disabled: false,
        icon: "person",
        note: null
    };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/toTeamPickerOption.ts`.

Before:

```ts
        muted: false,
        disabled: false,
        icon: "group"
    };
```

After:

```ts
        muted: false,
        disabled: false,
        icon: "group",
        note: null
    };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/toFolderPickerOption.ts`.

Before:

```ts
        muted: false,
        disabled: false,
        icon: "folder"
    };
```

After:

```ts
        muted: false,
        disabled: false,
        icon: "folder",
        note: null
    };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/getAiModelOptions.ts` (three literals).

Before:

```ts
        description: model.providerName,
        warning: null,
        muted: false,
        disabled: false,
        icon: null
    };
}
```

After:

```ts
        description: model.providerName,
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        note: null
    };
}
```

Before:

```ts
                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`,
                muted: false,
                disabled: false,
                icon: null
            };
```

After:

```ts
                warning: `The AI model “${selectedId}” is no longer offered. Choose another model; until then this step fails when reached.`,
                muted: false,
                disabled: false,
                icon: null,
                note: null
            };
```

Before:

```ts
                label: selectedId,
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: null
            };
```

After:

```ts
                label: selectedId,
                description: null,
                warning: null,
                muted: false,
                disabled: false,
                icon: null,
                note: null
            };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/getUnresolvedReferenceOption.ts`.

Before:

```ts
        muted: true,
        disabled: false,
        icon: null
    };
```

After:

```ts
        muted: true,
        disabled: false,
        icon: null,
        note: null
    };
```

Modify `packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.ts`.

Before:

```ts
        muted: false,
        disabled: false,
        icon: "groups"
    };
```

After:

```ts
        muted: false,
        disabled: false,
        icon: "groups",
        note: null
    };
```

Then confirm no literal is left: `grep -rn "icon: " packages/app-workflows/src --include='*.ts' --include='*.tsx' | grep -v "\.test\." | grep -v "note"` lists only lines whose object already gained `note` on the next line, the `PickerOption.ts` field, `PickerOptionIconView.tsx` and non-option objects (the build in Step 5 is the authority: a missing `note` is a TypeScript error).

- [ ] **Step 4: Run the new and changed tests, expect pass**

Run the seven commands of Step 2 again.

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/components/picker/WorkflowMultiPicker.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/components/picker/limitPickerOptions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/components/picker/usePickerRemountKey.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/getReferenceSelection.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerHelpers.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/UserPickerControl.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/FolderPickerControl.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TeamsPickerRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/AiModelPickerRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/RoutingRulesRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCard.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/TestRoutingRenderer.test.tsx 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawerPresenter.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/editor/presentation/stepDrawer/StepDrawer.people.test.tsx 2>&1 | tail -20
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors (the two app packages import the picker by deep path and build no option literal; their builds prove it).

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
git commit -m "feat(app-workflows): show an optional note on picker options" -m "A picker option can carry a short note, shown on the right in muted small text, cut at about half the row with the full text in its title and kept on a disabled row. Every existing option sets no note." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No conflicts with the code.** The contract names `[AWE]/presentation/stepForm/to*PickerOption.ts` mappers: they are `toReferencePickerOption`, `toUserPickerOption`, `toTeamPickerOption` and `toFolderPickerOption`; with `getAiModelOptions.ts` (three literals), `getUnresolvedReferenceOption.ts`, `getRuleTargetOptions.ts` (the pool; the member option spreads `toUserPickerOption`), `resolvePickerSelection.ts`, `toPickerCommandOptions.ts` and `createPickerOption.ts` that is every literal (grep and the build). The review package's `ReviewerPickerOptionVm` is a different type and is not touched.
- **No existing test file is edited for literals:** every test option is built with `createPickerOption`, so its new default `note: null` turns the existing `toEqual` assertions into the check that each producer sets the field (the RED of Step 2).
- **`data-picker-note`** is a test hook like the 9b `data-picker-icon`.
- **`max-w-[50%]`** is an arbitrary Tailwind value; app-workflows already uses arbitrary values (`h-[8px]`, `min-w-[280px]`).
- Size: small (one renderer change, eleven one-line literal changes, two test files).

## Review fixes (sub-phase review)

- No changes. Verified: every hunk applies to the current files (the eleven literals found by grep, `createPickerOption`, both test anchors); cmdk's `Command.Item` renders `role="option"` with `aria-disabled` from the `disabled` prop that admin-ui's `AutoCompleteList` passes, so the new `WorkflowPicker` case's `aria-disabled === "true"` holds; admin-ui `Text` forwards `title` and `data-*` attributes; admin-ui's `cn` keeps `text-sm` (font-size group) and `text-neutral-strong` (colour) together.
