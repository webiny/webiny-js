import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository as RepositoryAbstraction } from "./abstractions.js";
import type {
    CreateTenantLinkInput,
    UpdateTenantLinkInput,
    DeleteTenantLinkInput,
    ListTenantLinksByTypeInput,
    ListTenantLinksByTenantInput,
    ListTenantLinksByIdentityInput,
    GetTenantLinkByIdentityInput,
    TenantLink
} from "./types.js";
import { SecurityStorageOperations } from "~/features/security/shared/abstractions.js";
import { TenantLinkStorageError } from "./errors.js";

class TenantLinksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private storageOperations: SecurityStorageOperations.Interface) {}

    async createBatch(
        inputs: CreateTenantLinkInput[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createTenantLinks(
                inputs.map(input => ({
                    ...input,
                    createdOn: new Date().toISOString(),
                    webinyVersion: process.env.WEBINY_VERSION as string
                }))
            );
            return Result.ok();
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async updateBatch(
        inputs: UpdateTenantLinkInput[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateTenantLinks(inputs);
            return Result.ok();
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async deleteBatch(
        inputs: DeleteTenantLinkInput[]
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteTenantLinks(inputs);
            return Result.ok();
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async listByType<TLink extends TenantLink = TenantLink>(
        input: ListTenantLinksByTypeInput
    ): Promise<Result<TLink[], RepositoryAbstraction.Error>> {
        try {
            const links = await this.storageOperations.listTenantLinksByType<TLink>(input);
            return Result.ok(links);
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async listByTenant(
        input: ListTenantLinksByTenantInput
    ): Promise<Result<TenantLink[], RepositoryAbstraction.Error>> {
        try {
            const links = await this.storageOperations.listTenantLinksByTenant(input);
            return Result.ok(links);
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async listByIdentity(
        input: ListTenantLinksByIdentityInput
    ): Promise<Result<TenantLink[], RepositoryAbstraction.Error>> {
        try {
            const links = await this.storageOperations.listTenantLinksByIdentity(input);
            return Result.ok(links);
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }

    async getByIdentity<TLink extends TenantLink = TenantLink>(
        input: GetTenantLinkByIdentityInput
    ): Promise<Result<TLink | null, RepositoryAbstraction.Error>> {
        try {
            const link = await this.storageOperations.getTenantLinkByIdentity<TLink>(input);
            return Result.ok(link);
        } catch (error) {
            return Result.fail(new TenantLinkStorageError(error));
        }
    }
}

export const TenantLinksRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: TenantLinksRepositoryImpl,
    dependencies: [SecurityStorageOperations]
});
