import { Result } from "@webiny/feature/api";
import {
    CreateFileUseCase as UseCaseAbstraction,
    CreateFileInput,
    CreateFileRepository
} from "./abstractions.js";
import { GetSettingsUseCase } from "../../settings/GetSettings/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import type { File, FileInput } from "~/domain/file/types.js";
import { FileNotAuthorizedError, InvalidFileSizeError } from "~/domain/file/errors.js";
import { FileBeforeCreateEvent, FileAfterCreateEvent } from "./events.js";
import { FilePermissions } from "~/features/shared/abstractions.js";

class CreateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private filePermissions: FilePermissions.Interface,
        private repository: CreateFileRepository.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        input: CreateFileInput,
        meta?: Record<string, any>
    ): Promise<Result<File, UseCaseAbstraction.Error>> {
        const hasPermission = await this.filePermissions.ensure({ rwd: "w" });
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const validationResult = await this.validateInput(input);
        if (validationResult.isFail()) {
            return Result.fail(validationResult.error);
        }

        const [id] = input.key.split("/");

        // Prepare file input
        const fileInput: FileInput = {
            id: input.id || id,
            key: input.key,
            name: input.name,
            size: input.size,
            type: input.type,
            meta: input.meta || {},
            location: input.location || { folderId: "root" },
            tags: input.tags || [],
            aliases: input.aliases || [],
            extensions: meta || {}
        };

        await this.eventPublisher.publish(new FileBeforeCreateEvent({ file: fileInput, meta }));

        const result = await this.repository.create(fileInput);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new FileAfterCreateEvent({ file: result.value, meta }));

        return Result.ok(result.value);
    }

    private async validateInput(
        input: CreateFileInput
    ): Promise<Result<void, InvalidFileSizeError>> {
        const settingsResult = await this.getSettings.execute();

        const settings = settingsResult.value;

        if (settings) {
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

        return Result.ok();
    }
}

export const CreateFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateFileUseCaseImpl,
    dependencies: [FilePermissions, CreateFileRepository, GetSettingsUseCase, EventPublisher]
});
