import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetTenantLinkByIdentity } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { GetTenantLinkByIdentityInput, TenantLink } from "../shared/types.js";

export class GetTenantLinkByIdentityUseCase implements GetTenantLinkByIdentity.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute<TLink extends TenantLink = TenantLink>(
        input: GetTenantLinkByIdentityInput
    ): Promise<Result<TLink | null, GetTenantLinkByIdentity.Error>> {
        return this.repository.getByIdentity<TLink>(input);
    }
}

export const GetTenantLinkByIdentityUseCaseImpl = createImplementation({
    abstraction: GetTenantLinkByIdentity,
    implementation: GetTenantLinkByIdentityUseCase,
    dependencies: [TenantLinksRepository]
});
