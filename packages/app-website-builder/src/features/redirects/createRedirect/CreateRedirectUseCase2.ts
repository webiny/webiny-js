import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    CreateRedirectUseCase as UseCaseAbstraction,
    CreateRedirectGateway,
    type CreateRedirectUseCaseParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class CreateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private gateway: CreateRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: CreateRedirectUseCaseParams): Promise<Redirect> {
        const redirect = await this.gateway.execute(params);
        this.cache.addItems([redirect]);
        return redirect;
    }
}

export const CreateRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRedirectUseCaseImpl,
    dependencies: [CreateRedirectGateway, RedirectsListCache]
});
