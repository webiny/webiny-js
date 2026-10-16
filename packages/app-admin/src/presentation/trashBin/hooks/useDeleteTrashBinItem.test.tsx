import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { TrashBinItem } from "../abstractions.js";

const mocks = vi.hoisted(() => ({
    deleteItem: vi.fn(),
    showSuccessToast: vi.fn(),
    showWarningToast: vi.fn()
}));

vi.mock("~/index.js", () => ({
    useConfirmationDialog: () => ({
        showConfirmation: (callback: () => Promise<void>) => callback()
    })
}));

vi.mock("./useTrashBinPresenter.js", () => ({
    useTrashBinPresenter: () => ({ actions: { deleteItem: mocks.deleteItem } })
}));

vi.mock("@webiny/admin-ui", () => ({
    useToast: () => ({
        showSuccessToast: mocks.showSuccessToast,
        showWarningToast: mocks.showWarningToast
    })
}));

import { useDeleteTrashBinItem } from "./useDeleteTrashBinItem.js";

const ITEM = { id: "a", title: "Item a" } as TrashBinItem;

describe("useDeleteTrashBinItem", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("shows the success toast when the item was deleted", async () => {
        mocks.deleteItem.mockResolvedValue(true);
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showSuccessToast).toHaveBeenCalledWith({
            title: "Item a was deleted successfully!"
        });
    });

    it("shows no toast when the delete was not carried out (warning dismissed)", async () => {
        mocks.deleteItem.mockResolvedValue(false);
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
        expect(mocks.showWarningToast).not.toHaveBeenCalled();
    });

    it("shows the warning toast when the delete throws", async () => {
        mocks.deleteItem.mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showWarningToast).toHaveBeenCalledWith({ title: "Network down" });
    });
});
