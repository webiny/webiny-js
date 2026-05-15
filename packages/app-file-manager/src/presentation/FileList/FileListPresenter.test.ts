// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { observable, runInAction } from "mobx";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ListPresenter } from "@webiny/app-admin/presentation/listPresenter/abstractions.js";
import { FolderTreePresenter } from "@webiny/app-aco/presentation/folderTree/abstractions.js";
import { FileManagerPermissions } from "../../features/permissions/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import { ListTagsRepository } from "../../features/tags/abstractions.js";
import { FileUploader } from "../../features/fileUploader/abstractions.js";
import { LocalStorage } from "@webiny/app/features/localStorage";
import { ListFilesUseCase } from "../../features/listFiles/abstractions.js";
import { FilesListCache } from "../../features/shared/abstractions.js";
import { GetDescendantFoldersUseCase } from "@webiny/app-aco/features/folders/getDescendantFolders/abstractions.js";
import { FileModelProvider } from "../../features/fileModel/abstractions.js";
import { FileDetailsPresenter } from "../FileDetails/abstractions.js";
import type { IFileDetailsPresenter } from "../FileDetails/abstractions.js";
import { FileManagerPresenter as Abstraction, type IFileManagerPresenter } from "./abstractions.js";
import { FileManagerPresenter } from "./FileManagerPresenter.js";
import type { FmFile } from "../../features/shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockListPresenter(): ListPresenter.Interface<FmFile> {
    const vmState = observable({
        rows: [] as FmFile[],
        sort: null as { field: string; direction: "ASC" | "DESC" } | null,
        filters: {} as Record<string, unknown>,
        search: "",
        appliedQuery: null as
            | import("@webiny/app-admin/presentation/listPresenter/abstractions.js").IDataSourceQuery
            | null,
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
            allSelected: false
        },
        empty: true,
        emptyWithFilters: false,
        error: null as
            | import("@webiny/app-admin/presentation/listPresenter/abstractions.js").IListError
            | null
    });

    return {
        get vm() {
            return vmState;
        },
        actions: {
            search: { set: vi.fn(), clear: vi.fn() },
            sort: { set: vi.fn(), toggle: vi.fn() },
            filter: { set: vi.fn(), clear: vi.fn(), clearAll: vi.fn() },
            selection: {
                toggle: vi.fn(),
                selectRangeTo: vi.fn(),
                selectAll: vi.fn(),
                deselectAll: vi.fn(),
                selectRows: vi.fn(),
                isSelected: vi.fn().mockReturnValue(false)
            },
            loadMore: vi.fn().mockResolvedValue(undefined),
            refresh: vi.fn().mockResolvedValue(undefined)
        },
        init: vi.fn()
    };
}

function createMockFolderTreePresenter(): FolderTreePresenter.Interface {
    const state = observable({
        folders: [],
        tree: [],
        currentFolderId: null as string | null,
        currentFolder: null,
        loading: false,
        operation: { active: false, mode: null },
        isRootFolder: true,
        currentFolderTitle: "All Files",
        childFolders: [],
        loadingNodeIds: []
    });

    return {
        get vm() {
            return state;
        },
        selectFolder: vi.fn(),
        createFolder: vi.fn(),
        editFolder: vi.fn(),
        deleteFolder: vi.fn().mockResolvedValue(undefined),
        moveFolder: vi.fn().mockResolvedValue(undefined),
        loadChildFolders: vi.fn().mockResolvedValue(undefined),
        canManageStructure: vi.fn().mockReturnValue(true),
        getAncestorIds: vi.fn().mockReturnValue([]),
        submitOperation: vi.fn().mockResolvedValue(true),
        cancelOperation: vi.fn(),
        onFolderChange: vi.fn().mockReturnValue(() => {})
    };
}

function createMockPermissions(): FileManagerPermissions.Interface {
    return {
        canAccess: vi.fn().mockReturnValue(true),
        canRead: vi.fn().mockReturnValue(true),
        canCreate: vi.fn().mockReturnValue(true),
        canEdit: vi.fn().mockReturnValue(false),
        canDelete: vi.fn().mockReturnValue(false),
        canAction: vi.fn().mockReturnValue(true)
    } as unknown as FileManagerPermissions.Interface;
}

