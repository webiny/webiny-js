import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { StoreFileUseCase as UseCaseAbstraction } from "./abstractions.js";
import {
    FileAlreadyExistsError,
    FileNotAuthorizedError,
    FilePersistenceError,
    InvalidFileKeyError,
    InvalidFileSizeError
} from "~/domain/file/errors.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { CreateFileUseCase } from "~/features/file/CreateFile/abstractions.js";
import { GetFileRepository } from "~/features/file/GetFile/abstractions.js";
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
import { FileContentsStorage } from "~/features/file/FileContentsStorage/abstractions.js";
import { FileNormalizer } from "~/features/upload/utils/FileNormalizer.js";
import {
    createModifierFromPlugins,
    FileUploadModifier
} from "~/features/upload/utils/FileUploadModifier.js";
import type { FileData } from "~/features/upload/types.js";

class StoreFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private getFileRepository: GetFileRepository.Interface,
        private createFile: CreateFileUseCase.Interface,
        private storage: FileContentsStorage.Interface,
        private fileUrlGenerator: FileUrlGenerator.Interface,
        private modifiers: FileUploadModifier.Interface[],
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCaseAbstraction.Input): UseCaseAbstraction.Return {
        if (!(await this.permissions.canCreate("file"))) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Read the input once: changes the caller makes after this point don't apply.
        const contents = input.getContents();
        const size = contents.byteLength;
        const id = input.getId();

        const sizeResult = await this.validateSize(size);
        if (sizeResult.isFail()) {
            return Result.fail(sizeResult.error);
        }

        const normalized = await this.normalize({
            id,
            name: input.getName(),
            type: input.getType(),
            size
        });
        if (normalized.isFail()) {
            return Result.fail(normalized.error);
        }
        const { key, name, type } = normalized.value;

        // A stable ID that's already taken fails here, before anything is written.
        if (id) {
            const existing = await this.getFileRepository.execute(normalized.value.id);
            if (existing.isOk()) {
                return Result.fail(new FileAlreadyExistsError({ key: existing.value.key }));
            }
            if (existing.error.code !== "FileManager/File/NotFoundError") {
                return Result.fail(existing.error);
            }
        }

        // The write never overwrites: when two calls race for the same key, the second one fails
        // here with `alreadyExists`. So the bytes deleted below are always the ones this call wrote.
        const putResult = await this.storage.put({ key, contents, contentType: type });
        if (putResult.isFail()) {
            return Result.fail(putResult.error);
        }

        const createResult = await this.createFile.execute({
            id: normalized.value.id,
            key,
            name,
            size,
            type,
            tags: input.getTags(),
            description: input.getDescription(),
            metadata: input.getMetadata(),
            location: { folderId: input.getFolderId() }
        });

        if (createResult.isFail()) {
            await this.deleteStoredContents(key);
            return Result.fail(createResult.error);
        }

        const file = createResult.value;
        const url = await this.fileUrlGenerator.generateUrl(file);

        return Result.ok({ file, url });
    }

    private async validateSize(size: number): Promise<Result<void, InvalidFileSizeError>> {
        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.ok();
        }

        const { uploadMinFileSize, uploadMaxFileSize } = settingsResult.value;
        if (size < uploadMinFileSize || size > uploadMaxFileSize) {
            return Result.fail(
                new InvalidFileSizeError({
                    size,
                    minSize: uploadMinFileSize,
                    maxSize: uploadMaxFileSize
                })
            );
        }

        return Result.ok();
    }

    /**
     * Builds the ID and key the same way an upload does, with the registered upload modifiers.
     */
    private async normalize(data: {
        id?: string;
        name: string;
        type: string;
        size: number;
    }): Promise<Result<FileData, InvalidFileKeyError | FilePersistenceError>> {
        const normalizer = new FileNormalizer(createModifierFromPlugins(this.modifiers));

        try {
            return Result.ok(await normalizer.normalizeFile(data));
        } catch (error) {
            if (error instanceof InvalidFileKeyError) {
                return Result.fail(error);
            }
            return Result.fail(
                new FilePersistenceError(error instanceof Error ? error : new Error(String(error)))
            );
        }
    }

    private async deleteStoredContents(key: string): Promise<void> {
        try {
            const result = await this.storage.delete(key);
            if (result.isFail()) {
                this.logger.error(
                    { error: result.error, key },
                    "Could not delete the contents of a file whose record wasn't created."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, key },
                "Could not delete the contents of a file whose record wasn't created."
            );
        }
    }
}

export const StoreFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreFileUseCaseImpl,
    dependencies: [
        FmPermissions,
        GetSettingsUseCase,
        GetFileRepository,
        CreateFileUseCase,
        FileContentsStorage,
        FileUrlGenerator,
        [FileUploadModifier, { multiple: true }],
        Logger
    ]
});
