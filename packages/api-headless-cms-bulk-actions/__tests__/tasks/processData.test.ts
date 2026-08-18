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
 * Regression tests for bulk action processData methods.
 *
 * Entry IDs stored in background task inputs are full revision IDs (e.g. "abc123#0001").
 * Some use cases require the full revision ID (Publish, Unpublish, MoveToFolder — they
 * call getRevisionById), while others require a plain entryId (Delete, MoveToTrash,
 * Restore — they call getLatestRevisionByEntryId).
 */
describe("processData passes the correct ID format to each use case", () => {
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

    it("DeleteEntriesBulkAction strips version and passes plain entryId to deleteEntry", async () => {
        const mockDeleteEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new DeleteEntriesBulkAction(mockListEntries, mockDeleteEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockDeleteEntry.execute).toHaveBeenCalledWith(mockModel, "abc123", {
            permanently: true
        });
    });

    it("MoveToTrashBulkAction strips version and passes plain entryId to deleteEntry", async () => {
        const mockDeleteEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new MoveToTrashBulkAction(mockListEntries, mockDeleteEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockDeleteEntry.execute).toHaveBeenCalledWith(mockModel, "abc123", {
            permanently: false
        });
    });

    it("RestoreEntriesBulkAction strips version and passes plain entryId to restoreEntry", async () => {
        const mockRestoreEntry = { execute: vi.fn().mockResolvedValue(mockResult) };
        const mockListEntries = { execute: vi.fn().mockResolvedValue(mockListResult) };

        const action = new RestoreEntriesBulkAction(mockListEntries, mockRestoreEntry);

        await action.processData(mockModel, { id: "abc123#0001" });

        expect(mockRestoreEntry.execute).toHaveBeenCalledWith(mockModel, "abc123");
    });
});
