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
                    createReferenceLabel({
                        id: "f9",
                        label: "Restricted folder",
                        state: "restricted"
                    })
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
        const onlyPreserved = createRuleValue({
            preserved: { conditions: { modelId: "article" } }
        });
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

    it("shows a deleted requester user as muted Deleted user (copy gap 2)", () => {
        const options = createOptions({
            references: createReferencesSlice({
                users: [
                    createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })
                ]
            })
        });
        renderCard(createProps({ rule: createRuleValue({ requesterUserId: "user-9" }), options }));

        const picker = getPicker("Requester is");
        expect(picker.getAttribute("data-selected")).toBe("Deleted user");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
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

        fireEvent.click(
            screen.getByRole("button", { name: "Requester is in team: choose Marketing" })
        );
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

        fireEvent.click(
            screen.getByRole("button", { name: "Content is in folder: choose /Campaigns" })
        );
        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: clear" }));

        expect(props.onChange).toHaveBeenNthCalledWith(1, {
            folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
        });
        expect(props.onChange).toHaveBeenNthCalledWith(2, { folder: null });
    });

    it("starts a newly picked folder without subfolders", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(
            screen.getByRole("button", { name: "Content is in folder: choose /Campaigns" })
        );

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
                folders: [
                    createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" })
                ]
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
        renderCard(
            createProps({ rule: createRuleValue({ target: { type: "team", id: "team-2" } }) })
        );

        expect(getPicker("Then assign to").getAttribute("data-value")).toBe("team:team-2");
        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe(
            "Marketing team pool"
        );

        cleanup();
        renderCard(
            createProps({ rule: createRuleValue({ target: { type: "user", id: "user-2" } }) })
        );

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

        expect(props.onChange).toHaveBeenNthCalledWith(1, {
            target: { type: "user", id: "user-2" }
        });
        expect(props.onChange).toHaveBeenNthCalledWith(2, {
            target: { type: "team", id: "team-2" }
        });
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
            createProps({
                rule: createRuleValue({ target: { type: "user", id: "user-3" } }),
                options
            })
        );

        expect(getPicker("Then assign to").getAttribute("data-selected")).toBe(
            "Luka Perić (not in reviewing teams)"
        );
    });

    it("shows a deleted user target as muted Deleted user", () => {
        const options = createOptions({
            references: createReferencesSlice({
                users: [
                    createReferenceLabel({ id: "user-9", label: "Deleted user", state: "deleted" })
                ]
            })
        });
        renderCard(
            createProps({
                rule: createRuleValue({ target: { type: "user", id: "user-9" } }),
                options
            })
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

    it("shows a live error under its field", () => {
        renderCard(createProps({ issues: [targetError("Choose who this rule assigns to.")] }));

        expect(getPicker("Then assign to").getAttribute("data-error")).toBe(
            "Choose who this rule assigns to."
        );
    });

    it("shows no error for a clean rule", () => {
        renderCard(createProps());

        expect(getPicker("Then assign to").getAttribute("data-error")).toBe("");
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
        expect(getPicker("Content is in folder").getAttribute("data-error")).toBe(
            "No such folder."
        );
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
