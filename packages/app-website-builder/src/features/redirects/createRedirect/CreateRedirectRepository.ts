import { runInAction } from "mobx";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    CreateRedirectRepository as RepositoryAbstraction,
    CreateRedirectGateway,
    type CreateRedirectGatewayParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class CreateRedirectRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: CreateRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: CreateRedirectGatewayParams): Promise<Redirect> {
        const redirect = await this.gateway.execute(params);

        runInAction(() => {
            this.cache.addItems([redirect]);
        });

        return redirect;
    }
}

export const CreateRedirectRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRedirectRepositoryImpl,
    dependencies: [CreateRedirectGateway, RedirectsListCache]
});
