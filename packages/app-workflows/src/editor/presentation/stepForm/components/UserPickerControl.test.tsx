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

    it("keeps the field error under the options failure", () => {
        const users = createUsersSlice({ failed: true });
        renderWithAdminUi(
            <UserPickerControl {...createProps({ users, error: "Pick someone." })} />
        );

        expect(screen.getByText("Could not load the step options.")).toBeDefined();
        expect(screen.getByText("Pick someone.")).toBeDefined();
    });
});
