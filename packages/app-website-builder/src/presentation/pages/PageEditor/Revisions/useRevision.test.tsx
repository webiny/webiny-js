import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { act } from "@testing-library/react";
import type { PageRevision } from "~/domain/PageRevision/index.js";
import { useRevision } from "./useRevision.js";

const mocks = vi.hoisted(() => ({
    deletePageRevision: vi.fn(),
    showSnackbar: vi.fn()
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

vi.mock("@webiny/app", () => ({
    useRouter: () => ({ goToRoute: vi.fn() })
}));

vi.mock("@webiny/app-admin", () => ({
    useSnackbar: () => ({ showSnackbar: mocks.showSnackbar })
}));

const REVISION = { id: "page-1#0002" } as unknown as PageRevision;

describe("useRevision deleteRevision", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("deletes the revision by id only", async () => {
        mocks.deletePageRevision.mockResolvedValue(true);
        const { result } = renderHook(() => useRevision({ revision: REVISION }));

        await act(async () => {
            await result.current.deleteRevision();
        });

        expect(mocks.deletePageRevision).toHaveBeenCalledWith({ id: "page-1#0002" });
        expect(mocks.showSnackbar).not.toHaveBeenCalled();
    });

    it("stays silent when the delete was not carried out", async () => {
        mocks.deletePageRevision.mockResolvedValue(false);
        const { result } = renderHook(() => useRevision({ revision: REVISION }));

        await act(async () => {
            await result.current.deleteRevision();
        });

        expect(mocks.showSnackbar).not.toHaveBeenCalled();
    });

    it("shows the error message instead of an unhandled rejection", async () => {
        mocks.deletePageRevision.mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useRevision({ revision: REVISION }));

        await act(async () => {
            await result.current.deleteRevision();
        });

        expect(mocks.showSnackbar).toHaveBeenCalledWith("Network down");
    });
});
