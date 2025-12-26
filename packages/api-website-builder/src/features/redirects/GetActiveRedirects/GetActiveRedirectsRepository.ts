import { Result } from "@webiny/feature/api";
import { GetActiveRedirectsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { RedirectPersistenceError } from "~/domain/redirect/errors.js";

class GetActiveRedirectsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private listRedirects: ListRedirectsUseCase.Interface) {}

    async execute(): RepositoryAbstraction.Return {
        const result = await this.listRedirects.execute({
            where: {
                latest: true,
                isEnabled: true
            },
            limit: 10000,
            sort: [],
            after: null
        });

        if (result.isFail()) {
            return Result.fail(new RedirectPersistenceError(result.error));
        }

        return Result.ok(result.value.redirects);
    }
}

export const GetActiveRedirectsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetActiveRedirectsRepositoryImpl,
    dependencies: [ListRedirectsUseCase]
});
