import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { AdminUiProvider } from "@webiny/admin-ui";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { WorkflowUserSummary } from "~/editor/domain/types.js";
import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";
import type { TestRoutingVm } from "~/editor/presentation/stepDrawer/abstractions.js";
import { StepFormOptionsContext } from "~/editor/presentation/stepForm/StepFormOptionsContext.js";
import type { StepFormOptions } from "~/editor/presentation/stepForm/StepFormOptions.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestRoutingOptions } from "~/editor/testing/testRoutingFixtures.js";
import { createTestRoutingResultVm } from "~/editor/testing/testRoutingFixtures.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { TestRoutingRenderer } from "./TestRoutingRenderer.js";

interface PickerStubProps {
    label: string;
    value: string | null;
    selected: PickerOption | null;
    options: PickerOption[];
    placeholder: string;
    anyLabel: string | null;
    disabled: boolean;
    error: string | null;
    onSearch(search: string): void;
    onChange(id: string | null): void;
}

// Stub of the shared picker: it exposes the props the renderer passes and three buttons.
vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const react = await import("react");
    return {
        WorkflowPicker: (props: PickerStubProps) => {
            return react.createElement(
                "div",
                {
                    "data-testid": `picker-${props.label}`,
                    "data-value": props.value ?? "",
                    "data-selected": props.selected ? props.selected.label : "",
                    "data-options": props.options.map(option => option.label).join("|"),
                    "data-placeholder": props.placeholder,
                    "data-any-label": props.anyLabel ?? "",
                    "data-disabled": String(props.disabled),
                    "data-error": props.error ?? ""
                },
                react.createElement(
                    "button",
                    {
                        onClick: () => {
                            const first = props.options[0];
                            props.onChange(first ? first.id : null);
                        }
                    },
                    `pick first ${props.label}`
                ),
                react.createElement(
                    "button",
                    { onClick: () => props.onChange(null) },
                    `clear ${props.label}`
                ),
                react.createElement(
                    "button",
                    { onClick: () => props.onSearch("cam") },
                    `search ${props.label}`
                )
            );
        }
    };
});

const IVAN: WorkflowUserSummary = { id: "user-1", displayName: "Ivan Horvat", teamIds: ["team-1"] };
const ANA: WorkflowUserSummary = { id: "user-2", displayName: "Ana Kovac", teamIds: ["team-2"] };
const CAMPAIGNS: AppFolder = { id: "f1", path: "/Campaigns" };
const PARTNERS: AppFolder = { id: "f2", path: "/Partners" };
const ARCHIVE: AppFolder = { id: "f3", path: "/Campaign archive/2025" };

interface SetupParams {
    vm?: Partial<TestRoutingVm>;
    users?: WorkflowUserSummary[];
    usersFailed?: boolean;
    foldersFailed?: boolean;
}

const createSetup = (params: SetupParams = {}) => {
    const testRouting = createTestRoutingOptions(params.vm);
    const users = {
        loading: false,
        failed: params.usersFailed ?? false,
        retry: vi.fn(),
        items: params.users ?? [IVAN, ANA],
        selected: [],
        searchUsers: vi.fn()
    };
    const folders = {
        loading: false,
        failed: params.foldersFailed ?? false,
        retry: vi.fn(),
        items: [CAMPAIGNS, PARTNERS, ARCHIVE],
        folderType: "cms:article"
    };
    const options = createStepFormOptions({ users, folders, testRouting });
    return { options, testRouting, users, folders };
};

const wrap = (options: StepFormOptions) => {
    return (
        <StepFormOptionsContext.Provider value={options}>
            <TestRoutingRenderer field={{}} />
        </StepFormOptionsContext.Provider>
    );
};

const renderTab = (params: SetupParams = {}) => {
    const setup = createSetup(params);
    const view = renderWithAdminUi(wrap(setup.options));
    return { ...setup, view };
};

const runButton = (name: string): HTMLButtonElement => {
    return screen.getByRole("button", { name }) as HTMLButtonElement;
};

