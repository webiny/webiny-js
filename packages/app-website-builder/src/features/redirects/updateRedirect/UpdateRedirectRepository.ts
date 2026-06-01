import { runInAction } from "mobx";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    UpdateRedirectRepository as RepositoryAbstraction,
    UpdateRedirectGateway,
    type UpdateRedirectParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class UpdateRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: UpdateRedirectParams): Promise<Redirect> {
        const updated = await this.gateway.execute(params);

        runInAction(() => {
            this.cache.updateItems(existing => {
                if (existing.id === params.id) {
                    return updated;
                }
                return existing;
            });
        });

        return updated;
    }
}

export const UpdateRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRedirectRepositoryImpl,
    dependencies: [UpdateRedirectGateway, RedirectsListCache]
});
