import { Result } from "@webiny/feature/api";
import type {
    CmsEntryListParams,
    CmsEntryListWhere,
    CmsEntryValues
} from "@webiny/api-headless-cms/types/index.js";
import type { IListEntriesResult } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { FolderAccessListFilter } from "@webiny/api-aco/features/flp/FolderAccessListFilter/abstractions.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/abstractions.js";
import { ListFlpsUseCase } from "@webiny/api-aco/features/flp/ListFlps/abstractions.js";
import { FolderModelProvider } from "@webiny/api-aco/domain/folder/abstractions.js";
import type { ListFoldersUseCase } from "@webiny/api-aco/features/folder/ListFolders/abstractions.js";
import type { Folder, ListFoldersParams } from "@webiny/api-aco/folder/folder.types.js";
import type { FolderPermission } from "@webiny/api-aco/flp/flp.types.js";
import { hasRootFolderId } from "@webiny/api-aco/flpTaskCatalog/listEntries/hasRootFolderId.js";
import { isPageModel } from "@webiny/api-aco/flpTaskCatalog/listEntries/isPageModel.js";
import { FOLDER_MODEL_ID } from "@webiny/api-aco/domain/folder/folder.model.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { UserFolderCandidates } from "@webiny/api-aco/features/flp/ListFolderAccess/abstractions.js";
import { ROOT_FOLDER } from "@webiny/shared-aco";
import type { FolderLevelPermission } from "@webiny/api-aco/flp/flp.types.js";
import { FolderCatalog } from "~/catalog/FolderCatalog.js";

const DEFAULT_LIMIT = 50;

interface FolderAccess {
    /** Each folder's permissions as the current identity sees them (defaults applied). */
    permissions: Map<string, FolderPermission[]>;
    /** Folders the current identity cannot read. */
    hidden: string[];
}

/**
 * Applies folder-level permissions inside the list query: the folders the identity cannot read are
 * worked out first, from the folder catalog, and excluded by the query itself. Paging, `totalCount`
 * and `hasMoreItems` therefore describe what the identity sees.
 *
 * Which folders are readable is decided by the same checks the post-load filter makes per folder
 * (`canAccessFolder` for folders, `canAccessFolderContent` for entries), on the same permissions
 * (code-defined ones and the team and role defaults included).
 *
 * Only the folders the identity's grants can reach have their permissions worked out (see
 * `readableAccess`); the rest of the type is hidden by id, which the catalog lists cheaply.
 */
class PgFolderAccessListFilterImpl implements FolderAccessListFilter.Interface {
    public constructor(
        private readonly folderLevelPermissions: FolderLevelPermissions.Interface,
        private readonly listFlps: ListFlpsUseCase.Interface,
        private readonly catalog: FolderCatalog.Interface,
        private readonly folderModelProvider: FolderModelProvider.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly candidates: UserFolderCandidates.Interface,
        private readonly listUserTeams: ListUserTeamsUseCase.Interface
    ) {}

    public async listEntries<T extends CmsEntryValues>({
        model,
        params = {},
        loader
    }: FolderAccessListFilter.ListEntriesParams<T>): Promise<IListEntriesResult<T>> {
        const limited: CmsEntryListParams = { ...params, limit: params.limit || DEFAULT_LIMIT };

        if (
            // Folder entries are in no folder; folder lists apply FLP in listFolders().
            model.modelId === FOLDER_MODEL_ID ||
            !this.folderLevelPermissions.canUseFolderLevelPermissions() ||
            hasRootFolderId({ model, where: params.where }) ||
            (await this.seesEverything())
        ) {
            return loader(limited);
        }

        // Every entry has a location (a system field, not one of the model's fields).
        const locationField = isPageModel(model) ? "location" : "wbyAco_location";

        const folderModel = await this.folderModelProvider.get();
        const types = await this.catalog.listTypes(folderModel);
        const { hidden } = await this.readableAccess(types, permissions =>
            this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" })
        );
        if (hidden.length === 0) {
            return loader(limited);
        }

        // An entry without a folder has no `folderId`, which `not_in` lets through.
        const where: CmsEntryListWhere = {
            ...(limited.where || {}),
            AND: [
                ...((limited.where?.AND as CmsEntryListWhere[] | undefined) || []),
                { [locationField]: { folderId_not_in: hidden } }
            ]
        };
        return loader({ ...limited, where });
    }

