### Task 21: Rule card and fields

R285, R292, R296, R298, R299, R303, R307, R313; D42, D46, D61, D69, D117; Q50, Q53, QBZ-7, QBZ-11, QBZ-15; design README 4 and `research-spec.md` 4.2, 4.3, 7; Review Focus 3, 4, 11. One routing rule as a card: the header `Rule {n}` with up, down and delete buttons, the readable summary of the rule, the five fields, and the rule's warnings and errors. The card is controlled: it receives the rule, its position, the options slices and the callbacks, and reports edits as a `RulePatch`; the list renderer (Task 21b) writes them to the form field.

- **Header and buttons (design, R313):** `Rule {n}` (the position is the index plus one, so a reorder renumbers), then icon buttons with the accessible names `Move rule up` (disabled on the first card), `Move rule down` (disabled on the last), `Delete rule`. All three are disabled for a read-only step. The card is a `group` named `Rule {n}`.
- **Summary (R313):** the box shows `describeRule(rule, references)` of Task 11 verbatim: the design's `ruleSummary`, with ` and other conditions` / `If other conditions match` appended when the rule keeps a condition the editor cannot show, so a summary never reads `Always` for a rule the server restricts.
- **Fields (design 4.2, R292, R307):**
  - `Requester is`: the user picker (`UserPickerControl`), placeholder and clear row `Anyone`, options from `users`; picking sets `requesterUserId`, the clear row sets `null`.
  - `Requester is in team`: a `WorkflowPicker` over `teams.options` (the team search), placeholder and clear row `Any team`; a saved team that does not resolve shows through the references (a deleted team is muted `Deleted team`); picking sets `requesterTeamId`.
  - `Content is in folder`: the folder picker (`FolderPickerControl`), placeholder and clear row `Any folder`; picking sets `folder` to `{ id, type: folders.folderType, includeDescendants }` where `includeDescendants` keeps the rule's current value (R292: the type of a newly picked folder is the app's; a saved folder keeps its own `type` until the admin picks another), the clear row sets `folder` to `null` (which also clears the subfolders flag, it lives inside `folder`). A restricted folder is disabled with `Restricted folder`, `Remove` (title `Remove the folder condition`) and the hint `You can't see this folder. The condition stays as it is unless you remove it.`; `Remove` calls `onRemoveFolder`.
  - `Include subfolders`: the stock `Checkbox`; it shows the folder's `includeDescendants`; disabled with no folder, with a restricted folder (it shows the saved value, read-only, ANS QBZ-15) and for a read-only step; toggling writes `folder: { ...folder, includeDescendants }`.
  - `Then assign to` (required, placeholder `Search reviewers or teams`, description `Only members of this step's reviewing teams, or one of those teams.`): a `WorkflowPicker` over `getRuleTargetOptions` (the pools and members of the reviewing teams, the saved target resolved, a stale one listed `{Name} (not in reviewing teams)`); picking sets `target` to the parsed option id (`user` or `team`), the clear row sets `null`; a search asks `targetMembers.searchTargetMembers(stepTeamIds, search)`.
  - A list that failed to load shows the R281 banner `Could not load the step options.` with `Try again` in place of that picker (`teams.retry`, `targetMembers.retry`; the user and folder controls do the same with their slices).
- **Issues and errors (R299, R303):** the card receives the rule's live issues and its server errors. A field's message is the server error of that field if there is one, else the live error issue of that field (a server error replaces the live message, never doubles it); it shows under the field through the picker's `error`. Any error (server or live) gives the card the destructive border. Warnings (kind `warning`) list below the fields with the warning icon and no `Rule {n}:` prefix (the prefix is for the step card and the drawer top). A restricted folder has the field hint only; a deleted requester user has the `Deleted user` label and no warning.
- **Not shown (Q50, Review Focus 11):** no read-access warning, no exclusion note and no `Unavailable` text anywhere in the card or in the option lists; Test routing reports those.
- **Read-only:** every control is disabled; the rule data is shown as saved.

**Files:** (`[STEP]` = `packages/app-workflows/src/editor/presentation`, `[RULES]` = `[STEP]/stepForm/renderers/routingRules`)
- Create: `[RULES]/RuleCardOptions.ts`
- Create: `[RULES]/RuleFieldMessages.ts`
- Create: `[RULES]/getRuleFieldMessages.ts`
- Create: `[RULES]/RuleSummary.tsx`
- Create: `[RULES]/RuleWarnings.tsx`
- Create: `[RULES]/RuleFields.tsx`
- Create: `[RULES]/RuleCard.tsx`
- Create: `[RULES]/getRuleFieldMessages.test.ts`
- Create: `[RULES]/RuleCard.test.tsx`

