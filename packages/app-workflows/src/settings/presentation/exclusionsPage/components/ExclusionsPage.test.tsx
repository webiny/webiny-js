import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createExclusionRowVm } from "~/settings/testing/createExclusionRowVm.js";
import { createExclusionsPageViewModel } from "~/settings/testing/createExclusionsPageViewModel.js";
import { createFakeExclusionsPagePresenter } from "~/settings/testing/fakeExclusionsPagePresenter.js";
import type { ExclusionsPageVm } from "../abstractions.js";
import { ExclusionsPagePresenter } from "../abstractions.js";
import { ExclusionsPage } from "./ExclusionsPage.js";

const permission = vi.hoisted(() => {
    return { editor: true };
});

vi.mock("~/presentation/permissions/useWorkflowsPermission.js", () => {
    return {
        useWorkflowsPermission: () => {
            return { editor: permission.editor, reassign: false };
        }
    };
});

vi.mock("~/settings/model/time/resolveViewerTimeZone.js", () => {
    return {
        resolveViewerTimeZone: () => {
            return "Europe/Zagreb";
        }
    };
});

const renderPage = (vm: ExclusionsPageVm) => {
    const presenter = createFakeExclusionsPagePresenter(vm);
    const container = new Container();
    container.registerInstance(ExclusionsPagePresenter, presenter);
    const result = renderWithContainer(<ExclusionsPage />, container);
    return { presenter, result };
};

const LOADING = createExclusionsPageViewModel({ status: "loading", canAdd: false });
const FAILED = createExclusionsPageViewModel({ status: "failed", canAdd: false });
const NO_ACCESS = createExclusionsPageViewModel({ status: "noAccess", canAdd: false });
const READY = createExclusionsPageViewModel({ rows: [createExclusionRowVm()] });

const queryAddButtons = () => {
    return screen.queryAllByRole("button", { name: "Add exclusion" });
};

describe("ExclusionsPage presenter wiring (R337)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("initialises the presenter with the editor permission and the viewer's zone, and disposes it", () => {
        const { presenter, result } = renderPage(READY);

        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.init).toHaveBeenCalledWith({
            canManage: true,
            timeZone: "Europe/Zagreb"
        });
        expect(presenter.dispose).not.toHaveBeenCalled();

        result.unmount();
        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });

    it("passes canManage false without the editor permission", () => {
        permission.editor = false;

        const { presenter } = renderPage(NO_ACCESS);

        expect(presenter.init).toHaveBeenCalledWith({
            canManage: false,
            timeZone: "Europe/Zagreb"
        });
    });
});

