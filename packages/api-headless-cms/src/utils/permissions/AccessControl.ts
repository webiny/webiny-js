import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityIdentity } from "@webiny/api-security/types";
import {
    CmsEntry,
    CmsEntryPermission,
    CmsGroup,
    CmsGroupPermission,
    CmsModel,
    CmsModelPermission
} from "~/types";

export interface AccessControlParams {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getGroupsPermissions: () => CmsGroupPermission[] | Promise<CmsGroupPermission[]>;
    getModelsPermissions: () => CmsModelPermission[] | Promise<CmsModelPermission[]>;
    getEntriesPermissions: () => CmsEntryPermission[] | Promise<CmsEntryPermission[]>;
    listAllGroups: () => CmsGroup[] | Promise<CmsGroup[]>;
}

interface GetGroupsAccessControlListParams {
    group: CmsGroup;
}

interface CanAccessGroupParams extends GetGroupsAccessControlListParams {
    rwd?: string;
}

interface GetModelsAccessControlListParams {
    model: CmsModel;
}

interface CanAccessModelParams extends GetModelsAccessControlListParams {
    rwd?: string;
}

interface GetEntriesAccessControlListParams {
    model: CmsModel;
    entry: CmsEntry;
}

interface CanAccessEntryParams extends GetEntriesAccessControlListParams {
    rwd?: string;
}

interface AccessControlEntry {
    rwd: string;
    canAccessNonOwned: boolean;
    canAccessOnlyOwned: boolean;
}

type AccessControlList = AccessControlEntry[];

export class AccessControl {
    getIdentity: AccessControlParams["getIdentity"];
    getGroupsPermissions: AccessControlParams["getGroupsPermissions"];
    getModelsPermissions: AccessControlParams["getModelsPermissions"];
    getEntriesPermissions: AccessControlParams["getEntriesPermissions"];
    listAllGroupsCallback: AccessControlParams["listAllGroups"];

    private fullAccessPermissions: string[];
    private allGroups: {
        loaded: boolean;
        groups: CmsGroup[];
    }

    constructor({
        getIdentity,
        getGroupsPermissions,
        getModelsPermissions,
        getEntriesPermissions,
        listAllGroups
    }: AccessControlParams) {
        this.getIdentity = getIdentity;
        this.getGroupsPermissions = getGroupsPermissions;
        this.getModelsPermissions = getModelsPermissions;
        this.getEntriesPermissions = getEntriesPermissions;
        this.fullAccessPermissions = ["*", "cms.*"];
        this.listAllGroupsCallback = listAllGroups;
        this.allGroups = { loaded: false, groups: [] };
    }

    /**
     * Groups-related methods below. 👇
     * - canAccessGroup
     * - ensureCanAccessGroup
     * - canAccessNonOwnedGroups
     * - canAccessOnlyOwnedGroups
     * - getGroupsAccessControlList
     * - hasFullAccessToGroups
     */

