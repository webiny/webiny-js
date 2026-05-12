// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { GetFileUseCase } from "../../features/getFile/abstractions.js";
import { UpdateFileUseCase } from "../../features/updateFile/abstractions.js";
import { DeleteFileUseCase } from "../../features/deleteFile/abstractions.js";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { IFormVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { FileManagerPermissions } from "../../features/permissions/abstractions.js";
import { GetSettingsRepository } from "../../features/settings/abstractions.js";
import { FileDetailsPresenter as Abstraction, type IFileDetailsPresenter } from "./abstractions.js";
import { FileDetailsPresenter } from "./FileDetailsPresenter.js";
import type { FmFile } from "../../features/shared/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFormModel(overrides?: Partial<IFormVM>): IFormModel {
    const vm: IFormVM = {
        layout: [],
        errors: [],
        isDirty: false,
        isValid: true,
        ...overrides
    };

    const data: Record<string, unknown> = {};

    return {
        field: vi.fn() as any,
        fields: vi.fn() as any,
        layout: vi.fn() as any,
        getData: vi.fn(() => ({ ...data })),
        setData: vi.fn((incoming: Record<string, unknown>) => {
            Object.assign(data, incoming);
        }),
        reset: vi.fn(),
        validate: vi.fn().mockResolvedValue(true),
        submit: vi.fn().mockResolvedValue({ ...data }),
        get isDirty() {
            return vm.isDirty;
        },
        get isValid() {
            return vm.isValid;
        },
        get errors() {
            return vm.errors;
        },
        get vm() {
            return vm;
        }
    } as unknown as IFormModel;
}

function createMockFormModelFactory(): FormModelFactory.Interface {
    const mockForm = createMockFormModel();
    return {
        create: vi.fn().mockReturnValue(mockForm)
    };
}

function createMockGetFileUseCase(): GetFileUseCase.Interface {
    return {
        execute: vi.fn().mockResolvedValue({ success: true, file: createTestFile() })
    };
}

function createMockUpdateFileUseCase(): UpdateFileUseCase.Interface {
    return {
        execute: vi.fn().mockResolvedValue({ success: true, file: createTestFile() })
    };
}

function createMockDeleteFileUseCase(): DeleteFileUseCase.Interface {
    return {
        execute: vi.fn().mockResolvedValue({ success: true })
    };
}

function createMockPermissions(): FileManagerPermissions.Interface {
    return {
        canAccess: vi.fn().mockReturnValue(true),
        canRead: vi.fn().mockReturnValue(true),
        canCreate: vi.fn().mockReturnValue(true),
        canEdit: vi.fn().mockReturnValue(true),
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
        settings: {
            uploadMinFileSize: "0",
            uploadMaxFileSize: "10485760",
            srcPrefix: "https://cdn.example.com/"
        }
    };
}

function createTestFile(overrides?: Partial<FmFile>): FmFile {
    return {
        id: "file-1",
        name: "photo.jpg",
        key: "files/photo.jpg",
        src: "https://cdn.example.com/files/photo.jpg",
        type: "image/jpeg",
        size: 12345,
        metadata: {},
        tags: ["nature", "landscape"],
        createdOn: "2025-01-01T00:00:00Z",
        savedOn: "2025-01-01T00:00:00Z",
        createdBy: { id: "user-1", displayName: "Test User", type: "admin" },
        savedBy: { id: "user-1", displayName: "Test User", type: "admin" },
        location: { folderId: "root" },
        accessControl: { type: "public" },
        ...overrides
    };
}

// ---------------------------------------------------------------------------
// Container setup
// ---------------------------------------------------------------------------

interface Mocks {
    getFileUseCase: GetFileUseCase.Interface;
    updateFileUseCase: UpdateFileUseCase.Interface;
    deleteFileUseCase: DeleteFileUseCase.Interface;
    formModelFactory: FormModelFactory.Interface;
    permissions: FileManagerPermissions.Interface;
    settingsRepository: GetSettingsRepository.Interface;
}

function createMocks(): Mocks {
    return {
        getFileUseCase: createMockGetFileUseCase(),
        updateFileUseCase: createMockUpdateFileUseCase(),
        deleteFileUseCase: createMockDeleteFileUseCase(),
        formModelFactory: createMockFormModelFactory(),
        permissions: createMockPermissions(),
        settingsRepository: createMockSettingsRepository()
    };
}

