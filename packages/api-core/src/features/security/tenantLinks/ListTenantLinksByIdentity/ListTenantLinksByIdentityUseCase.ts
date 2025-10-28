import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListTenantLinksByIdentity } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByIdentityInput, TenantLink } from "../shared/types.js";

export class ListTenantLinksByIdentityUseCase implements ListTenantLinksByIdentity.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute(
        input: ListTenantLinksByIdentityInput
    ): Promise<Result<TenantLink[], ListTenantLinksByIdentity.Error>> {
        return this.repository.listByIdentity(input);
    }
}

export const ListTenantLinksByIdentityUseCaseImpl = createImplementation({
    abstraction: ListTenantLinksByIdentity,
    implementation: ListTenantLinksByIdentityUseCase,
    dependencies: [TenantLinksRepository]
});