    async canAccessGroup(params: CanAccessGroupParams) {
        const acl = await this.getGroupsAccessControlList(params);

        // If we don't even have read access, we can't proceed. This is the first check
        // we need to make, because it will prevent us from proceeding with other checks.
        const canRead = acl.find(ace => ace.rwd?.includes("r"));
        if (!canRead) {
            return false;
        }

        if (params.rwd) {
            const hasRwd = acl.find(({ rwd }) => rwd.includes("r"));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessGroup(params: CanAccessGroupParams) {
        const canAccess = await this.canAccessGroup(params);
        if (!canAccess) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access group "${params.group.id}".`
                }
            });
        }
    }

    async canAccessNonOwnedGroups(params: GetGroupsAccessControlListParams) {
        const acl = await this.getGroupsAccessControlList(params);
        return acl.some(ace => ace.canAccessNonOwned);
    }

    async canAccessOnlyOwnedGroups(params: GetGroupsAccessControlListParams) {
        const canAccessNonOwned = await this.canAccessNonOwnedGroups(params);
        return !canAccessNonOwned;
    }

    async getGroupsAccessControlList(
        params: GetGroupsAccessControlListParams
    ): Promise<AccessControlList> {
        if (await this.hasFullAccessToGroups()) {
            return [{ rwd: "rwd", canAccessNonOwned: true, canAccessOnlyOwned: false }];
        }

        const groupsPermissionsList = await this.getGroupsPermissions();
        const acl: AccessControlList = [];
        const { group } = params;

        for (const groupsPermissions of groupsPermissionsList) {
            if (groupsPermissions.own) {
                const modelGroupCreatedBy = group.createdBy;
                if (!modelGroupCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (modelGroupCreatedBy.id === identity.id) {
                    acl.push({ rwd: "rwd", canAccessNonOwned: false, canAccessOnlyOwned: true });
                    continue;
                }
            }

            if (groupsPermissions.groups) {
                const { groups } = groupsPermissions;
                if (!Array.isArray(groups)) {
                    continue;
                }

                if (!groups.includes(group.id)) {
                    continue;
                }
            }

            acl.push({
                rwd: groupsPermissions.rwd as string,
                canAccessNonOwned: true,
                canAccessOnlyOwned: false
            });
        }

        return acl;
    }

    async hasFullAccessToGroups() {
        const permissions = await this.getGroupsPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    /**
     * Models-related methods below. 👇
     * - canAccessModel
     * - ensureCanAccessModel
     * - canAccessNonOwnedModels
     * - canAccessOnlyOwnedModels
     * - getModelsAccessControlList
     * - hasFullAccessToModels
     */

    async canAccessModel(params: CanAccessModelParams) {
        const acl = await this.getModelsAccessControlList(params);

        // If we don't even have read access, we can't proceed. This is the first check
        // we need to make, because it will prevent us from proceeding with other checks.
        const canRead = acl.find(ace => ace.rwd?.includes("r"));
        if (!canRead) {
            return false;
        }

        if (params.rwd) {
            const hasRwd = acl.find(({ rwd }) => rwd.includes("r"));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessModel(params: CanAccessModelParams) {
        const canAccess = await this.canAccessModel(params);
        if (!canAccess) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access model "${params.model.modelId}".`
                }
            });
        }
    }

    async canAccessNonOwnedModels(params: GetModelsAccessControlListParams) {
        const acl = await this.getModelsAccessControlList(params);
        return acl.some(ace => ace.canAccessNonOwned);
    }

    async canAccessOnlyOwnedModels(params: GetModelsAccessControlListParams) {
        const canAccessNonOwned = await this.canAccessNonOwnedModels(params);
        return !canAccessNonOwned;
    }

    async getModelsAccessControlList(
        params: GetModelsAccessControlListParams
    ): Promise<AccessControlList> {
        if (await this.hasFullAccessToModels(params)) {
            return [{ rwd: "rwd", canAccessNonOwned: true, canAccessOnlyOwned: false }];
        }

        const groupsPermissionsList = await this.getGroupsPermissions();

        const { model } = params;
        const { locale } = model;

        const group = await this.getGroup(model.group.id);

        const acl: AccessControlList = [];

        for (let i = 0; i < groupsPermissionsList.length; i++) {
            const groupPermissions = groupsPermissionsList[i];

            // 1. Group permissions granting access to all groups the user created?
            // When selected, that means the user can perform all actions on not only
            // the groups they created, but also on all models and all content entries
            // within those groups. The only exception are the publish / unpublish actions
            // on content entries, which still need to be set on content entries permission.
            if (groupPermissions.own) {
                if (!group) {
                    continue;
                }

                const modelGroupCreatedBy = group.createdBy;
                if (!modelGroupCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (modelGroupCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            // 2. Group permissions granting access specific groups?
            // When selected, that means the user can perform all actions on all models
            // and all entries within the selected groups. But, unlike the previous permission,
            // this one doesn't give full access to all models and content entries. The user
            // must define what permissions they have on models and entries.
            if (groupPermissions.groups) {
                const { groups } = groupPermissions;

                if (!Array.isArray(groups[locale])) {
                    continue;
                }

                if (!groups[locale].includes(model.group.id)) {
                    continue;
                }
            }

            // If we got here, that means the model either belongs to a group the user
            // has access to, or, the user has access to all groups. In both cases, we
            // need to check the related model permissions.

            // The following note is important for when the Teams feature is enabled,
            // and where users can be linked to multiple roles, some of which contain
            // their own CMS permissions.
            // ---
            // We're only checking one model permissions object!
            // This is because model permissions are always related to group permissions.
            // We don't care about potentially other model permissions that might exist,
            // because they are not related to current group permissions. We're using the
            // `_src` property to link the model permissions to the group permissions.
            // ---
            const modelsPermissionsList = await this.getModelsPermissions();
            const relatedModelPermissions = modelsPermissionsList.find(
                permissions => permissions._src === groupPermissions._src
            );

            if (!relatedModelPermissions) {
                continue;
            }

            // Check if the permissions object grants full access to all models (doesn't set any restrictions).
            const fullAccess =
                !relatedModelPermissions.rwd &&
                !relatedModelPermissions.own &&
                !relatedModelPermissions.models;

            if (fullAccess) {
                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: true,
                    canAccessOnlyOwned: false
                });

                continue;
            }

            // 1. Model permissions granting access to all models the user created?
            if (relatedModelPermissions.own) {
                const modelCreatedBy = model.createdBy;
                if (!modelCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (modelCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            // 2. Model permission granting access to specific models?
            if (relatedModelPermissions.models) {
                const { models } = relatedModelPermissions;

                if (!Array.isArray(models[locale])) {
                    continue;
                }

                if (!models[locale].includes(params.model.modelId)) {
                    continue;
                }
            }

            // If we got here, that means the model either belongs to a group the user
            // has access to, or, the user has access to all groups.
            acl.push({
                rwd: relatedModelPermissions.rwd as string,
                canAccessNonOwned: true,
                canAccessOnlyOwned: false
            });
        }

        return acl;
    }

    async hasFullAccessToModels(params: GetModelsAccessControlListParams) {
        if (this.modelAuthorizationDisabled(params)) {
            return true;
        }

        const permissions = await this.getModelsPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    /**
     * Entries-related methods below. 👇
     * - canAccessEntry
     * - ensureCanAccessEntry
     * - canAccessNonOwnedEntries
     * - canAccessOnlyOwnedEntries
     * - getEntriesAccessControlList
     * - hasFullAccessToEntries
     */

    async canAccessEntry(params: CanAccessEntryParams) {
        const acl = await this.getEntriesAccessControlList(params);

        // If we don't even have read access, we can't proceed. This is the first check
        // we need to make, because it will prevent us from proceeding with other checks.
        const canRead = acl.find(ace => ace.rwd?.includes("r"));
        if (!canRead) {
            return false;
        }

        if (params.rwd) {
            const hasRwd = acl.find(({ rwd }) => rwd.includes("r"));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessEntry(params: CanAccessEntryParams) {
        const canAccess = await this.canAccessEntry(params);
        if (!canAccess) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access entry "${params.entry.entryId}".`
                }
            });
        }
    }

    async canAccessNonOwnedEntries(params: GetEntriesAccessControlListParams) {
        const acl = await this.getEntriesAccessControlList(params);
        return acl.some(ace => ace.canAccessNonOwned);
    }

    async canAccessOnlyOwnedEntries(params: GetEntriesAccessControlListParams) {
        const canAccessNonOwned = await this.canAccessNonOwnedEntries(params);
        return !canAccessNonOwned;
    }

    async getEntriesAccessControlList(
        params: GetEntriesAccessControlListParams
    ): Promise<AccessControlList> {
        if (await this.hasFullAccessToEntries(params)) {
            return [{ rwd: "rwd", canAccessNonOwned: true, canAccessOnlyOwned: false }];
        }

        const groupsPermissionsList = await this.getGroupsPermissions();

        const { model, entry } = params;
        const { locale } = entry;

        const acl: AccessControlList = [];

        for (let i = 0; i < groupsPermissionsList.length; i++) {
            const groupPermissions = groupsPermissionsList[i];

            // 1. Group permissions granting access to all groups the user created?
            // When selected, that means the user can perform all actions on not only
            // the groups they created, but also on all entries and all content entries
            // within those groups. The only exception are the publish / unpublish actions
            // on content entries, which still need to be set on content entries permission.
            if (groupPermissions.own) {
                const group = await this.getGroup(model.group.id);
                if (!group) {
                    continue;
                }

                const entryGroupCreatedBy = group.createdBy;
                if (!entryGroupCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (entryGroupCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            // 2. Group permissions granting access specific groups?
            // When selected, that means the user can perform all actions on all entries
            // and all entries within the selected groups. But, unlike the previous permission,
            // this one doesn't give full access to all entries and content entries. The user
            // must define what permissions they have on entries and entries.
            if (groupPermissions.groups) {
                const { groups } = groupPermissions;

                if (!Array.isArray(groups[locale])) {
                    continue;
                }

                if (!groups[locale].includes(model.group.id)) {
                    continue;
                }
            }

            // If we got here, that means the entry either belongs to a group the user
            // has access to, or, the user has access to all groups. In both cases, we
            // need to check the related entry permissions.

            // The following note is important for when the Teams feature is enabled,
            // and where users can be linked to multiple roles, some of which contain
            // their own CMS permissions.
            // ---
            // We're only checking one entry permissions object!
            // This is because entry permissions are always related to group permissions.
            // We don't care about potentially other entry permissions that might exist,
            // because they are not related to current group permissions. We're using the
            // `_src` property to link the entry permissions to the group permissions.
            // ---
            const modelsPermissionsList = await this.getModelsPermissions();
            const relatedModelPermissions = modelsPermissionsList.find(
                permissions => permissions._src === groupPermissions._src
            );

            if (!relatedModelPermissions) {
                continue;
            }

            const entriesPermissionsList = await this.getEntriesPermissions();
            const relatedEntriesPermissions = entriesPermissionsList.find(
                permissions => permissions._src === groupPermissions._src
            );

            if (!relatedEntriesPermissions) {
                continue;
            }

            // Check if the permissions object grants full access to all model (doesn't set any restrictions).
            const fullAccess =
                !relatedModelPermissions.rwd &&
                !relatedModelPermissions.own &&
                !relatedModelPermissions.entries;

            if (fullAccess) {
                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: true,
                    canAccessOnlyOwned: false
                });

                continue;
            }

            // 1. Entry permissions granting access to all entries the user created?
            if (relatedModelPermissions.own) {
                const entryCreatedBy = entry.createdBy;
                if (!entryCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (entryCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            // 2. Entry permission granting access to specific entries?
            if (relatedModelPermissions.entries) {
                const { entries } = relatedModelPermissions;

                if (!Array.isArray(entries[locale])) {
                    continue;
                }

                if (!entries[locale].includes(params.entry.entryId)) {
                    continue;
                }
            }

            // If we got here, that means the entry either belongs to a group the user
            // has access to, or, the user has access to all groups.
            acl.push({
                rwd: relatedModelPermissions.rwd as string,
                canAccessNonOwned: true,
                canAccessOnlyOwned: false
            });
        }

        return acl;
    }

    async hasFullAccessToEntries(params: GetEntriesAccessControlListParams) {
        if (this.entryAuthorizationDisabled(params)) {
            return true;
        }

        const permissions = await this.getEntriesPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    private modelAuthorizationDisabled(params: { model: CmsModel }) {
        // Authorization disabled on model level?
        if ("authorization" in params.model) {
            const { authorization } = params.model;
            if (typeof authorization === "boolean") {
                return authorization === false;
            }

            return authorization?.permissions === false;
        }

        return false;
    }

    async listAllGroups(): Promise<CmsGroup[]> {
        if (this.allGroups.loaded) {
            return this.allGroups.groups;
        }

        this.allGroups.loaded = true;
        this.allGroups.groups = await this.listAllGroupsCallback();
        return this.allGroups.groups;
    }

    async getGroup(id: string): Promise<CmsGroup | undefined> {
        const groups = await this.listAllGroups();
        return groups.find(group => group.id === id);
    }
}