**Interfaces:**
- Consumes (verified in the repo today): admin-ui `Checkbox`, `IconButton`, `Icon`, `Text`, `cn` (`Checkbox` with a string label, `checked`, `onChange(checked)`, `disabled`, `id`; `IconButton` with `aria-label`, `icon`, `disabled`: both checked by running them in the test setup), `WorkflowPicker`, `@webiny/icons` `arrow_upward`, `arrow_downward`, `delete`, `warning`, `renderWithAdminUi`, `createStepFormOptions`.
- Consumes (earlier tasks, as their task files specify; verify each): Task 9 (`RuleValue`, `createRuleValue` in `[AWET]/ruleFixtures.ts`); Task 10 (`RulePatch { requesterUserId?; requesterTeamId?; folder?; target? }` in `~/editor/model/rules/RulePatch.js`); Task 11 (`describeRule(rule, references)`, `RuleIssue`, `createReferenceLabel`, `createRuleReferences`); Task 18 (`StepFormOptions`, `StepFormRuleError`, `ASSIGNMENT_FORM_MESSAGES`, `createEmptyStepFormOptions`); Task 19 (`WorkflowPicker.anyLabel`, `PickerOption` flags, `createPickerOption`); Task 19b (`UserPickerControl`, `FolderPickerControl`, `PickerLoadFailed`, `getReferenceSelection`, `getRuleTargetOptions`, `getTeamNames`, `isRestrictedFolder`, `parseRuleTargetOptionId`, `workflowPickerStub.tsx`, `stepFormOptionsFixtures.ts`, `createWorkflowUserSummary`, `createAppFolder`).
- Produces: `RuleCard` and `RuleCardProps`, `RuleCardOptions`, `RuleFieldMessages`, `getRuleFieldMessages(issues: RuleIssue[], errors: StepFormRuleError[]): RuleFieldMessages`, `RuleFields`, `RuleSummary`, `RuleWarnings` (Task 21b renders `RuleCard`).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. Type check: `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/getRuleFieldMessages.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import { getRuleFieldMessages } from "./getRuleFieldMessages.js";

const issue = (overrides: Partial<RuleIssue>): RuleIssue => {
    return {
        ruleId: "rule-1",
        index: 0,
        kind: "error",
        field: "target",
        message: "Choose who this rule assigns to.",
        ...overrides
    };
};

const serverError = (overrides: Partial<StepFormRuleError>): StepFormRuleError => {
    return { ruleId: "rule-1", field: "target", message: "Server says no.", ...overrides };
};

describe("getRuleFieldMessages (R299, R303)", () => {
    it("has no message, no error and no warning for a clean rule", () => {
        expect(getRuleFieldMessages([], [])).toEqual({
            target: null,
            requesterUser: null,
            requesterTeam: null,
            folder: null,
            hasError: false,
            warnings: []
        });
    });

    it("puts a live error on its field and marks the rule as holding an error", () => {
        const messages = getRuleFieldMessages([issue({})], []);

        expect(messages.target).toBe("Choose who this rule assigns to.");
        expect(messages.requesterUser).toBeNull();
        expect(messages.hasError).toBe(true);
    });

    it("lets a server error replace the live error of the same field instead of doubling it", () => {
        const messages = getRuleFieldMessages(
            [issue({ message: "Ivan Horvat is no longer in the reviewing teams." })],
            [serverError({ message: "The target user is not a member of the step's teams." })]
        );

        expect(messages.target).toBe("The target user is not a member of the step's teams.");
    });

    it("keeps a live error of one field next to a server error of another", () => {
        const messages = getRuleFieldMessages(
            [issue({ field: "requesterTeam", message: "The team was deleted." })],
            [serverError({ field: "folder", message: "The folder is invalid." })]
        );

        expect(messages.requesterTeam).toBe("The team was deleted.");
        expect(messages.folder).toBe("The folder is invalid.");
        expect(messages.target).toBeNull();
        expect(messages.hasError).toBe(true);
    });

    it("lists the warnings in order without a prefix and does not mark them as an error", () => {
        const messages = getRuleFieldMessages(
            [
                issue({ kind: "warning", field: "requesterTeam", message: "The team was deleted." }),
                issue({ kind: "warning", field: "folder", message: "The folder no longer exists." })
            ],
            []
        );

        expect(messages.warnings).toEqual(["The team was deleted.", "The folder no longer exists."]);
        expect(messages.requesterTeam).toBeNull();
        expect(messages.folder).toBeNull();
        expect(messages.hasError).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCard.test.tsx`:

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
import { within } from "@testing-library/react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { describeRule } from "~/editor/model/rules/describeRule.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createWorkflowUserSummary } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { createAssignmentSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createTargetMembersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createUsersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { WORKFLOW_PICKER_STUB_SEARCH } from "~/editor/testing/workflowPickerStub.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createEmptyStepFormOptions } from "../../createEmptyStepFormOptions.js";
import { RuleCard } from "./RuleCard.js";
import type { RuleCardProps } from "./RuleCard.js";
import type { RuleCardOptions } from "./RuleCardOptions.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const LEGAL = createPickerOption({ id: "team-1", label: "Legal", icon: "group" });
const MARKETING = createPickerOption({ id: "team-2", label: "Marketing", icon: "group" });
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
const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });
const HINT = "You can't see this folder. The condition stays as it is unless you remove it.";

const createOptions = (overrides: Partial<RuleCardOptions> = {}): RuleCardOptions => {
    return {
        assignment: createAssignmentSlice({ stepTeamIds: ["team-1", "team-2"], strategy: "none" }),
        teams: { ...createEmptyStepFormOptions().teams, options: [LEGAL, MARKETING], selected: [] },
        users: createUsersSlice({ items: [IVAN, ANA] }),
        targetMembers: createTargetMembersSlice({ items: [IVAN, ANA] }),
        folders: createFoldersSlice({ items: [CAMPAIGNS], folderType: "cms:article" }),
        references: createReferencesSlice(),
        ...overrides
    };
};

const createProps = (overrides: Partial<RuleCardProps> = {}): RuleCardProps => {
    return {
        rule: createRuleValue({ id: "rule-1" }),
        index: 0,
        total: 2,
        readOnly: false,
        options: createOptions(),
        issues: [],
        errors: [],
        onChange: vi.fn(),
        onRemoveFolder: vi.fn(),
        onMoveUp: vi.fn(),
        onMoveDown: vi.fn(),
        onDelete: vi.fn(),
        ...overrides
    };
};

const renderCard = (props: RuleCardProps) => {
    return renderWithAdminUi(<RuleCard {...props} />);
};

const getPicker = (label: string) => {
    return screen.getByTestId(`picker-${label}`);
};

const getOptionDetails = (label: string): PickerOption[] => {
    return JSON.parse(getPicker(label).getAttribute("data-option-details") ?? "[]");
};

const restrictedFolderProps = (overrides: Partial<RuleCardProps> = {}): RuleCardProps => {
    return createProps({
        rule: createRuleValue({
            folder: { id: "f9", type: "cms:article", includeDescendants: true }
        }),
        options: createOptions({
            references: createReferencesSlice({
                folders: [
                    createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
                ]
            })
        }),
        ...overrides
    });
};

