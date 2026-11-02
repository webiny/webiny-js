import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import { useRevision } from "./useRevision.js";

interface CapturedDialog {
    onAccept: () => Promise<void>;
}

const mocks = vi.hoisted(() => ({
    deletePageRevision: vi.fn(),
    showDialog: vi.fn(),
    showSuccessToast: vi.fn(),
    showWarningToast: vi.fn()
}));

vi.mock("~/features/pages/index.js", () => ({
    usePublishPage: () => ({ publishPage: vi.fn() }),
    useUnpublishPage: () => ({ unpublishPage: vi.fn() }),
    useCreatePageRevisionFrom: () => ({ createPageRevisionFrom: vi.fn() }),
    useDeletePageRevision: () => ({ deletePageRevision: mocks.deletePageRevision })
}));

vi.mock("~/routes.js", () => ({
    Routes: { Pages: { Editor: "editor" } }
}));

vi.mock("./usePageEditorDrawer.js", () => ({
    usePageEditorDrawer: () => ({ openRevisionList: vi.fn() })
}));

vi.mock("@webiny/app", async importOriginal => ({
    ...(await importOriginal<typeof import("@webiny/app")>()),
    useRouter: () => ({ goToRoute: vi.fn() })
}));

vi.mock("@webiny/app-admin", () => ({
    useDialogs: () => ({ showDialog: mocks.showDialog })
}));

vi.mock("@webiny/admin-ui", async importOriginal => ({
    ...(await importOriginal<typeof import("@webiny/admin-ui")>()),
    useToast: () => ({
        showSuccessToast: mocks.showSuccessToast,
        showWarningToast: mocks.showWarningToast
    })
}));

const REVISION = { id: "page-1#0002", version: 2 } as unknown as PageRevision;

/** Opens the delete dialog and confirms it, as the user would. */
const deleteAndConfirm = async (onDeleted = vi.fn()) => {
    const { result } = renderHook(() => useRevision({ revision: REVISION, onDeleted }));
    act(() => {
        result.current.deleteRevision();
    });
    expect(mocks.showDialog).toHaveBeenCalledTimes(1);
    const dialog = mocks.showDialog.mock.calls[0][0] as CapturedDialog;
    await act(async () => {
        await dialog.onAccept();
    });
    return onDeleted;
};

describe("useRevision deleteRevision", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("deletes nothing until the dialog is confirmed", () => {
        const { result } = renderHook(() => useRevision({ revision: REVISION }));

        act(() => {
            result.current.deleteRevision();
        });

        expect(mocks.showDialog).toHaveBeenCalledTimes(1);
        expect(mocks.deletePageRevision).not.toHaveBeenCalled();
    });

    it("deletes the revision by id on confirm, then tells the user and the list", async () => {
        mocks.deletePageRevision.mockResolvedValue(true);

        const onDeleted = await deleteAndConfirm();

        expect(mocks.deletePageRevision).toHaveBeenCalledWith({ id: "page-1#0002" });
        expect(mocks.showSuccessToast).toHaveBeenCalledWith({
            title: "Revision #2 was deleted successfully!"
        });
        expect(onDeleted).toHaveBeenCalledWith(REVISION);
    });

    it("stays silent when the delete was not carried out", async () => {
        mocks.deletePageRevision.mockResolvedValue(false);

        const onDeleted = await deleteAndConfirm();

        expect(mocks.deletePageRevision).toHaveBeenCalledWith({ id: "page-1#0002" });
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
        expect(mocks.showWarningToast).not.toHaveBeenCalled();
        expect(onDeleted).not.toHaveBeenCalled();
    });

    it("shows the error message instead of an unhandled rejection", async () => {
        mocks.deletePageRevision.mockRejectedValue(new Error("Network down"));

        const onDeleted = await deleteAndConfirm();

        expect(mocks.showWarningToast).toHaveBeenCalledWith({
            title: "Could not delete the revision.",
            description: "Network down"
        });
        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
        expect(onDeleted).not.toHaveBeenCalled();
    });
});
