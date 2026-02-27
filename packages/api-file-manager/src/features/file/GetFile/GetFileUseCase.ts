import { Result } from "@webiny/feature/api";
import { GetFileUseCase as UseCaseAbstraction, GetFileRepository } from "./abstractions.js";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FmPermissions } from "~/features/shared/abstractions.js";

class GetFileUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private repository: GetFileRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<File, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canRead("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const result = await this.repository.execute(id);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const file = result.value;

        if (!(await this.permissions.canAccess("file", file))) {
            return Result.fail(new FileNotAuthorizedError());
        }

        return Result.ok(file);
    }
}

export const GetFileUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFileUseCaseImpl,
    dependencies: [FmPermissions.Abstraction, GetFileRepository]
});
