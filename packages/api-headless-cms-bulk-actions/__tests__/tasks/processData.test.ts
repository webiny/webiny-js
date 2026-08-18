import { describe, expect, it, vi } from "vitest";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { PublishEntriesBulkAction } from "~/features/PublishEntriesBulkAction/PublishEntriesBulkAction.js";
import { UnpublishEntriesBulkAction } from "~/features/UnpublishEntriesBulkAction/UnpublishEntriesBulkAction.js";
import { MoveToFolderBulkAction } from "~/features/MoveToFolderBulkAction/MoveToFolderBulkAction.js";
import { DeleteEntriesBulkAction } from "~/features/DeleteEntriesBulkAction/DeleteEntriesBulkAction.js";
import { MoveToTrashBulkAction } from "~/features/MoveToTrashBulkAction/MoveToTrashBulkAction.js";
import { RestoreEntriesBulkAction } from "~/features/RestoreEntriesBulkAction/RestoreEntriesBulkAction.js";

const mockModel = { modelId: "car", name: "Car" } as CmsModel;

const mockResult = {
    isFail: () => false,
    value: {}
};

const mockListResult = {
    isFail: () => false,
    value: {
        entries: [],
        meta: { totalCount: 0, hasMoreItems: false, cursor: null }
    }
};

/**
 * Regression tests for the version-stripping bug in bulk action processData methods.
 *
 * Entry IDs stored in background task inputs are full revision IDs (e.g. "abc123#0001").
 * The bug was that processData() called parseIdentifier() which stripped the "#0001" suffix,
 * passing only "abc123" to the underlying use case. For use cases that call getRevisionById(),
 * a bare ID without a version is silently skipped — the entry is never fetched, and the
 * operation silently fails.
 */
describe("processData preserves full revision IDs", () => {
    it("PublishEntriesBulkAction passes full revision ID to publishEntry", async () => {
        const mockPublishEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new PublishEntriesBulkAction(mockListEntries, mockPublishEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockPublishEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001");
    });

    it("UnpublishEntriesBulkAction passes full revision ID to unpublishEntry", async () => {
        const mockUnpublishEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new UnpublishEntriesBulkAction(mockListEntries, mockUnpublishEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockUnpublishEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001");
    });

    it("MoveToFolderBulkAction passes full revision ID to moveEntry", async () => {
        const mockMoveEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new MoveToFolderBulkAction(mockListEntries, mockMoveEntry);

        await action.processData(mockModel, {
            id: "abc123#0001",
            data: { folderId: "folder-1" }
        });

        expect(mockMoveEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001", "folder-1");
    });

    it("DeleteEntriesBulkAction passes full revision ID to deleteEntry", async () => {
        const mockDeleteEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new DeleteEntriesBulkAction(mockListEntries, mockDeleteEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockDeleteEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001", {
            permanently: true
        });
    });

    it("MoveToTrashBulkAction passes full revision ID to deleteEntry", async () => {
        const mockDeleteEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new MoveToTrashBulkAction(mockListEntries, mockDeleteEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockDeleteEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001", {
            permanently: false
        });
    });

    it("RestoreEntriesBulkAction passes full revision ID to restoreEntry", async () => {
        const mockRestoreEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new RestoreEntriesBulkAction(mockListEntries, mockRestoreEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockRestoreEntry.execute).toHaveBeenCalledWith(mockModel, "abc123#0001");
    });
});
