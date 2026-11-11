import { Result } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    GetUserEntryAccessUseCase as UseCaseAbstraction,
    GetUserFolderAccessUseCase
} from "./abstractions.js";
import { mayAskAboutUser } from "./mayAskAboutUser.js";

class GetUserEntryAccessUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdUseCase.Interface,
        private getUserFolderAccess: GetUserFolderAccessUseCase.Interface
    ) {}

    async execute({
        userId,
        model,
        entryId
    }: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Checked before reading the entry, so a refused caller learns nothing about it.
        if (!(await mayAskAboutUser(this.identityContext, userId))) {
            return Result.fail(new NotAuthorizedError());
        }
        // The entry is read whoever asks: the answer is about the user, not the caller.
        const result = await this.identityContext.withoutAuthorization(() =>
            this.getLatestRevision.execute(model, { id: entryId })
        );
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        const folderId = result.value.location?.folderId ?? null;
        return this.getUserFolderAccess.execute({ userId, folderId });
    }
}

export const GetUserEntryAccessUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetUserEntryAccessUseCaseImpl,
    dependencies: [IdentityContext, GetLatestRevisionByEntryIdUseCase, GetUserFolderAccessUseCase]
});
