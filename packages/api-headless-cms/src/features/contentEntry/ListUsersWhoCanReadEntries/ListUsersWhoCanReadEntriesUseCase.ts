import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { UserPermissionsProvider } from "@webiny/api-core/features/users/UserPermissionsProvider/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UserDisplayName } from "@webiny/api-core/domain/users/UserDisplayName.js";
import { ListUsersWhoCanReadEntriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { AccessControl as AccessControlClass } from "~/crud/AccessControl/AccessControl.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListGroupsRepository } from "~/features/contentModelGroup/ListGroups/index.js";
import { ModelAccessGuard } from "~/features/contentModel/ModelAccessGuard/index.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { CmsGroup } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

/*
 * The e-mail is left out on purpose: the query is open to anyone who can read the model's
 * entries, so a user without a name is listed by ID rather than by e-mail address.
 */
const toReader = (user: Pick<AdminUser, "id" | "displayName" | "firstName" | "lastName">) => {
    const nameSource = {
        id: user.id,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName
    };
    const displayName = UserDisplayName.from(nameSource).toString();

    return { id: user.id, displayName };
};

/*
 * Runs the same entry read check the CMS runs on a request, with the user's permissions
 * instead of the caller's.
 */
const canUserReadEntries = (
    model: CmsModel,
    item: UserPermissionsProvider.Item,
    reader: UseCaseAbstraction.Reader,
    groups: CmsGroup[]
) => {
    const identity = new AuthenticatedIdentity({
        id: reader.id,
        displayName: reader.displayName,
        type: "admin"
    });

    const accessControl = AccessControlClass.fromPermissions({
        identity,
        permissions: item.permissions,
        listAllGroups: async () => groups
    });

    return accessControl.canAccessEntry({ model });
};

const notAuthorized = (modelId: string) => {
    const error = new EntryNotAuthorizedError(`Not allowed to access "${modelId}" entries.`);
    return Result.fail(error);
};

/*
 * A model that does not exist and a model the caller cannot read get the same answer,
 * so the query does not tell which models exist.
 */
const fromModelError = (modelId: string, error: GetModelUseCase.Error) => {
    if (error instanceof ModelPersistenceError) {
        const persistenceError = new EntryPersistenceError(error);
        return Result.fail(persistenceError);
    }
    return notAuthorized(modelId);
};

class ListUsersWhoCanReadEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private identityContext: IdentityContext.Interface,
        private listGroupsRepository: ListGroupsRepository.Interface,
        private userPermissionsProvider: UserPermissionsProvider.Interface,
        private modelAccessGuards: ModelAccessGuard.Interface[]
    ) {}

    async execute(modelId: string): UseCaseAbstraction.Return {
        const modelResult = await this.getModel.execute(modelId);
        if (modelResult.isFail()) {
            return fromModelError(modelId, modelResult.error);
        }

        // Private models are internal and have no entry list.
        const model = modelResult.value;
        if (model.isPrivate) {
            return notAuthorized(modelId);
        }

        const canRead = await this.accessControl.canAccessEntry({ model });
        if (!canRead) {
            return notAuthorized(modelId);
        }

        // An identity that only sees its own entries can only filter by itself.
        const canAccessOnlyOwned = await this.accessControl.canAccessOnlyOwnedEntries({ model });
        if (canAccessOnlyOwned) {
            return this.listOnlyCaller();
        }

        /*
         * A model access guard decides from the current request, so it cannot tell whether
         * another user passes it. Rather than list users the guard might refuse, a guarded
         * model only offers the caller.
         */
        const isGuarded = this.modelAccessGuards.some(guard => guard.canHandle(model));
        if (isGuarded) {
            return this.listOnlyCaller();
        }

        const usersResult = await this.userPermissionsProvider.listUsersWithPermissions();
        if (usersResult.isFail()) {
            const error = new EntryPersistenceError(usersResult.error);
            return Result.fail(error);
        }

        /*
         * The checks need every group, not only the ones the caller can see, the same way the
         * request's own `AccessControl` loads them.
         */
        const groupsResult = await this.identityContext.withoutAuthorization(() => {
            return this.listGroupsRepository.execute();
        });
        if (groupsResult.isFail()) {
            const error = new EntryPersistenceError(groupsResult.error);
            return Result.fail(error);
        }

        const readers: UseCaseAbstraction.Reader[] = [];
        for (const item of usersResult.value) {
            const reader = toReader(item.user);
            const canUserRead = await canUserReadEntries(model, item, reader, groupsResult.value);
            if (canUserRead) {
                readers.push(reader);
            }
        }

        readers.sort((a, b) => a.displayName.localeCompare(b.displayName));

        return Result.ok(readers);
    }

    private listOnlyCaller() {
        const identity = this.identityContext.getIdentity();
        const reader = toReader(identity);

        return Result.ok([reader]);
    }
}

export const ListUsersWhoCanReadEntriesUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListUsersWhoCanReadEntriesUseCaseImpl,
    dependencies: [
        GetModelUseCase,
        AccessControl,
        IdentityContext,
        ListGroupsRepository,
        UserPermissionsProvider,
        [ModelAccessGuard, { multiple: true }]
    ]
});
