import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";

interface TestItem {
    id: string;
    title: string;
}

interface TestReport {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
    deleteItem: vi.fn(),
    refresh: vi.fn(),
    report: { success: vi.fn(), error: vi.fn() }
}));

const items: TestItem[] = [
    { id: "a", title: "Item a" },
    { id: "b", title: "Item b" }
];

vi.mock("~/index.js", () => ({
    useSnackbar: () => ({ showSnackbar: vi.fn() })
}));

vi.mock("../../hooks/index.js", () => ({
    useTrashBinPresenter: () => ({
        actions: { deleteItem: mocks.deleteItem, refresh: mocks.refresh }
    })
}));

vi.mock("../../configs/index.js", () => ({
    TrashBinListConfig: {
        Browser: {
            BulkAction: {
                useWorker: () => ({
                    items,
                    isSelectedAll: false,
                    resetItems: vi.fn(),
                    results: [],
                    processInSeries: async (
                        callback: (params: { item: TestItem; report: TestReport }) => Promise<void>
                    ) => {
                        for (const item of items) {
                            await callback({ item, report: mocks.report });
                        }
                    }
                }),
                useButtons: () => ({
                    ButtonDefault: (props: { onAction: () => void; children: React.ReactNode }) => (
                        <button onClick={props.onAction}>{props.children}</button>
                    )
                }),
                useDialog: () => ({
                    showConfirmationDialog: (params: { execute: () => Promise<void> }) =>
                        params.execute(),
                    showResultsDialog: vi.fn()
                })
            }
        }
    }
}));

vi.mock("@webiny/admin-ui", () => ({
    Tooltip: (props: { trigger: React.ReactNode }) => props.trigger
}));

vi.mock("@webiny/icons/delete.svg", () => ({ ReactComponent: () => null }));

import { BulkActionsDeleteItems } from "./DeleteItems.js";

describe("BulkActionsDeleteItems", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("reports a deleted item as a success", async () => {
        mocks.deleteItem.mockResolvedValue(true);
        render(<BulkActionsDeleteItems />);

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(mocks.report.success).toHaveBeenCalledTimes(2));
        expect(mocks.report.error).not.toHaveBeenCalled();
    });

    it("reports an item whose delete returned false as a failure, not a success", async () => {
        mocks.deleteItem.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        render(<BulkActionsDeleteItems />);

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(mocks.report.error).toHaveBeenCalledTimes(1));
        expect(mocks.report.error).toHaveBeenCalledWith({
            title: "Item a",
            message: "The item was not deleted."
        });
        expect(mocks.report.success).toHaveBeenCalledTimes(1);
    });
});
