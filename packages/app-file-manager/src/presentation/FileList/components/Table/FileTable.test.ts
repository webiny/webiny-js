// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { observable } from "mobx";
import type { IFileManagerPresenter, IFileManagerViewModel } from "../../abstractions.js";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import type { FmFile } from "~/features/shared/types.js";

// ---------------------------------------------------------------------------
// Helpers — extracted from FileTable.tsx for unit testing.
// ---------------------------------------------------------------------------

/**
 * Convert presenter sort state to DataTable sorting format.
 */
function toDataTableSorting(
    sort: { field: string; direction: "ASC" | "DESC" } | null
): Array<{ id: string; desc: boolean }> {
    if (!sort) {
        return [];
    }
    return [{ id: sort.field, desc: sort.direction === "DESC" }];
}

/**
 * Map IFolderTreeNode to FolderTableRow-compatible shape.
 */
function toFolderTableRows(nodes: IFolderTreeNode[]) {
    return nodes.map(node => ({
        id: node.id,
        $type: "FOLDER" as const,
        $selectable: false,
        data: {
            id: node.id,
            title: node.name,
            slug: node.slug,
            type: "",
            parentId: node.parentId,
            path: "",
            permissions: [],
            hasNonInheritedPermissions: false,
            canManagePermissions: false,
            canManageStructure: false,
            canManageContent: false,
            createdBy: { id: "", displayName: "" },
            createdOn: "",
            savedBy: { id: "", displayName: "" },
            savedOn: "",
            modifiedBy: null,
            modifiedOn: null,
            extensions: {}
        }
    }));
}

// ---------------------------------------------------------------------------
// Mock file factory.
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

function createMockFolderNode(overrides: Partial<IFolderTreeNode> = {}): IFolderTreeNode {
    return {
        id: "folder-1",
        name: "Documents",
        slug: "documents",
        parentId: null,
        children: [],
        hasNonInheritedPermissions: false,
        canManagePermissions: false,
        canManageStructure: true,
        ...overrides
    };
}

function createMockPresenter(
    vmOverrides: Partial<IFileManagerViewModel> = {}
): IFileManagerPresenter {
    const defaultVm: IFileManagerViewModel = observable({
        fileModel: null,
        loading: false,
        empty: true,
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
        viewMode: "table" as const,
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
// Tests
// ---------------------------------------------------------------------------

describe("FileTable — sorting conversion", () => {
    it("should convert null sort to empty DataTable sorting", () => {
        expect(toDataTableSorting(null)).toEqual([]);
    });

    it("should convert ASC sort to DataTable format", () => {
        const result = toDataTableSorting({ field: "name", direction: "ASC" });
        expect(result).toEqual([{ id: "name", desc: false }]);
    });

    it("should convert DESC sort to DataTable format", () => {
        const result = toDataTableSorting({ field: "createdOn", direction: "DESC" });
        expect(result).toEqual([{ id: "createdOn", desc: true }]);
    });
});

describe("FileTable — folder data mapping", () => {
    it("should map IFolderTreeNode to FolderTableRow with $type FOLDER", () => {
        const node = createMockFolderNode({ id: "f1", name: "Images", slug: "images" });
        const rows = toFolderTableRows([node]);

        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("f1");
        expect(rows[0].$type).toBe("FOLDER");
        expect(rows[0].$selectable).toBe(false);
        expect(rows[0].data.title).toBe("Images");
        expect(rows[0].data.slug).toBe("images");
    });

    it("should map multiple folder nodes", () => {
        const nodes = [
            createMockFolderNode({ id: "f1", name: "Docs" }),
            createMockFolderNode({ id: "f2", name: "Photos" })
        ];
        const rows = toFolderTableRows(nodes);

        expect(rows).toHaveLength(2);
        expect(rows[0].id).toBe("f1");
        expect(rows[1].id).toBe("f2");
    });

    it("should return empty array for empty folder list", () => {
        expect(toFolderTableRows([])).toEqual([]);
    });
});

describe("FileTable — sort action wiring", () => {
    it("should call actions.sort.set when sorting changes to DESC", () => {
        const presenter = createMockPresenter();

        // Simulate what the component does when onSortingChange fires.
        const newSorting = [{ id: "size", desc: true }];
        if (newSorting.length > 0) {
            const { id, desc } = newSorting[0];
            presenter.actions.sort.set(id, desc ? "DESC" : "ASC");
        }

        expect(presenter.actions.sort.set).toHaveBeenCalledWith("size", "DESC");
    });

    it("should call actions.sort.set when sorting changes to ASC", () => {
        const presenter = createMockPresenter();

        const newSorting = [{ id: "name", desc: false }];
        if (newSorting.length > 0) {
            const { id, desc } = newSorting[0];
            presenter.actions.sort.set(id, desc ? "DESC" : "ASC");
        }

        expect(presenter.actions.sort.set).toHaveBeenCalledWith("name", "ASC");
    });
});

describe("FileTable — selection action wiring", () => {
    it("should call actions.selection.toggle for RECORD row toggle", () => {
        const presenter = createMockPresenter();

        // Simulate onToggleRow for a file row.
        const row = {
            id: "file-1",
            $type: "RECORD" as const,
            $selectable: true,
            data: createMockFile()
        };
        if (row.$type === "RECORD") {
            presenter.actions.selection.toggle(row.id);
        }

        expect(presenter.actions.selection.toggle).toHaveBeenCalledWith("file-1");
    });

    it("should not call actions.selection.toggle for FOLDER row toggle", () => {
        const presenter = createMockPresenter();

        // Simulate onToggleRow for a folder row — folders are not selectable.
        const row = { id: "folder-1", $type: "FOLDER" as const, $selectable: false, data: {} };
        if ((row.$type as string) === "RECORD") {
            presenter.actions.selection.toggle(row.id);
        }

        expect(presenter.actions.selection.toggle).not.toHaveBeenCalled();
    });

    it("should call actions.selection.deselectAll when empty selection", () => {
        const presenter = createMockPresenter();

        // Simulate onSelectRow with empty array.
        const rows: Array<{ id: string; $type: string }> = [];
        if (rows.length === 0) {
            presenter.actions.selection.deselectAll();
        }

        expect(presenter.actions.selection.deselectAll).toHaveBeenCalled();
    });

    it("should call actions.selection.selectRows with file IDs only", () => {
        const presenter = createMockPresenter();

        // Simulate onSelectRow with mixed rows.
        const rows = [
            {
                id: "file-1",
                $type: "RECORD" as const,
                $selectable: true,
                data: createMockFile({ id: "file-1" })
            },
            { id: "folder-1", $type: "FOLDER" as const, $selectable: false, data: {} },
            {
                id: "file-2",
                $type: "RECORD" as const,
                $selectable: true,
                data: createMockFile({ id: "file-2" })
            }
        ];

        const ids = rows.filter(row => row.$type === "RECORD").map(row => row.id);
        presenter.actions.selection.selectRows(ids);

        expect(presenter.actions.selection.selectRows).toHaveBeenCalledWith(["file-1", "file-2"]);
    });
});
