import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListTenantLinksByType } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByTypeInput, TenantLink } from "../shared/types.js";

export class ListTenantLinksByTypeUseCase implements ListTenantLinksByType.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute<TLink extends TenantLink = TenantLink>(
        input: ListTenantLinksByTypeInput
    ): Promise<Result<TLink[], ListTenantLinksByType.Error>> {
        return this.repository.listByType<TLink>(input);
    }
}

export const ListTenantLinksByTypeUseCaseImpl = createImplementation({
    abstraction: ListTenantLinksByType,
    implementation: ListTenantLinksByTypeUseCase,
    dependencies: [TenantLinksRepository]
});