function createContainer(mocks: Mocks) {
    const container = new Container();

    container.registerInstance(GetFileUseCase, mocks.getFileUseCase);
    container.registerInstance(UpdateFileUseCase, mocks.updateFileUseCase);
    container.registerInstance(DeleteFileUseCase, mocks.deleteFileUseCase);
    container.registerInstance(FormModelFactory, mocks.formModelFactory);
    container.registerInstance(FileManagerPermissions, mocks.permissions);
    container.registerInstance(GetSettingsRepository, mocks.settingsRepository);

    // Register the real FileDetailsPresenter implementation.
    container.register(FileDetailsPresenter).inSingletonScope();

    return container;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FileDetailsPresenter", () => {
    let mocks: Mocks;
    let presenter: IFileDetailsPresenter;

    beforeEach(() => {
        mocks = createMocks();
        const container = createContainer(mocks);
        presenter = container.resolve(Abstraction);
    });

    // -----------------------------------------------------------------------
    // Initial state.
    // -----------------------------------------------------------------------

    it("should have null file and loading=null before loadFile is called", () => {
        expect(presenter.vm.file).toBeNull();
        expect(presenter.vm.loading).toBeNull();
    });

    it("should have a form vm with layout and isDirty=false initially", () => {
        expect(presenter.vm.form).toBeDefined();
        expect(presenter.vm.form.layout).toBeDefined();
        expect(presenter.vm.form.isDirty).toBe(false);
    });

    it("should have null previewUrl when no file is loaded", () => {
        expect(presenter.vm.previewUrl).toBeNull();
    });

    // -----------------------------------------------------------------------
    // loadFile populates vm with file data and FormModel.
    // -----------------------------------------------------------------------

    it("should populate vm.file after loadFile", async () => {
        await presenter.loadFile("file-1");

        expect(presenter.vm.file).not.toBeNull();
        expect(presenter.vm.file!.id).toBe("file-1");
        expect(presenter.vm.file!.name).toBe("photo.jpg");
    });

    it("should set loading=null after loadFile completes", async () => {
        await presenter.loadFile("file-1");

        expect(presenter.vm.loading).toBeNull();
    });

    it("should call GetFileUseCase.execute with the file id", async () => {
        await presenter.loadFile("file-1");

        expect(mocks.getFileUseCase.execute).toHaveBeenCalledWith({ id: "file-1" });
    });

    it("should rebuild the form and call setData after loadFile", async () => {
        await presenter.loadFile("file-1");

        // FormModelFactory.create should be called twice: once in constructor, once in loadFile.
        expect(mocks.formModelFactory.create).toHaveBeenCalledTimes(2);
    });

    it("should have form.isDirty=false after loadFile", async () => {
        await presenter.loadFile("file-1");

        expect(presenter.vm.form.isDirty).toBe(false);
    });

    // -----------------------------------------------------------------------
    // Form submission triggers UpdateFileUseCase.
    // -----------------------------------------------------------------------

    it("should call UpdateFileUseCase.execute when saveFile is called", async () => {
        await presenter.loadFile("file-1");

        // Mock the form submit to return data.
        const mockForm = (mocks.formModelFactory.create as ReturnType<typeof vi.fn>).mock.results[1]
            .value as IFormModel;
        (mockForm.submit as ReturnType<typeof vi.fn>).mockResolvedValue({
            name: "updated.jpg",
            tags: ["updated"],
            accessControl: "private-authenticated"
        });

        await presenter.saveFile();

        expect(mocks.updateFileUseCase.execute).toHaveBeenCalledWith({
            id: "file-1",
            data: {
                name: "updated.jpg",
                tags: ["updated"],
                accessControl: { type: "private-authenticated" }
            }
        });
    });

    it("should not call UpdateFileUseCase when no file is loaded", async () => {
        await presenter.saveFile();

        expect(mocks.updateFileUseCase.execute).not.toHaveBeenCalled();
    });

    it("should not call UpdateFileUseCase when form submit returns false", async () => {
        await presenter.loadFile("file-1");

        // Mock the form submit to return false (validation failure).
        const mockForm = (mocks.formModelFactory.create as ReturnType<typeof vi.fn>).mock.results[1]
            .value as IFormModel;
        (mockForm.submit as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        await presenter.saveFile();

        expect(mocks.updateFileUseCase.execute).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Permission flags control action visibility.
    // -----------------------------------------------------------------------

    it("should expose permission flags in vm.permissions", () => {
        expect(presenter.vm.permissions.canEdit).toBe(true);
        expect(presenter.vm.permissions.canDelete).toBe(false);
    });

    it("should reflect updated permission mock values", () => {
        // Override permissions to both false.
        (mocks.permissions.canEdit as ReturnType<typeof vi.fn>).mockReturnValue(false);
        (mocks.permissions.canDelete as ReturnType<typeof vi.fn>).mockReturnValue(true);

        expect(presenter.vm.permissions.canEdit).toBe(false);
        expect(presenter.vm.permissions.canDelete).toBe(true);
    });

    // -----------------------------------------------------------------------
    // previewUrl construction from srcPrefix + key.
    // -----------------------------------------------------------------------

    it("should construct previewUrl from srcPrefix + file.key after loadFile", async () => {
        await presenter.loadFile("file-1");

        expect(presenter.vm.previewUrl).toBe("https://cdn.example.com/files/photo.jpg");
    });

    it("should return null previewUrl when file has no key", async () => {
        (mocks.getFileUseCase.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: true,
            file: createTestFile({ key: undefined })
        });

        await presenter.loadFile("file-1");

        expect(presenter.vm.previewUrl).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Loading state transitions.
    // -----------------------------------------------------------------------

    it("should set loading=true during loadFile and false after", async () => {
        // Capture loading state during execution.
        let loadingDuringExecution: string | null = null;

        (mocks.getFileUseCase.execute as ReturnType<typeof vi.fn>).mockImplementation(async () => {
            loadingDuringExecution = presenter.vm.loading;
            return { success: true, file: createTestFile() };
        });

        await presenter.loadFile("file-1");

        expect(loadingDuringExecution).toBe("Loading file...");
        expect(presenter.vm.loading).toBeNull();
    });
});