describe("ExclusionsPage states (R322, R329)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("always shows the title and the sub line", () => {
        [LOADING, FAILED, NO_ACCESS, READY].forEach(vm => {
            const { result } = renderPage(vm);

            expect(
                screen.getByRole("heading", { level: 3, name: "Reviewer exclusions" })
            ).toBeTruthy();
            expect(
                screen.getByText(
                    "Take people out of automatic assignment for a while, e.g. during leave or when their workload is too high."
                )
            ).toBeTruthy();
            result.unmount();
        });
    });

    it("shows five skeleton rows while loading, without the Add button, rules or toolbar", () => {
        renderPage(LOADING);

        expect(screen.getAllByTestId("exclusions-loading-row")).toHaveLength(5);
        expect(queryAddButtons()).toHaveLength(0);
        expect(screen.queryByTestId("exclusions-rules")).toBeNull();
        expect(screen.queryByTestId("exclusions-toolbar")).toBeNull();
    });

    it("shows the load error with Try again, which reloads, and no Add button", () => {
        const { presenter, result } = renderPage(FAILED);

        expect(screen.getByText("Could not load exclusions")).toBeTruthy();
        expect(screen.getByText("The server did not respond. Try again in a moment.")).toBeTruthy();
        expect(result.container.querySelector('[data-icon="cloud_off"]')).toBeNull();
        expect(
            screen.getByTestId("exclusions-load-error").querySelector("svg[aria-hidden]")
        ).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(0);

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(presenter.reload).toHaveBeenCalledTimes(1);
    });

    it("shows the no-access view with the lock icon and nothing else", () => {
        const { result } = renderPage(NO_ACCESS);

        expect(screen.getByText("You don't have access to reviewer exclusions")).toBeTruthy();
        expect(
            screen.getByText(
                "Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
        expect(result.container.querySelector('[data-icon="lock"]')).toBeNull();
        expect(
            screen.getByTestId("exclusions-no-access").querySelector("svg[aria-hidden]")
        ).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(0);
        expect(screen.queryByTestId("exclusions-rules")).toBeNull();
        expect(screen.queryByTestId("exclusions-toolbar")).toBeNull();
        expect(screen.queryByTestId("exclusions-table")).toBeNull();
    });

    it("shows the Add button when the list is loaded, and it opens Add", () => {
        const { presenter } = renderPage(READY);

        const buttons = queryAddButtons();
        expect(buttons).toHaveLength(1);

        fireEvent.click(buttons[0]);

        expect(presenter.openAdd).toHaveBeenCalledTimes(1);
    });

    it("hides the Add button whenever canAdd is false", () => {
        renderPage(
            createExclusionsPageViewModel({ canAdd: false, rows: [createExclusionRowVm()] })
        );

        expect(queryAddButtons()).toHaveLength(0);
    });

    it("shows the four rules with their icons when ready", () => {
        const { result } = renderPage(READY);

        expect(screen.getByText("Automatic assignment skips excluded people.")).toBeTruthy();
        expect(screen.getByText("Reviewer pickers show them as Unavailable.")).toBeTruthy();
        expect(screen.getByText("Work they already hold stays with them.")).toBeTruthy();
        expect(screen.getByText("They can still start or take over work themselves.")).toBeTruthy();
        const rules = result.container.querySelector('[data-testid="exclusions-rules"]');
        const icons = Array.from(rules?.querySelectorAll("[data-icon]") ?? []).map(icon =>
            icon.getAttribute("data-icon")
        );
        expect(icons).toEqual(["block", "person_off", "assignment_ind", "front_hand"]);
    });

    it("shows the table with the rows when ready and not empty", () => {
        renderPage(READY);

        expect(screen.getByTestId("exclusions-table")).toBeTruthy();
        expect(screen.getByText("Ana Kovač")).toBeTruthy();
        expect(screen.queryByTestId("exclusions-empty")).toBeNull();
    });

    it("shows the empty state with its icon, texts and Add exclusion", () => {
        const { presenter, result } = renderPage(
            createExclusionsPageViewModel({
                empty: {
                    title: "No exclusions",
                    text: "Everyone in reviewing teams can be assigned automatically.",
                    showAdd: true
                }
            })
        );

        const empty = screen.getByTestId("exclusions-empty");
        expect(screen.getByText("No exclusions")).toBeTruthy();
        expect(
            screen.getByText("Everyone in reviewing teams can be assigned automatically.")
        ).toBeTruthy();
        expect(empty.querySelector("[data-icon]")).toBeNull();
        expect(empty.querySelector("svg[aria-hidden]")).not.toBeNull();
        expect(screen.queryByTestId("exclusions-table")).toBeNull();
        expect(result.container.querySelector('[data-testid="exclusions-toolbar"]')).not.toBeNull();

        const buttons = queryAddButtons();
        expect(buttons).toHaveLength(2);
        fireEvent.click(buttons[1]);
        expect(presenter.openAdd).toHaveBeenCalledTimes(1);
    });

    it("shows the Expired empty state with the history icon and no button", () => {
        renderPage(
            createExclusionsPageViewModel({
                tab: "expired",
                empty: {
                    title: "No expired exclusions",
                    text: "Exclusions move here after their end date.",
                    showAdd: false
                }
            })
        );

        const empty = screen.getByTestId("exclusions-empty");
        expect(screen.getByText("No expired exclusions")).toBeTruthy();
        expect(screen.getByText("Exclusions move here after their end date.")).toBeTruthy();
        expect(empty.querySelector("[data-icon]")).toBeNull();
        expect(empty.querySelector("svg[aria-hidden]")).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(1);
    });

    it("shows the user-filter empty state without its button", () => {
        renderPage(
            createExclusionsPageViewModel({
                empty: {
                    title: "No exclusions for this user",
                    text: "Everyone in reviewing teams can be assigned automatically.",
                    showAdd: false
                }
            })
        );

        expect(screen.getByText("No exclusions for this user")).toBeTruthy();
        expect(queryAddButtons()).toHaveLength(1);
    });

    it("shows the names banner with Try again, which retries the names (Q68.1)", () => {
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                namesFailed: true,
                rows: [createExclusionRowVm({ userId: "user-77", label: "user-77" })]
            })
        );

        expect(screen.getByText("Could not load user names.")).toBeTruthy();
        expect(screen.getByText("user-77")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(presenter.retryNames).toHaveBeenCalledTimes(1);
    });

    it("shows no names banner when the names resolved", () => {
        renderPage(READY);

        expect(screen.queryByText("Could not load user names.")).toBeNull();
    });
});