describe("RuleCard: header and buttons (R313)", () => {
    afterEach(() => {
        cleanup();
    });

    it("is a group named Rule {n} with the number from its position", () => {
        renderCard(createProps({ index: 1, total: 3 }));

        expect(screen.getByRole("group", { name: "Rule 2" })).toBeDefined();
        expect(screen.getByText("Rule 2")).toBeDefined();
    });

    it("calls the move and delete callbacks from its three buttons", () => {
        const props = createProps({ index: 1, total: 3 });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Move rule up" }));
        fireEvent.click(screen.getByRole("button", { name: "Move rule down" }));
        fireEvent.click(screen.getByRole("button", { name: "Delete rule" }));

        expect(props.onMoveUp).toHaveBeenCalledTimes(1);
        expect(props.onMoveDown).toHaveBeenCalledTimes(1);
        expect(props.onDelete).toHaveBeenCalledTimes(1);
    });

    it("disables Move rule up on the first card and Move rule down on the last", () => {
        renderCard(createProps({ index: 0, total: 1 }));

        const up: HTMLButtonElement = screen.getByRole("button", { name: "Move rule up" });
        const down: HTMLButtonElement = screen.getByRole("button", { name: "Move rule down" });
        const remove: HTMLButtonElement = screen.getByRole("button", { name: "Delete rule" });
        expect(up.disabled).toBe(true);
        expect(down.disabled).toBe(true);
        expect(remove.disabled).toBe(false);
    });

    it("disables the three buttons for a read-only step", () => {
        renderCard(createProps({ index: 1, total: 3, readOnly: true }));

        for (const name of ["Move rule up", "Move rule down", "Delete rule"]) {
            const button: HTMLButtonElement = screen.getByRole("button", { name });
            expect(button.disabled).toBe(true);
        }
    });
});

describe("RuleCard: summary (R313)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows what describeRule says of the rule with the references", () => {
        const options = createOptions({
            references: createReferencesSlice({
                teams: [createReferenceLabel({ id: "team-2", label: "Marketing" })]
            })
        });
        const rule = createRuleValue({ requesterTeamId: "team-2" });
        renderCard(createProps({ rule, options }));

        expect(screen.getByTestId("rule-summary").textContent).toBe(
            describeRule(rule, options.references)
        );
        expect(screen.getByTestId("rule-summary").textContent).toContain("Marketing");
    });

    it("says that other conditions apply when the rule keeps a condition the editor cannot show", () => {
        const options = createOptions({
            references: createReferencesSlice({
                teams: [createReferenceLabel({ id: "team-2", label: "Marketing" })]
            })
        });
        const withEditable = createRuleValue({
            requesterTeamId: "team-2",
            preserved: { conditions: { modelId: "article" } }
        });
        renderCard(createProps({ rule: withEditable, options }));

        expect(screen.getByTestId("rule-summary").textContent).toContain("and other conditions");

        cleanup();
        const onlyPreserved = createRuleValue({ preserved: { conditions: { modelId: "article" } } });
        renderCard(createProps({ rule: onlyPreserved, options }));

        expect(screen.getByTestId("rule-summary").textContent).toContain(
            "If other conditions match"
        );
        expect(screen.getByTestId("rule-summary").textContent).not.toMatch(/^Always/);
    });
});

