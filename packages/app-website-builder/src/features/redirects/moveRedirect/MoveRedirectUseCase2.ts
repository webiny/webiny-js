import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";
import {
    MoveRedirectUseCase as UseCaseAbstraction,
    MoveRedirectGateway,
    type MoveRedirectParams
} from "./abstractions.js";

class MoveRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private gateway: MoveRedirectGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: MoveRedirectParams): Promise<void> {
        await this.gateway.execute(params);
        this.cache.removeItems(r => r.id === params.id);
    }
}

export const MoveRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: MoveRedirectUseCaseImpl,
    dependencies: [MoveRedirectGateway, RedirectsListCache]
});
