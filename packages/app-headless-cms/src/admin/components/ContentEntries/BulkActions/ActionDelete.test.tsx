/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ActionDelete } from "./ActionDelete.js";

interface Hoisted {
    showSuccessToast: ReturnType<typeof vi.fn>;
    showResultsDialog: ReturnType<typeof vi.fn>;
    deselectAll: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    allSelected: boolean;
    /** The confirmed action's run, so a test can wait for it to finish. */
    lastRun: Promise<void> | null;
}

const hoisted = vi.hoisted((): Hoisted => {
    return {
        showSuccessToast: vi.fn(),
        showResultsDialog: vi.fn(),
        deselectAll: vi.fn(),
        execute: vi.fn(),
        allSelected: false,
        lastRun: null
    };
});

vi.mock("@webiny/icons/delete.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/admin-ui", () => {
    return { useToast: () => ({ showSuccessToast: hoisted.showSuccessToast }) };
});

vi.mock("@webiny/app", () => {
    return {
        useFeature: () => ({ presenter: { execute: hoisted.execute, vm: { results: [] } } })
    };
});

vi.mock("~/presentation/contentEntries/bulkActions/feature.js", () => {
    return { BulkDeleteFeature: {} };
});

vi.mock("@webiny/app-admin/components/BulkActions/index.js", () => {
    return {
        BulkActionButton: (props: { text: string; onClick: () => void }) => {
            return <button onClick={props.onClick}>{props.text}</button>;
        },
        useBulkActionDialog: () => {
            return {
                showConfirmationDialog: (params: { execute: () => Promise<void> }) => {
                    hoisted.lastRun = params.execute();
                    return hoisted.lastRun;
                },
                showResultsDialog: hoisted.showResultsDialog
            };
        }
    };
});

vi.mock("~/presentation/contentEntries/list/useContentEntriesPresenter.js", () => {
    return {
        useContentEntriesPresenter: () => {
            return {
                list: {
                    vm: {
                        rows: [{ id: "e1#0001" }],
                        selection: {
                            selectedIds: new Set(["e1#0001"]),
                            allSelected: hoisted.allSelected,
                            label: "1 entry"
                        }
                    },
                    actions: { selection: { deselectAll: hoisted.deselectAll } }
                }
            };
        }
    };
});

const click = async () => {
    const view = render(<ActionDelete />);
    fireEvent.click(view.getByText("Trash"));
    await waitFor(() => expect(hoisted.execute).toHaveBeenCalledTimes(1));
};

describe("ActionDelete", () => {
    beforeEach(() => {
        hoisted.showSuccessToast.mockReset();
        hoisted.showResultsDialog.mockReset();
        hoisted.deselectAll.mockReset();
        hoisted.execute.mockReset();
        hoisted.lastRun = null;
    });

    afterEach(() => {
        cleanup();
    });

    it("shows the background toast and clears the selection when the bulk task started", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(true);

        await click();

        await waitFor(() => expect(hoisted.showSuccessToast).toHaveBeenCalledTimes(1));
        expect(hoisted.showSuccessToast.mock.calls[0][0].title).toBe(
            "Entries will be trashed in the background"
        );
        expect(hoisted.deselectAll).toHaveBeenCalledTimes(1);
        expect(hoisted.showResultsDialog).not.toHaveBeenCalled();
    });

    it("shows no toast and keeps the selection when the bulk task did not start", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(false);

        await click();

        // The whole confirmed action has run, so a missing guard would have acted by now.
        await hoisted.lastRun;
        expect(hoisted.showSuccessToast).not.toHaveBeenCalled();
        expect(hoisted.deselectAll).not.toHaveBeenCalled();
        expect(hoisted.showResultsDialog).not.toHaveBeenCalled();
    });

    it("shows the results dialog and clears the selection after a per-item run", async () => {
        hoisted.allSelected = false;
        hoisted.execute.mockResolvedValue(true);

        await click();

        await waitFor(() => expect(hoisted.showResultsDialog).toHaveBeenCalledTimes(1));
        expect(hoisted.deselectAll).toHaveBeenCalledTimes(1);
        expect(hoisted.showSuccessToast).not.toHaveBeenCalled();
    });

    it("passes the selected rows and allSelected to the presenter", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(true);

        await click();

        expect(hoisted.execute).toHaveBeenCalledWith([{ id: "e1#0001" }], true);
    });
});
