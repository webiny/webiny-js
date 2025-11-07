import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DeleteTenantLinks } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { DeleteTenantLinkInput } from "../shared/types.js";

export class DeleteTenantLinksUseCase implements DeleteTenantLinks.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute(inputs: DeleteTenantLinkInput[]): Promise<Result<void, DeleteTenantLinks.Error>> {
        return this.repository.deleteBatch(inputs);
    }
}

export const DeleteTenantLinksUseCaseImpl = createImplementation({
    abstraction: DeleteTenantLinks,
    implementation: DeleteTenantLinksUseCase,
    dependencies: [TenantLinksRepository]
});
