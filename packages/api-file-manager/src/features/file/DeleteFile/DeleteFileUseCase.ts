import { Result } from "@webiny/feature/api";
import { DeleteFileUseCase as UseCaseAbstraction, DeleteFileRepository } from "./abstractions.js";
import { GetFileUseCase } from "../GetFile/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FileBeforeDeleteEvent, FileAfterDeleteEvent } from "./events.js";
import { FmPermissions } from "~/features/shared/abstractions.js";

class DeleteFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private getFile: GetFileUseCase.Interface,
        private repository: DeleteFileRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canDelete("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Get file (includes ownership check)
        const getResult = await this.getFile.execute(id);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const file = getResult.value;

        await this.eventPublisher.publish(new FileBeforeDeleteEvent({ file }));

        const result = await this.repository.delete(file);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new FileAfterDeleteEvent({ file }));

        return Result.ok();
    }
}

export const DeleteFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteFileUseCaseImpl,
    dependencies: [FmPermissions, GetFileUseCase, DeleteFileRepository, EventPublisher]
});