function createMockSettingsRepository(): GetSettingsRepository.Interface {
    return {
        execute: vi.fn().mockResolvedValue({
            uploadMinFileSize: "0",
            uploadMaxFileSize: "10485760",
            srcPrefix: "https://cdn.example.com/"
        }),
        save: vi.fn().mockImplementation(async (data: Record<string, unknown>) => data),
        settings: null
    };
}

function createMockTagsRepository(): ListTagsRepository.Interface {
    return {
        execute: vi.fn().mockResolvedValue([]),
        tags: [{ tag: "photo", count: 5 }]
    };
}

function createMockFileUploader(): FileUploader.Interface {
    return {
        vm: {
            jobs: [],
            overallProgress: { sent: 0, total: 0, percentage: 0 },
            isUploading: false,
            completedCount: 0,
            failedCount: 0
        },
        upload: vi.fn().mockResolvedValue(undefined),
        uploadMany: vi.fn().mockResolvedValue(undefined),
        abort: vi.fn(),
        clear: vi.fn()
    };
}

function createMockLocalStorage(): LocalStorage.Interface {
    const store = new Map<string, unknown>();
    return {
        get: vi.fn((key: string) => store.get(key)) as LocalStorage.Interface["get"],
        set: vi.fn(<T>(key: string, value: T): void => {
            store.set(key, value);
        }),
        remove: vi.fn((key: string) => {
            store.delete(key);
        }),
        clear: vi.fn(() => store.clear()),
        keys: vi.fn(() => Array.from(store.keys()))
    };
}

function createMockListFilesUseCase(): ListFilesUseCase.Interface {
    return {
        execute: vi.fn().mockResolvedValue({
            data: [],
            meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
        })
    };
}

function createMockGetDescendantFoldersUseCase(): GetDescendantFoldersUseCase.Interface {
    return {
        execute: vi.fn().mockReturnValue([])
    };
}

function createMockFileDetailsPresenter(): IFileDetailsPresenter {
    return {
        vm: {
            file: null,
            loading: null,
            form: {
                layout: [],
                errors: [],
                isDirty: false,
                isValid: null,
                submitCount: 0,
                focusField: vi.fn(),
                getData: vi.fn(() => ({})),
                setData: vi.fn()
            },
            previewUrl: null,
            permissions: { canEdit: true, canDelete: true }
        },
        loadFile: vi.fn().mockResolvedValue(undefined),
        saveFile: vi.fn().mockResolvedValue(undefined)
    };
}

// ---------------------------------------------------------------------------
// Container setup
// ---------------------------------------------------------------------------

interface Mocks {
    listPresenter: ListPresenter.Interface<FmFile>;
    folderTreePresenter: FolderTreePresenter.Interface;
    fileDetailsPresenter: IFileDetailsPresenter;
    permissions: FileManagerPermissions.Interface;
    settingsRepository: GetSettingsRepository.Interface;
    tagsRepository: ListTagsRepository.Interface;
    fileUploader: FileUploader.Interface;
    localStorage: LocalStorage.Interface;
    listFilesUseCase: ListFilesUseCase.Interface;
    cache: ListCache<FmFile>;
    getDescendantFoldersUseCase: GetDescendantFoldersUseCase.Interface;
    fileModelProvider: FileModelProvider.Interface;
}

function createMocks(): Mocks {
    return {
        listPresenter: createMockListPresenter(),
        folderTreePresenter: createMockFolderTreePresenter(),
        fileDetailsPresenter: createMockFileDetailsPresenter(),
        permissions: createMockPermissions(),
        settingsRepository: createMockSettingsRepository(),
        tagsRepository: createMockTagsRepository(),
        fileUploader: createMockFileUploader(),
        localStorage: createMockLocalStorage(),
        listFilesUseCase: createMockListFilesUseCase(),
        cache: new ListCache<FmFile>(),
        getDescendantFoldersUseCase: createMockGetDescendantFoldersUseCase(),
        fileModelProvider: {
            getModel: vi.fn().mockResolvedValue({ fields: [] })
        }
    };
}

