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
    listAllGroups: () => Promise<CmsGroup[]>;
}

interface GetGroupsAccessControlListParams {
    group?: CmsGroup;
}

interface CanAccessGroupParams extends GetGroupsAccessControlListParams {
    rwd?: string;
}

interface GetModelsAccessControlListParams {
    model?: CmsModel;
}

interface CanAccessModelParams extends GetModelsAccessControlListParams {
    rwd?: string;
}

interface GetEntriesAccessControlListParams {
    model: CmsModel;
    entry?: CmsEntry;
}

interface CanAccessEntryParams extends GetEntriesAccessControlListParams {
    rwd?: string;
    pw?: string;
}

interface AccessControlEntry {
    rwd: string;
    canAccessNonOwned: boolean;
    canAccessOnlyOwned: boolean;
}

type AccessControlList = AccessControlEntry[];

interface EntriesAccessControlEntry extends AccessControlEntry {
    pw?: string;
}

type EntriesAccessControlList = EntriesAccessControlEntry[];

export class AccessControl {
    getIdentity: AccessControlParams["getIdentity"];
    getGroupsPermissions: AccessControlParams["getGroupsPermissions"];
    getModelsPermissions: AccessControlParams["getModelsPermissions"];
    getEntriesPermissions: AccessControlParams["getEntriesPermissions"];
    listAllGroupsCallback: AccessControlParams["listAllGroups"];

    private fullAccessPermissions: string[];
    private allGroups: null | CmsGroup[] | Promise<CmsGroup[]>;

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
        this.allGroups = null;
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

