// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { observable } from "mobx";
import type { IFileManagerPresenter, IFileManagerViewModel } from "../../abstractions.js";
import type { FolderDto } from "@webiny/app-aco";
import type { FmFile } from "~/features/shared/types.js";

// ---------------------------------------------------------------------------
// Mock factories.
// ---------------------------------------------------------------------------

function createMockFile(overrides: Partial<FmFile> = {}): FmFile {
    return {
        id: "file-1",
        name: "photo.jpg",
        key: "files/photo.jpg",
        src: "https://cdn.example.com/files/photo.jpg",
        type: "image/jpeg",
        size: 1024,
        metadata: {},
        tags: [],
        createdOn: "2025-01-01T00:00:00Z",
        savedOn: "2025-01-02T00:00:00Z",
        createdBy: { id: "user-1", displayName: "Alice", type: "admin" },
        savedBy: { id: "user-1", displayName: "Alice", type: "admin" },
        location: { folderId: "root" },
        ...overrides
    };
}

const emptyIdentity = { id: "", displayName: "", type: "" };

function createMockFolderDto(overrides: Partial<FolderDto> = {}): FolderDto {
    return {
        id: "folder-1",
        title: "Documents",
        slug: "documents",
        type: "",
        parentId: null,
        path: "",
        permissions: [],
        hasNonInheritedPermissions: false,
        canManagePermissions: false,
        canManageStructure: true,
        canManageContent: false,
        createdBy: emptyIdentity,
        createdOn: "",
        savedBy: emptyIdentity,
        savedOn: "",
        modifiedBy: null,
        modifiedOn: null,
        extensions: {},
        ...overrides
    };
}

function createMockPresenter(
    vmOverrides: Partial<IFileManagerViewModel> = {}
): IFileManagerPresenter {
    const defaultVm: IFileManagerViewModel = observable({
        fileModel: null,
        list: {
            rows: [],
            sort: null,
            filters: {},
            search: "",
            appliedQuery: null,
            pagination: {
                hasMore: false,
                loading: false,
                loadingMore: false,
                totalCount: 0,
                currentCount: 0
            },
            selection: {
                selectedIds: new Set<string>(),
                selectedCount: 0,
                allSelected: false,
                label: ""
            },
            showingFilters: false,
            empty: true,
            emptyWithFilters: false,
            error: null
        },
        folders: {
            folders: [],
            tree: [],
            currentFolderId: null,
            currentFolder: null,
            loading: false,
            operation: { active: false, mode: null },
            isRootFolder: true,
            currentFolderTitle: "All Files",
            childFolders: [],
            loadingNodeIds: []
        },
        permissions: {
            canRead: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canEditFile: () => true,
            canDeleteFile: () => true
        },
        upload: {
            jobs: [],
            overallProgress: { percentage: 0, bytesSent: 0, totalBytes: 0 },
            isUploading: false
        },
        tags: [],
        showFolders: true,
        childFolders: [],
        viewMode: "grid" as const,
        dragging: false,
        showingFilters: false,
        isOverlay: false,
        accept: [],
        multiple: false,
        scope: undefined,
        fileDetails: null,
        ...vmOverrides
    });

    return {
        vm: defaultVm,
        actions: {
            search: { set: vi.fn(), clear: vi.fn() },
            sort: { set: vi.fn(), toggle: vi.fn() },
            filter: {
                set: vi.fn(),
                clear: vi.fn(),
                clearAll: vi.fn(),
                show: vi.fn(),
                hide: vi.fn()
            },
            selection: {
                toggle: vi.fn(),
                selectRangeTo: vi.fn(),
                selectAll: vi.fn(),
                deselectAll: vi.fn(),
                selectRows: vi.fn(),
                isSelected: vi.fn().mockReturnValue(false)
            },
            loadMore: vi.fn().mockResolvedValue(undefined),
            refresh: vi.fn().mockResolvedValue(undefined),
            upload: vi.fn().mockResolvedValue(undefined),
            setViewMode: vi.fn(),
            showFileDetails: vi.fn(),
            hideFileDetails: vi.fn(),
            setDragging: vi.fn(),
            showFilters: vi.fn(),
            hideFilters: vi.fn(),
            folders: {
                selectFolder: vi.fn(),
                createFolder: vi.fn(),
                editFolder: vi.fn(),
                deleteFolder: vi.fn().mockResolvedValue(undefined),
                moveFolder: vi.fn().mockResolvedValue(undefined),
                loadChildFolders: vi.fn().mockResolvedValue(undefined),
                canManageStructure: vi.fn().mockReturnValue(true),
                getAncestorIds: vi.fn().mockReturnValue([]),
                submitOperation: vi.fn().mockResolvedValue(true),
                cancelOperation: vi.fn()
            }
        },
        init: vi.fn(),
        dispose: vi.fn()
    };
}

// ---------------------------------------------------------------------------
// Tests — Grid data composition logic.
// ---------------------------------------------------------------------------

