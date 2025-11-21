import { Result } from "@webiny/feature/api";
import {
    GetFileUseCase as UseCaseAbstraction,
    GetFileInput,
    GetFileRepository
} from "./abstractions.js";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FilePermissions } from "~/features/shared/abstractions.js";

class GetFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private filePermissions: FilePermissions.Interface,
        private repository: GetFileRepository.Interface
    ) {}

    async execute(input: GetFileInput): Promise<Result<File, UseCaseAbstraction.Error>> {
        // Check read permission
        const hasPermission = await this.filePermissions.ensure({ rwd: "r" });
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const result = await this.repository.getById(input.id);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const file = result.value;

        // Check ownership permission
        const hasOwnershipPermission = await this.filePermissions.ensure({ owns: file.createdBy });
        if (!hasOwnershipPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        return Result.ok(file);
    }
}

export const GetFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFileUseCaseImpl,
    dependencies: [FilePermissions, GetFileRepository]
});
