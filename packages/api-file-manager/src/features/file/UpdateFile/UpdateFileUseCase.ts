import { Result } from "@webiny/feature/api";
import {
    UpdateFileUseCase as UseCaseAbstraction,
    UpdateFileInput,
    UpdateFileRepository
} from "./abstractions.js";
import { GetFileUseCase } from "../GetFile/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FileBeforeUpdateEvent, FileAfterUpdateEvent } from "./events.js";
import { FilePermissions } from "~/features/shared/abstractions.js";

class UpdateFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private filePermissions: FilePermissions.Interface,
        private getFile: GetFileUseCase.Interface,
        private repository: UpdateFileRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UpdateFileInput): Promise<Result<File, UseCaseAbstraction.Error>> {
        // Check write permission
        const hasPermission = await this.filePermissions.ensure({ rwd: "w" });
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Get original file (includes ownership check)
        const getResult = await this.getFile.execute({ id: input.id });
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const original = getResult.value;

        // Build updated file for event
        const file: File = {
            ...original,
            ...input,
            // Preserve immutable fields
            id: original.id,
            key: original.key,
            size: original.size,
            type: original.type,
            createdOn: original.createdOn,
            createdBy: original.createdBy,
            // Update mutable fields
            tags: input.tags !== undefined ? input.tags : original.tags,
            aliases: input.aliases !== undefined ? input.aliases : original.aliases,
            location: input.location !== undefined ? input.location : original.location
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
    dependencies: [FilePermissions, GetFileUseCase, UpdateFileRepository, EventPublisher]
});
