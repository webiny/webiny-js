import {
    I18NContext,
    I18NLocale,
    I18NLocalesStorageOperations,
    I18NLocalesStorageOperationsCreateParams,
    I18NLocalesStorageOperationsDeleteParams,
    I18NLocalesStorageOperationsListParams,
    I18NLocalesStorageOperationsListResponse,
    I18NLocalesStorageOperationsUpdateDefaultParams,
    I18NLocalesStorageOperationsUpdateParams
} from "@webiny/api-i18n/types";
import { Entity, Table } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import defineTable from "~/definitions/table";
import defineLocaleEntity from "~/definitions/localeEntity";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";
import { createListResponse } from "@webiny/db-dynamodb/utils/listResponse";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { LocaleDynamoDbFieldPlugin } from "~/plugins/LocaleDynamoDbFieldPlugin";

interface ConstructorParams {
    context: I18NContext;
}

const DEFAULT_SORT_KEY = "default";

export class LocalesStorageOperations implements I18NLocalesStorageOperations {
    private readonly context: I18NContext;
    private readonly table: Table;
    private readonly entity: Entity<any>;

    public constructor({ context }: ConstructorParams) {
        this.context = context;
        this.table = defineTable({
            context
        });

        this.entity = defineLocaleEntity({
            context,
            table: this.table
        });
    }

    public async getDefault(): Promise<I18NLocale> {
        try {
            const locale = await this.entity.get({
                PK: this.createDefaultPartitionKey(),
                SK: DEFAULT_SORT_KEY
            });
            if (!locale || !locale.Item) {
                return null;
            }
            return cleanupItem(this.entity, locale.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the I18N locale.",
                ex.code || "GET_DEFAULT_LOCALE_ERROR"
            );
        }
    }

    public async get(code: string): Promise<I18NLocale> {
        try {
            const locale = await this.entity.get({
                PK: this.createPartitionKey(),
                SK: code
            });
            if (!locale || !locale.Item) {
                return null;
            }
            return cleanupItem(this.entity, locale.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the I18N locale.",
                ex.code || "GET_LOCALE_ERROR"
            );
        }
    }

    public async create({ locale }: I18NLocalesStorageOperationsCreateParams): Promise<I18NLocale> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.getSortKey(locale)
        };

        try {
            await this.entity.put({
                ...locale,
                ...keys
            });
            return locale;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot create I18N locale.",
                ex.code || "CREATE_LOCALE_ERROR",
                {
                    locale,
                    keys
                }
            );
        }
    }

    public async update({ locale }: I18NLocalesStorageOperationsUpdateParams): Promise<I18NLocale> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.getSortKey(locale)
        };
        try {
            await this.entity.put({
                ...locale,
                ...keys
            });
            return locale;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot update I18N locale.",
                ex.code || "UPDATE_LOCALE_ERROR",
                {
                    locale,
                    keys
                }
            );
        }
    }

    public async updateDefault({
        previous,
        locale
    }: I18NLocalesStorageOperationsUpdateDefaultParams): Promise<I18NLocale> {
        /**
         * Set the locale as the default one.
         */
        const batch = [
            {
                ...locale,
                PK: this.createPartitionKey(),
                SK: this.getSortKey(locale)
            },
            {
                ...locale,
                PK: this.createDefaultPartitionKey(),
                SK: DEFAULT_SORT_KEY
            }
        ];
        /**
         * Set the previous locale not to be default in its data.
         */
        if (previous) {
            batch.push({
                ...previous,
                default: false,
                PK: this.createPartitionKey(),
                SK: this.getSortKey(previous)
            });
        }

        try {
            await this.table.batchWrite(batch.map(item => this.entity.putBatch(item)));
            return locale;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot update I18N locale.",
                ex.code || "UPDATE_LOCALE_ERROR",
                {
                    locale,
                    previous,
                    batch
                }
            );
        }
    }

    public async delete({ locale }: I18NLocalesStorageOperationsDeleteParams): Promise<void> {
        const keys = {
            PK: this.createPartitionKey(),
            SK: this.getSortKey(locale)
        };
        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot delete I18N locale.",
                ex.code || "DELETE_LOCALE_ERROR",
                {
                    locale,
                    keys
                }
            );
        }
    }

    public async list(
        params: I18NLocalesStorageOperationsListParams
    ): Promise<I18NLocalesStorageOperationsListResponse> {
        const { where: initialWhere, after, limit, sort } = params;
        const where = {
            ...(initialWhere || {})
        };
        const queryAllParams = this.createQueryAllParamsOptions({
            ...params,
            where
        });

        let results: I18NLocale[] = [];
        try {
            results = await queryAll<I18NLocale>(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Cannot list I18N locales.",
                ex.code || "LIST_LOCALES_ERROR",
                params
            );
        }
        const fields = this.context.plugins.byType<LocaleDynamoDbFieldPlugin>(
            LocaleDynamoDbFieldPlugin.type
        );
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredFiles = filterItems({
            items: results,
            where,
            context: this.context,
            fields
        });

        const totalCount = filteredFiles.length;
        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedFiles = sortItems({
            items: filteredFiles,
            sort,
            // TODO: add possibility to add more fields via plugins
            fields
        });
        /**
         * Use the common db-dynamodb method to create the required response.
         */
        return createListResponse<I18NLocale>({
            items: cleanupItems(this.entity, sortedFiles),
            after,
            totalCount,
            limit
        });
    }

    public createPartitionKey(): string {
        const tenant = this.context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#I18N#L`;
    }

    public createDefaultPartitionKey(): string {
        return `${this.createPartitionKey()}#D`;
    }

    public getSortKey(locale: I18NLocale): string {
        if (!locale.code) {
            throw new WebinyError("Missing locale code.", "CODE_ERROR", {
                locale
            });
        }
        return locale.code;
    }

    private createQueryAllParamsOptions(
        params: I18NLocalesStorageOperationsListParams
    ): QueryAllParams {
        const { where } = params;
        let partitionKey = this.createPartitionKey();
        if (where.default === true) {
            partitionKey = this.createDefaultPartitionKey();
            delete where.default;
        }
        return {
            entity: this.entity,
            partitionKey,
            options: {}
        };
    }
}
