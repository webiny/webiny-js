import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { CreateTenantLinks } from "./abstractions.js";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { CreateTenantLinkInput } from "../shared/types.js";

export class CreateTenantLinksUseCase implements CreateTenantLinks.Interface {
    private repository: TenantLinksRepository.Interface;

    constructor(repository: TenantLinksRepository.Interface) {
        this.repository = repository;
    }

    async execute(inputs: CreateTenantLinkInput[]): Promise<Result<void, CreateTenantLinks.Error>> {
        console.log("CreateTenantLinks", inputs);
        return this.repository.createBatch(inputs);
    }
}

export const CreateTenantLinksUseCaseImpl = createImplementation({
    abstraction: CreateTenantLinks,
    implementation: CreateTenantLinksUseCase,
    dependencies: [TenantLinksRepository]
});
