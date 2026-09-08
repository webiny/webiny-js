import { Result } from "@webiny/feature/api";
import { ListRedirectsRepository as RepositoryAbstraction } from "./abstractions.js";
import { type CmsEntryWbRedirect, RedirectModelProvider } from "~/domain/redirect/abstractions.js";
import { RedirectPersistenceError } from "~/domain/redirect/errors.js";
import { EntryToRedirectMapper } from "~/domain/redirect/EntryToRedirectMapper.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";

class ListRedirectsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private redirectModelProvider: RedirectModelProvider.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private cmsSortMapper: CmsSortMapper.Interface
    ) {}

    async execute(params: RepositoryAbstraction.Params): RepositoryAbstraction.Return {
        const redirectModel = await this.redirectModelProvider.get();
        const result = await this.listEntries.execute<CmsEntryWbRedirect>(redirectModel, {
            ...params,
            sort: this.cmsSortMapper.map({
                input: params.sort,
                fields: redirectModel.fields
            }),
            where: this.cmsWhereMapper.map({
                input: params.where,
                fields: redirectModel.fields
            })
        });

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
    dependencies: [RedirectModelProvider, ListLatestEntriesUseCase, CmsWhereMapper, CmsSortMapper]
});
