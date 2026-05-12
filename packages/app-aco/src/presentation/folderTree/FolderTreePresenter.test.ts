import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FolderTreePresenter as Abstraction } from "./abstractions.js";
import { FolderTreePresenterFeature } from "./feature.js";
import { FoldersCache, FoldersContext } from "~/features/folders/abstractions.js";
import { ListFoldersUseCase } from "~/features/folders/listFolders/abstractions.js";
import { CreateFolderUseCase } from "~/features/folders/createFolder/abstractions.js";
import { UpdateFolderUseCase } from "~/features/folders/updateFolder/abstractions.js";
import { DeleteFolderUseCase } from "~/features/folders/deleteFolder/abstractions.js";
import { ListFoldersByParentIdsUseCase } from "~/features/folders/listFoldersByParentIds/abstractions.js";
import { GetFolderAncestorsUseCase } from "~/features/folders/getFolderAncestors/abstractions.js";
import { GetFolderLevelPermissionUseCase } from "~/features/folders/getFolderLevelPermission/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { ListCache } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import type {
    IFormModel,
    IFormModelConfig,
    IField
} from "@webiny/app-admin/features/formModel/abstractions.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE = "FmFile";

function createFolder(data: {
    id: string;
    title: string;
    slug: string;
    parentId: string | null;
}): Folder {
    return Folder.create({
        ...data,
        type: TYPE,
        permissions: []
    });
}

function createFlatFolders(): Folder[] {
    return [
        createFolder({ id: "root-1", title: "Documents", slug: "documents", parentId: null }),
        createFolder({ id: "root-2", title: "Images", slug: "images", parentId: null }),
        createFolder({ id: "child-1", title: "Invoices", slug: "invoices", parentId: "root-1" }),
        createFolder({
            id: "child-2",
            title: "Contracts",
            slug: "contracts",
            parentId: "root-1"
        }),
        createFolder({
            id: "grandchild-1",
            title: "2024",
            slug: "2024",
            parentId: "child-1"
        })
    ];
}

// ---------------------------------------------------------------------------
// Mock FormModel
// ---------------------------------------------------------------------------

function createMockField(): IField {
    let value: unknown = undefined;
    return {
        getValue: vi.fn(() => value),
        setValue: vi.fn((v: unknown) => {
            value = v;
        }),
        setDisabled: vi.fn(),
        setVisible: vi.fn(),
        remove: vi.fn(),
        addBeforeChange: vi.fn(),
        addAfterChange: vi.fn(),
        addAfterSetValue: vi.fn(),
        addOnBlur: vi.fn(),
        blur: vi.fn(),
        as: vi.fn()
    } as unknown as IField;
}

function createMockFormModel(): IFormModel {
    const fields = new Map<string, IField>();
    let data: Record<string, unknown> = {};

    const form: IFormModel = {
        field(name: string) {
            if (!fields.has(name)) {
                fields.set(name, createMockField());
            }
            return fields.get(name)!;
        },
        fields: vi.fn(),
        layout: vi.fn() as IFormModel["layout"],
        setLayout: vi.fn(),
        addRule: vi.fn(),
        getData: vi.fn(() => data),
        setData: vi.fn((d: Record<string, unknown>) => {
            data = d;
        }),
        reset: vi.fn(),
        validate: vi.fn(async () => true),
        submit: vi.fn(async () => data) as IFormModel["submit"],
        evaluateRules: vi.fn(() => ({ visible: true, disabled: false })),
        focusField: vi.fn(),
        isDirty: false,
        isValid: null,
        submitted: false,
        submitCount: 0,
        errors: [],
        vm: {
            layout: [],
            isDirty: false,
            isValid: null,
            errors: [],
            submitCount: 0,
            focusField: vi.fn(),
            getData: vi.fn(() => ({})),
            setData: vi.fn()
        },
        getFieldBuilders: vi.fn(() => []),
        resolveChildLayout: vi.fn(() => []),
        registry: {} as IFormModel["registry"]
    };

    return form;
}

// ---------------------------------------------------------------------------
// Mock use cases
// ---------------------------------------------------------------------------

class MockListFoldersUseCase implements ListFoldersUseCase.Interface {
    execute = vi.fn(async () => {});
}

