import { Result } from "@webiny/feature/api";
import {
    CreateFilesInBatchUseCase as UseCaseAbstraction,
    CreateFilesInBatchInput,
    CreateFilesInBatchRepository
} from "./abstractions.js";
import { GetSettingsUseCase } from "../../settings/GetSettings/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { File, FileInput } from "~/domain/file/types.js";
import { FileNotAuthorizedError, InvalidFileSizeError } from "~/domain/file/errors.js";
import { FileBeforeBatchCreateEvent, FileAfterBatchCreateEvent } from "./events.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { CreateFileInput } from "~/features/file/CreateFile/abstractions.js";

class CreateFilesInBatchUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private permissions: FmPermissions.Interface,
        private repository: CreateFilesInBatchRepository.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    public async execute(
        input: CreateFilesInBatchInput
    ): Promise<Result<File[], UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canCreate("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Validate all files
        const validationResult = await this.validateInput(input.files);
        if (validationResult.isFail()) {
            return Result.fail(validationResult.error);
        }

        // Prepare file inputs with defaults
        const fileInputs: FileInput[] = input.files.map(file => {
            const [id] = file.key.split("/");
            return {
                id: file.id || id,
                key: file.key,
                name: file.name,
                size: file.size,
                type: file.type,
                metadata: file.metadata || {},
                location: file.location || { folderId: "root" },
                tags: file.tags || [],
                extensions: input.meta || {}
            };
        });

        await this.eventPublisher.publish(
            new FileBeforeBatchCreateEvent({ files: fileInputs, meta: input.meta })
        );

        const result = await this.repository.createBatch(fileInputs);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new FileAfterBatchCreateEvent({ files: result.value, meta: input.meta })
        );

        return Result.ok(result.value);
    }

    private async validateInput(
        files: CreateFileInput[]
    ): Promise<Result<void, InvalidFileSizeError>> {
        const settingsResult = await this.getSettings.execute();

        if (settingsResult.isFail()) {
            return Result.ok();
        }

        const settings = settingsResult.value;

        if (settings) {
            for (const input of files) {
                // Validate file size
                if (
                    input.size < settings.uploadMinFileSize ||
                    input.size > settings.uploadMaxFileSize
                ) {
                    return Result.fail(
                        new InvalidFileSizeError({
                            size: input.size,
                            minSize: settings.uploadMinFileSize,
                            maxSize: settings.uploadMaxFileSize
                        })
                    );
                }
            }
        }

        return Result.ok();
    }
}

export const CreateFilesInBatchUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateFilesInBatchUseCaseImpl,
    dependencies: [FmPermissions, CreateFilesInBatchRepository, GetSettingsUseCase, EventPublisher]
});