    async canAccessGroup(params: CanAccessGroupParams = {}) {
        const acl = await this.getGroupsAccessControlList(params);

        const canRead = acl.find(ace => ace.rwd?.includes("r"));
        if (!canRead) {
            return false;
        }

        const { rwd } = params;
        if (rwd) {
            const hasRwd = acl.find(ace => ace.rwd.includes(rwd));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessGroup(params: CanAccessGroupParams = {}) {
        const canAccess = await this.canAccessGroup(params);
        if (canAccess) {
            return;
        }

        if ("group" in params) {
            let groupName = "(could not determine name)";
            if (params.group?.name) {
                groupName = `"${params.group.name}"`;
            }

            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access content model group ${groupName}.`
                }
            });
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access content model groups.`
            }
        });
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

        for (const groupsPermissions of groupsPermissionsList) {
            if (groupsPermissions.own) {
                if ("group" in params) {
                    const modelGroupCreatedBy = params.group?.createdBy;
                    if (!modelGroupCreatedBy) {
                        continue;
                    }

                    const identity = await this.getIdentity();

                    if (modelGroupCreatedBy.id !== identity.id) {
                        continue;
                    }
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });
            }

            if (groupsPermissions.groups) {
                if ("group" in params) {
                    const { group } = params;
                    if (!group) {
                        continue;
                    }

                    const { groups } = groupsPermissions;
                    if (!Array.isArray(groups[group.locale])) {
                        continue;
                    }

                    if (!groups[group.locale].includes(group.id)) {
                        continue;
                    }
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

        const canRead = acl.find(ace => ace.rwd.includes("r"));
        if (!canRead) {
            return false;
        }

        const { rwd } = params;
        if (rwd) {
            const hasRwd = acl.find(ace => ace.rwd.includes(rwd));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessModel(params: CanAccessModelParams = {}) {
        const canAccess = await this.canAccessModel(params);
        if (canAccess) {
            return;
        }

        if ("model" in params) {
            let modelName = "(could not determine name)";
            if (params.model?.name) {
                modelName = `"${params.model.name}"`;
            }

            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access content model ${modelName}.`
                }
            });
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access content models.`
            }
        });
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
        const acl: AccessControlList = [];

        for (let i = 0; i < groupsPermissionsList.length; i++) {
            const groupsPermissions = groupsPermissionsList[i];

            const modelsPermissionsList = await this.getModelsPermissions();
            const relatedModelPermissions = modelsPermissionsList.find(
                permissions => permissions._src === groupsPermissions._src
            );

            if (!relatedModelPermissions) {
                continue;
            }

            if (groupsPermissions.own) {
                if ("model" in params) {
                    const { model } = params;
                    if (!model) {
                        continue;
                    }

                    const group = await this.getGroup(model.group.id);
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
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            if (groupsPermissions.groups) {
                if ("model" in params) {
                    const { model } = params;
                    if (!model) {
                        continue;
                    }

                    if (!Array.isArray(groupsPermissions.groups[model.locale])) {
                        continue;
                    }

                    if (!groupsPermissions.groups[model.locale].includes(model.group.id)) {
                        continue;
                    }
                }
            }

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

            if (relatedModelPermissions.own) {
                if ("model" in params) {
                    if (!params.model) {
                        continue;
                    }

                    const modelCreatedBy = params.model.createdBy;
                    if (!modelCreatedBy) {
                        continue;
                    }

                    const identity = await this.getIdentity();
                    if (modelCreatedBy.id !== identity.id) {
                        continue;
                    }
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true
                });

                continue;
            }

            if (relatedModelPermissions.models) {
                const { models } = relatedModelPermissions;
                if ("model" in params) {
                    if (!params.model) {
                        continue;
                    }

                    if (!Array.isArray(models[params.model.locale])) {
                        continue;
                    }

                    if (!models[params.model.locale].includes(params.model.modelId)) {
                        continue;
                    }
                }
            }

            acl.push({
                rwd: relatedModelPermissions.rwd as string,
                canAccessNonOwned: true,
                canAccessOnlyOwned: false
            });
        }

        return acl;
    }

    async hasFullAccessToModels(params: GetModelsAccessControlListParams) {
        const { model } = params;
        if (model) {
            if (this.modelAuthorizationDisabled({ model })) {
                return true;
            }
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

        const canRead = acl.find(ace => ace.rwd.includes("r"));
        if (!canRead) {
            return false;
        }

        const { rwd } = params;
        if (rwd) {
            const hasRwd = acl.find(ace => ace.rwd.includes(rwd));
            if (!hasRwd) {
                return false;
            }
        }

        const { pw } = params;
        if (pw) {
            const hasPw = acl.find(ace => ace.pw?.includes(pw));
            if (!hasPw) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessEntry(params: CanAccessEntryParams) {
        const canAccess = await this.canAccessEntry(params);
        if (!canAccess) {
            if (params.entry) {
                throw new NotAuthorizedError({
                    data: {
                        reason: `Not allowed to access entry "${params.entry.entryId}".`
                    }
                });
            }

            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access "${params.model.modelId}" entries.`
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
    ): Promise<EntriesAccessControlList> {
        if (await this.hasFullAccessToEntries(params)) {
            return [{ rwd: "rwd", pw: "pu", canAccessNonOwned: true, canAccessOnlyOwned: false }];
        }

        const { model } = params;
        const groupsPermissionsList = await this.getGroupsPermissions();
        const acl: EntriesAccessControlList = [];

        for (let i = 0; i < groupsPermissionsList.length; i++) {
            const groupPermissions = groupsPermissionsList[i];

            const modelsPermissionsList = await this.getModelsPermissions();
            const relatedModelsPermissions = modelsPermissionsList.find(
                permissions => permissions._src === groupPermissions._src
            );

            if (!relatedModelsPermissions) {
                continue;
            }

            const entriesPermissionsList = await this.getEntriesPermissions();
            const relatedEntriesPermissions = entriesPermissionsList.find(
                permissions => permissions._src === groupPermissions._src
            );

            if (!relatedEntriesPermissions) {
                continue;
            }

            if (groupPermissions.own) {
                const group = await this.getGroup(model.group.id);
                if (!group) {
                    continue;
                }

                const groupCreatedBy = group.createdBy;
                if (!groupCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (groupCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true,
                    pw: relatedEntriesPermissions.pw
                });

                continue;
            }

            if (groupPermissions.groups) {
                const { groups } = groupPermissions;

                if (!Array.isArray(groups[model.locale])) {
                    continue;
                }

                if (!groups[model.locale].includes(model.group.id)) {
                    continue;
                }
            }

            if (relatedModelsPermissions.own) {
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
                    canAccessOnlyOwned: true,
                    pw: relatedEntriesPermissions.pw
                });
            }

            if (relatedModelsPermissions.models) {
                if (!Array.isArray(relatedModelsPermissions.models[model.locale])) {
                    continue;
                }

                if (!relatedModelsPermissions.models[model.locale].includes(model.modelId)) {
                    continue;
                }
            }

            const fullAccess =
                !relatedEntriesPermissions.rwd &&
                !relatedEntriesPermissions.own &&
                !relatedEntriesPermissions.models;

            if (fullAccess) {
                acl.push({
                    rwd: "rwd",
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true,
                    pw: "pu"
                });

                continue;
            }

            if (relatedEntriesPermissions.own) {
                if ("entry" in params) {
                    const entryCreatedBy = params.entry?.createdBy;
                    if (!entryCreatedBy) {
                        continue;
                    }

                    const identity = await this.getIdentity();
                    if (entryCreatedBy.id !== identity.id) {
                        continue;
                    }
                }

                acl.push({
                    rwd: relatedEntriesPermissions.rwd,
                    canAccessNonOwned: false,
                    canAccessOnlyOwned: true,
                    pw: relatedEntriesPermissions.pw
                });

                continue;
            }

            acl.push({
                rwd: relatedEntriesPermissions.rwd,
                canAccessNonOwned: true,
                canAccessOnlyOwned: false,
                pw: relatedEntriesPermissions.pw
            });
        }

        return acl;
    }

    async hasFullAccessToEntries(params: GetEntriesAccessControlListParams) {
        if (this.modelAuthorizationDisabled(params)) {
            return true;
        }

        const permissions = await this.getEntriesPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }

    private modelAuthorizationDisabled(params: { model: CmsModel }) {
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
        if (this.allGroups === null) {
            this.allGroups = this.listAllGroupsCallback();
        }

        return this.allGroups;
    }

    async getGroup(id: string): Promise<CmsGroup | undefined> {
        const groups = await this.listAllGroups();
        return groups.find(group => group.id === id);
    }
}