describe("ExclusionsPage toolbar (R322, R332, R340)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("shows the Active, Expired and All tabs with the current one checked", () => {
        renderPage(
            createExclusionsPageViewModel({ tab: "expired", rows: [createExclusionRowVm()] })
        );

        const tabs = screen.getAllByRole("radio").map(tab => tab.textContent);
        const expired = screen.getByRole("radio", { name: "Expired" });

        expect(tabs).toEqual(["Active", "Expired", "All"]);
        expect(expired.getAttribute("aria-checked")).toBe("true");
    });

    it("switches the tab through the presenter", () => {
        const { presenter } = renderPage(READY);

        fireEvent.click(screen.getByRole("radio", { name: "All" }));

        expect(presenter.setTab).toHaveBeenCalledWith("all");
    });

    it("labels the user filter Filter by user and shows All users while no user is chosen", () => {
        renderPage(READY);

        expect(screen.getAllByText("Filter by user").length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText("All users")).toBeTruthy();
    });

    it("lists the filter options and sets the picked user", async () => {
        const options = [
            createPickerOption({ id: "user-1", label: "Ana Kovač" }),
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                description: "user-9",
                muted: true,
                icon: "person_off"
            })
        ];
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                rows: [createExclusionRowVm()],
                filter: { value: null, selected: null, options }
            })
        );

        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.click(await screen.findByText("user-9"));

        expect(presenter.setUserFilter).toHaveBeenCalledWith("user-9");
    });

    it("sends the typed filter text to the presenter", () => {
        const { presenter } = renderPage(READY);

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "ana" } });

        expect(presenter.searchUserFilter).toHaveBeenCalledWith("ana");
    });

    it("clears the filter through the All users row", async () => {
        const selected = createPickerOption({ id: "user-1", label: "Ana Kovač" });
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                rows: [createExclusionRowVm()],
                filter: { value: "user-1", selected, options: [selected] }
            })
        );

        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });
        // With a user chosen the input shows its name and the list filters by it, so type the
        // clear row's label first (as `WorkflowPicker.test.tsx` does).
        fireEvent.change(input, { target: { value: "All" } });
        fireEvent.click(await screen.findByText("All users"));

        expect(presenter.setUserFilter).toHaveBeenCalledWith(null);
    });
});

describe("ExclusionsPage frame and polish (C11, S2)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("centres the content in the 1180px page column", () => {
        const { result } = renderPage(READY);

        const page = result.container.querySelector('[data-testid="exclusions-page"]');

        expect(page?.className).toContain("mx-auto");
        expect(page?.className).toContain("max-w-[1180px]");
    });

    it("renders the title as an h3", () => {
        renderPage(READY);

        expect(screen.getByRole("heading", { level: 3, name: "Reviewer exclusions" })).toBeTruthy();
    });

    it("renders the rules in an admin-ui Card", () => {
        const { result } = renderPage(READY);

        const rules = result.container.querySelector('[data-testid="exclusions-rules"]');

        expect(rules?.querySelector('[data-card="body"]')).not.toBeNull();
    });
});