function createContainer(mocks: Mocks) {
    const container = new Container();

    container.registerInstance(ListPresenter, mocks.listPresenter);
    container.registerInstance(FolderTreePresenter, mocks.folderTreePresenter);
    container.registerInstance(FileDetailsPresenter, mocks.fileDetailsPresenter);
    container.registerInstance(FileManagerPermissions, mocks.permissions);
    container.registerInstance(GetSettingsRepository, mocks.settingsRepository);
    container.registerInstance(ListTagsRepository, mocks.tagsRepository);
    container.registerInstance(FileUploader, mocks.fileUploader);
    container.registerInstance(LocalStorage, mocks.localStorage);
    container.registerInstance(ListFilesUseCase, mocks.listFilesUseCase);
    container.registerInstance(FilesListCache, mocks.cache);
    container.registerInstance(GetDescendantFoldersUseCase, mocks.getDescendantFoldersUseCase);
    container.registerInstance(FileModelProvider, mocks.fileModelProvider);

    // Register the real FileListPresenter implementation.
    container.register(FileManagerPresenter).inSingletonScope();

    return container;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileListPresenter", () => {
    let mocks: Mocks;
    let presenter: IFileManagerPresenter;

    beforeEach(() => {
        mocks = createMocks();
        const container = createContainer(mocks);
        presenter = container.resolve(Abstraction);
    });

    // -----------------------------------------------------------------------
    // Composition: ListPresenter and FolderTreePresenter initialized.
    // -----------------------------------------------------------------------

    it("should call listPresenter.init with a DataSource and initialSort on init()", () => {
        presenter.init();

        expect(mocks.listPresenter.init).toHaveBeenCalledTimes(1);
        const config = (mocks.listPresenter.init as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(config.dataSource).toBeDefined();
        expect(config.initialSort).toEqual({ field: "createdOn", direction: "DESC" });
    });

    it("should forward ListPresenter.vm data as vm.list", () => {
        presenter.init();
        expect(presenter.vm.list.rows).toEqual(mocks.listPresenter.vm.rows);
        expect(presenter.vm.list.sort).toEqual(mocks.listPresenter.vm.sort);
        expect(presenter.vm.list.search).toBe(mocks.listPresenter.vm.search);
        expect(presenter.vm.list.empty).toBe(mocks.listPresenter.vm.empty);
    });

    it("should forward FolderTreePresenter.vm as vm.folders", () => {
        presenter.init();
        expect(presenter.vm.folders).toBe(mocks.folderTreePresenter.vm);
    });

    // -----------------------------------------------------------------------
    // Folder change wiring.
    // -----------------------------------------------------------------------

    it("should set folderId filter when folder changes", async () => {
        presenter.init();

        // Simulate folder selection via MobX observable change.
        runInAction(() => {
            (mocks.folderTreePresenter.vm as any).currentFolderId = "folder-abc";
        });

        // MobX reaction fires synchronously in the same tick after runInAction.
        expect(mocks.listPresenter.actions.filter.set).toHaveBeenCalledWith(
            "folderId",
            "folder-abc"
        );
    });

    it("should set folderId to root when folder is set to null", () => {
        presenter.init();

        // First set a folder.
        runInAction(() => {
            (mocks.folderTreePresenter.vm as any).currentFolderId = "folder-1";
        });

        // Then clear it.
        runInAction(() => {
            (mocks.folderTreePresenter.vm as any).currentFolderId = null;
        });

        expect(mocks.listPresenter.actions.filter.set).toHaveBeenCalledWith("folderId", "root");
    });

    // -----------------------------------------------------------------------
    // Permission flags forwarded to vm.
    // -----------------------------------------------------------------------

    it("should expose permission flags in vm.permissions", () => {
        presenter.init();

        expect(presenter.vm.permissions.canRead).toBe(true);
        expect(presenter.vm.permissions.canCreate).toBe(true);
        expect(presenter.vm.permissions.canEdit).toBe(false);
        expect(presenter.vm.permissions.canDelete).toBe(false);
    });

    // -----------------------------------------------------------------------
    // View mode persistence via LocalStorage.
    // -----------------------------------------------------------------------

    it("should default viewMode to 'grid'", () => {
        expect(presenter.vm.viewMode).toBe("grid");
    });

    it("should update viewMode and persist to localStorage", () => {
        presenter.actions.setViewMode("grid");

        expect(presenter.vm.viewMode).toBe("grid");
        expect(mocks.localStorage.set).toHaveBeenCalledWith("fm:viewMode", "grid");
    });

    it("should restore viewMode from localStorage on construction", () => {
        // Pre-seed localStorage with "grid" before creating the presenter.
        const seededMocks = createMocks();
        (seededMocks.localStorage.get as ReturnType<typeof vi.fn>).mockReturnValue("grid");

        const container = createContainer(seededMocks);
        const seededPresenter: IFileManagerPresenter = container.resolve(Abstraction);

        expect(seededPresenter.vm.viewMode).toBe("grid");
    });

    // -----------------------------------------------------------------------
    // Upload action.
    // -----------------------------------------------------------------------

    it("should call fileUploader.uploadMany when actions.upload is called", async () => {
        presenter.init();

        const file1 = {
            id: "f1",
            name: "test.txt",
            type: "text/plain",
            size: 7,
            src: { file: new File(["content"], "test.txt", { type: "text/plain" }), base64: null }
        };
        const file2 = {
            id: "f2",
            name: "photo.png",
            type: "image/png",
            size: 3,
            src: { file: new File(["img"], "photo.png", { type: "image/png" }), base64: null }
        };

        await presenter.actions.upload([file1, file2]);

        expect(mocks.fileUploader.uploadMany).toHaveBeenCalledTimes(1);
        const args = (mocks.fileUploader.uploadMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(args).toHaveLength(2);
        expect(args[0].data.name).toBe("test.txt");
        expect(args[0].data.type).toBe("text/plain");
        expect(args[1].data.name).toBe("photo.png");
        expect(args[1].data.type).toBe("image/png");
    });

    // -----------------------------------------------------------------------
    // showFolders computed from appliedQuery.
    // -----------------------------------------------------------------------

    it("should show folders when appliedQuery is null", () => {
        presenter.init();
        expect(presenter.vm.showFolders).toBe(true);
    });

    it("should show folders when appliedQuery has no search and only folderId filter", () => {
        presenter.init();
        runInAction(() => {
            (mocks.listPresenter.vm as any).appliedQuery = {
                filters: { folderId: "root" }
            };
        });
        expect(presenter.vm.showFolders).toBe(true);
    });

    it("should hide folders when appliedQuery has a search", () => {
        presenter.init();
        runInAction(() => {
            (mocks.listPresenter.vm as any).appliedQuery = {
                search: "photo",
                filters: { folderId: "root" }
            };
        });
        expect(presenter.vm.showFolders).toBe(false);
    });

    it("should hide folders when appliedQuery has non-folderId filters", () => {
        presenter.init();
        runInAction(() => {
            (mocks.listPresenter.vm as any).appliedQuery = {
                filters: { folderId: "root", tags: ["photo"] }
            };
        });
        expect(presenter.vm.showFolders).toBe(false);
    });

    it("should show folders again when appliedQuery filters are cleared", () => {
        presenter.init();
        runInAction(() => {
            (mocks.listPresenter.vm as any).appliedQuery = {
                filters: { folderId: "root", type: "image" }
            };
        });
        expect(presenter.vm.showFolders).toBe(false);

        runInAction(() => {
            (mocks.listPresenter.vm as any).appliedQuery = {
                filters: { folderId: "root" }
            };
        });
        expect(presenter.vm.showFolders).toBe(true);
    });
});
