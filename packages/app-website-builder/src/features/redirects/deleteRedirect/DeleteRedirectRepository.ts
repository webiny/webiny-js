import { runInAction } from "mobx";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    DeleteRedirectRepository as RepositoryAbstraction,
    DeleteRedirectGateway,
    type DeleteRedirectParams
} from "./abstractions.js";

class DeleteRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: DeleteRedirectParams): Promise<void> {
        await this.gateway.execute(params);

        runInAction(() => {
            this.cache.removeItems(r => r.id === params.id);
        });
    }
}

export const DeleteRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteRedirectRepositoryImpl,
    dependencies: [DeleteRedirectGateway, RedirectsListCache]
});
