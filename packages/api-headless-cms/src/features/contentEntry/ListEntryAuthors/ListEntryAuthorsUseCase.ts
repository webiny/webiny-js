import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ListUsersWithPermissionsUseCase } from "@webiny/api-core/features/users/ListUsersWithPermissions/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { filterPermissionsByName } from "@webiny/api-core/features/security/utils/filterPermissionsByName.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ListEntryAuthorsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { AccessControl as AccessControlClass } from "~/crud/AccessControl/AccessControl.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsGroup } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

const getDisplayName = (user: Pick<AdminUser, "id" | "displayName" | "firstName" | "lastName">) => {
    if (user.displayName?.trim()) {
        return user.displayName.trim();
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return fullName || user.id;
};

/*
 * Runs the same entry read check the CMS runs on a request, with the user's permissions
 * instead of the caller's. Model access guards are left out: they check the identity of
 * the current request, and the caller has already passed them.
 */
const canUserReadEntries = (
    model: CmsModel,
    user: AdminUser,
    permissions: SecurityPermission[],
    listAllGroups: () => Promise<CmsGroup[]>
) => {
    const identity = new AuthenticatedIdentity({
        id: user.id,
        displayName: getDisplayName(user),
        type: "admin"
    });

    const accessControl = new AccessControlClass({
        getIdentity: async () => identity,
        getGroupsPermissions: async () => {
            return filterPermissionsByName(permissions, "cms.contentModelGroup");
        },
        getModelsPermissions: async () => {
            return filterPermissionsByName(permissions, "cms.contentModel");
        },
        getEntriesPermissions: async () => {
            return filterPermissionsByName(permissions, "cms.contentEntry");
        },
        listAllGroups
    });

    return accessControl.canAccessEntry({ model });
};

class ListEntryAuthorsUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private cmsContext: CmsContext.Interface,
        private listUsersWithPermissions: ListUsersWithPermissionsUseCase.Interface
    ) {}

    async execute(model: CmsModel): UseCaseAbstraction.Return {
        const canRead = await this.accessControl.canAccessEntry({ model });
        if (!canRead) {
            const error = EntryNotAuthorizedError.fromModel(model);
            return Result.fail(error);
        }

        // An identity that only sees its own entries can only filter by itself.
        const canAccessOnlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (canAccessOnlyOwned) {
            const identity = this.cmsContext.security.getIdentity();
            return Result.ok([
                { id: identity.id, displayName: identity.displayName || identity.id }
            ]);
        }

        const usersResult = await this.listUsersWithPermissions.execute();
        if (usersResult.isFail()) {
            const error = new EntryPersistenceError(usersResult.error);
            return Result.fail(error);
        }

        const listAllGroups = this.createGroupsLoader();

        const authors: UseCaseAbstraction.Author[] = [];
        for (const { user, permissions } of usersResult.value) {
            const canUserRead = await canUserReadEntries(model, user, permissions, listAllGroups);
            if (!canUserRead) {
                continue;
            }

            const displayName = getDisplayName(user);
            authors.push({ id: user.id, displayName });
        }

        authors.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return Result.ok(authors);
    }

    /*
     * Every user's check needs the model groups. Load them once, without authorization,
     * the same way the request's own `AccessControl` does.
     */
    private createGroupsLoader() {
        let groups: Promise<CmsGroup[]> | undefined;
        return () => {
            if (!groups) {
                groups = this.cmsContext.security.withoutAuthorization(() => {
                    return this.cmsContext.cms.listGroups();
                });
            }
            return groups;
        };
    }
}

export const ListEntryAuthorsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListEntryAuthorsUseCaseImpl,
    dependencies: [AccessControl, CmsContext, ListUsersWithPermissionsUseCase]
});
