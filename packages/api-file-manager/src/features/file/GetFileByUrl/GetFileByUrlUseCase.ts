import { Result } from "@webiny/feature/api";
import { GetFileByUrlUseCase as Abstraction } from "./abstractions.js";
import { ListFilesUseCase } from "~/features/file/ListFiles/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import type { File } from "~/domain/file/types.js";

class GetFileByUrlUseCaseImpl implements Abstraction.Interface {
    public constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly listFiles: ListFilesUseCase.Interface
    ) {}

    public async execute(url: string): Promise<Result<File | undefined, Abstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const { pathname } = new URL(url);
        const query = pathname.replace("/files/", "").replace("/private/", "");

        const filesResult = await this.listFiles.execute({
            where: { key: query },
            limit: 1
        });

        if (filesResult.isFail()) {
            return Result.fail(filesResult.error);
        }

        const files = filesResult.value.items;
        const file = files.length ? files[0] : undefined;

        return Result.ok(file);
    }
}

export const GetFileByUrlUseCase = Abstraction.createImplementation({
    implementation: GetFileByUrlUseCaseImpl,
    dependencies: [IdentityContext, ListFilesUseCase]
});