class MockCreateFolderUseCase implements CreateFolderUseCase.Interface {
    execute = vi.fn(async () => {});
}

class MockUpdateFolderUseCase implements UpdateFolderUseCase.Interface {
    execute = vi.fn(async () => {});
}

class MockDeleteFolderUseCase implements DeleteFolderUseCase.Interface {
    execute = vi.fn(async () => {});
}

class MockFormModelFactory {
    create = vi.fn((_config: IFormModelConfig) => createMockFormModel());
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function createTestPresenter(folders: Folder[] = []) {
    const container = new Container();
    const foldersCache = new ListCache<Folder>();
    const listFolders = new MockListFoldersUseCase();
    const createFolderUseCase = new MockCreateFolderUseCase();
    const updateFolderUseCase = new MockUpdateFolderUseCase();
    const deleteFolderUseCase = new MockDeleteFolderUseCase();
    const formModelFactory = new MockFormModelFactory();

    // Pre-populate cache.
    if (folders.length > 0) {
        foldersCache.addItems(folders);
    }

    container.registerInstance(FoldersContext, { type: TYPE });
    container.registerInstance(FoldersCache, foldersCache);
    container.registerInstance(ListFoldersUseCase, listFolders);
    container.registerInstance(CreateFolderUseCase, createFolderUseCase);
    container.registerInstance(UpdateFolderUseCase, updateFolderUseCase);
    container.registerInstance(DeleteFolderUseCase, deleteFolderUseCase);
    container.registerInstance(ListFoldersByParentIdsUseCase, {
        execute: vi.fn().mockResolvedValue(undefined)
    });
    container.registerInstance(GetFolderAncestorsUseCase, {
        execute: vi.fn().mockReturnValue([])
    });
    container.registerInstance(GetFolderLevelPermissionUseCase, {
        execute: vi.fn().mockReturnValue(true)
    });
    container.registerInstance(
        FormModelFactory,
        formModelFactory as unknown as FormModelFactory.Interface
    );

    FolderTreePresenterFeature.register(container);

    const presenter = container.resolve(Abstraction);

    return {
        presenter,
        foldersCache,
        listFolders,
        createFolderUseCase,
        updateFolderUseCase,
        deleteFolderUseCase,
        formModelFactory
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FolderTreePresenter", () => {
    // -------------------------------------------------------------------
    // Scoped initialization via FoldersContext
    // -------------------------------------------------------------------

    describe("scoped initialization", () => {
        it("should load folders on construction via ListFoldersUseCase", () => {
            const { listFolders } = createTestPresenter();
            expect(listFolders.execute).toHaveBeenCalledTimes(1);
        });

        it("should not require an init(type) method — type comes from FoldersContext", () => {
            const { presenter } = createTestPresenter();
            // The presenter has no init method — it reads type from injected FoldersContext.
            expect((presenter as any).init).toBeUndefined();
        });

        it("should start with loading=true then resolve to false", async () => {
            const { presenter } = createTestPresenter();

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });
        });
    });

    // -------------------------------------------------------------------
    // Tree computation from flat folder list
    // -------------------------------------------------------------------

