import { runInAction } from "mobx";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    MoveRedirectRepository as RepositoryAbstraction,
    MoveRedirectGateway,
    type MoveRedirectParams
} from "./abstractions.js";

class MoveRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: MoveRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: MoveRedirectParams): Promise<void> {
        await this.gateway.execute(params);

        runInAction(() => {
            this.cache.removeItems(r => r.id === params.id);
        });
    }
}

export const MoveRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveRedirectRepositoryImpl,
    dependencies: [MoveRedirectGateway, RedirectsListCache]
});
