import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { CreateGroupRepository as RepositoryAbstraction } from "./abstractions.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/abstractions.js";
import { GroupSlugTakenError } from "~/domain/contentModelGroup/errors.js";
import { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { toSlug } from "~/utils/toSlug.js";
import { generateAlphaNumericId } from "@webiny/utils";
import type { CmsGroup } from "~/types/index.js";

/**
 * CreateGroupRepository - Validates and persists a new group.
 *
 * Responsibilities:
 * - Validate ID uniqueness (if provided)
 * - Validate slug uniqueness (or generate unique slug)
 * - Check for plugin group conflicts
 * - Persist to storage
 * - Clear GroupCache after successful create
 */
class CreateGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private groupCache: GroupCache.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(group: CmsGroup): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // 1. Validate ID uniqueness (if provided)
            if (group.id) {
                const existingById = await this.storageOperations.groups.list({
                    where: {
                        tenant: tenant.id,
                        id: group.id
                    }
                });

                if (existingById.length > 0) {
                    return Result.fail(new GroupSlugTakenError(group.slug));
                }
            }

            // 2. Generate or validate slug
            const slugTaken = await this.isSlugTaken(group, tenant.id);
            if (slugTaken) {
                return Result.fail(new GroupSlugTakenError(group.slug));
            }

            // 3. Check for plugin group conflicts
            const pluginGroups = await this.pluginGroupsProvider.getGroups();
            const pluginGroupConflict = pluginGroups.find(pg => pg.slug === group.slug);
            if (pluginGroupConflict) {
                return Result.fail(new GroupSlugTakenError(group.slug));
            }

            // 4. Persist to storage
            await this.storageOperations.groups.create({ group });

            // 5. Clear cache
            this.groupCache.clear();

            return Result.ok();
        } catch (error) {
            return Result.fail(new GroupPersistenceError(error as Error));
        }
    }

    private async isSlugTaken(group: CmsGroup, tenant: string): Promise<boolean> {
        // If slug is provided and not empty, validate it
        if (group.slug && group.slug.trim()) {
            const existingBySlug = await this.storageOperations.groups.list({
                where: {
                    tenant,
                    slug: group.slug
                }
            });

            return existingBySlug.length > 0;
        }

        // Generate slug from name
        const baseSlug = toSlug(group.name);
        const existingBySlug = await this.storageOperations.groups.list({
            where: {
                tenant,
                slug: baseSlug
            }
        });

        if (existingBySlug.length === 0) {
            // No conflict, use base slug
            group.slug = baseSlug;
        } else {
            // Conflict, append random suffix
            group.slug = `${baseSlug}-${generateAlphaNumericId(8)}`;
        }

        return false;
    }
}

export const CreateGroupRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: CreateGroupRepositoryImpl,
    dependencies: [GroupCache, PluginGroupsProvider, StorageOperations, TenantContext]
});