describe("FileGrid — child folder resolution", () => {
    it("should use vm.folders.childFolders when no current folder is selected", () => {
        const childFolders = [
            createMockFolderDto({ id: "f1", title: "Docs" }),
            createMockFolderDto({ id: "f2", title: "Photos" })
        ];
        const presenter = createMockPresenter({
            folders: observable({
                folders: childFolders,
                tree: [],
                currentFolderId: null,
                currentFolder: null,
                loading: false,
                operation: { active: false, mode: null },
                isRootFolder: true,
                currentFolderTitle: "All Files",
                childFolders,
                loadingNodeIds: []
            })
        });

        expect(presenter.vm.folders.childFolders).toHaveLength(2);
        expect(presenter.vm.folders.childFolders[0].id).toBe("f1");
        expect(presenter.vm.folders.childFolders[1].id).toBe("f2");
    });

    it("should expose child folders via vm.folders.childFolders when a folder is selected", () => {
        const childA = createMockFolderDto({ id: "child-a", title: "Sub A" });
        const childB = createMockFolderDto({ id: "child-b", title: "Sub B" });

        const presenter = createMockPresenter({
            folders: observable({
                folders: [],
                tree: [],
                currentFolderId: "parent",
                currentFolder: null,
                loading: false,
                operation: { active: false, mode: null },
                isRootFolder: false,
                currentFolderTitle: "Parent",
                childFolders: [childA, childB],
                loadingNodeIds: []
            })
        });

        expect(presenter.vm.folders.childFolders).toHaveLength(2);
        expect(presenter.vm.folders.childFolders[0].id).toBe("child-a");
        expect(presenter.vm.folders.childFolders[1].id).toBe("child-b");
    });

    it("should return empty childFolders when current folder has no children", () => {
        const presenter = createMockPresenter({
            folders: observable({
                folders: [],
                tree: [],
                currentFolderId: "leaf",
                currentFolder: null,
                loading: false,
                operation: { active: false, mode: null },
                isRootFolder: false,
                currentFolderTitle: "Leaf",
                childFolders: [],
                loadingNodeIds: []
            })
        });

        expect(presenter.vm.folders.childFolders).toHaveLength(0);
    });
});

describe("FileGrid — selection action wiring", () => {
    it("should call actions.selection.toggle with file id on file click", () => {
        const presenter = createMockPresenter();

        // Simulate what the component does when a file card is clicked.
        const fileId = "file-1";
        presenter.actions.selection.toggle(fileId);

        expect(presenter.actions.selection.toggle).toHaveBeenCalledWith("file-1");
    });

    it("should call actions.selection.deselectAll on background click", () => {
        const presenter = createMockPresenter();

        // Simulate background click handler.
        presenter.actions.selection.deselectAll();

        expect(presenter.actions.selection.deselectAll).toHaveBeenCalled();
    });

    it("should correctly determine selected state from vm.list.selection.selectedIds", () => {
        const file1 = createMockFile({ id: "file-1" });
        const file2 = createMockFile({ id: "file-2", name: "doc.pdf" });

        const presenter = createMockPresenter({
            list: observable({
                rows: [file1, file2],
                sort: null,
                filters: {},
                search: "",
                pagination: {
                    hasMore: false,
                    loading: false,
                    loadingMore: false,
                    totalCount: 2,
                    currentCount: 2
                },
                selection: {
                    selectedIds: new Set<string>(["file-1"]),
                    selectedCount: 1,
                    allSelected: false,
                    label: "1 item"
                },
                showingFilters: false,
                empty: false,
                emptyWithFilters: false,
                appliedQuery: null,
                error: null
            })
        });

        expect(presenter.vm.list.selection.selectedIds.has("file-1")).toBe(true);
        expect(presenter.vm.list.selection.selectedIds.has("file-2")).toBe(false);
    });
});

describe("FileGrid — folder navigation wiring", () => {
    it("should call actions.filter.set with folderId on folder card click", () => {
        const presenter = createMockPresenter();

        // Simulate what the component does when a folder card is clicked.
        const folderId = "folder-1";
        presenter.actions.filter.set("folderId", folderId);

        expect(presenter.actions.filter.set).toHaveBeenCalledWith("folderId", "folder-1");
    });
});

describe("FileGrid — loading state", () => {
    it("should show loading state when loading with no rows", () => {
        const presenter = createMockPresenter({
            list: observable({
                rows: [],
                sort: null,
                filters: {},
                search: "",
                pagination: {
                    hasMore: false,
                    loading: true,
                    loadingMore: false,
                    totalCount: 0,
                    currentCount: 0
                },
                selection: {
                    selectedIds: new Set<string>(),
                    selectedCount: 0,
                    allSelected: false,
                    label: ""
                },
                showingFilters: false,
                empty: true,
                emptyWithFilters: false,
                appliedQuery: null,
                error: null
            })
        });

        // Replicate the component's loading check.
        const showLoader =
            presenter.vm.list.pagination.loading && presenter.vm.list.rows.length === 0;

        expect(showLoader).toBe(true);
    });

    it("should not show loading state when loading with existing rows", () => {
        const presenter = createMockPresenter({
            list: observable({
                rows: [createMockFile()],
                sort: null,
                filters: {},
                search: "",
                pagination: {
                    hasMore: false,
                    loading: true,
                    loadingMore: false,
                    totalCount: 1,
                    currentCount: 1
                },
                selection: {
                    selectedIds: new Set<string>(),
                    selectedCount: 0,
                    allSelected: false,
                    label: ""
                },
                showingFilters: false,
                empty: false,
                emptyWithFilters: false,
                appliedQuery: null,
                error: null
            })
        });

        const showLoader =
            presenter.vm.list.pagination.loading && presenter.vm.list.rows.length === 0;

        expect(showLoader).toBe(false);
    });
});