    describe("tree computation", () => {
        it("should build a nested tree from a flat folder list", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const { tree } = presenter.vm;

            // Two root nodes.
            expect(tree).toHaveLength(2);
            expect(tree[0].name).toBe("Documents");
            expect(tree[1].name).toBe("Images");

            // Documents has 2 children.
            expect(tree[0].children).toHaveLength(2);
            expect(tree[0].children[0].name).toBe("Invoices");
            expect(tree[0].children[1].name).toBe("Contracts");

            // Invoices has 1 grandchild.
            expect(tree[0].children[0].children).toHaveLength(1);
            expect(tree[0].children[0].children[0].name).toBe("2024");

            // Images has no children.
            expect(tree[1].children).toHaveLength(0);
        });

        it("should return an empty tree when cache is empty", async () => {
            const { presenter } = createTestPresenter([]);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            expect(presenter.vm.tree).toEqual([]);
        });

        it("should treat folders with unknown parentId as root nodes", async () => {
            const folders = [
                createFolder({
                    id: "orphan",
                    title: "Orphan",
                    slug: "orphan",
                    parentId: "non-existent"
                })
            ];
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            expect(presenter.vm.tree).toHaveLength(1);
            expect(presenter.vm.tree[0].name).toBe("Orphan");
        });

        it("should map folder properties correctly to tree nodes", async () => {
            const folders = [
                createFolder({
                    id: "f1",
                    title: "My Folder",
                    slug: "my-folder",
                    parentId: null
                })
            ];
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const node = presenter.vm.tree[0];
            expect(node.id).toBe("f1");
            expect(node.name).toBe("My Folder");
            expect(node.slug).toBe("my-folder");
            expect(node.parentId).toBeNull();
            expect(node.children).toEqual([]);
        });
    });

    // -------------------------------------------------------------------
    // selectFolder and onFolderChange
    // -------------------------------------------------------------------

    describe("selectFolder", () => {
        it("should update currentFolderId", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            expect(presenter.vm.currentFolderId).toBeNull();

            presenter.selectFolder("root-1");
            expect(presenter.vm.currentFolderId).toBe("root-1");
        });

        it("should update currentFolder to the matching tree node", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.selectFolder("child-1");
            expect(presenter.vm.currentFolder).not.toBeNull();
            expect(presenter.vm.currentFolder!.id).toBe("child-1");
            expect(presenter.vm.currentFolder!.name).toBe("Invoices");
        });

        it("should set currentFolder to null when selecting root (null)", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.selectFolder("root-1");
            expect(presenter.vm.currentFolder).not.toBeNull();

            presenter.selectFolder(null);
            expect(presenter.vm.currentFolderId).toBeNull();
            expect(presenter.vm.currentFolder).toBeNull();
        });

        it("should find deeply nested folders as currentFolder", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.selectFolder("grandchild-1");
            expect(presenter.vm.currentFolder).not.toBeNull();
            expect(presenter.vm.currentFolder!.name).toBe("2024");
        });
    });

    describe("onFolderChange", () => {
        it("should fire callbacks when currentFolderId changes", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const callback = vi.fn();
            presenter.onFolderChange(callback);

            presenter.selectFolder("root-1");

            // MobX reaction fires synchronously for simple observable changes.
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith("root-1");
        });

        it("should fire callback with null when navigating to root", async () => {
            const folders = createFlatFolders();
            const { presenter } = createTestPresenter(folders);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.selectFolder("root-1");

            const callback = vi.fn();
            presenter.onFolderChange(callback);

            presenter.selectFolder(null);
            expect(callback).toHaveBeenCalledWith(null);
        });

        it("should support multiple callbacks", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const cb1 = vi.fn();
            const cb2 = vi.fn();
            presenter.onFolderChange(cb1);
            presenter.onFolderChange(cb2);

            presenter.selectFolder("root-2");

            expect(cb1).toHaveBeenCalledWith("root-2");
            expect(cb2).toHaveBeenCalledWith("root-2");
        });

        it("should return an unsubscribe function that stops callbacks", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const callback = vi.fn();
            const unsubscribe = presenter.onFolderChange(callback);

            presenter.selectFolder("root-1");
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe();

            presenter.selectFolder("root-2");
            // Should not have been called again after unsubscribe.
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it("should not fire callback when selecting the same folder", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.selectFolder("root-1");

            const callback = vi.fn();
            presenter.onFolderChange(callback);

            // Select the same folder again.
            presenter.selectFolder("root-1");
            expect(callback).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------
    // createFolder / editFolder — operation state with FormModel
    // -------------------------------------------------------------------

    describe("createFolder", () => {
        it("should set operation state with mode 'create' and a FormModel", async () => {
            const { presenter, formModelFactory } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.createFolder("root-1");

            expect(presenter.vm.operation.active).toBe(true);
            expect(presenter.vm.operation.mode).toBe("create");
            expect(presenter.vm.operation.parentFolderId).toBe("root-1");
            expect(presenter.vm.operation.form).toBeDefined();
            expect(formModelFactory.create).toHaveBeenCalledTimes(1);
        });

        it("should set parentFolderId to undefined when creating at root", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.createFolder();

            expect(presenter.vm.operation.active).toBe(true);
            expect(presenter.vm.operation.mode).toBe("create");
            expect(presenter.vm.operation.parentFolderId).toBeUndefined();
        });

        it("should wire submitOperation to CreateFolderUseCase", async () => {
            const { presenter, createFolderUseCase, listFolders } =
                createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.createFolder("root-1");

            await presenter.submitOperation();

            expect(createFolderUseCase.execute).toHaveBeenCalledTimes(1);
            expect(listFolders.execute).toHaveBeenCalledTimes(2);
        });
    });

    describe("editFolder", () => {
        it("should set operation state with mode 'edit' and a FormModel", async () => {
            const { presenter, formModelFactory } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.editFolder("root-1");

            expect(presenter.vm.operation.active).toBe(true);
            expect(presenter.vm.operation.mode).toBe("edit");
            expect(presenter.vm.operation.folderId).toBe("root-1");
            expect(presenter.vm.operation.form).toBeDefined();
            expect(formModelFactory.create).toHaveBeenCalledTimes(1);
        });

        it("should pre-populate form with existing folder data", async () => {
            const mockForm = createMockFormModel();
            const { presenter, formModelFactory } = createTestPresenter(createFlatFolders());
            formModelFactory.create.mockReturnValue(mockForm);

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.editFolder("root-1");

            expect(mockForm.setData).toHaveBeenCalledWith({
                title: "Documents",
                slug: "documents"
            });
        });

        it("should do nothing when editing a non-existent folder", async () => {
            const { presenter, formModelFactory } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            presenter.editFolder("non-existent");

            expect(presenter.vm.operation.active).toBe(false);
            expect(presenter.vm.operation.mode).toBeNull();
            expect(formModelFactory.create).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------------
    // deleteFolder — navigates to parent and updates tree
    // -------------------------------------------------------------------

    describe("deleteFolder", () => {
        it("should call DeleteFolderUseCase with the folder id", async () => {
            const { presenter, deleteFolderUseCase } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            await presenter.deleteFolder("child-1");

            expect(deleteFolderUseCase.execute).toHaveBeenCalledWith("child-1");
        });

        it("should set operation state with mode 'delete' during deletion", async () => {
            const { presenter, deleteFolderUseCase } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            // Make delete hang so we can inspect intermediate state.
            let resolveDelete!: () => void;
            deleteFolderUseCase.execute.mockReturnValueOnce(
                new Promise<void>(resolve => {
                    resolveDelete = resolve;
                })
            );

            const deletePromise = presenter.deleteFolder("child-1");

            expect(presenter.vm.operation.active).toBe(true);
            expect(presenter.vm.operation.mode).toBe("delete");
            expect(presenter.vm.operation.folderId).toBe("child-1");

            resolveDelete();
            await deletePromise;

            // After completion, operation should be reset.
            expect(presenter.vm.operation.active).toBe(false);
            expect(presenter.vm.operation.mode).toBeNull();
        });

        it("should navigate to parent folder after deletion", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            // child-1 has parentId "root-1".
            await presenter.deleteFolder("child-1");

            expect(presenter.vm.currentFolderId).toBe("root-1");
        });

        it("should navigate to root (null) when deleting a root folder", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            // root-1 has parentId null.
            await presenter.deleteFolder("root-1");

            expect(presenter.vm.currentFolderId).toBeNull();
        });

        it("should refresh the folder list after deletion", async () => {
            const { presenter, listFolders } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            await presenter.deleteFolder("child-1");

            // Initial load + refresh after delete.
            expect(listFolders.execute).toHaveBeenCalledTimes(2);
        });

        it("should fire onFolderChange callback when navigating to parent after delete", async () => {
            const { presenter } = createTestPresenter(createFlatFolders());

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            const callback = vi.fn();
            presenter.onFolderChange(callback);

            // child-1 has parentId "root-1".
            await presenter.deleteFolder("child-1");

            expect(callback).toHaveBeenCalledWith("root-1");
        });
    });

    // -------------------------------------------------------------------
    // Operation state reset
    // -------------------------------------------------------------------

    describe("operation state", () => {
        it("should start with inactive operation state", async () => {
            const { presenter } = createTestPresenter();

            await vi.waitFor(() => {
                expect(presenter.vm.loading).toBe(false);
            });

            expect(presenter.vm.operation.active).toBe(false);
            expect(presenter.vm.operation.mode).toBeNull();
        });
    });
});
