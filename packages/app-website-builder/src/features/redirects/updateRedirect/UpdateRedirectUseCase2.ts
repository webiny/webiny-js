import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    UpdateRedirectUseCase as UseCaseAbstraction,
    UpdateRedirectGateway,
    type UpdateRedirectParams
} from "./abstractions.js";
import type { Redirect } from "~/domain/Redirect/Redirect.js";

class UpdateRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private gateway: UpdateRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: UpdateRedirectParams): Promise<Redirect> {
        const updated = await this.gateway.execute(params);
        this.cache.updateItems(existing => {
            if (existing.id === params.id) {
                return updated;
            }
            return existing;
        });
        return updated;
    }
}

export const UpdateRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateRedirectUseCaseImpl,
    dependencies: [UpdateRedirectGateway, RedirectsListCache]
});
