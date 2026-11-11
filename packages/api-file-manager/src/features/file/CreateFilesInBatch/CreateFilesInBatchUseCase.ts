import { Result } from "@webiny/feature/api";
import {
    CreateFilesInBatchUseCase as UseCaseAbstraction,
    CreateFilesInBatchInput,
    CreateFilesInBatchRepository
} from "./abstractions.js";
import { GetSettingsUseCase } from "../../settings/GetSettings/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { File, FileInput } from "~/domain/file/types.js";
import {
    FileNotAuthorizedError,
    InvalidFileKeyError,
    InvalidFileSizeError
} from "~/domain/file/errors.js";
import { FileBeforeBatchCreateEvent, FileAfterBatchCreateEvent } from "./events.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { CreateFileInput } from "~/features/file/CreateFile/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { isValidFileKey } from "~/features/file/shared/isValidFileKey.js";

class CreateFilesInBatchUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
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

        // Security: each key must point at its own file's upload. Imports and migrations
        // (running without authorization) may register any key.
        if (this.identityContext.isAuthorizationEnabled()) {
            for (const file of input.files) {
                const fileId = file.id || file.key.split("/")[0];
                if (!isValidFileKey(fileId, file.key)) {
                    return Result.fail(new InvalidFileKeyError({ id: fileId, key: file.key }));
                }
            }
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
    dependencies: [
        IdentityContext,
        FmPermissions,
        CreateFilesInBatchRepository,
        GetSettingsUseCase,
        EventPublisher
    ]
});
