import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UpdateTenantLinks } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { UpdateTenantLinkInput } from "../shared/types.js";

export class UpdateTenantLinksUseCase implements UpdateTenantLinks.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute(inputs: UpdateTenantLinkInput[]): Promise<Result<void, UpdateTenantLinks.Error>> {
        return this.repository.updateBatch(inputs);
    }
}

export const UpdateTenantLinksUseCaseImpl = createImplementation({
    abstraction: UpdateTenantLinks,
    implementation: UpdateTenantLinksUseCase,
    dependencies: [TenantLinksRepository]
});
