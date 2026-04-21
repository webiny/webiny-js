import { Result } from "@webiny/feature/api";
import {
    UpdateFileUseCase as UseCaseAbstraction,
    UpdateFileInput,
    UpdateFileRepository
} from "./abstractions.js";
import { GetFileUseCase } from "../GetFile/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FileBeforeUpdateEvent, FileAfterUpdateEvent } from "./events.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Identity } from "~/domain/identity/Identity.js";

class UpdateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: FmPermissions.Interface,
        private getFile: GetFileUseCase.Interface,
        private repository: UpdateFileRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UpdateFileInput): Promise<Result<File, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canEdit("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Get the original file (includes ownership check).
        const getResult = await this.getFile.execute(input.id);

        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const original = getResult.value;

        // Check ownership-aware edit permission.
        const canEditFile = await this.permissions.canEdit("file", original);
        if (!canEditFile) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const currentIdentity = this.identityContext.getIdentity();

        const file: File = {
            ...original,
            ...input,
            // Preserve immutable fields.
            id: original.id,
            key: original.key,
            size: original.size,
            type: original.type,
            // Update mutable fields.
            tags: input.tags !== undefined ? input.tags : original.tags,
            description: input.description !== undefined ? input.description : original.description,
            location: input.location !== undefined ? input.location : original.location,
            // System fields.
            createdOn: input.createdOn ?? original.createdOn,
            modifiedOn: input.modifiedOn ?? undefined,
            savedOn: input.savedOn ?? original.savedOn,
            createdBy: input.createdBy ? Identity.from(input.createdBy) : original.createdBy,
            modifiedBy: input.modifiedBy
                ? Identity.from(input.modifiedBy)
                : Identity.from(currentIdentity),
            savedBy: input.savedBy ? Identity.from(input.savedBy) : Identity.from(currentIdentity)
        };

        await this.eventPublisher.publish(new FileBeforeUpdateEvent({ original, file, input }));

        const result = await this.repository.update(file);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new FileAfterUpdateEvent({ original, file, input }));

        return Result.ok(file);
    }
}

export const UpdateFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateFileUseCaseImpl,
    dependencies: [
        IdentityContext,
        FmPermissions,
        GetFileUseCase,
        UpdateFileRepository,
        EventPublisher
    ]
});
