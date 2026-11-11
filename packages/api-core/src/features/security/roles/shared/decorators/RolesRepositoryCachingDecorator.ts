import { Result } from "@webiny/feature/api";
import { RolesRepository } from "../abstractions.js";
import type { Role, GetRoleInput, ListRolesInput } from "../types.js";
import { ListCache } from "./ListCache.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

class RolesRepositoryCachingDecoratorImpl implements RolesRepository.Interface {
    // Security: roles are per tenant, so the cache is too (keyed by tenant ID).
    private readonly caches = new Map<string, ListCache<Role>>();

    constructor(
        private tenantContext: TenantContext.Interface,
        private decoratee: RolesRepository.Interface
    ) {}

    private get cache(): ListCache<Role> {
        const tenantId = this.tenantContext.getTenant().id;
        let cache = this.caches.get(tenantId);
        if (!cache) {
            cache = new ListCache<Role>();
            this.caches.set(tenantId, cache);
        }
        return cache;
    }

    async get(params: GetRoleInput): Promise<Result<Role, RolesRepository.Error>> {
        // Check cache first
        if (this.cache.hasItems()) {
            const cachedRole = this.cache.getItems().find(r => {
                if (params.id && r.id === params.id) {
                    return true;
                }
                if (params.slug && r.slug === params.slug) {
                    return true;
                }
                return false;
            });

            if (cachedRole) {
                return Result.ok(cachedRole);
            }
        }

        // Delegate to decoratee
        const result = await this.decoratee.get(params);

        // Add to cache on success
        if (result.isOk()) {
            this.cache.addItems([result.value]);
        }

        return result;
    }

    async list(params: ListRolesInput): Promise<Result<Role[], RolesRepository.Error>> {
        return this.decoratee.list(params);
    }

    async create(role: Role): Promise<Result<void, RolesRepository.Error>> {
        const result = await this.decoratee.create(role);

        // Add to cache on success
        if (result.isOk()) {
            this.cache.addItems([role]);
        }

        return result;
    }

    async update(role: Role): Promise<Result<void, RolesRepository.Error>> {
        const result = await this.decoratee.update(role);

        // Update in cache on success
        if (result.isOk()) {
            this.cache.updateItems(item => {
                if (item.id === role.id) {
                    return role;
                }
                return item;
            });
        }

        return result;
    }

    async delete(role: Role): Promise<Result<void, RolesRepository.Error>> {
        const result = await this.decoratee.delete(role);

        // Remove from cache on success
        if (result.isOk()) {
            this.cache.removeItems(item => item.id === role.id);
        }

        return result;
    }
}

export const RolesRepositoryCachingDecorator = RolesRepository.createDecorator({
    decorator: RolesRepositoryCachingDecoratorImpl,
    dependencies: [TenantContext]
});
