// @ts-nocheck
import {
    Group,
    GroupsStorageOperations,
    GroupsStorageOperationsCreateParams,
    GroupsStorageOperationsDeleteParams,
    GroupsStorageOperationsGetParams,
    GroupsStorageOperationsListParams,
    GroupsStorageOperationsUpdateParams
} from "@webiny/api-security/types";
import { Entity, Table } from "dynamodb-toolbox";
import { createTable } from "~/definitions/table";
import { createGroupEntity } from "~/definitions/groupEntity";
import Error from "@webiny/error";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { SecurityStorageParams } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export class GroupsStorageOperationsDdb implements GroupsStorageOperations {
    protected readonly tenant: string;
    protected readonly table: Table;
    protected readonly entity: Entity<any>;
    protected readonly plugins: PluginsContainer;

    public constructor({ tenant, plugins, table, documentClient }: SecurityStorageParams) {
        this.tenant = tenant;
        this.plugins = plugins;
        this.table = createTable({ table, documentClient });
        this.entity = createGroupEntity({ table: this.table, plugins });
    }

    public async get(
        tenant: string,
        { slug }: GroupsStorageOperationsGetParams
    ): Promise<Group | null> {
        const keys = {
            PK: this.createPartitionKey(tenant),
            SK: this.createSortKey(slug)
        };
        try {
            const result = await this.entity.get(keys);
            if (!result || !result.Item) {
                return null;
            }
            return this.cleanupItem(result.Item);
        } catch (ex) {
            throw new Error(ex.message || "Could not load group.", ex.code || "GET_GROUP_ERROR", {
                keys,
                slug
            });
        }
    }

    public async list(
        tenant: string,
        { sort }: GroupsStorageOperationsListParams
    ): Promise<Group[]> {
        let items: Group[] = [];
        try {
            items = await queryAll<Group>({
                entity: this.entity,
                partitionKey: this.createPartitionKey(tenant),
                options: {
                    beginsWith: "G#"
                }
            });
        } catch (ex) {
            throw new Error(ex.message || "Could not list groups.", ex.code || "LIST_GROUP_ERROR");
        }

        const sortedItems = sortItems({
            plugins: this.plugins,
            items,
            sort,
            fields: ["createdOn"]
        });
        return sortedItems.map(item => this.cleanupItem(item));
    }

    public async create(
        tenant: string,
        { group }: GroupsStorageOperationsCreateParams
    ): Promise<Group> {
        const keys = {
            PK: this.createPartitionKey(tenant),
            SK: this.createSortKey(group.slug)
        };

        try {
            await this.entity.put({
                ...group,
                TYPE: "security.group",
                ...keys
            });
            return group;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create group.",
                ex.code || "CREATE_GROUP_ERROR",
                {
                    keys
                }
            );
        }
    }

    public async update(
        tenant: string,
        { group }: GroupsStorageOperationsUpdateParams
    ): Promise<Group> {
        const keys = {
            PK: this.createPartitionKey(tenant),
            SK: this.createSortKey(group.slug)
        };

        try {
            await this.entity.put({
                ...group,
                ...keys
            });
            return group;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update group.",
                ex.code || "CREATE_UPDATE_ERROR",
                {
                    keys,
                    group
                }
            );
        }
    }

    public async delete(
        tenant: string,
        { group }: GroupsStorageOperationsDeleteParams
    ): Promise<Group> {
        const keys = {
            PK: this.createPartitionKey(tenant),
            SK: this.createSortKey(group.slug)
        };

        try {
            await this.entity.delete({
                ...keys
            });
            return group;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not delete group.",
                ex.code || "CREATE_DELETE_ERROR",
                {
                    keys,
                    group
                }
            );
        }
    }
    //
    // public async updateUserLinks(
    //     tenant: string,
    //     { group }: GroupsStorageOperationsUpdateUserLinksParams
    // ): Promise<void> {
    //     let links: DbItem<IdentityToTenantLink>[] = [];
    //     try {
    //         links = await queryAll<DbItem<IdentityToTenantLink>>({
    //             entity: this.entity,
    //             partitionKey: this.createPartitionKey(tenant),
    //             options: {
    //                 index: "GSI1",
    //                 beginsWith: `${this.createSortKey(group.slug)}#`
    //             }
    //         });
    //     } catch (ex) {
    //         throw new Error(
    //             ex.message || "Could not get all the user <-> group links.",
    //             ex.code || "USER_GROUP_LINKS_LIST_ERROR"
    //         );
    //     }
    //     const items = links.map(link => {
    //         return this.linksEntity.putBatch({
    //             ...link,
    //             group: {
    //                 slug: group.slug,
    //                 name: group.name,
    //                 permissions: group.permissions
    //             }
    //         });
    //     });
    //     try {
    //         await batchWriteAll({
    //             table: this.table,
    //             items
    //         });
    //     } catch (ex) {
    //         throw new Error(
    //             ex.message || "Could not update user <-> group links.",
    //             ex.code || "UPDATE_USER_LINKS_ERROR",
    //             {
    //                 group
    //             }
    //         );
    //     }
    // }

    protected createPartitionKey(tenant: string) {
        return `T#${tenant}`;
    }

    protected createSortKey(slug: string): string {
        return `G#${slug}`;
    }

    private cleanupItem(item: Group & Record<string, any>): Group {
        return cleanupItem(this.entity, item, ["TYPE"]);
    }
}
