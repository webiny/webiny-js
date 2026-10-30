### Task 19b: User and folder renderers, option mappers, `user` hint

R292, R298, R299, R307, R315; D117, D122; Q54, Q59.1, QBZ-7, QBZ-15; design README 9 and `research-spec.md` 4.2, 4.4, 4.6, 7; Review Focus 4. The pieces every rule field and the Automation `user` hint need: pure option mappers (a user, a folder, a saved reference in each state, a rule target), the two picker controls (user and folder) and the two field renderers that wrap them (`workflowUserPicker`, `workflowFolderPicker`), and the `user` ui hint of an Automation setting.

- **Mappers (R307, R298):** `toUserPickerOption(user, teamNames?)` (display name, `person` icon, sub line = the names of the user's teams that are known, joined `, `), `toFolderPickerOption(folder)` (the path is the label, `folder` icon), `toReferencePickerOption(label, kind)` (a saved reference by state: found = the name with the kind's icon; deleted user = muted `Deleted user` with `person_off`; deleted team = muted `Deleted team` with `group_off`; deleted folder = `Deleted folder`, not muted, no icon (design ED:772); restricted folder = muted `Restricted folder` with `lock`, disabled; the label text always comes from the `ReferenceLabel`, so a state's copy lives in one place, Task 11).
- **Saved value never shows empty (D117, R298):** `getReferenceSelection({ id, kind, known, references })` returns the option a picker shows for a saved id: a known option (a pick or a search result) first, else the resolved reference through `toReferencePickerOption`, else, while the resolution is running or failed, the neutral option `Searching…` (muted, `PICKER_LOADING_LABEL`), else `null` (the picker then shows `Unknown item` with `This item no longer exists.`: the lookup finished and did not know the id). A picked value is known locally and is never re-resolved.
- **Rule target options (R307):** `getRuleTargetOptions({ stepTeamIds, teamNames, members, target, references })` lists one `{Team} team pool` per reviewing team (value `team:<id>`, `groups` icon), then the members of the reviewing teams (value `user:<id>`, sub line = their team names), and resolves the saved target to the option the picker shows: a pool or member as listed, or, when the saved target left the reviewing teams, `{Name} (not in reviewing teams)` (a user whose teams are known and none is a step team; a team that is not a step team), `Deleted user` or `Deleted team` (muted) for a deleted one, `Searching…` while unresolved. The option ids are `toRuleTargetOptionId(target)` / `parseRuleTargetOptionId(id)` (`user:<id>`, `team:<id>`, split at the first colon).
- **Folders (R292):** the complete folder list is filtered client side by `filterPickerOptions(options, query)` (case-insensitive, on the path). `isRestrictedFolder(id, folders, references)` is true for an id that the list does not contain and whose reference state is `restricted`; the folder control then disables the picker, shows `Remove` (title `Remove the folder condition`, calls `onRemove`) and the hint `You can't see this folder. The condition stays as it is unless you remove it.` (QBZ-15). A listed folder is never restricted, whatever the reference map says.
- **Controls (the renderers and Task 21 share them):** `UserPickerControl` (a `WorkflowPicker` over `users.items` with the saved value resolved by `getReferenceSelection`; a failed list shows the R281 banner `Could not load the step options.` with `Try again` in place of the picker, `users.retry`) and `FolderPickerControl` (the same over `folders.items`, plus the restricted state). Both take their data as props; the renderers read `useStepFormOptions()`, the rule card reads the same slices.
- **Renderers:** `UserPickerRenderer` (`workflowUserPicker`, a `text` field: the Automation `user` hint) and `FolderPickerRenderer` (`workflowFolderPicker`, a `text` field holding a folder id). Both are thin wrappers (label, description, required, disabled, error from the field; `Search users` / `Search folders` placeholders). No 9b form field uses `workflowFolderPicker` (the rule card and Test routing use the control or a plain picker); it is registered because the contract names it.
- **`user` hint:** `buildAutomationStepForm` maps `ui: "user"` to `workflowUserPicker`; `getUserSettingKeys(schema)` (`~/editor/model/getUserSettingKeys.js`, created by Task 14) and `hasUserSetting(schema)` (`presentation/stepForm/hasUserSetting.ts`, created by Task 16) tell the presenter when to ask for the first user results and which ids to resolve.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`)
- Create: `[STEP]/stepForm/toUserPickerOption.ts`, `toFolderPickerOption.ts`, `toReferencePickerOption.ts`, `getUnresolvedReferenceOption.ts`, `getReferenceSelection.ts`, `getTeamNames.ts`, `isRestrictedFolder.ts`, `filterPickerOptions.ts`, `toRuleTargetOptionId.ts`, `parseRuleTargetOptionId.ts`, `getRuleTargetOptions.ts`
- Create: `[STEP]/stepForm/components/PickerLoadFailed.tsx`, `UserPickerControl.tsx`, `FolderPickerControl.tsx`
- Create: `[STEP]/stepForm/renderers/UserPickerRenderer.tsx`, `FolderPickerRenderer.tsx`
- Modify: `[STEP]/stepForm/buildAutomationStepForm.ts`
- Modify: `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, `WorkflowEditorConfig.test.tsx`
- Create: `packages/app-workflows/src/editor/testing/workflowPickerStub.tsx`, `stepFormOptionsFixtures.ts`
- Create tests: `[STEP]/stepForm/pickerOptionMappers.test.ts`, `getReferenceSelection.test.ts`, `getRuleTargetOptions.test.ts`, `pickerHelpers.test.ts`, `ruleTargetOptionIds.test.ts`, `components/UserPickerControl.test.tsx`, `components/FolderPickerControl.test.tsx`, `renderers/UserPickerRenderer.test.tsx`, `renderers/FolderPickerRenderer.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): `WorkflowPicker` (`~/components/picker/WorkflowPicker.js`), `PickerOption`, `PICKER_UNKNOWN_ITEM_LABEL`, `createFieldRenderer`, `useStepFormOptions`, `STEP_FORM_MESSAGES.optionsFailed` / `.tryAgain`, `STEP_FORM_RENDERER`, `buildAutomationStepForm`, `getTeamSettingKeys` (pattern), `hasTeamSetting` (pattern), `createWebhookAutomation`, `renderStepFormField`, `createStepFormOptions`, `createTestFormModelFactory`, `renderWithAdminUi`, admin-ui `Alert`, `Button`, `FormComponentLabel`, `Text`.
- Consumes (earlier tasks, as their task files specify; verify each): Task 19 (`PickerOption.muted | disabled | icon`, `PickerOptionIcon`, `PICKER_LOADING_LABEL`, `WorkflowPicker.anyLabel`, `createPickerOption`); Task 18 (`StepFormOptions` slices `StepFormUsersOptions`, `StepFormTargetMembersOptions`, `StepFormFoldersOptions`, `StepFormReferencesOptions`, `StepFormTeamsOptions`, `ASSIGNMENT_FORM_MESSAGES`, the `workflowUserPicker` / `workflowFolderPicker` names and augmentations); Task 6 (`WorkflowUserSummary`, `createWorkflowUserSummary` in `[AWET]/editorFixtures.ts`); Task 8 (`AppFolder`, `createAppFolder`); Task 9 (`RuleTargetValue`); Task 11 (`ReferenceLabel`, `ReferenceKind`, `createReferenceLabel`, `createRuleReferences`, `RuleReferenceEntries` in `[AWET]/ruleFixtures.ts`).
- Produces: the mappers and helpers above (signatures in the code below), `UserPickerControl` and `FolderPickerControl` with their props interfaces, renderers `workflowUserPicker` and `workflowFolderPicker`, the test kit `workflowPickerStub.tsx` (`WorkflowPickerStub`, `WORKFLOW_PICKER_STUB_SEARCH`) and `stepFormOptionsFixtures.ts` (`createAssignmentSlice`, `createUsersSlice`, `createTargetMembersSlice`, `createFoldersSlice`, `createReferencesSlice`, `createRuleErrorsSlice`, `createRuleIssuesSlice`; Tasks 21 and 21b import them).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/workflowPickerStub.tsx` (a stand-in for the shared picker: the data attributes show what the caller passed, and one button per option, a clear button and a search button drive the callbacks; the setup stubs every SVG, so icons are read from the option data, not from the DOM):

```tsx
import React from "react";
import type { WorkflowPickerProps } from "~/components/picker/WorkflowPicker.js";

// The text the stub's search button reports to `onSearch`.
export const WORKFLOW_PICKER_STUB_SEARCH = "camp";

/*
 * Replaces `WorkflowPicker` in the tests of its callers (`vi.mock("~/components/picker/WorkflowPicker.js", ...)`).
 * `data-testid` is `picker-{label}`; `data-option-details` is the options as JSON.
 */
export const WorkflowPickerStub = (props: WorkflowPickerProps) => {
    const optionIds = props.options.map(option => option.id).join(",");
    const details = JSON.stringify(props.options);
    const selected = props.selected;

    return (
        <div
            data-testid={`picker-${props.label}`}
            data-label={props.label}
            data-description={props.description ?? ""}
            data-required={String(props.required ?? false)}
            data-value={props.value ?? ""}
            data-selected={selected === null ? "" : selected.label}
            data-selected-id={selected === null ? "" : selected.id}
            data-selected-icon={selected === null ? "" : (selected.icon ?? "")}
            data-selected-muted={String(selected === null ? false : selected.muted)}
            data-selected-disabled={String(selected === null ? false : selected.disabled)}
            data-options={optionIds}
            data-option-details={details}
            data-placeholder={props.placeholder}
            data-any-label={props.anyLabel ?? ""}
            data-disabled={String(props.disabled)}
            data-error={props.error ?? ""}
        >
            {props.options.map(option => (
                <button
                    key={option.id}
                    type={"button"}
                    aria-label={`${props.label}: choose ${option.label}`}
                    onClick={() => props.onChange(option.id)}
                >
                    {option.label}
                </button>
            ))}
            <button
                type={"button"}
                aria-label={`${props.label}: clear`}
                onClick={() => props.onChange(null)}
            >
                clear
            </button>
            <button
                type={"button"}
                aria-label={`${props.label}: search`}
                onClick={() => props.onSearch(WORKFLOW_PICKER_STUB_SEARCH)}
            >
                search
            </button>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/testing/stepFormOptionsFixtures.ts` (pure builders over `createEmptyStepFormOptions`; override what a test needs):

```ts
import type { RuleReferenceEntries } from "~/editor/testing/ruleFixtures.js";
import { createRuleReferences } from "~/editor/testing/ruleFixtures.js";
import { createEmptyStepFormOptions } from "~/editor/presentation/stepForm/createEmptyStepFormOptions.js";
import type { StepFormAssignmentOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormFoldersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormListState } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormReferencesOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormRuleErrorsOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormRuleIssuesOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormTargetMembersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import type { StepFormUsersOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";

export const createAssignmentSlice = (
    overrides: Partial<StepFormAssignmentOptions> = {}
): StepFormAssignmentOptions => {
    return { ...createEmptyStepFormOptions().assignment, ...overrides };
};

export const createUsersSlice = (
    overrides: Partial<StepFormUsersOptions> = {}
): StepFormUsersOptions => {
    return { ...createEmptyStepFormOptions().users, ...overrides };
};

export const createTargetMembersSlice = (
    overrides: Partial<StepFormTargetMembersOptions> = {}
): StepFormTargetMembersOptions => {
    return { ...createEmptyStepFormOptions().targetMembers, ...overrides };
};

export const createFoldersSlice = (
    overrides: Partial<StepFormFoldersOptions> = {}
): StepFormFoldersOptions => {
    return { ...createEmptyStepFormOptions().folders, ...overrides };
};

// The resolved references from `createRuleReferences` entries, and the resolution state on top.
export const createReferencesSlice = (
    entries: RuleReferenceEntries = {},
    state: Partial<StepFormListState> = {}
): StepFormReferencesOptions => {
    return {
        ...createEmptyStepFormOptions().references,
        ...createRuleReferences(entries),
        ...state
    };
};

export const createRuleErrorsSlice = (
    overrides: Partial<StepFormRuleErrorsOptions> = {}
): StepFormRuleErrorsOptions => {
    return { ...createEmptyStepFormOptions().ruleErrors, ...overrides };
};

export const createRuleIssuesSlice = (
    overrides: Partial<StepFormRuleIssuesOptions> = {}
): StepFormRuleIssuesOptions => {
    return { ...createEmptyStepFormOptions().ruleIssues, ...overrides };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/pickerOptionMappers.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { toFolderPickerOption } from "./toFolderPickerOption.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";
import { toUserPickerOption } from "./toUserPickerOption.js";

const TEAM_NAMES = new Map([
    ["team-1", "Legal"],
    ["team-2", "Marketing"]
]);

describe("toUserPickerOption (R307)", () => {
    it("is the display name with the person icon and no sub line when no team name is known", () => {
        const user = createWorkflowUserSummary({ id: "user-1", displayName: "Ivan Horvat" });

        expect(toUserPickerOption(user)).toEqual(
            createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" })
        );
    });

    it("lists the known team names of the user, in the user's order, as the sub line", () => {
        const user = createWorkflowUserSummary({
            id: "user-1",
            displayName: "Ivan Horvat",
            teamIds: ["team-2", "team-9", "team-1"]
        });

        const option = toUserPickerOption(user, TEAM_NAMES);

        expect(option.description).toBe("Marketing, Legal");
    });

    it("has no sub line when no team of the user has a known name", () => {
        const user = createWorkflowUserSummary({ teamIds: ["team-9"] });

        expect(toUserPickerOption(user, TEAM_NAMES).description).toBeNull();
    });
});

describe("toFolderPickerOption (R292, R307)", () => {
    it("is the path as the label with the folder icon", () => {
        const folder = createAppFolder({ id: "folder-1", path: "/Campaigns/Spring" });

        expect(toFolderPickerOption(folder)).toEqual(
            createPickerOption({ id: "folder-1", label: "/Campaigns/Spring", icon: "folder" })
        );
    });
});

describe("toReferencePickerOption (R298, D117)", () => {
    it("shows a found user, team and folder by name with the icon of its kind", () => {
        const user = createReferenceLabel({ id: "user-1", label: "Ivan Horvat" });
        const team = createReferenceLabel({ id: "team-1", label: "Marketing" });
        const folder = createReferenceLabel({ id: "folder-1", label: "/Campaigns" });

        expect(toReferencePickerOption(user, "user")).toEqual(
            createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" })
        );
        expect(toReferencePickerOption(team, "team")).toEqual(
            createPickerOption({ id: "team-1", label: "Marketing", icon: "group" })
        );
        expect(toReferencePickerOption(folder, "folder")).toEqual(
            createPickerOption({ id: "folder-1", label: "/Campaigns", icon: "folder" })
        );
    });

    it("shows a deleted user as muted Deleted user with the person_off icon", () => {
        const label = createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" });

        expect(toReferencePickerOption(label, "user")).toEqual(
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows a deleted team as muted Deleted team with the group_off icon", () => {
        const label = createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" });

        expect(toReferencePickerOption(label, "team")).toEqual(
            createPickerOption({
                id: "team-9",
                label: "Deleted team",
                muted: true,
                icon: "group_off"
            })
        );
    });

    it("shows a deleted folder as Deleted folder, not muted and with no icon", () => {
        const label = createReferenceLabel({ id: "f9", label: "Deleted folder", state: "deleted" });

        expect(toReferencePickerOption(label, "folder")).toEqual(
            createPickerOption({ id: "f9", label: "Deleted folder" })
        );
    });

    it("shows a restricted folder as muted, disabled Restricted folder with the lock icon", () => {
        const label = createReferenceLabel({
            id: "f9",
            label: "Restricted folder",
            state: "restricted"
        });

        expect(toReferencePickerOption(label, "folder")).toEqual(
            createPickerOption({
                id: "f9",
                label: "Restricted folder",
                muted: true,
                disabled: true,
                icon: "lock"
            })
        );
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getReferenceSelection.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { getReferenceSelection } from "./getReferenceSelection.js";

const IVAN = createPickerOption({ id: "user-1", label: "Ivan Horvat", icon: "person" });

describe("getReferenceSelection (R298, D117)", () => {
    it("is null for no value", () => {
        const selection = getReferenceSelection({
            id: null,
            kind: "user",
            known: [IVAN],
            references: createReferencesSlice()
        });

        expect(selection).toBeNull();
    });

    it("prefers a known option (a pick or a search result) over the resolved reference", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-1", label: "Deleted user", state: "deleted" })]
        });

        const selection = getReferenceSelection({
            id: "user-1",
            kind: "user",
            known: [IVAN],
            references
        });

        expect(selection).toEqual(IVAN);
    });

    it("uses the resolved reference of the kind when nothing known has the id", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-2", label: "Ana Kovač" })],
            teams: [createReferenceLabel({ id: "team-2", label: "Marketing" })],
            folders: [createReferenceLabel({ id: "folder-2", label: "/Partners" })]
        });

        const user = getReferenceSelection({ id: "user-2", kind: "user", known: [], references });
        const team = getReferenceSelection({ id: "team-2", kind: "team", known: [], references });
        const folder = getReferenceSelection({
            id: "folder-2",
            kind: "folder",
            known: [],
            references
        });

        expect(user?.label).toBe("Ana Kovač");
        expect(team?.label).toBe("Marketing");
        expect(folder?.label).toBe("/Partners");
    });

    it("looks only in the map of its kind", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "x", label: "Marketing" })]
        });

        const selection = getReferenceSelection({ id: "x", kind: "user", known: [], references });

        expect(selection).toBeNull();
    });

    it("shows a deleted reference as its muted label", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });

        const selection = getReferenceSelection({ id: "user-9", kind: "user", known: [], references });

        expect(selection).toEqual(
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows the neutral Searching label for an unresolved id while the resolution runs or after it failed", () => {
        const loading = createReferencesSlice({}, { loading: true });
        const failed = createReferencesSlice({}, { failed: true });

        const whileLoading = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: loading
        });
        const afterFailure = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: failed
        });

        const expected = createPickerOption({ id: "user-3", label: "Searching…", muted: true });
        expect(whileLoading).toEqual(expected);
        expect(afterFailure).toEqual(expected);
    });

    it("is null for an unresolved id once the resolution settled (the picker shows Unknown item)", () => {
        const selection = getReferenceSelection({
            id: "user-3",
            kind: "user",
            known: [],
            references: createReferencesSlice()
        });

        expect(selection).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/ruleTargetOptionIds.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { parseRuleTargetOptionId } from "./parseRuleTargetOptionId.js";
import { toRuleTargetOptionId } from "./toRuleTargetOptionId.js";

describe("rule target option ids (R307)", () => {
    it("writes the type and the id", () => {
        expect(toRuleTargetOptionId({ type: "user", id: "user-1" })).toBe("user:user-1");
        expect(toRuleTargetOptionId({ type: "team", id: "team-1" })).toBe("team:team-1");
    });

    it("reads back what it wrote", () => {
        expect(parseRuleTargetOptionId("user:user-1")).toEqual({ type: "user", id: "user-1" });
        expect(parseRuleTargetOptionId("team:team-1")).toEqual({ type: "team", id: "team-1" });
    });

    it("splits at the first colon only, so an id may contain one", () => {
        expect(parseRuleTargetOptionId("user:a:b")).toEqual({ type: "user", id: "a:b" });
    });

    it("is null for a type that is not user or team, an empty id and a value with no colon", () => {
        expect(parseRuleTargetOptionId("group:1")).toBeNull();
        expect(parseRuleTargetOptionId("user:")).toBeNull();
        expect(parseRuleTargetOptionId("user")).toBeNull();
        expect(parseRuleTargetOptionId("")).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/pickerHelpers.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createEmptyStepFormOptions } from "./createEmptyStepFormOptions.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { filterPickerOptions } from "./filterPickerOptions.js";
import { getTeamNames } from "./getTeamNames.js";
import { isRestrictedFolder } from "./isRestrictedFolder.js";

describe("getTeamNames (R307)", () => {
    it("unites the team search results, the chosen teams and the found rule teams", () => {
        const teams = {
            ...createEmptyStepFormOptions().teams,
            options: [createPickerOption({ id: "team-1", label: "Legal" })],
            selected: [createPickerOption({ id: "team-2", label: "Marketing" })]
        };
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-3", label: "Press" })]
        });

        const names = getTeamNames(teams, references);

        expect(names.size).toBe(3);
        expect(names.get("team-1")).toBe("Legal");
        expect(names.get("team-2")).toBe("Marketing");
        expect(names.get("team-3")).toBe("Press");
    });

    it("leaves out a deleted rule team and lets the chosen label win over a search result", () => {
        const teams = {
            ...createEmptyStepFormOptions().teams,
            options: [createPickerOption({ id: "team-1", label: "Legal (old)" })],
            selected: [createPickerOption({ id: "team-1", label: "Legal" })]
        };
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" })]
        });

        const names = getTeamNames(teams, references);

        expect(names.get("team-1")).toBe("Legal");
        expect(names.has("team-9")).toBe(false);
    });
});

describe("isRestrictedFolder (R292, QBZ-15)", () => {
    const folders = createFoldersSlice({ items: [createAppFolder({ id: "folder-1" })] });

    it("is true for an id the list does not contain whose reference is restricted", () => {
        const references = createReferencesSlice({
            folders: [createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })]
        });

        expect(isRestrictedFolder("f9", folders, references)).toBe(true);
    });

    it("is false for a listed folder, whatever the reference says", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "folder-1", label: "Restricted folder", state: "restricted" })
            ]
        });

        expect(isRestrictedFolder("folder-1", folders, references)).toBe(false);
    });

    it("is false for no value, a deleted folder, a found one and an unresolved one", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" }),
                createReferenceLabel({ id: "f7", label: "/Other" })
            ]
        });

        expect(isRestrictedFolder(null, folders, references)).toBe(false);
        expect(isRestrictedFolder("f8", folders, references)).toBe(false);
        expect(isRestrictedFolder("f7", folders, references)).toBe(false);
        expect(isRestrictedFolder("f6", folders, references)).toBe(false);
    });
});

describe("filterPickerOptions (R292)", () => {
    const options = [
        createPickerOption({ id: "f1", label: "/Campaigns" }),
        createPickerOption({ id: "f2", label: "/Partners" }),
        createPickerOption({ id: "f3", label: "/Campaigns/Spring" })
    ];

    it("returns every option for an empty or blank search", () => {
        expect(filterPickerOptions(options, "")).toEqual(options);
        expect(filterPickerOptions(options, "   ")).toEqual(options);
    });

    it("matches the label case-insensitively and keeps the order", () => {
        expect(filterPickerOptions(options, "CAMP").map(option => option.id)).toEqual(["f1", "f3"]);
        expect(filterPickerOptions(options, " part ").map(option => option.id)).toEqual(["f2"]);
    });

    it("returns nothing when nothing matches", () => {
        expect(filterPickerOptions(options, "zzz")).toEqual([]);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createTargetMembersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { getRuleTargetOptions } from "./getRuleTargetOptions.js";
import type { RuleTargetOptionsParams } from "./getRuleTargetOptions.js";

const TEAM_NAMES = new Map([
    ["team-1", "Legal"],
    ["team-2", "Marketing"]
]);
const IVAN = createWorkflowUserSummary({
    id: "user-1",
    displayName: "Ivan Horvat",
    teamIds: ["team-1"]
});
const ANA = createWorkflowUserSummary({
    id: "user-2",
    displayName: "Ana Kovač",
    teamIds: ["team-1", "team-2"]
});

const createParams = (overrides: Partial<RuleTargetOptionsParams> = {}): RuleTargetOptionsParams => {
    return {
        stepTeamIds: ["team-1", "team-2"],
        teamNames: TEAM_NAMES,
        members: createTargetMembersSlice({ items: [IVAN, ANA] }),
        target: null,
        references: createReferencesSlice(),
        ...overrides
    };
};

describe("getRuleTargetOptions: the list (R307)", () => {
    it("lists one team pool per reviewing team, then the members with their team names", () => {
        const { options } = getRuleTargetOptions(createParams());

        expect(options).toEqual([
            createPickerOption({ id: "team:team-1", label: "Legal team pool", icon: "groups" }),
            createPickerOption({ id: "team:team-2", label: "Marketing team pool", icon: "groups" }),
            createPickerOption({
                id: "user:user-1",
                label: "Ivan Horvat",
                description: "Legal",
                icon: "person"
            }),
            createPickerOption({
                id: "user:user-2",
                label: "Ana Kovač",
                description: "Legal, Marketing",
                icon: "person"
            })
        ]);
    });

    it("names a team pool with Unknown item when its team name is not known", () => {
        const { options } = getRuleTargetOptions(
            createParams({ stepTeamIds: ["team-9"], members: createTargetMembersSlice() })
        );

        expect(options[0].label).toBe("Unknown item team pool");
    });

    it("lists no pool for a step with no teams and selects nothing for no target", () => {
        const result = getRuleTargetOptions(
            createParams({ stepTeamIds: [], members: createTargetMembersSlice() })
        );

        expect(result).toEqual({ options: [], selected: null });
    });
});

describe("getRuleTargetOptions: a saved team target", () => {
    it("selects the pool of a reviewing team", () => {
        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-2" } })
        );

        expect(selected).toEqual(
            createPickerOption({ id: "team:team-2", label: "Marketing team pool", icon: "groups" })
        );
    });

    it("lists a team outside the reviewing teams as {Name} (not in reviewing teams)", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-3", label: "Press" })]
        });

        const { selected, options } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-3" }, references })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "team:team-3",
                label: "Press (not in reviewing teams)",
                icon: "group"
            })
        );
        expect(options.map(option => option.id)).not.toContain("team:team-3");
    });

    it("shows a deleted team as muted Deleted team", () => {
        const references = createReferencesSlice({
            teams: [createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" })]
        });

        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "team", id: "team-9" }, references })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "team:team-9",
                label: "Deleted team",
                muted: true,
                icon: "group_off"
            })
        );
    });

    it("shows the neutral Searching label while an outside team is unresolved, and nothing once it settled", () => {
        const target = { type: "team", id: "team-3" } as const;

        const loading = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { loading: true }) })
        );
        const settled = getRuleTargetOptions(createParams({ target }));

        expect(loading.selected).toEqual(
            createPickerOption({ id: "team:team-3", label: "Searching…", muted: true })
        );
        expect(settled.selected).toBeNull();
    });
});

describe("getRuleTargetOptions: a saved user target", () => {
    it("selects a listed member as listed", () => {
        const { selected } = getRuleTargetOptions(
            createParams({ target: { type: "user", id: "user-2" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-2",
                label: "Ana Kovač",
                description: "Legal, Marketing",
                icon: "person"
            })
        );
    });

    it("lists a known user whose teams left the reviewing teams as {Name} (not in reviewing teams)", () => {
        const left = createWorkflowUserSummary({
            id: "user-3",
            displayName: "Luka Perić",
            teamIds: ["team-9"]
        });
        const members = createTargetMembersSlice({ items: [IVAN], selected: [left] });

        const { selected } = getRuleTargetOptions(
            createParams({ members, target: { type: "user", id: "user-3" } })
        );

        expect(selected?.id).toBe("user:user-3");
        expect(selected?.label).toBe("Luka Perić (not in reviewing teams)");
    });

    it("resolves a user nobody listed through the references and flags it by its known teams", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-4", label: "Maja Kos" })],
            userTeamIds: { "user-4": ["team-9"] }
        });

        const { selected } = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-4" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-4",
                label: "Maja Kos (not in reviewing teams)",
                icon: "person"
            })
        );
    });

    it("does not flag a resolved user whose teams are unknown or include a reviewing team", () => {
        const references = createReferencesSlice({
            users: [
                createReferenceLabel({ id: "user-4", label: "Maja Kos" }),
                createReferenceLabel({ id: "user-5", label: "Tin Babić" })
            ],
            userTeamIds: { "user-5": ["team-2"] }
        });

        const unknownTeams = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-4" } })
        );
        const inTeam = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-5" } })
        );

        expect(unknownTeams.selected?.label).toBe("Maja Kos");
        expect(inTeam.selected?.label).toBe("Tin Babić");
    });

    it("shows a deleted user as muted Deleted user", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });

        const { selected } = getRuleTargetOptions(
            createParams({ references, target: { type: "user", id: "user-9" } })
        );

        expect(selected).toEqual(
            createPickerOption({
                id: "user:user-9",
                label: "Deleted user",
                muted: true,
                icon: "person_off"
            })
        );
    });

    it("shows the neutral Searching label while an unlisted user is unresolved or the lookup failed, and nothing once it settled", () => {
        const target = { type: "user", id: "user-8" } as const;

        const loading = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { loading: true }) })
        );
        const failed = getRuleTargetOptions(
            createParams({ target, references: createReferencesSlice({}, { failed: true }) })
        );
        const settled = getRuleTargetOptions(createParams({ target }));

        const expected = createPickerOption({ id: "user:user-8", label: "Searching…", muted: true });
        expect(loading.selected).toEqual(expected);
        expect(failed.selected).toEqual(expected);
        expect(settled.selected).toBeNull();
    });
});

describe("getRuleTargetOptions: what the editor does not show (Q50)", () => {
    it("lists no Unavailable note and no read-access warning on any option", () => {
        const { options } = getRuleTargetOptions(createParams());

        for (const option of options) {
            expect(option.warning).toBeNull();
            expect(option.description ?? "").not.toMatch(/unavailable|excluded|can't read/i);
        }
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/UserPickerControl.test.tsx`:

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
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createUsersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { WORKFLOW_PICKER_STUB_SEARCH } from "~/editor/testing/workflowPickerStub.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { UserPickerControl } from "./UserPickerControl.js";
import type { UserPickerControlProps } from "./UserPickerControl.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const IVAN = createWorkflowUserSummary({
    id: "user-1",
    displayName: "Ivan Horvat",
    teamIds: ["team-1"]
});
const ANA = createWorkflowUserSummary({
    id: "user-2",
    displayName: "Ana Kovač",
    teamIds: ["team-2"]
});
const TEAM_NAMES = new Map([
    ["team-1", "Legal"],
    ["team-2", "Marketing"]
]);

