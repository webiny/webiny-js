import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListTenantLinksByTenant } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByTenantInput, TenantLink } from "../shared/types.js";

export class ListTenantLinksByTenantUseCase implements ListTenantLinksByTenant.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute(
        input: ListTenantLinksByTenantInput
    ): Promise<Result<TenantLink[], ListTenantLinksByTenant.Error>> {
        return this.repository.listByTenant(input);
    }
}

export const ListTenantLinksByTenantUseCaseImpl = createImplementation({
    abstraction: ListTenantLinksByTenant,
    implementation: ListTenantLinksByTenantUseCase,
    dependencies: [TenantLinksRepository]
});