describe("RuleCard: the requester fields (R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("labels the user picker Requester is, with Anyone as placeholder and clear row, and lists the users", () => {
        renderCard(createProps());

        const picker = getPicker("Requester is");
        expect(picker.getAttribute("data-placeholder")).toBe("Anyone");
        expect(picker.getAttribute("data-any-label")).toBe("Anyone");
        expect(picker.getAttribute("data-options")).toBe("user-1,user-2");
    });

    it("sets and clears the requester user", () => {
        const props = createProps({ rule: createRuleValue({ requesterUserId: "user-1" }) });
        renderCard(props);

        expect(getPicker("Requester is").getAttribute("data-selected")).toBe("Ivan Horvat");

        fireEvent.click(screen.getByRole("button", { name: "Requester is: choose Ana Kovač" }));
        fireEvent.click(screen.getByRole("button", { name: "Requester is: clear" }));

        expect(props.onChange).toHaveBeenNthCalledWith(1, { requesterUserId: "user-2" });
        expect(props.onChange).toHaveBeenNthCalledWith(2, { requesterUserId: null });
    });

    it("shows a deleted requester user as muted Deleted user and no warning (copy gap 2)", () => {
        const options = createOptions({
            references: createReferencesSlice({
                users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
            })
        });
        renderCard(createProps({ rule: createRuleValue({ requesterUserId: "user-9" }), options }));

        const picker = getPicker("Requester is");
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
        expect(screen.queryByText("The assigned user was deleted.")).toBeNull();
    });

    it("labels the team picker Requester is in team, with Any team, over the team search results", () => {
        renderCard(createProps());

        const picker = getPicker("Requester is in team");
        expect(picker.getAttribute("data-placeholder")).toBe("Any team");
        expect(picker.getAttribute("data-any-label")).toBe("Any team");
        expect(picker.getAttribute("data-options")).toBe("team-1,team-2");
    });

    it("sets and clears the requester team and forwards a team search", () => {
        const search = vi.fn();
        const options = createOptions({
            teams: { ...createOptions().teams, search }
        });
        const props = createProps({ options });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Requester is in team: choose Marketing" }));
        fireEvent.click(screen.getByRole("button", { name: "Requester is in team: clear" }));
        fireEvent.click(screen.getByRole("button", { name: "Requester is in team: search" }));

        expect(props.onChange).toHaveBeenNthCalledWith(1, { requesterTeamId: "team-2" });
        expect(props.onChange).toHaveBeenNthCalledWith(2, { requesterTeamId: null });
        expect(search).toHaveBeenCalledWith(WORKFLOW_PICKER_STUB_SEARCH);
    });

    it("shows a saved requester team the search does not contain through the references, a deleted one muted", () => {
        const options = createOptions({
            teams: { ...createOptions().teams, options: [LEGAL] },
            references: createReferencesSlice({
                teams: [
                    createReferenceLabel({ id: "team-3", label: "Press" }),
                    createReferenceLabel({ id: "team-9", label: "Deleted team", state: "deleted" })
                ]
            })
        });
        renderCard(createProps({ rule: createRuleValue({ requesterTeamId: "team-3" }), options }));

        expect(getPicker("Requester is in team").getAttribute("data-selected")).toBe("Press");

        cleanup();
        renderCard(createProps({ rule: createRuleValue({ requesterTeamId: "team-9" }), options }));

        const deleted = getPicker("Requester is in team");
        expect(deleted.getAttribute("data-selected")).toBe("Deleted team");
        expect(deleted.getAttribute("data-selected-muted")).toBe("true");
        expect(deleted.getAttribute("data-selected-icon")).toBe("group_off");
    });

    it("shows the options banner in place of the team picker when the team search failed", () => {
        const retry = vi.fn();
        const options = createOptions({
            teams: { ...createOptions().teams, failed: true, retry }
        });
        renderCard(createProps({ options }));

        expect(screen.queryByTestId("picker-Requester is in team")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});

describe("RuleCard: the folder fields (R292, R295, QBZ-15)", () => {
    afterEach(() => {
        cleanup();
    });

    it("labels the folder picker Content is in folder, with Any folder, over the folder paths", () => {
        renderCard(createProps());

        const picker = getPicker("Content is in folder");
        expect(picker.getAttribute("data-placeholder")).toBe("Any folder");
        expect(picker.getAttribute("data-any-label")).toBe("Any folder");
        expect(picker.getAttribute("data-options")).toBe("folder-1");
    });

    it("sets a picked folder with the app's folder type and the subfolders flag it had, and clears it to null", () => {
        const rule = createRuleValue({
            folder: { id: "folder-9", type: "cms:old", includeDescendants: true }
        });
        const props = createProps({ rule });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: choose /Campaigns" }));
        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: clear" }));

        expect(props.onChange).toHaveBeenNthCalledWith(1, {
            folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
        });
        expect(props.onChange).toHaveBeenNthCalledWith(2, { folder: null });
    });

    it("starts a newly picked folder without subfolders", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: choose /Campaigns" }));

        expect(props.onChange).toHaveBeenCalledWith({
            folder: { id: "folder-1", type: "cms:article", includeDescendants: false }
        });
    });

    it("disables Include subfolders while there is no folder", () => {
        renderCard(createProps());

        const checkbox: HTMLButtonElement = screen.getByRole("checkbox", {
            name: "Include subfolders"
        });
        expect(checkbox.disabled).toBe(true);
        expect(checkbox.getAttribute("aria-checked")).toBe("false");
    });

    it("shows the saved subfolders flag and writes the toggle into the folder", () => {
        const folder = { id: "folder-1", type: "cms:article", includeDescendants: false };
        const props = createProps({ rule: createRuleValue({ folder }) });
        renderCard(props);

        const checkbox: HTMLButtonElement = screen.getByRole("checkbox", {
            name: "Include subfolders"
        });
        expect(checkbox.disabled).toBe(false);
        expect(checkbox.getAttribute("aria-checked")).toBe("false");

        fireEvent.click(checkbox);

        expect(props.onChange).toHaveBeenCalledWith({
            folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
        });
    });

    it("keeps the folder's own type when only the subfolders flag changes (R295)", () => {
        const folder = { id: "folder-1", type: "cms:other", includeDescendants: false };
        const props = createProps({ rule: createRuleValue({ folder }) });
        renderCard(props);

        fireEvent.click(screen.getByRole("checkbox", { name: "Include subfolders" }));

        expect(props.onChange).toHaveBeenCalledWith({
            folder: { id: "folder-1", type: "cms:other", includeDescendants: true }
        });
    });

    it("shows a restricted folder as a disabled Restricted folder with Remove, the hint and the saved subfolders flag read-only", () => {
        const props = restrictedFolderProps();
        renderCard(props);

        const picker = getPicker("Content is in folder");
        expect(picker.getAttribute("data-selected")).toBe("Restricted folder");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(screen.getByText(HINT)).toBeDefined();
        const checkbox: HTMLButtonElement = screen.getByRole("checkbox", {
            name: "Include subfolders"
        });
        expect(checkbox.disabled).toBe(true);
        expect(checkbox.getAttribute("aria-checked")).toBe("true");

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(props.onRemoveFolder).toHaveBeenCalledTimes(1);
        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("shows a deleted folder as Deleted folder and a warning", () => {
        const options = createOptions({
            references: createReferencesSlice({
                folders: [createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" })]
            })
        });
        const issues: RuleIssue[] = [
            {
                ruleId: "rule-1",
                index: 0,
                kind: "warning",
                field: "folder",
                message: "The folder no longer exists."
            }
        ];
        const rule = createRuleValue({
            folder: { id: "f8", type: "cms:article", includeDescendants: false }
        });
        renderCard(createProps({ rule, options, issues }));

        expect(getPicker("Content is in folder").getAttribute("data-selected")).toBe(
            "Deleted folder"
        );
        expect(screen.getByText("The folder no longer exists.")).toBeDefined();
    });
});

describe("RuleCard: the target field (R296, R299, R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("is required, with its placeholder and hint, and lists the pools and the members", () => {
        renderCard(createProps());

        const picker = getPicker("Then assign to");
        expect(picker.getAttribute("data-required")).toBe("true");
        expect(picker.getAttribute("data-placeholder")).toBe("Search reviewers or teams");
        expect(picker.getAttribute("data-description")).toBe(
            "Only members of this step's reviewing teams, or one of those teams."
        );
        expect(getOptionDetails("Then assign to").map(option => option.label)).toEqual([
            "Legal team pool",
            "Marketing team pool",
            "Ivan Horvat",
            "Ana Kovač"
        ]);
        expect(picker.getAttribute("data-any-label")).toBe("");
    });

    it("shows the saved target: a pool, then a member", () => {
        renderCard(createProps({ rule: createRuleValue({ target: { type: "team", id: "team-2" } }) }));

        expect(getPicker("Then assign to").getAttribute("data-value")).toBe("team:team-2");
        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe(
            "Marketing team pool"
        );

        cleanup();
        renderCard(createProps({ rule: createRuleValue({ target: { type: "user", id: "user-2" } }) }));

        expect(getPicker("Then assign to").getAttribute("data-value")).toBe("user:user-2");
        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe("Ana Kovač");
    });

    it("sets a user target, a team target and clears the target", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Then assign to: choose Ana Kovač" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Then assign to: choose Marketing team pool" })
        );
        fireEvent.click(screen.getByRole("button", { name: "Then assign to: clear" }));

        expect(props.onChange).toHaveBeenNthCalledWith(1, { target: { type: "user", id: "user-2" } });
        expect(props.onChange).toHaveBeenNthCalledWith(2, { target: { type: "team", id: "team-2" } });
        expect(props.onChange).toHaveBeenNthCalledWith(3, { target: null });
    });

    it("searches the members of the reviewing teams", () => {
        const searchTargetMembers = vi.fn();
        const options = createOptions({
            targetMembers: createTargetMembersSlice({ items: [IVAN], searchTargetMembers })
        });
        renderCard(createProps({ options }));

        fireEvent.click(screen.getByRole("button", { name: "Then assign to: search" }));

        expect(searchTargetMembers).toHaveBeenCalledWith(
            ["team-1", "team-2"],
            WORKFLOW_PICKER_STUB_SEARCH
        );
    });

    it("lists a target that left the reviewing teams as {Name} (not in reviewing teams)", () => {
        const left = createWorkflowUserSummary({
            id: "user-3",
            displayName: "Luka Perić",
            teamIds: ["team-9"]
        });
        const options = createOptions({
            targetMembers: createTargetMembersSlice({ items: [IVAN], selected: [left] })
        });
        renderCard(
            createProps({ rule: createRuleValue({ target: { type: "user", id: "user-3" } }), options })
        );

        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe(
            "Luka Perić (not in reviewing teams)"
        );
    });

    it("shows a deleted user target as muted Deleted user", () => {
        const options = createOptions({
            references: createReferencesSlice({
                users: [createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })]
            })
        });
        renderCard(
            createProps({ rule: createRuleValue({ target: { type: "user", id: "user-9" } }), options })
        );

        const picker = getPicker("Then assign to");
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
        expect(picker.getAttribute("data-selected-icon")).toBe("person_off");
    });

    it("shows a rule with no target as an empty field", () => {
        renderCard(createProps({ rule: createRuleValue({ target: null }) }));

        expect(getPicker("Then assign to").getAttribute("data-value")).toBe("");
        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe("");
    });

    it("shows the options banner in place of the target picker when the members failed to load", () => {
        const retry = vi.fn();
        const options = createOptions({
            targetMembers: createTargetMembersSlice({ failed: true, retry })
        });
        renderCard(createProps({ options }));

        expect(screen.queryByTestId("picker-Then assign to")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});

describe("RuleCard: issues and server errors (R299, R303, Q50)", () => {
    afterEach(() => {
        cleanup();
    });

    const targetError = (message: string): RuleIssue => {
        return { ruleId: "rule-1", index: 0, kind: "error", field: "target", message };
    };

    it("shows a live error under its field and gives the card the destructive border", () => {
        renderCard(createProps({ issues: [targetError("Choose who this rule assigns to.")] }));

        expect(getPicker("Then assign to").getAttribute("data-error")).toBe(
            "Choose who this rule assigns to."
        );
        const card = screen.getByRole("group", { name: "Rule 1" });
        expect(card.className).toContain("border-destructive-default");
    });

    it("has the neutral border and no error for a clean rule", () => {
        renderCard(createProps());

        expect(getPicker("Then assign to").getAttribute("data-error")).toBe("");
        const card = screen.getByRole("group", { name: "Rule 1" });
        expect(card.className).toContain("border-neutral-muted");
        expect(card.className).not.toContain("border-destructive-default");
    });

    it("shows a server error of the target instead of the live one, once", () => {
        renderCard(
            createProps({
                issues: [targetError("Ivan Horvat is no longer in the reviewing teams.")],
                errors: [
                    {
                        ruleId: "rule-1",
                        field: "target",
                        message: "The target user is not a member of the step's teams."
                    }
                ]
            })
        );

        expect(getPicker("Then assign to").getAttribute("data-error")).toBe(
            "The target user is not a member of the step's teams."
        );
        expect(screen.queryByText("Ivan Horvat is no longer in the reviewing teams.")).toBeNull();
    });

    it("shows a server error on a requester or folder field under that field", () => {
        renderCard(
            createProps({
                errors: [
                    { ruleId: "rule-1", field: "requesterUser", message: "No such user." },
                    { ruleId: "rule-1", field: "requesterTeam", message: "No such team." },
                    { ruleId: "rule-1", field: "folder", message: "No such folder." }
                ]
            })
        );

        expect(getPicker("Requester is").getAttribute("data-error")).toBe("No such user.");
        expect(getPicker("Requester is in team").getAttribute("data-error")).toBe("No such team.");
        expect(getPicker("Content is in folder").getAttribute("data-error")).toBe("No such folder.");
        expect(getPicker("Then assign to").getAttribute("data-error")).toBe("");
    });

    it("lists the warnings below the fields without the Rule prefix, and keeps the neutral border", () => {
        const issues: RuleIssue[] = [
            {
                ruleId: "rule-1",
                index: 0,
                kind: "warning",
                field: "requesterTeam",
                message: "The team was deleted."
            }
        ];
        renderCard(createProps({ issues }));

        expect(screen.getByText("The team was deleted.")).toBeDefined();
        expect(screen.queryByText(/^Rule 1:/)).toBeNull();
        const card = screen.getByRole("group", { name: "Rule 1" });
        expect(card.className).not.toContain("border-destructive-default");
    });

    it("renders no read-access warning, no exclusion note and no Unavailable option text (Q50)", () => {
        renderCard(createProps());

        const card = screen.getByRole("group", { name: "Rule 1" });
        expect(within(card).queryByText(/can't read/i)).toBeNull();
        expect(within(card).queryByText(/unavailable/i)).toBeNull();
        expect(within(card).queryByText(/excluded/i)).toBeNull();
        for (const option of getOptionDetails("Then assign to")) {
            expect(option.warning).toBeNull();
            expect(option.description ?? "").not.toMatch(/unavailable|excluded|can't read/i);
        }
    });
});

describe("RuleCard: read-only", () => {
    afterEach(() => {
        cleanup();
    });

    it("disables every picker and the subfolders checkbox", () => {
        const rule = createRuleValue({
            folder: { id: "folder-1", type: "cms:article", includeDescendants: false }
        });
        renderCard(createProps({ rule, readOnly: true }));

        for (const label of [
            "Requester is",
            "Requester is in team",
            "Content is in folder",
            "Then assign to"
        ]) {
            expect(getPicker(label).getAttribute("data-disabled")).toBe("true");
        }
        const checkbox: HTMLButtonElement = screen.getByRole("checkbox", {
            name: "Include subfolders"
        });
        expect(checkbox.disabled).toBe(true);
    });

    it("disables Remove on a restricted folder", () => {
        renderCard(restrictedFolderProps({ readOnly: true }));

        const remove: HTMLButtonElement = screen.getByRole("button", { name: "Remove" });
        expect(remove.disabled).toBe(true);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/getRuleFieldMessages.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCard.test.tsx 2>&1 | tail -30
```

Expected: both fail with `Failed to resolve import` (`./getRuleFieldMessages.js`, `./RuleCard.js`).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCardOptions.ts`:

```ts
import type { StepFormOptions } from "../../StepFormOptions.js";

// The slices of the step form options a rule card reads (R307, R298).
export type RuleCardOptions = Pick<
    StepFormOptions,
    "assignment" | "teams" | "users" | "targetMembers" | "folders" | "references"
>;
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleFieldMessages.ts`:

```ts
// What a rule card shows of its issues and server errors (R299, R303).
export interface RuleFieldMessages {
    // The message under each field: the server error of that field, else its live error issue.
    target: string | null;
    requesterUser: string | null;
    requesterTeam: string | null;
    folder: string | null;
    // True when the rule holds an error of either kind: the card gets the destructive border.
    hasError: boolean;
    // The rule's warnings in order, without the `Rule {n}:` prefix (that is for the step card and the drawer top).
    warnings: string[];
}
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/getRuleFieldMessages.ts`:

```ts
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import type { RuleFieldMessages } from "./RuleFieldMessages.js";

function getFieldMessage(
    field: RuleIssue["field"],
    issues: RuleIssue[],
    errors: StepFormRuleError[]
): string | null {
    const serverError = errors.find(error => error.field === field);
    if (serverError !== undefined) {
        return serverError.message;
    }
    const liveError = issues.find(issue => issue.kind === "error" && issue.field === field);
    if (liveError !== undefined) {
        return liveError.message;
    }
    return null;
}

/*
 * The messages of one rule card (R299, R303): per field the server error if there is one, else the
 * live error issue, so a server error replaces the live message and never doubles it; the warnings
 * in order; and whether the rule holds an error at all.
 */
export const getRuleFieldMessages = (
    issues: RuleIssue[],
    errors: StepFormRuleError[]
): RuleFieldMessages => {
    const target = getFieldMessage("target", issues, errors);
    const requesterUser = getFieldMessage("requesterUser", issues, errors);
    const requesterTeam = getFieldMessage("requesterTeam", issues, errors);
    const folder = getFieldMessage("folder", issues, errors);
    const warnings = issues.filter(issue => issue.kind === "warning").map(issue => issue.message);
    const hasError =
        target !== null || requesterUser !== null || requesterTeam !== null || folder !== null;

    return { target, requesterUser, requesterTeam, folder, hasError, warnings };
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleSummary.tsx`:

```tsx
import React from "react";
import { Text } from "@webiny/admin-ui";

export interface RuleSummaryProps {
    text: string;
}

// The readable summary of a rule in its neutral box (design `ruleSummary`, R313).
export const RuleSummary = ({ text }: RuleSummaryProps) => {
    return (
        <div data-testid={"rule-summary"} className={"rounded-sm bg-neutral-light px-sm py-xs"}>
            <Text size={"sm"} className={"text-neutral-strong"}>
                {text}
            </Text>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleWarnings.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";

export interface RuleWarningsProps {
    warnings: string[];
}

// The warnings of a rule below its fields (design 4.2): the warning icon and the message, no prefix.
export const RuleWarnings = ({ warnings }: RuleWarningsProps) => {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div className={"flex flex-col gap-xs"}>
            {warnings.map((warning, index) => (
                <div key={`${index}:${warning}`} className={"flex items-start gap-xs"}>
                    <Icon
                        icon={<WarningIcon />}
                        label={"Warning"}
                        size={"sm"}
                        className={"fill-warning-xstrong"}
                    />
                    <Text size={"sm"} className={"text-warning-xstrong"}>
                        {warning}
                    </Text>
                </div>
            ))}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleFields.tsx`:

```tsx
import React from "react";
import { Checkbox } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import { FolderPickerControl } from "../../components/FolderPickerControl.js";
import { PickerLoadFailed } from "../../components/PickerLoadFailed.js";
import { UserPickerControl } from "../../components/UserPickerControl.js";
import { getReferenceSelection } from "../../getReferenceSelection.js";
import { getRuleTargetOptions } from "../../getRuleTargetOptions.js";
import { getTeamNames } from "../../getTeamNames.js";
import { isRestrictedFolder } from "../../isRestrictedFolder.js";
import { parseRuleTargetOptionId } from "../../parseRuleTargetOptionId.js";
import { toRuleTargetOptionId } from "../../toRuleTargetOptionId.js";
import type { RuleCardOptions } from "./RuleCardOptions.js";
import type { RuleFieldMessages } from "./RuleFieldMessages.js";

export interface RuleFieldsProps {
    rule: RuleValue;
    options: RuleCardOptions;
    messages: RuleFieldMessages;
    readOnly: boolean;
    onChange(patch: RulePatch): void;
    onRemoveFolder(): void;
}

/*
 * The five fields of a rule (design 4.2): requester user, requester team, folder with its
 * subfolders flag, and the target. Each reports its edit as a `RulePatch`; the rule itself is
 * never mutated.
 */
export const RuleFields = (props: RuleFieldsProps) => {
    const { rule, options, messages, readOnly } = props;
    const { assignment, teams, targetMembers, folders, references } = options;
    const teamNames = getTeamNames(teams, references);
    const folderId = rule.folder === null ? null : rule.folder.id;
    const restricted = isRestrictedFolder(folderId, folders, references);

    const handleUserChange = (userId: string | null) => {
        props.onChange({ requesterUserId: userId });
    };

    const handleTeamChange = (teamId: string | null) => {
        props.onChange({ requesterTeamId: teamId });
    };

    const handleFolderChange = (newFolderId: string | null) => {
        if (newFolderId === null) {
            props.onChange({ folder: null });
            return;
        }
        let includeDescendants = false;
        if (rule.folder !== null) {
            includeDescendants = rule.folder.includeDescendants;
        }
        props.onChange({
            folder: { id: newFolderId, type: folders.folderType, includeDescendants }
        });
    };

    const handleSubfoldersChange = (checked: boolean) => {
        if (rule.folder === null) {
            return;
        }
        props.onChange({ folder: { ...rule.folder, includeDescendants: checked } });
    };

    const handleTargetChange = (optionId: string | null) => {
        if (optionId === null) {
            props.onChange({ target: null });
            return;
        }
        const target = parseRuleTargetOptionId(optionId);
        props.onChange({ target });
    };

    let teamPicker: React.ReactNode = null;
    if (teams.failed) {
        teamPicker = (
            <PickerLoadFailed
                label={ASSIGNMENT_FORM_MESSAGES.requesterTeamLabel}
                disabled={readOnly}
                onRetry={teams.retry}
            />
        );
    } else {
        const known = [...teams.selected, ...teams.options];
        const selected = getReferenceSelection({
            id: rule.requesterTeamId,
            kind: "team",
            known,
            references
        });
        teamPicker = (
            <WorkflowPicker
                label={ASSIGNMENT_FORM_MESSAGES.requesterTeamLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyTeam}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyTeam}
                value={rule.requesterTeamId}
                selected={selected}
                options={teams.options}
                onSearch={teams.search}
                onChange={handleTeamChange}
                disabled={readOnly}
                error={messages.requesterTeam}
            />
        );
    }

    let targetPicker: React.ReactNode = null;
    if (targetMembers.failed) {
        targetPicker = (
            <PickerLoadFailed
                label={ASSIGNMENT_FORM_MESSAGES.targetLabel}
                required
                disabled={readOnly}
                onRetry={targetMembers.retry}
            />
        );
    } else {
        const targetOptions = getRuleTargetOptions({
            stepTeamIds: assignment.stepTeamIds,
            teamNames,
            members: targetMembers,
            target: rule.target,
            references
        });
        let targetValue: string | null = null;
        if (rule.target !== null) {
            targetValue = toRuleTargetOptionId(rule.target);
        }
        targetPicker = (
            <WorkflowPicker
                label={ASSIGNMENT_FORM_MESSAGES.targetLabel}
                description={ASSIGNMENT_FORM_MESSAGES.targetHint}
                required
                placeholder={ASSIGNMENT_FORM_MESSAGES.targetPlaceholder}
                value={targetValue}
                selected={targetOptions.selected}
                options={targetOptions.options}
                onSearch={query => targetMembers.searchTargetMembers(assignment.stepTeamIds, query)}
                onChange={handleTargetChange}
                disabled={readOnly}
                error={messages.target}
            />
        );
    }

    const includeDescendants = rule.folder !== null && rule.folder.includeDescendants;

    return (
        <div className={"grid grid-cols-2 gap-md"}>
            <UserPickerControl
                label={ASSIGNMENT_FORM_MESSAGES.requesterUserLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyUser}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyUser}
                value={rule.requesterUserId}
                users={options.users}
                references={references}
                teamNames={teamNames}
                disabled={readOnly}
                error={messages.requesterUser}
                onChange={handleUserChange}
            />
            {teamPicker}
            <FolderPickerControl
                label={ASSIGNMENT_FORM_MESSAGES.folderLabel}
                placeholder={ASSIGNMENT_FORM_MESSAGES.anyFolder}
                anyLabel={ASSIGNMENT_FORM_MESSAGES.anyFolder}
                value={folderId}
                folders={folders}
                references={references}
                disabled={readOnly}
                error={messages.folder}
                onRemove={props.onRemoveFolder}
                onChange={handleFolderChange}
            />
            <div className={"flex items-end pb-xs"}>
                <Checkbox
                    id={`${rule.id}-include-subfolders`}
                    label={ASSIGNMENT_FORM_MESSAGES.includeSubfolders}
                    checked={includeDescendants}
                    disabled={readOnly || rule.folder === null || restricted}
                    onChange={handleSubfoldersChange}
                />
            </div>
            <div className={"col-span-2"}>{targetPicker}</div>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCard.tsx`:

```tsx
import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { describeRule } from "~/editor/model/rules/describeRule.js";
import type { RuleIssue } from "~/editor/model/rules/RuleIssue.js";
import type { RulePatch } from "~/editor/model/rules/RulePatch.js";
import { ASSIGNMENT_FORM_MESSAGES } from "../../assignmentFormMessages.js";
import type { StepFormRuleError } from "../../StepFormOptions.js";
import { getRuleFieldMessages } from "./getRuleFieldMessages.js";
import type { RuleCardOptions } from "./RuleCardOptions.js";
import { RuleFields } from "./RuleFields.js";
import { RuleSummary } from "./RuleSummary.js";
import { RuleWarnings } from "./RuleWarnings.js";

export interface RuleCardProps {
    rule: RuleValue;
    // The position of the rule in the list, zero-based; the title is `Rule {index + 1}`.
    index: number;
    total: number;
    readOnly: boolean;
    options: RuleCardOptions;
    // The live issues of this rule (R299) and the server errors of this rule (R303).
    issues: RuleIssue[];
    errors: StepFormRuleError[];
    onChange(patch: RulePatch): void;
    onRemoveFolder(): void;
    onMoveUp(): void;
    onMoveDown(): void;
    onDelete(): void;
}

/*
 * One routing rule (design 4.2, R299, R303, R313): the header with the number and the move and
 * delete buttons, the readable summary, the five fields and the rule's warnings. The card is
 * controlled: it reports edits and never holds the rule. A rule that holds an error gets the
 * destructive border.
 */
export const RuleCard = (props: RuleCardProps) => {
    const { rule, index, total, readOnly, options } = props;
    const messages = getRuleFieldMessages(props.issues, props.errors);
    const summary = describeRule(rule, options.references);
    const title = ASSIGNMENT_FORM_MESSAGES.ruleTitle(index + 1);

    const cardClass = cn(
        "flex flex-col gap-md rounded-lg border-sm bg-neutral-base p-md",
        messages.hasError && "border-destructive-default",
        !messages.hasError && "border-neutral-muted"
    );

    return (
        <div role={"group"} aria-label={title} data-rule-id={rule.id} className={cardClass}>
            <div className={"flex items-center justify-between"}>
                <Text
                    as={"span"}
                    size={"sm"}
                    className={"font-semibold uppercase tracking-wide text-neutral-strong"}
                >
                    {title}
                </Text>
                <div className={"flex items-center gap-xxs"}>
                    <IconButton
                        aria-label={ASSIGNMENT_FORM_MESSAGES.moveRuleUp}
                        variant={"ghost"}
                        size={"sm"}
                        icon={<ArrowUpwardIcon />}
                        disabled={readOnly || index === 0}
                        onClick={props.onMoveUp}
                    />
                    <IconButton
                        aria-label={ASSIGNMENT_FORM_MESSAGES.moveRuleDown}
                        variant={"ghost"}
                        size={"sm"}
                        icon={<ArrowDownwardIcon />}
                        disabled={readOnly || index === total - 1}
                        onClick={props.onMoveDown}
                    />
                    <IconButton
                        aria-label={ASSIGNMENT_FORM_MESSAGES.deleteRule}
                        variant={"ghost"}
                        size={"sm"}
                        icon={<DeleteIcon />}
                        disabled={readOnly}
                        onClick={props.onDelete}
                    />
                </div>
            </div>
            <RuleSummary text={summary} />
            <RuleFields
                rule={rule}
                options={options}
                messages={messages}
                readOnly={readOnly}
                onChange={props.onChange}
                onRemoveFolder={props.onRemoveFolder}
            />
            <RuleWarnings warnings={messages.warnings} />
        </div>
    );
};
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/getRuleFieldMessages.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/stepForm/renderers/routingRules/RuleCard.test.tsx 2>&1 | tail -40
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
git commit -m "feat(app-workflows): add the routing rule card with its fields, summary and messages" -m "A rule is a controlled card: the Rule n header with move up, move down and delete, the readable summary, the requester user and team, the folder with its subfolders flag and the restricted folder state, the required target over the reviewing teams' pools and members, and the rule's warnings. A server error replaces the live message of its field, any error gives the card the destructive border, and no read-access or exclusion text is shown." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`RuleCard` has no `edited` argument and no `clearRuleError`:** the contract says the list "calls `clearRuleError` when a rule's field is edited"; the card only reports a `RulePatch` and the list (Task 21b) clears the rule's error, so the card stays free of the options' callbacks. `RuleCardProps` takes `issues` and `errors` already filtered to the rule (the list filters by `ruleId`).
- **Hint of the target field** is the picker's `description` (shown above the input, under the label): `WorkflowPicker` has no slot below the input, and the design's hint position would need a new prop (not in the contract).
- **`getRuleFieldMessages` dedupes server and live errors by field;** Task 16 also drops a live issue that a server error overrides in `vm.ruleIssues` and the warnings block. Both are safe together; the card must not rely on Task 16 for this.
- **`describeRule` is called with `options.references`** (`StepFormReferencesOptions` extends `RuleReferences`). The tests call the real `describeRule` (Task 11) and assert only `toContain` fragments of its text, so a wording tweak in Task 11 does not break them; the equality test compares with the function's own output.
- **No exclusion or read-access text exists in the card** (Q50, Review Focus 11): the negative test pins it for the card text and the option lists.
- **Layout detail the contract leaves open:** the subfolders checkbox sits next to the folder picker in a two-column grid, the target spans both columns.
- Size: large (seven source files, two test files, about 40 cases).

## Review fixes (sub-phase review)

- No change to the task text. Checked: no nested call arguments in the source, a server error replaces the live message per field, the negative test for exclusion and read-access text is present, and the slice and callback names match Task 18.
