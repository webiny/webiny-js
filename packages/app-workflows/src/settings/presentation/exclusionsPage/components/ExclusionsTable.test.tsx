import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createExclusionRowVm } from "~/settings/testing/createExclusionRowVm.js";
import { createFakeExclusionsPagePresenter } from "~/settings/testing/fakeExclusionsPagePresenter.js";
import type { ExclusionRowVm } from "../abstractions.js";
import { ExclusionsTable } from "./ExclusionsTable.js";

const ANA = createExclusionRowVm();

const DELETED = createExclusionRowVm({
    userId: "user-9",
    label: "Deleted user",
    muted: true,
    subLine: "This user no longer exists",
    reason: "No reason given",
    reasonMuted: true,
    untilLabel: "Until removed",
    untilTitle: "Until removed",
    editLabel: "Edit exclusion for Deleted user",
    removeLabel: "Remove exclusion for Deleted user"
});

const EXPIRED = createExclusionRowVm({
    userId: "user-2",
    label: "Luka Perić",
    reason: "Workload",
    untilLabel: "3 Sep 2026, 06:59",
    untilTitle: "Thu 3 Sep 2026, 06:59 CEST (Europe/Zagreb)",
    status: "expired",
    statusLabel: "Expired",
    editLabel: "Edit exclusion for Luka Perić",
    removeLabel: "Remove exclusion for Luka Perić"
});

const UNRESOLVED = createExclusionRowVm({
    userId: "user-77",
    label: "user-77",
    editLabel: "Edit exclusion for user-77",
    removeLabel: "Remove exclusion for user-77"
});

const renderTable = (rows: ExclusionRowVm[]) => {
    const presenter = createFakeExclusionsPagePresenter();
    const result = renderWithAdminUi(<ExclusionsTable rows={rows} presenter={presenter} />);
    return { presenter, result };
};

const getRow = (container: HTMLElement, userId: string): HTMLElement => {
    const row = container.querySelector<HTMLElement>(`[data-user-id="${userId}"]`);
    if (!row) {
        throw new Error(`No row for ${userId}.`);
    }
    return row;
};

describe("ExclusionsTable (R323)", () => {
    it("shows the column headers User, Reason, Until, Status and an empty actions header", () => {
        renderTable([ANA]);

        const headers = screen.getAllByRole("columnheader").map(header => header.textContent);

        expect(headers).toEqual(["User", "Reason", "Until", "Status", ""]);
    });

    it("shows the name, the reason and the until label with the full time as its title", () => {
        renderTable([ANA]);

        expect(screen.getByText("Ana Kovač")).toBeTruthy();
        expect(screen.getByText("On leave")).toBeTruthy();
        const until = screen.getByText("End of 20 Oct 2026");
        expect(until.getAttribute("title")).toBe("Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)");
    });

    it("shows a deleted user with the person_off icon, the muted label and the sub line", () => {
        const { result } = renderTable([DELETED]);

        const row = getRow(result.container, "user-9");
        const label = screen.getByText("Deleted user");

        expect(row.querySelector('[data-icon="person_off"]')).not.toBeNull();
        expect(label.closest("[data-muted]")).not.toBeNull();
        expect(screen.getByText("This user no longer exists")).toBeTruthy();
    });

    it("keeps both actions enabled on a deleted user's row (Q64)", () => {
        const { presenter } = renderTable([DELETED]);

        const edit: HTMLButtonElement = screen.getByRole("button", {
            name: "Edit exclusion for Deleted user"
        });
        const remove: HTMLButtonElement = screen.getByRole("button", {
            name: "Remove exclusion for Deleted user"
        });

        expect(edit.disabled).toBe(false);
        expect(remove.disabled).toBe(false);
        fireEvent.click(remove);
        expect(presenter.openRemove).toHaveBeenCalledWith("user-9");
    });

    it("shows an unresolved user by the raw id without the deleted-user marker", () => {
        const { result } = renderTable([UNRESOLVED]);

        const row = getRow(result.container, "user-77");

        expect(screen.getByText("user-77")).toBeTruthy();
        expect(row.querySelector('[data-icon="person_off"]')).toBeNull();
    });

    it("shows a missing reason muted", () => {
        renderTable([DELETED]);

        const reason = screen.getByText("No reason given");

        expect(reason.closest("[data-muted]")).not.toBeNull();
    });

    it("shows Active and Expired tags", () => {
        const { result } = renderTable([ANA, EXPIRED]);

        const active = getRow(result.container, "user-1").querySelector<HTMLElement>(
            '[data-status="active"]'
        );
        const expired = getRow(result.container, "user-2").querySelector<HTMLElement>(
            '[data-status="expired"]'
        );

        expect(active?.textContent).toBe("Active");
        expect(expired?.textContent).toBe("Expired");
    });

    it("names the row actions for screen readers and titles them Edit and Remove (Q68.6)", () => {
        renderTable([ANA]);

        const edit = screen.getByRole("button", { name: "Edit exclusion for Ana Kovač" });
        const remove = screen.getByRole("button", { name: "Remove exclusion for Ana Kovač" });

        expect(edit.getAttribute("title")).toBe("Edit");
        expect(remove.getAttribute("title")).toBe("Remove");
    });

    it("opens Edit from the Edit button once, without the row click", () => {
        const { presenter } = renderTable([ANA]);

        fireEvent.click(screen.getByRole("button", { name: "Edit exclusion for Ana Kovač" }));

        expect(presenter.openEdit).toHaveBeenCalledTimes(1);
        expect(presenter.openEdit).toHaveBeenCalledWith("user-1");
    });

    it("opens Remove from the Remove button and not Edit", () => {
        const { presenter } = renderTable([ANA]);

        fireEvent.click(screen.getByRole("button", { name: "Remove exclusion for Ana Kovač" }));

        expect(presenter.openRemove).toHaveBeenCalledWith("user-1");
        expect(presenter.openEdit).not.toHaveBeenCalled();
    });

    it("opens Edit on a row click", () => {
        const { presenter } = renderTable([ANA, EXPIRED]);

        fireEvent.click(screen.getByText("Workload"));

        expect(presenter.openEdit).toHaveBeenCalledWith("user-2");
    });

    it("renders the rows in the order of the view model", () => {
        const { result } = renderTable([EXPIRED, ANA, DELETED]);

        const ids = Array.from(result.container.querySelectorAll("[data-user-id]")).map(row =>
            row.getAttribute("data-user-id")
        );

        expect(ids).toEqual(["user-2", "user-1", "user-9"]);
    });
});
