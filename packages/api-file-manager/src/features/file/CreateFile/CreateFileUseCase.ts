import { Result } from "@webiny/feature/api";
import {
    CreateFileUseCase as UseCaseAbstraction,
    CreateFileInput,
    CreateFileRepository
} from "./abstractions.js";
import { GetSettingsUseCase } from "../../settings/GetSettings/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { File, FileInput } from "~/domain/file/types.js";
import { FileNotAuthorizedError, InvalidFileSizeError } from "~/domain/file/errors.js";
import { FileBeforeCreateEvent, FileAfterCreateEvent } from "./events.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Identity } from "~/domain/identity/Identity.js";

class CreateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: FmPermissions.Interface,
        private repository: CreateFileRepository.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(
        input: CreateFileInput,
        meta?: Record<string, any>
    ): Promise<Result<File, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canCreate("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const validationResult = await this.validateInput(input);
        if (validationResult.isFail()) {
            return Result.fail(validationResult.error);
        }

        const [id] = input.key.split("/");
        const currentIdentity = this.identityContext.getIdentity();

        // Attribution and dates come from the server. Only full access, or code running without
        // authorization (imports, migrations), may set them.
        const systemInput: Partial<CreateFileInput> =
            !this.identityContext.isAuthorizationEnabled() ||
            (await this.identityContext.hasFullAccess())
                ? input
                : {};

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
            description: input.description ?? "",
            extensions: meta || {},
            // system attributes
            createdOn: systemInput.createdOn,
            modifiedOn: systemInput.modifiedOn,
            savedOn: systemInput.savedOn,
            createdBy: systemInput.createdBy
                ? Identity.from(systemInput.createdBy)
                : Identity.from(currentIdentity),
            modifiedBy: systemInput.modifiedBy ? Identity.from(systemInput.modifiedBy) : undefined,
            savedBy: systemInput.savedBy
                ? Identity.from(systemInput.savedBy)
                : Identity.from(currentIdentity)
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
        FmPermissions,
        CreateFileRepository,
        GetSettingsUseCase,
        EventPublisher
    ]
});
