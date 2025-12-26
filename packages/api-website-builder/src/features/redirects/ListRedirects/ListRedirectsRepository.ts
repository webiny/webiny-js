import { Result } from "@webiny/feature/api";
import { ListRedirectsRepository as RepositoryAbstraction } from "./abstractions.js";
import { RedirectModel } from "~/domain/redirect/abstractions.js";
import { RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

class ListRedirectsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModel: RedirectModel.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const result = await this.listEntries.execute(this.redirectModel, params);

        if (result.isFail()) {
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        const { entries, meta } = result.value;
        const redirects = entries.map(entry => EntryToRedirectMapper.toRedirect(entry));

        return Result.ok({ redirects, meta });
    }
}

export const ListRedirectsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRedirectsRepositoryImpl,
    dependencies: [RedirectModel, ListLatestEntriesUseCase]
});