describe("TestRoutingRenderer (R300, R301, R315)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the intro, the two inputs with their labels and the enabled button without a hint", () => {
        renderTab();

        expect(
            screen.getByText(
                "Test who would get this step, using the configuration on screen, including unsaved changes. Nothing is assigned and nobody is notified."
            )
        ).toBeTruthy();
        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-placeholder")).toBe("Search users");
        expect(requester.getAttribute("data-any-label")).toBe("");
        expect(requester.getAttribute("data-options")).toBe("Ivan Horvat|Ana Kovac");
        const folder = screen.getByTestId("picker-Folder");
        expect(folder.getAttribute("data-placeholder")).toBe("Search folders");
        expect(folder.getAttribute("data-any-label")).toBe("Root (no folder)");
        expect(folder.getAttribute("data-options")).toBe(
            "/Campaigns|/Partners|/Campaign archive/2025"
        );
        expect(runButton("Test routing").disabled).toBe(false);
        expect(screen.queryByText("Choose a requester to test.")).toBeNull();
        expect(requester.getAttribute("data-error")).toBe("");
    });

    it("shows the requester validation error and does not run when clicked without a requester", () => {
        const { testRouting } = renderTab();

        fireEvent.click(runButton("Test routing"));

        expect(screen.getByTestId("picker-Requester").getAttribute("data-error")).toBe(
            "Choose a requester to test."
        );
        expect(screen.getByTestId("picker-Folder").getAttribute("data-error")).toBe("");
        expect(testRouting.runTest).not.toHaveBeenCalled();
    });

    it("enables the button once it can run, shows no error and runs on click", () => {
        const { testRouting } = renderTab({
            vm: { requesterId: "user-1", canRun: true, hint: null }
        });

        expect(screen.queryByText("Choose a requester to test.")).toBeNull();
        const button = runButton("Test routing");
        expect(button.disabled).toBe(false);
        fireEvent.click(button);

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("never runs by itself, also for a stale result", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                stale: true,
                result: createTestRoutingResultVm()
            }
        });

        expect(testRouting.runTest).not.toHaveBeenCalled();
    });

    it("sends the picked requester and folder, and null for the clear rows", () => {
        const { testRouting } = renderTab();

        fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));
        fireEvent.click(screen.getByRole("button", { name: "pick first Folder" }));
        fireEvent.click(screen.getByRole("button", { name: "clear Requester" }));
        fireEvent.click(screen.getByRole("button", { name: "clear Folder" }));

        expect(testRouting.setTestRequester.mock.calls).toEqual([["user-1"], [null]]);
        expect(testRouting.setTestFolder.mock.calls).toEqual([["f1"], [null]]);
    });

    it("searches users on the server and folders on the loaded list", () => {
        const { users } = renderTab();

        fireEvent.click(screen.getByRole("button", { name: "search Requester" }));
        expect(users.searchUsers).toHaveBeenCalledWith("cam");

        fireEvent.click(screen.getByRole("button", { name: "search Folder" }));
        expect(screen.getByTestId("picker-Folder").getAttribute("data-options")).toBe(
            "/Campaigns|/Campaign archive/2025"
        );
        expect(users.searchUsers).toHaveBeenCalledTimes(1);
    });

    it("shows the chosen requester and folder with their labels", () => {
        renderTab({ vm: { requesterId: "user-2", folderId: "f2", canRun: true, hint: null } });

        expect(screen.getByTestId("picker-Requester").getAttribute("data-value")).toBe("user-2");
        expect(screen.getByTestId("picker-Requester").getAttribute("data-selected")).toBe(
            "Ana Kovac"
        );
        expect(screen.getByTestId("picker-Folder").getAttribute("data-selected")).toBe("/Partners");
    });

    it("keeps the label of the picked requester when a search narrows the list", () => {
        const { options, view } = renderTab();
        fireEvent.click(screen.getByRole("button", { name: "pick first Requester" }));

        const narrowed = createSetup({
            users: [ANA],
            vm: { requesterId: "user-1", canRun: true, hint: null }
        });
        view.rerender(
            <AdminUiProvider>{wrap({ ...options, ...narrowed.options })}</AdminUiProvider>
        );

        const requester = screen.getByTestId("picker-Requester");
        expect(requester.getAttribute("data-options")).toBe("Ana Kovac");
        expect(requester.getAttribute("data-selected")).toBe("Ivan Horvat");
    });

    it("shows Testing… with enabled inputs, a disabled button and a skeleton inside the card while running", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "running",
                buttonLabel: "Testing…"
            }
        });

        expect(runButton("Testing…").disabled).toBe(true);
        expect(screen.getByTestId("picker-Requester").getAttribute("data-disabled")).toBe("false");
        expect(screen.getByTestId("picker-Folder").getAttribute("data-disabled")).toBe("false");
        expect(screen.getByTestId("test-routing-skeleton")).toBeTruthy();
        expect(screen.queryByTestId("test-routing-result")).toBeNull();
    });

    it("keeps the inputs enabled when idle", () => {
        renderTab();

        expect(screen.getByTestId("picker-Requester").getAttribute("data-disabled")).toBe("false");
        expect(screen.getByTestId("picker-Folder").getAttribute("data-disabled")).toBe("false");
        expect(screen.queryByTestId("test-routing-skeleton")).toBeNull();
    });

    it("renders the owner, the trace, the strategy line and the skipped people", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                result: createTestRoutingResultVm()
            }
        });

        const result = screen.getByTestId("test-routing-result");
        expect(result.getAttribute("data-stale")).toBe("false");
        expect(screen.getByText("Owner")).toBeTruthy();
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("Assigned by rule 1")).toBeTruthy();
        expect(screen.getByText("Trace")).toBeTruthy();
        expect(screen.getByText("Matched")).toBeTruthy();
        expect(screen.getByText("Rule 1: If requester is in Marketing → Ivan Horvat")).toBeTruthy();
        expect(screen.getByText("All conditions match.")).toBeTruthy();
        expect(screen.getByText("Skipped")).toBeTruthy();
        expect(screen.getByText("Rule 2: Always → Editors team pool")).toBeTruthy();
        expect(screen.getByText("An earlier rule matched.")).toBeTruthy();
        expect(screen.getByText("Strategy")).toBeTruthy();
        expect(screen.getByText("Not used: a rule chose the reviewer.")).toBeTruthy();
        expect(screen.getByText("Skipped people")).toBeTruthy();
        const skipped = screen.getByTestId("test-routing-skipped-0");
        expect(skipped.textContent).toBe("Ana KovacExcluded from reviews.");
    });

    it("lays the result out as an owner band, then the trace and the strategy line", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        const result = screen.getByTestId("test-routing-result");
        const band = screen.getByTestId("test-routing-owner-band");
        expect(result.contains(band)).toBe(true);
        expect(band.contains(screen.getByTestId("test-routing-owner-icon"))).toBe(true);
        expect(band.contains(screen.getByText("Ivan Horvat"))).toBe(true);
        expect(band.contains(screen.getByText("Assigned by rule 1"))).toBe(true);
    });

    it("lists the Trace rows, the Strategy line and Skipped people under their headings", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        expect(screen.getByRole("heading", { name: "Trace" })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Skipped people" })).toBeTruthy();
        const row = screen.getByTestId("test-routing-trace-0");
        expect(row.contains(screen.getByText("Matched"))).toBe(true);
        const strategy = screen.getByTestId("test-routing-strategy");
        expect(strategy.contains(screen.getByText("Strategy"))).toBe(true);
        const order = row.compareDocumentPosition(strategy) & Node.DOCUMENT_POSITION_FOLLOWING;
        expect(order).toBeTruthy();
    });

    it("shows the Not matched tag", () => {
        renderTab({
            vm: {
                status: "done",
                result: createTestRoutingResultVm({
                    trace: [
                        {
                            ruleId: "r1",
                            tag: "Not matched",
                            label: "Rule 1: If requester is Ana Kovac → Ivan Horvat",
                            reason: "Requester is not Ana Kovac."
                        }
                    ]
                })
            }
        });

        expect(screen.getByText("Not matched")).toBeTruthy();
        expect(screen.getByText("Requester is not Ana Kovac.")).toBeTruthy();
    });

    it("says No routing rules. for an empty trace and hides Skipped people when nobody was skipped", () => {
        renderTab({
            vm: {
                status: "done",
                result: createTestRoutingResultVm({
                    ownerLabel: "Team pool",
                    ownerIcon: "groups",
                    trace: [],
                    skipped: []
                })
            }
        });

        expect(screen.getByText("No routing rules.")).toBeTruthy();
        expect(screen.queryByText("Skipped people")).toBeNull();
        expect(screen.getByText("Team pool")).toBeTruthy();
        const tile = screen.getByTestId("test-routing-owner-icon");
        expect(tile.getAttribute("data-owner-icon")).toBe("groups");
    });

    it("marks a person owner with the person icon", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        const tile = screen.getByTestId("test-routing-owner-icon");
        expect(tile.getAttribute("data-owner-icon")).toBe("person");
    });

    it("shows the stale alert with Test again, keeps the old result and re-runs only on click", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "done",
                stale: true,
                result: createTestRoutingResultVm()
            }
        });

        expect(
            screen.getByText(
                "Out of date: the configuration or test inputs changed since this result."
            )
        ).toBeTruthy();
        const result = screen.getByTestId("test-routing-result");
        expect(result.getAttribute("data-stale")).toBe("true");
        expect(screen.getByText("Ivan Horvat")).toBeTruthy();
        const alert = screen.getByText(/Out of date/).closest("[class*=warning]");
        expect(alert).toBeTruthy();

        fireEvent.click(runButton("Test again"));

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("disables Test again while the requester is cleared", () => {
        renderTab({ vm: { status: "done", stale: true, result: createTestRoutingResultVm() } });

        expect(runButton("Test again").disabled).toBe(true);
    });

    it("shows no stale alert for a fresh result", () => {
        renderTab({ vm: { status: "done", result: createTestRoutingResultVm() } });

        expect(screen.queryByText(/Out of date/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Test again" })).toBeNull();
    });

    it("shows a validation failure with Try again and no result", () => {
        const { testRouting } = renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "failed",
                errorMessage:
                    "Could not test routing: The target team is not one of the step's reviewing teams."
            }
        });

        expect(
            screen.getByText(
                "Could not test routing: The target team is not one of the step's reviewing teams."
            )
        ).toBeTruthy();
        expect(screen.queryByTestId("test-routing-result")).toBeNull();
        fireEvent.click(runButton("Try again"));

        expect(testRouting.runTest).toHaveBeenCalledTimes(1);
    });

    it("shows the transport failure text", () => {
        renderTab({
            vm: {
                requesterId: "user-1",
                canRun: true,
                hint: null,
                status: "failed",
                errorMessage: "Could not test routing: the server did not respond."
            }
        });

        expect(
            screen.getByText("Could not test routing: the server did not respond.")
        ).toBeTruthy();
    });

    it("shows the options banner in place of a requester list that failed to load", () => {
        const { users } = renderTab({ usersFailed: true });

        expect(screen.queryByTestId("picker-Requester")).toBeNull();
        expect(screen.getByTestId("picker-Folder")).toBeTruthy();
        expect(screen.getByText("Could not load the step options.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(users.retry).toHaveBeenCalledTimes(1);
    });

    it("shows the options banner in place of a folder list that failed to load", () => {
        const { folders } = renderTab({ foldersFailed: true });

        expect(screen.queryByTestId("picker-Folder")).toBeNull();
        expect(screen.getByTestId("picker-Requester")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(folders.retry).toHaveBeenCalledTimes(1);
    });
});
