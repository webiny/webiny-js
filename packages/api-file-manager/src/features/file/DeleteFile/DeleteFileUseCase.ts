import { Result } from "@webiny/feature/api";
import {
    DeleteFileUseCase as UseCaseAbstraction,
    DeleteFileInput,
    DeleteFileRepository
} from "./abstractions.js";
import { GetFileUseCase } from "../GetFile/abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FileBeforeDeleteEvent, FileAfterDeleteEvent } from "./events.js";
import { FilePermissions } from "~/features/shared/abstractions.js";

class DeleteFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private filePermissions: FilePermissions.Interface,
        private getFile: GetFileUseCase.Interface,
        private repository: DeleteFileRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: DeleteFileInput): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Check delete permission
        const hasPermission = await this.filePermissions.ensure({ rwd: "d" });
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Get file (includes ownership check)
        const getResult = await this.getFile.execute({ id: input.id });
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
    dependencies: [FilePermissions, GetFileUseCase, DeleteFileRepository, EventPublisher]
});
