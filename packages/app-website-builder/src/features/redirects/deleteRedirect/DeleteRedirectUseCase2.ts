import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    DeleteRedirectUseCase as UseCaseAbstraction,
    DeleteRedirectGateway,
    type DeleteRedirectParams
} from "./abstractions.js";

class DeleteRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private gateway: DeleteRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: DeleteRedirectParams): Promise<void> {
        await this.gateway.execute(params);
        this.cache.removeItems(r => r.id === params.id);
    }
}

export const DeleteRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteRedirectUseCaseImpl,
    dependencies: [DeleteRedirectGateway, RedirectsListCache]
});