const createProps = (overrides: Partial<UserPickerControlProps> = {}): UserPickerControlProps => {
    return {
        label: "Requester is",
        placeholder: "Search users",
        anyLabel: "Anyone",
        value: null,
        users: createUsersSlice({ items: [IVAN, ANA] }),
        references: createReferencesSlice(),
        teamNames: TEAM_NAMES,
        disabled: false,
        error: null,
        onChange: vi.fn(),
        ...overrides
    };
};

const getPicker = () => {
    return screen.getByTestId("picker-Requester is");
};

const getOptionDetails = (): PickerOption[] => {
    return JSON.parse(getPicker().getAttribute("data-option-details") ?? "[]");
};

describe("UserPickerControl (R307, R315)", () => {
    afterEach(() => {
        cleanup();
    });

    it("passes the label, description, placeholder, clear row, required marker, disabled flag and error to the picker", () => {
        renderWithAdminUi(
            <UserPickerControl
                {...createProps({
                    description: "Who asks.",
                    required: true,
                    disabled: true,
                    error: "Pick someone."
                })}
            />
        );

        const picker = getPicker();
        expect(picker.getAttribute("data-label")).toBe("Requester is");
        expect(picker.getAttribute("data-description")).toBe("Who asks.");
        expect(picker.getAttribute("data-placeholder")).toBe("Search users");
        expect(picker.getAttribute("data-any-label")).toBe("Anyone");
        expect(picker.getAttribute("data-required")).toBe("true");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(picker.getAttribute("data-error")).toBe("Pick someone.");
    });

    it("lists the users with the person icon and their team names as the sub line", () => {
        renderWithAdminUi(<UserPickerControl {...createProps()} />);

        const details = getOptionDetails();

        expect(details.map(option => option.label)).toEqual(["Ivan Horvat", "Ana Kovač"]);
        expect(details.map(option => option.description)).toEqual(["Legal", "Marketing"]);
        expect(details.map(option => option.icon)).toEqual(["person", "person"]);
    });

    it("shows a saved user the search results contain", () => {
        renderWithAdminUi(<UserPickerControl {...createProps({ value: "user-2" })} />);

        expect(getPicker().getAttribute("data-value")).toBe("user-2");
        expect(getPicker().getAttribute("data-selected")).toBe("Ana Kovač");
    });

    it("shows a saved user beyond the first results through the known users", () => {
        const users = createUsersSlice({ items: [IVAN], selected: [ANA] });
        renderWithAdminUi(<UserPickerControl {...createProps({ users, value: "user-2" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("Ana Kovač");
    });

    it("shows a saved user resolved by id from the references", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-7", label: "Maja Kos" })]
        });
        renderWithAdminUi(<UserPickerControl {...createProps({ references, value: "user-7" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("Maja Kos");
    });

    it("shows a deleted user as muted Deleted user with the person_off icon", () => {
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });
        renderWithAdminUi(<UserPickerControl {...createProps({ references, value: "user-9" })} />);

        const picker = getPicker();
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
        expect(picker.getAttribute("data-selected-icon")).toBe("person_off");
    });

    it("shows the neutral Searching label for an unresolved id while resolving or after a failure", () => {
        const loading = createReferencesSlice({}, { loading: true });
        renderWithAdminUi(
            <UserPickerControl {...createProps({ references: loading, value: "user-8" })} />
        );

        expect(getPicker().getAttribute("data-selected")).toBe("Searching…");
        expect(getPicker().getAttribute("data-selected-muted")).toBe("true");

        cleanup();
        const failed = createReferencesSlice({}, { failed: true });
        renderWithAdminUi(
            <UserPickerControl {...createProps({ references: failed, value: "user-8" })} />
        );

        expect(getPicker().getAttribute("data-selected")).toBe("Searching…");
    });

    it("hands an id nobody knows to the picker with no selected option (it shows Unknown item)", () => {
        renderWithAdminUi(<UserPickerControl {...createProps({ value: "user-8" })} />);

        expect(getPicker().getAttribute("data-value")).toBe("user-8");
        expect(getPicker().getAttribute("data-selected")).toBe("");
    });

    it("forwards a search to the users slice", () => {
        const searchUsers = vi.fn();
        const users = createUsersSlice({ items: [IVAN], searchUsers });
        renderWithAdminUi(<UserPickerControl {...createProps({ users })} />);

        fireEvent.click(screen.getByRole("button", { name: "Requester is: search" }));

        expect(searchUsers).toHaveBeenCalledWith(WORKFLOW_PICKER_STUB_SEARCH);
    });

    it("reports the picked id and null for the clear row", () => {
        const onChange = vi.fn();
        renderWithAdminUi(<UserPickerControl {...createProps({ onChange })} />);

        fireEvent.click(screen.getByRole("button", { name: "Requester is: choose Ana Kovač" }));
        fireEvent.click(screen.getByRole("button", { name: "Requester is: clear" }));

        expect(onChange).toHaveBeenNthCalledWith(1, "user-2");
        expect(onChange).toHaveBeenNthCalledWith(2, null);
    });

    it("shows the options failure with Try again in place of the picker", () => {
        const retry = vi.fn();
        const users = createUsersSlice({ failed: true, retry });
        renderWithAdminUi(<UserPickerControl {...createProps({ users })} />);

        expect(screen.queryByTestId("picker-Requester is")).toBeNull();
        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/FolderPickerControl.test.tsx`:

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
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { FolderPickerControl } from "./FolderPickerControl.js";
import type { FolderPickerControlProps } from "./FolderPickerControl.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });
const PARTNERS = createAppFolder({ id: "folder-2", path: "/Partners" });
const HINT = "You can't see this folder. The condition stays as it is unless you remove it.";

const createProps = (
    overrides: Partial<FolderPickerControlProps> = {}
): FolderPickerControlProps => {
    return {
        label: "Content is in folder",
        placeholder: "Search folders",
        anyLabel: "Any folder",
        value: null,
        folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS], folderType: "cms:article" }),
        references: createReferencesSlice(),
        disabled: false,
        error: null,
        onRemove: null,
        onChange: vi.fn(),
        ...overrides
    };
};

const getPicker = () => {
    return screen.getByTestId("picker-Content is in folder");
};

const getOptionDetails = (): PickerOption[] => {
    return JSON.parse(getPicker().getAttribute("data-option-details") ?? "[]");
};

const restrictedReferences = () => {
    return createReferencesSlice({
        folders: [
            createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
        ]
    });
};

describe("FolderPickerControl (R292, R307, QBZ-15)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists the folder paths in order with the folder icon and passes the clear row", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps()} />);

        const details = getOptionDetails();
        expect(details.map(option => option.label)).toEqual(["/Campaigns", "/Partners"]);
        expect(details.map(option => option.icon)).toEqual(["folder", "folder"]);
        expect(getPicker().getAttribute("data-any-label")).toBe("Any folder");
        expect(getPicker().getAttribute("data-placeholder")).toBe("Search folders");
    });

    it("filters the complete list by the typed text on the client", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps()} />);

        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: search" }));

        expect(getPicker().getAttribute("data-options")).toBe("folder-1");
    });

    it("shows a saved folder the list contains", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps({ value: "folder-2" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("/Partners");
        expect(getPicker().getAttribute("data-selected-icon")).toBe("folder");
        expect(getPicker().getAttribute("data-disabled")).toBe("false");
    });

    it("reports the picked folder id and null for the clear row", () => {
        const onChange = vi.fn();
        renderWithAdminUi(<FolderPickerControl {...createProps({ onChange })} />);

        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: choose /Partners" }));
        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: clear" }));

        expect(onChange).toHaveBeenNthCalledWith(1, "folder-2");
        expect(onChange).toHaveBeenNthCalledWith(2, null);
    });

    it("shows a restricted folder as a disabled picker with Restricted folder, Remove and the hint", () => {
        const onRemove = vi.fn();
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({ references: restrictedReferences(), value: "f9", onRemove })}
            />
        );

        const picker = getPicker();
        expect(picker.getAttribute("data-selected")).toBe("Restricted folder");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
        expect(picker.getAttribute("data-selected-disabled")).toBe("true");
        expect(picker.getAttribute("data-selected-icon")).toBe("lock");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(screen.getByText(HINT)).toBeDefined();
        expect(screen.getByTitle("Remove the folder condition")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("shows the hint but no Remove for a restricted folder when the control has no remove callback", () => {
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ references: restrictedReferences(), value: "f9" })} />
        );

        expect(screen.getByText(HINT)).toBeDefined();
        expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    });

    it("disables Remove when the control is disabled", () => {
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({
                    references: restrictedReferences(),
                    value: "f9",
                    onRemove: vi.fn(),
                    disabled: true
                })}
            />
        );

        const remove: HTMLButtonElement = screen.getByRole("button", { name: "Remove" });
        expect(remove.disabled).toBe(true);
    });

    it("does not treat a listed folder as restricted, whatever the references say", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "folder-1", label: "Restricted folder", state: "restricted" })
            ]
        });
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ references, value: "folder-1", onRemove: vi.fn() })} />
        );

        expect(getPicker().getAttribute("data-selected")).toBe("/Campaigns");
        expect(screen.queryByText(HINT)).toBeNull();
        expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    });

    it("shows a deleted folder as Deleted folder: not muted, no icon, not disabled, no hint", () => {
        const references = createReferencesSlice({
            folders: [createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" })]
        });
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ references, value: "f8", onRemove: vi.fn() })} />
        );

        const picker = getPicker();
        expect(picker.getAttribute("data-selected")).toBe("Deleted folder");
        expect(picker.getAttribute("data-selected-muted")).toBe("false");
        expect(picker.getAttribute("data-selected-icon")).toBe("");
        expect(picker.getAttribute("data-disabled")).toBe("false");
        expect(screen.queryByText(HINT)).toBeNull();
    });

    it("shows the neutral Searching label for an unresolved folder while resolving", () => {
        const references = createReferencesSlice({}, { loading: true });
        renderWithAdminUi(<FolderPickerControl {...createProps({ references, value: "f7" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("Searching…");
    });

    it("passes the error and the disabled flag to the picker", () => {
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ error: "Pick a folder.", disabled: true })} />
        );

        expect(getPicker().getAttribute("data-error")).toBe("Pick a folder.");
        expect(getPicker().getAttribute("data-disabled")).toBe("true");
    });

    it("shows the options failure with Try again in place of the picker", () => {
        const retry = vi.fn();
        const folders = createFoldersSlice({ failed: true, retry });
        renderWithAdminUi(<FolderPickerControl {...createProps({ folders })} />);

        expect(screen.queryByTestId("picker-Content is in folder")).toBeNull();
        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/UserPickerRenderer.test.tsx`:

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
import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { createWebhookAutomation } from "~/editor/testing/draftFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createUsersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { buildAutomationStepForm } from "../buildAutomationStepForm.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { UserPickerRenderer } from "./UserPickerRenderer.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const OWNER_SCHEMA: JsonSchema = {
    type: "object",
    properties: { owner: { type: "string", title: "Owner", ui: "user" } }
};

const IVAN = createWorkflowUserSummary({ id: "user-1", displayName: "Ivan Horvat" });
const ANA = createWorkflowUserSummary({ id: "user-2", displayName: "Ana Kovač" });

const createForm = (owner: string | null) => {
    const definition = createWebhookAutomation({ settingsSchema: OWNER_SCHEMA });
    const form = createTestFormModelFactory().create(buildAutomationStepForm({ definition }));
    form.setData({ settings: { owner } }, { dirty: false });
    return form;
};

const renderOwner = (form: ReturnType<typeof createForm>, users = createUsersSlice()) => {
    renderStepFormField({
        form,
        name: "settings.owner",
        Renderer: UserPickerRenderer,
        options: createStepFormOptions({ users })
    });
};

describe("UserPickerRenderer (R271, R285, R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the `user` ui hint of an Automation setting", () => {
        const form = createForm(null);

        expect(form.field("settings.owner").vm.renderer).toBe(STEP_FORM_RENDERER.userPicker);
    });

    it("passes the label, the saved value, the users and the Search users placeholder to the picker", () => {
        const form = createForm("user-1");
        renderOwner(form, createUsersSlice({ items: [IVAN, ANA] }));

        const picker = screen.getByTestId("picker-Owner");
        expect(picker.getAttribute("data-label")).toBe("Owner");
        expect(picker.getAttribute("data-value")).toBe("user-1");
        expect(picker.getAttribute("data-selected")).toBe("Ivan Horvat");
        expect(picker.getAttribute("data-options")).toBe("user-1,user-2");
        expect(picker.getAttribute("data-placeholder")).toBe("Search users");
        expect(picker.getAttribute("data-any-label")).toBe("");
    });

    it("writes the picked user id to the setting and null when cleared", () => {
        const form = createForm("user-1");
        renderOwner(form, createUsersSlice({ items: [IVAN, ANA] }));

        fireEvent.click(screen.getByRole("button", { name: "Owner: choose Ana Kovač" }));

        expect(form.field("settings.owner").getValue()).toBe("user-2");

        fireEvent.click(screen.getByRole("button", { name: "Owner: clear" }));

        expect(form.field("settings.owner").getValue()).toBeNull();
    });

    it("shows a saved user that left the system as muted Deleted user", () => {
        const form = createForm("user-9");
        const references = createReferencesSlice({
            users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
        });
        renderStepFormField({
            form,
            name: "settings.owner",
            Renderer: UserPickerRenderer,
            options: createStepFormOptions({ users: createUsersSlice(), references })
        });

        const picker = screen.getByTestId("picker-Owner");
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
    });

    it("shows a server error of the setting under the picker", () => {
        const form = createForm("user-1");
        form.field("settings.owner").setValidation({
            isValid: false,
            message: "The user was deleted."
        });
        renderOwner(form, createUsersSlice({ items: [IVAN] }));

        expect(screen.getByTestId("picker-Owner").getAttribute("data-error")).toBe(
            "The user was deleted."
        );
    });

    it("shows the options failure with Try again", () => {
        const retry = vi.fn();
        const form = createForm(null);
        renderOwner(form, createUsersSlice({ failed: true, retry }));

        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/FolderPickerRenderer.test.tsx`:

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
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { FolderPickerRenderer } from "./FolderPickerRenderer.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });
const PARTNERS = createAppFolder({ id: "folder-2", path: "/Partners" });

const createForm = (folder: string | null) => {
    const form = createTestFormModelFactory().create({
        fields: registry => {
            return {
                folder: registry
                    .text()
                    .label("Folder")
                    .renderer(STEP_FORM_RENDERER.folderPicker)
            };
        }
    });
    form.setData({ folder }, { dirty: false });
    return form;
};

describe("FolderPickerRenderer (R292, R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the saved folder id as its path and offers the folders and the Any folder row", () => {
        const form = createForm("folder-2");
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({
                folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS] })
            })
        });

        const picker = screen.getByTestId("picker-Folder");
        expect(picker.getAttribute("data-selected")).toBe("/Partners");
        expect(picker.getAttribute("data-options")).toBe("folder-1,folder-2");
        expect(picker.getAttribute("data-any-label")).toBe("Any folder");
        expect(picker.getAttribute("data-placeholder")).toBe("Search folders");
    });

    it("writes the picked folder id and null for the clear row", () => {
        const form = createForm(null);
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({
                folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS] })
            })
        });

        fireEvent.click(screen.getByRole("button", { name: "Folder: choose /Campaigns" }));

        expect(form.field("folder").getValue()).toBe("folder-1");

        fireEvent.click(screen.getByRole("button", { name: "Folder: clear" }));

        expect(form.field("folder").getValue()).toBeNull();
    });

    it("clears the field when Remove is pressed on a restricted folder", () => {
        const form = createForm("f9");
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
            ]
        });
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({ references })
        });

        expect(screen.getByTestId("picker-Folder").getAttribute("data-selected")).toBe(
            "Restricted folder"
        );

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(form.field("folder").getValue()).toBeNull();
    });
});
```

`WorkflowEditorConfig.test.tsx` (modify): the test title and names array. Before:

```tsx
    it("registers the colour, teams, transport, automation, AI model and AI tools renderers", () => {
```
After:

```tsx
    it("registers the colour, teams, transport, automation, AI model, AI tools, user and folder renderers", () => {
```
Before:

```tsx
            "workflowAiModel",
            "workflowAiTools"
        ]);
```
After:

```tsx
            "workflowAiModel",
            "workflowAiTools",
            "workflowUserPicker",
            "workflowFolderPicker"
        ]);
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerOptionMappers.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/getReferenceSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerHelpers.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/ruleTargetOptionIds.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/UserPickerControl.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/FolderPickerControl.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/UserPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/FolderPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: every new test file fails with `Failed to resolve import` for its module (`./toFolderPickerOption.js`, `./getReferenceSelection.js`, `./getRuleTargetOptions.js`, `./filterPickerOptions.js`, `./parseRuleTargetOptionId.js`, `./UserPickerControl.js`, `./FolderPickerControl.js`, `./UserPickerRenderer.js`, `./FolderPickerRenderer.js`). `WorkflowEditorConfig.test.tsx` fails on the renderer list (the two new names are missing).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/toUserPickerOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";

const NO_TEAM_NAMES: ReadonlyMap<string, string> = new Map();

/*
 * A user as a picker option (R307): the display name, the `person` icon and, when the names of the
 * user's teams are known, the sub line `Team A, Team B`. The sub line lists only the teams whose
 * name is in `teamNames`, in the order of the user's team ids.
 */
export const toUserPickerOption = (
    user: WorkflowUserSummary,
    teamNames: ReadonlyMap<string, string> = NO_TEAM_NAMES
): PickerOption => {
    const names: string[] = [];
    for (const teamId of user.teamIds) {
        const name = teamNames.get(teamId);
        if (name !== undefined) {
            names.push(name);
        }
    }

    let description: string | null = null;
    if (names.length > 0) {
        description = names.join(", ");
    }

    return {
        id: user.id,
        label: user.displayName,
        description,
        warning: null,
        muted: false,
        disabled: false,
        icon: "person"
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/toFolderPickerOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";

// A folder as a picker option (R292, R307): the path is the label, with the `folder` icon.
export const toFolderPickerOption = (folder: AppFolder): PickerOption => {
    return {
        id: folder.id,
        label: folder.path,
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: "folder"
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/toReferencePickerOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { ReferenceKind } from "~/editor/model/rules/ReferenceLabel.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";

const FOUND_ICON: Record<ReferenceKind, PickerOptionIcon> = {
    user: "person",
    team: "group",
    folder: "folder"
};

/*
 * A saved reference as the option a picker shows for it (R298, D117). The label is the
 * `ReferenceLabel`'s (the name, or `Deleted user`, `Deleted team`, `Deleted folder`, `Restricted
 * folder`); this function adds how the state looks: a deleted user or team is muted with
 * `person_off` or `group_off`, a deleted folder is plain (design ED:772), a restricted folder is
 * muted and disabled with `lock`.
 */
export const toReferencePickerOption = (label: ReferenceLabel, kind: ReferenceKind): PickerOption => {
    const base = { id: label.id, label: label.label, description: null, warning: null };

    if (label.state === "found") {
        return { ...base, muted: false, disabled: false, icon: FOUND_ICON[kind] };
    }
    if (label.state === "restricted") {
        return { ...base, muted: true, disabled: true, icon: "lock" };
    }
    if (kind === "user") {
        return { ...base, muted: true, disabled: false, icon: "person_off" };
    }
    if (kind === "team") {
        return { ...base, muted: true, disabled: false, icon: "group_off" };
    }
    return { ...base, muted: false, disabled: false, icon: null };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getUnresolvedReferenceOption.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { PICKER_LOADING_LABEL } from "~/components/picker/pickerTexts.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";

/*
 * What a picker shows for a saved id that no reference map knows (R298): while the resolution
 * runs, or after it failed, the neutral muted label `Searching…` under the id (the failure shows
 * the banner and a retry; the ids stay neutral until it resolves them); once the resolution
 * settled, null, and the picker shows `Unknown item` with `This item no longer exists.`.
 */
export const getUnresolvedReferenceOption = (
    id: string,
    references: StepFormReferencesOptions
): PickerOption | null => {
    if (!references.loading && !references.failed) {
        return null;
    }
    return {
        id,
        label: PICKER_LOADING_LABEL,
        description: null,
        warning: null,
        muted: true,
        disabled: false,
        icon: null
    };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getReferenceSelection.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ReferenceKind } from "~/editor/model/rules/ReferenceLabel.js";
import { getUnresolvedReferenceOption } from "./getUnresolvedReferenceOption.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";

export interface ReferenceSelectionParams {
    id: string | null;
    kind: ReferenceKind;
    // The options a picker already knows: a pick, the search results, the chosen items.
    known: PickerOption[];
    references: StepFormReferencesOptions;
}

/*
 * The option a picker shows for a saved id (R298, D117): a known option first (a picked value is
 * known locally and is never re-resolved), else the resolved reference of its kind, else the
 * neutral label while unresolved, else null (the picker shows `Unknown item`).
 */
export const getReferenceSelection = (params: ReferenceSelectionParams): PickerOption | null => {
    const { id, kind, known, references } = params;
    if (id === null) {
        return null;
    }

    const option = known.find(item => item.id === id);
    if (option !== undefined) {
        return option;
    }

    let labels = references.users;
    if (kind === "team") {
        labels = references.teams;
    }
    if (kind === "folder") {
        labels = references.folders;
    }
    const label = labels.get(id);
    if (label !== undefined) {
        return toReferencePickerOption(label, kind);
    }

    return getUnresolvedReferenceOption(id, references);
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getTeamNames.ts`:

```ts
import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import type { StepFormTeamsOptions } from "./StepFormOptions.js";

/*
 * The names of the teams the form knows by id (R307): the team search results, the chosen teams
 * (their labels win) and the found rule teams. A deleted team has no name to show.
 */
export const getTeamNames = (
    teams: StepFormTeamsOptions,
    references: StepFormReferencesOptions
): ReadonlyMap<string, string> => {
    const names = new Map<string, string>();
    for (const option of teams.options) {
        names.set(option.id, option.label);
    }
    references.teams.forEach((label, id) => {
        if (label.state === "found") {
            names.set(id, label.label);
        }
    });
    for (const option of teams.selected) {
        names.set(option.id, option.label);
    }
    return names;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/isRestrictedFolder.ts`:

```ts
import type { StepFormFoldersOptions } from "./StepFormOptions.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";

/*
 * True for a folder id the admin's folder list does not contain whose reference resolved as
 * restricted (R292, QBZ-15): the condition is kept as stored and its picker is disabled. A listed
 * folder is never restricted.
 */
export const isRestrictedFolder = (
    folderId: string | null,
    folders: StepFormFoldersOptions,
    references: StepFormReferencesOptions
): boolean => {
    if (folderId === null) {
        return false;
    }
    const listed = folders.items.some(folder => folder.id === folderId);
    if (listed) {
        return false;
    }
    const reference = references.folders.get(folderId);
    return reference !== undefined && reference.state === "restricted";
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/filterPickerOptions.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";

/*
 * Client-side search over a complete list (R292): the options whose label contains the text,
 * case-insensitively, in their order; a blank text returns the list.
 */
export const filterPickerOptions = (options: PickerOption[], query: string): PickerOption[] => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
        return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(needle));
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/toRuleTargetOptionId.ts`:

```ts
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

// The picker value of a rule target (R307): `user:<id>` or `team:<id>`.
export const toRuleTargetOptionId = (target: RuleTargetValue): string => {
    return `${target.type}:${target.id}`;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/parseRuleTargetOptionId.ts`:

```ts
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";

/*
 * The rule target a picker value stands for: the inverse of `toRuleTargetOptionId`, split at the
 * first colon. Null for an unknown type, an empty id or a value with no colon.
 */
export const parseRuleTargetOptionId = (optionId: string): RuleTargetValue | null => {
    const colon = optionId.indexOf(":");
    if (colon === -1) {
        return null;
    }

    const type = optionId.slice(0, colon);
    const id = optionId.slice(colon + 1);
    if (id === "") {
        return null;
    }
    if (type === "user") {
        return { type: "user", id };
    }
    if (type === "team") {
        return { type: "team", id };
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { PICKER_UNKNOWN_ITEM_LABEL } from "~/components/picker/pickerTexts.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { RuleTargetValue } from "~/editor/model/assignment/RuleTargetValue.js";
import { ASSIGNMENT_FORM_MESSAGES } from "./assignmentFormMessages.js";
import { getUnresolvedReferenceOption } from "./getUnresolvedReferenceOption.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import type { StepFormTargetMembersOptions } from "./StepFormOptions.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";
import { toRuleTargetOptionId } from "./toRuleTargetOptionId.js";
import { toUserPickerOption } from "./toUserPickerOption.js";

export interface RuleTargetOptionsParams {
    // The ids of the reviewing teams as the form holds them now.
    stepTeamIds: string[];
    teamNames: ReadonlyMap<string, string>;
    members: StepFormTargetMembersOptions;
    target: RuleTargetValue | null;
    references: StepFormReferencesOptions;
}

export interface RuleTargetOptions {
    // The pools of the reviewing teams, then the members found by the last search.
    options: PickerOption[];
    // The option the picker shows for the saved target; null for none or for an id nobody knows.
    selected: PickerOption | null;
}

function toPoolOption(teamId: string, teamNames: ReadonlyMap<string, string>): PickerOption {
    let name = teamNames.get(teamId);
    if (name === undefined) {
        name = PICKER_UNKNOWN_ITEM_LABEL;
    }
    return {
        id: toRuleTargetOptionId({ type: "team", id: teamId }),
        label: ASSIGNMENT_FORM_MESSAGES.teamPool(name),
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: "groups"
    };
}

function toMemberOption(
    user: WorkflowUserSummary,
    teamNames: ReadonlyMap<string, string>
): PickerOption {
    const option = toUserPickerOption(user, teamNames);
    return { ...option, id: toRuleTargetOptionId({ type: "user", id: user.id }) };
}

function isInSomeTeam(teamIds: string[], stepTeamIds: string[]): boolean {
    return teamIds.some(teamId => stepTeamIds.includes(teamId));
}

function toStaleOption(option: PickerOption): PickerOption {
    return { ...option, label: ASSIGNMENT_FORM_MESSAGES.notInReviewingTeams(option.label) };
}

function getSelectedTeamTarget(
    params: RuleTargetOptionsParams,
    target: RuleTargetValue
): PickerOption | null {
    const { stepTeamIds, teamNames, references } = params;
    if (stepTeamIds.includes(target.id)) {
        return toPoolOption(target.id, teamNames);
    }

    const optionId = toRuleTargetOptionId(target);
    const label = references.teams.get(target.id);
    if (label === undefined) {
        return getUnresolvedReferenceOption(optionId, references);
    }

    const option = { ...toReferencePickerOption(label, "team"), id: optionId };
    if (label.state === "found") {
        return toStaleOption(option);
    }
    return option;
}

function getSelectedUserTarget(
    params: RuleTargetOptionsParams,
    target: RuleTargetValue
): PickerOption | null {
    const { stepTeamIds, teamNames, members, references } = params;
    const optionId = toRuleTargetOptionId(target);

    const known = [...members.selected, ...members.items].find(user => user.id === target.id);
    if (known !== undefined) {
        const option = toMemberOption(known, teamNames);
        if (isInSomeTeam(known.teamIds, stepTeamIds)) {
            return option;
        }
        return toStaleOption(option);
    }

    const label = references.users.get(target.id);
    if (label === undefined) {
        return getUnresolvedReferenceOption(optionId, references);
    }

    const option = { ...toReferencePickerOption(label, "user"), id: optionId };
    if (label.state !== "found") {
        return option;
    }

    // A user whose teams are unknown (the lookup failed) is not flagged.
    const teamIds = references.userTeamIds.get(target.id);
    if (teamIds === undefined || isInSomeTeam(teamIds, stepTeamIds)) {
        return option;
    }
    return toStaleOption(option);
}

/*
 * The options of a rule's `Then assign to` picker and the option of its saved target (R307, R298):
 * `{Team} team pool` per reviewing team (value `team:<id>`), then the members of the reviewing
 * teams (value `user:<id>`, sub line = their team names). A saved target is shown as listed, or, when
 * it left the reviewing teams, as `{Name} (not in reviewing teams)`; a deleted user or team is
 * muted (`Deleted user`, `Deleted team`); an unresolved one shows the neutral label until it
 * resolves. The editor shows no exclusion and no read-access note (Q50).
 */
export const getRuleTargetOptions = (params: RuleTargetOptionsParams): RuleTargetOptions => {
    const { stepTeamIds, teamNames, members, target } = params;

    const options: PickerOption[] = [];
    for (const teamId of stepTeamIds) {
        const pool = toPoolOption(teamId, teamNames);
        options.push(pool);
    }
    for (const user of members.items) {
        const member = toMemberOption(user, teamNames);
        options.push(member);
    }

    let selected: PickerOption | null = null;
    if (target !== null && target.type === "team") {
        selected = getSelectedTeamTarget(params, target);
    }
    if (target !== null && target.type === "user") {
        selected = getSelectedUserTarget(params, target);
    }

    return { options, selected };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/PickerLoadFailed.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { FormComponentLabel } from "@webiny/admin-ui";
import { STEP_FORM_MESSAGES } from "../stepFormMessages.js";

export interface PickerLoadFailedProps {
    label: string;
    required?: boolean;
    disabled: boolean;
    onRetry(): void;
}

// A list a picker needs could not be loaded (R281): the label, the options banner and `Try again`.
export const PickerLoadFailed = (props: PickerLoadFailedProps) => {
    return (
        <div className={"w-full"}>
            <FormComponentLabel
                text={props.label}
                required={props.required}
                disabled={props.disabled}
            />
            <Alert
                type={"danger"}
                variant={"subtle"}
                actions={
                    <Alert.Action text={STEP_FORM_MESSAGES.tryAgain} onClick={props.onRetry} />
                }
            >
                {STEP_FORM_MESSAGES.optionsFailed}
            </Alert>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/UserPickerControl.tsx`:

```tsx
import React from "react";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import { getReferenceSelection } from "../getReferenceSelection.js";
import type { StepFormReferencesOptions } from "../StepFormOptions.js";
import type { StepFormUsersOptions } from "../StepFormOptions.js";
import { toUserPickerOption } from "../toUserPickerOption.js";
import { PickerLoadFailed } from "./PickerLoadFailed.js";

export interface UserPickerControlProps {
    label: string;
    description?: string;
    required?: boolean;
    placeholder: string;
    // The clear row (`Anyone`) or null for none.
    anyLabel: string | null;
    value: string | null;
    users: StepFormUsersOptions;
    references: StepFormReferencesOptions;
    // The names of the teams the form knows, for the sub line of a user.
    teamNames: ReadonlyMap<string, string>;
    disabled: boolean;
    error: string | null;
    onChange(userId: string | null): void;
}

/*
 * A single user picker (R307, R315, D117): the user search results as options, the saved value
 * resolved by id when no search result or pick holds it (a deleted user shows as muted `Deleted
 * user`). A failed list shows the options banner with `Try again` in place of the picker.
 */
export const UserPickerControl = (props: UserPickerControlProps) => {
    const { users, references, teamNames, value } = props;

    if (users.failed) {
        return (
            <PickerLoadFailed
                label={props.label}
                required={props.required}
                disabled={props.disabled}
                onRetry={users.retry}
            />
        );
    }

    const toOption = (user: WorkflowUserSummary) => toUserPickerOption(user, teamNames);
    const options = users.items.map(toOption);
    const chosen = users.selected.map(toOption);
    const known = [...chosen, ...options];
    const selected = getReferenceSelection({ id: value, kind: "user", known, references });

    return (
        <WorkflowPicker
            label={props.label}
            description={props.description}
            required={props.required}
            placeholder={props.placeholder}
            anyLabel={props.anyLabel}
            value={value}
            selected={selected}
            options={options}
            onSearch={users.searchUsers}
            onChange={props.onChange}
            disabled={props.disabled}
            error={props.error}
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/components/FolderPickerControl.tsx`:

```tsx
import React from "react";
import { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { filterPickerOptions } from "../filterPickerOptions.js";
import { getReferenceSelection } from "../getReferenceSelection.js";
import { isRestrictedFolder } from "../isRestrictedFolder.js";
import type { StepFormFoldersOptions } from "../StepFormOptions.js";
import type { StepFormReferencesOptions } from "../StepFormOptions.js";
import { toFolderPickerOption } from "../toFolderPickerOption.js";
import { PickerLoadFailed } from "./PickerLoadFailed.js";

export interface FolderPickerControlProps {
    label: string;
    description?: string;
    placeholder: string;
    // The clear row (`Any folder`) or null for none.
    anyLabel: string | null;
    // The saved folder id.
    value: string | null;
    folders: StepFormFoldersOptions;
    references: StepFormReferencesOptions;
    disabled: boolean;
    error: string | null;
    // The restricted folder's `Remove` (QBZ-15); null when the control has no such button.
    onRemove: (() => void) | null;
    onChange(folderId: string | null): void;
}

/*
 * A single folder picker (R292, R307, D117): the complete folder list filtered on the client by the
 * typed text, the saved id shown by its path when listed, else as `Deleted folder` or, for a
 * folder the admin cannot see, as the disabled `Restricted folder` with a `Remove` button and the
 * hint (QBZ-15). The search text is the only state, and it is visual.
 */
export const FolderPickerControl = (props: FolderPickerControlProps) => {
    const { folders, references, value, onRemove } = props;
    const [query, setQuery] = useState("");

    if (folders.failed) {
        return (
            <PickerLoadFailed
                label={props.label}
                disabled={props.disabled}
                onRetry={folders.retry}
            />
        );
    }

    const options = folders.items.map(toFolderPickerOption);
    const shown = filterPickerOptions(options, query);
    const selected = getReferenceSelection({
        id: value,
        kind: "folder",
        known: options,
        references
    });
    const restricted = isRestrictedFolder(value, folders, references);

    const picker = (
        <WorkflowPicker
            label={props.label}
            description={props.description}
            placeholder={props.placeholder}
            anyLabel={props.anyLabel}
            value={value}
            selected={selected}
            options={shown}
            onSearch={setQuery}
            onChange={props.onChange}
            disabled={props.disabled || restricted}
            error={props.error}
        />
    );

    if (!restricted) {
        return picker;
    }

    return (
        <div className={"flex w-full flex-col gap-xs"}>
            <div className={"flex items-end gap-sm"}>
                <div className={"min-w-0 grow"}>{picker}</div>
                {onRemove !== null && (
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        text={ASSIGNMENT_FORM_MESSAGES.removeFolder}
                        title={ASSIGNMENT_FORM_MESSAGES.removeFolderTitle}
                        disabled={props.disabled}
                        onClick={onRemove}
                    />
                )}
            </div>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {ASSIGNMENT_FORM_MESSAGES.restrictedFolderHint}
            </Text>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/UserPickerRenderer.tsx`:

```tsx
import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { UserPickerControl } from "../components/UserPickerControl.js";
import { getTeamNames } from "../getTeamNames.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * A single user (R285, R307): the `user` ui hint of an Automation setting, a `text` field holding
 * the user id. It reads the user search and the resolved references from the options the drawer
 * provides; the label, description, required marker, disabled flag and error come from the field.
 */
export const UserPickerRenderer = createFieldRenderer<"workflowUserPicker">(({ field }) => {
    const { users, references, teams } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" && field.value !== "" ? field.value : null;
    const teamNames = getTeamNames(teams, references);

    return (
        <UserPickerControl
            label={field.label ?? ""}
            description={field.description}
            required={field.required}
            placeholder={ASSIGNMENT_FORM_MESSAGES.searchUsersPlaceholder}
            anyLabel={null}
            value={value}
            users={users}
            references={references}
            teamNames={teamNames}
            disabled={field.disabled}
            error={error}
            onChange={id => field.onChange(id)}
        />
    );
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/FolderPickerRenderer.tsx`:

```tsx
import React from "react";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../assignmentFormMessages.js";
import { FolderPickerControl } from "../components/FolderPickerControl.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

/*
 * A single folder (R292, R307): a `text` field holding a folder id, over the app's folder list. A
 * restricted folder is disabled and its `Remove` clears the field (QBZ-15). No 9b form field uses
 * it: the rule card and Test routing compose `FolderPickerControl` or a plain picker themselves.
 */
export const FolderPickerRenderer = createFieldRenderer<"workflowFolderPicker">(({ field }) => {
    const { folders, references } = useStepFormOptions();
    const invalid = field.validation.isValid === false;
    const error = invalid ? (field.validation.message ?? null) : null;
    const value = typeof field.value === "string" && field.value !== "" ? field.value : null;

    return (
        <FolderPickerControl
            label={field.label ?? ""}
            description={field.description}
            placeholder={ASSIGNMENT_FORM_MESSAGES.searchFoldersPlaceholder}
            anyLabel={ASSIGNMENT_FORM_MESSAGES.anyFolder}
            value={value}
            folders={folders}
            references={references}
            disabled={field.disabled}
            error={error}
            onRemove={() => field.onChange(null)}
            onChange={folderId => field.onChange(folderId)}
        />
    );
});
```

In `packages/app-workflows/src/editor/presentation/stepForm/buildAutomationStepForm.ts`, before:

```ts
// The `team` hint of a setting renders as the teams picker; a `user` hint falls back to text in 9a (R271).
const SETTINGS_OPTIONS: JsonSchemaFieldOptions = {
    uiRenderers: { team: STEP_FORM_RENDERER.teams }
};
```

After:

```ts
// The `team` hint of a setting renders as the teams picker and the `user` hint as the user picker (R271, R285).
const SETTINGS_OPTIONS: JsonSchemaFieldOptions = {
    uiRenderers: { team: STEP_FORM_RENDERER.teams, user: STEP_FORM_RENDERER.userPicker }
};
```

In `packages/app-workflows/src/editor/WorkflowEditorConfig.tsx`, add the imports after the `AiToolsRenderer` import:

```tsx
import { UserPickerRenderer } from "~/editor/presentation/stepForm/renderers/UserPickerRenderer.js";
import { FolderPickerRenderer } from "~/editor/presentation/stepForm/renderers/FolderPickerRenderer.js";
```

and the entries after the AI tools entry. Before:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiTools}
                component={AiToolsRenderer}
            />
        </AdminConfig>
```

After:

```tsx
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.aiTools}
                component={AiToolsRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.userPicker}
                component={UserPickerRenderer}
            />
            <AdminConfig.Form.FieldRenderer
                name={STEP_FORM_RENDERER.folderPicker}
                component={FolderPickerRenderer}
            />
        </AdminConfig>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerOptionMappers.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/getReferenceSelection.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/getRuleTargetOptions.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/pickerHelpers.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/ruleTargetOptionIds.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/UserPickerControl.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/components/FolderPickerControl.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/UserPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/FolderPickerRenderer.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/WorkflowEditorConfig.test.tsx 2>&1 | tail -30
```

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/presentation/stepDrawer 2>&1 | tail -40
yarn test packages/app-workflows/src/editor/model 2>&1 | tail -30
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (`registry.text().renderer(STEP_FORM_RENDERER.folderPicker)` in the renderer test and `uiRenderers.user` in the builder prove the augmentation of Task 18 types the new names).

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
git commit -m "feat(app-workflows): add the user and folder pickers and the saved-reference option mappers" -m "Pure mappers turn a user, a folder and a saved reference in each state (found, deleted, restricted, unresolved) into picker options, so a saved value never shows empty; the rule target options list the reviewing teams' pools and members and flag a stale target. The user and folder controls and the two field renderers wrap the shared picker, a restricted folder is disabled with Remove, and the Automation user hint renders the user picker." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`toUserPickerOption(user, teamNames?)` has an optional second parameter** (the contract and Task 22 call it with the user only): with no names the option has no sub line; the rule target picker and the user controls pass the names so the sub line is the user's teams (R307). Task 22's one-argument calls compile and behave as before.
- **Extra files not in the contract:** `getReferenceSelection`, `getUnresolvedReferenceOption`, `getTeamNames`, `isRestrictedFolder`, `filterPickerOptions`, `getRuleTargetOptions` with `toRuleTargetOptionId` and `parseRuleTargetOptionId`, `PickerLoadFailed`, `UserPickerControl` and `FolderPickerControl`. The contract's "restricted folder disabled with `Remove`" and "stale target `{Name} (not in reviewing teams)`" are behaviours of these; the rule card (Task 21) and the renderers share them instead of each building options. Task 22 imports `filterPickerOptions` from here (see the last notes).
- **`ReferenceKind` and the labels come from Task 11** (`ReferenceLabel.ts`, the label text already holds `Deleted user`, `Deleted team`, `Deleted folder`, `Restricted folder`); `toReferencePickerOption` only adds how each state looks. `getReferenceLabel` is not called here: the presenter (Task 14) builds the `ReferenceLabel`s.
- **The neutral label for an unresolved reference is `Searching…`** (R298 says "the picker's neutral loading label"; the design picker's own loading text is `Searching…`, source `Picker.dc.html`). It shows only while `references.loading` or `references.failed`; once the resolution settled an unknown id shows the picker's `Unknown item`.
- **`workflowFolderPicker` has no 9b consumer:** the rule's folder is part of the rule value, not a form field, and Test routing uses a plain `WorkflowPicker`. The renderer exists and is registered because the contract lists it; its test builds a `text` field for it.
- **Automation `user` hint wiring (owner: Task 16):** `getUserSettingKeys` (created by Task 14) and `hasUserSetting` (created by Task 16) already exist when this task runs; this task creates neither and nothing here calls them. Controller ruling (consistency items): Task 16's drawer presenter asks `source.searchUsers("")` when the open Automation step's `definition.settingsSchema` has a `user` hint (`hasUserSetting`), and the editor presenter resolves the saved ids of `ui: "user"` settings (`getUserSettingKeys`) through the reference path of Task 14. Until Task 16 does, an Automation step with a `user` setting shows the picker with no first results until the admin types.
- **Slice filling (owner: Task 16):** this task only reads the slices. Controller ruling: Task 16 fills `assignment`, `users`, `targetMembers`, `folders` and `references` in `StepDrawerPresenter.formOptions` from `StepDrawerSource`; Task 22b adds `ruleErrors`, `ruleIssues` and `testRouting`. See Task 18's contract notes.
- **Task 22 must import this task's `filterPickerOptions`** (controller ruling): `~/editor/presentation/stepForm/filterPickerOptions.js`, not a copy of its own.
- Size: large (twelve helpers, three components, two renderers, eleven test files).

## Review fixes (sub-phase review)

- `getRuleTargetOptions`: the two `options.push(toPoolOption(...))` / `options.push(toMemberOption(...))` calls (a call as an argument) now go through named constants.
- Contract notes: the Automation `user` hint wiring and the slice filling are now recorded as owned by Task 16 (controller ruling), not as open gaps; the note that Task 22 duplicates `filterPickerOptions` is replaced by the ruling that Task 22 imports this task's file.
- Verified against the repo: `createWorkflowUserSummary` (Task 6), `createAppFolder` (Task 8), `createReferenceLabel` and `createRuleReferences` with `RuleReferenceEntries` (Task 11), `JsonSchema` export from `@webiny/app-admin`, and that `getUserSettingKeys` (Task 14) / `hasUserSetting` (Task 16) exist.
