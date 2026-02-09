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
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Identity } from "~/domain/identity/Identity.js";

class CreateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
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
        const currentIdentity = this.identityContext.getIdentity();

        // Prepare file input
        const fileInput: FileInput = {
            id: input.id || id,
            key: input.key,
            name: input.name,
            size: input.size,
            type: input.type,
            metadata: input.metadata || {},
            location: input.location || { folderId: "root" },
            tags: input.tags || [],
            extensions: meta || {},
            // system attributes
            createdOn: input.createdOn,
            modifiedOn: input.modifiedOn,
            savedOn: input.savedOn,
            createdBy: input.createdBy
                ? Identity.from(input.createdBy)
                : Identity.from(currentIdentity),
            modifiedBy: input.modifiedBy ? Identity.from(input.modifiedBy) : undefined,
            savedBy: input.savedBy ? Identity.from(input.savedBy) : Identity.from(currentIdentity)
        };

        await this.eventPublisher.publish(new FileBeforeCreateEvent({ file: fileInput, meta }));

        const result = await this.repository.execute(fileInput);

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

        if (settingsResult.isFail()) {
            return Result.ok();
        }

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
    dependencies: [
        IdentityContext,
        FilePermissions,
        CreateFileRepository,
        GetSettingsUseCase,
        EventPublisher
    ]
});
