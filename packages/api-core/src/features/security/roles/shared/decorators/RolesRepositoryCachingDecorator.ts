import { Result } from "@webiny/feature/api";
import { RolesRepository } from "../abstractions.js";
import type { Role, GetRoleInput, ListRolesInput } from "../types.js";
import { ListCache } from "./ListCache.js";

class RolesRepositoryCachingDecoratorImpl implements RolesRepository.Interface {
    private readonly cache = new ListCache<Role>();

    constructor(private decoratee: RolesRepository.Interface) {}

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
    dependencies: []
});
