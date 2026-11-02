import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { PageDto } from "~/domain/Page/index.js";
import { useDeletePageConfirmationDialog } from "./useDeletePageConfirmationDialog.js";

const mocks = vi.hoisted(() => ({
    deletePage: vi.fn(),
    showSnackbar: vi.fn()
}));

vi.mock("~/features/pages/index.js", () => ({
    useDeletePage: () => ({ deletePage: mocks.deletePage })
}));

vi.mock("@webiny/app-admin", () => ({
    useConfirmationDialog: () => ({
        showConfirmation: (callback: () => Promise<void>) => callback()
    }),
    useSnackbar: () => ({ showSnackbar: mocks.showSnackbar })
}));

const PAGE = { id: "page-1#0001", properties: { title: "Home page" } } as unknown as PageDto;

describe("useDeletePageConfirmationDialog", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("announces the trash when the page was moved to trash", async () => {
        mocks.deletePage.mockResolvedValue(true);
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.deletePage).toHaveBeenCalledWith({ id: "page-1#0001", permanently: false });
        expect(mocks.showSnackbar).toHaveBeenCalledWith("Home page was moved to trash!");
    });

    it("announces nothing when the trash was not carried out (warning dismissed)", async () => {
        mocks.deletePage.mockResolvedValue(false);
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.showSnackbar).not.toHaveBeenCalled();
    });

    it("shows the error message when the trash throws", async () => {
        mocks.deletePage.mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.showSnackbar).toHaveBeenCalledWith("Network down");
    });
});