    public async listFolders(
        params: ListFoldersParams,
        loader: FolderAccessListFilter.ListFoldersLoader
    ): ListFoldersUseCase.Return {
        /*
         * Only the folders the list can return need checking: the children of the requested
         * parents when it asks for some (as the admin's folder tree does), else every folder of the
         * type.
         */
        const { type, parentId, parentId_in } = params.where;
        const parents =
            parentId !== undefined ? [parentId] : parentId_in?.length ? parentId_in : null;
        const seesEverything = await this.seesEverything();
        const canRead = (permissions: FolderPermission[]) =>
            seesEverything
                ? Promise.resolve(true)
                : this.folderLevelPermissions.canAccessFolder({ permissions, rwd: "r" });

        let access: FolderAccess;
        if (parents) {
            const flps = (
                await Promise.all(
                    parents.map(parent =>
                        this.listFlps.execute({
                            where: { type, parentId: parent ?? ROOT_FOLDER }
                        })
                    )
                )
            ).flat();
            access = await this.folderAccess(flps, canRead);
        } else if (seesEverything) {
            // Every folder is returned with its permissions, so all of them are needed.
            access = await this.folderAccess(
                await this.listFlps.execute({ where: { type } }),
                canRead
            );
        } else {
            access = await this.readableAccess([type], canRead);
        }
        const { permissions, hidden } = access;

        /*
         * Folder ids are entry ids. The folder `id` filters reach the CMS as they are, where `id` is
         * the revision id (`<id>#0001`), so the exclusion goes on `entryId`.
         */
        const where: ListFoldersParams["where"] & { entryId_not_in?: string[] } = {
            ...params.where
        };
        if (hidden.length > 0) {
            where.entryId_not_in = [...(where.entryId_not_in || []), ...hidden];
        }

        const result = await loader({ ...params, where });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const { folders, meta } = result.value;
        const withPermissions: Folder[] = [];
        for (const folder of folders) {
            // A folder missing from the catalog reads as it would one by one.
            const folderPermissions =
                permissions.get(folder.id) ??
                (await this.folderLevelPermissions.getFolderLevelPermissions(folder.id));
            withPermissions.push({ ...folder, permissions: folderPermissions });
        }
        return Result.ok({ folders: withPermissions, meta });
    }

    /*
     * Nothing can be hidden from the identity: folder access checks are off, or it has full access
     * (which makes it the owner of every folder). Saves working out every folder's permissions.
     */
    private async seesEverything(): Promise<boolean> {
        if (
            !this.folderLevelPermissions.canUseFolderLevelPermissions() ||
            !this.identityContext.isAuthorizationEnabled()
        ) {
            return true;
        }
        const permissions = await this.identityContext.listPermissions();
        return permissions.some(permission => permission.name === "*");
    }

    /*
     * The folders of the types the identity cannot read, worked out from the candidates only:
     * without full access (checked by the caller), a folder is readable when it has no permissions
     * at all, or when a grant other than `no-access` to the identity or one of its teams applies
     * to it, in the catalog or in code. `UserFolderCandidates` returns every folder that could
     * be, for the same targets, so every other folder of the types is hidden without its
     * permissions being worked out.
     */
    private async readableAccess(
        types: string[],
        canRead: (permissions: FolderPermission[]) => Promise<boolean>
    ): Promise<FolderAccess> {
        const identity = this.identityContext.getIdentity();
        // The teams `getDefaultPermissionsBatch` expands; any extra target only adds candidates.
        const teams = this.folderLevelPermissions.canUseTeams()
            ? await this.listUserTeams.execute(identity.id)
            : null;
        const targets = [
            `admin:${identity.id}`,
            ...(teams?.isOk() ? teams.value.map(team => `team:${team.slug}`) : [])
        ];

        const folderModel = await this.folderModelProvider.get();
        const [candidates, allIds] = await Promise.all([
            Promise.all(types.map(type => this.candidates.list({ type, targets }))),
            Promise.all(types.map(type => this.catalog.listIds(folderModel, { type })))
        ]);

        const access = await this.folderAccess(candidates.flat(), canRead);
        const hidden = new Set(access.hidden);
        for (const id of allIds.flat()) {
            if (!access.permissions.has(id)) {
                hidden.add(id);
            }
        }
        return { permissions: access.permissions, hidden: [...hidden] };
    }

    private async folderAccess(
        flps: FolderLevelPermission[],
        canRead: (permissions: FolderPermission[]) => Promise<boolean>
    ): Promise<FolderAccess> {
        const defaults = await this.folderLevelPermissions.getDefaultPermissionsBatch(
            flps.map(flp => flp.permissions)
        );

        const permissions = new Map<string, FolderPermission[]>();
        const hidden: string[] = [];
        for (const [index, flp] of flps.entries()) {
            const folderPermissions = defaults[index];
            permissions.set(flp.id, folderPermissions);
            // As the post-load filter: a folder with no permissions at all is readable.
            if (folderPermissions.length > 0 && !(await canRead(folderPermissions))) {
                hidden.push(flp.id);
            }
        }
        return { permissions, hidden };
    }
}

export const PgFolderAccessListFilter = FolderAccessListFilter.createImplementation({
    implementation: PgFolderAccessListFilterImpl,
    dependencies: [
        FolderLevelPermissions,
        ListFlpsUseCase,
        FolderCatalog,
        FolderModelProvider,
        IdentityContext,
        UserFolderCandidates,
        ListUserTeamsUseCase
    ]
});
