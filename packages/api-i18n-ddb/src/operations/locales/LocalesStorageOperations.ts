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

interface ConstructorParams {
    context: I18NContext;
}

const DEFAULT_SORT_KEY = "default";

export class LocalesStorageOperations implements I18NLocalesStorageOperations {
    private readonly _context: I18NContext;
    private readonly _table: Table;
    private readonly _entity: Entity<any>;

    private get partitionKey(): string {
        const tenant = this._context.tenancy.getCurrentTenant();
        if (!tenant) {
            throw new WebinyError("Tenant missing.", "TENANT_NOT_FOUND");
        }
        return `T#${tenant.id}#I18N#L`;
    }

    private get defaultPartitionKey(): string {
        return `${this.partitionKey}#D`;
    }

    public constructor({ context }: ConstructorParams) {
        this._context = context;
        this._table = defineTable({
            context
        });

        this._entity = defineLocaleEntity({
            context,
            table: this._table
        });
    }

    public async getDefault(): Promise<I18NLocale> {
        try {
            const locale = await this._entity.get({
                PK: this.defaultPartitionKey,
                SK: DEFAULT_SORT_KEY
            });
            if (!locale || !locale.Item) {
                return null;
            }
            return cleanupItem(this._entity, locale.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the I18N locale.",
                ex.code || "GET_DEFAULT_LOCALE_ERROR"
            );
        }
    }

    public async get(code: string): Promise<I18NLocale> {
        try {
            const locale = await this._entity.get({
                PK: this.partitionKey,
                SK: code
            });
            if (!locale || !locale.Item) {
                return null;
            }
            return cleanupItem(this._entity, locale.Item);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not fetch the I18N locale.",
                ex.code || "GET_LOCALE_ERROR"
            );
        }
    }

    public async create({ locale }: I18NLocalesStorageOperationsCreateParams): Promise<I18NLocale> {
        const keys = {
            PK: this.partitionKey,
            SK: this.getSortKey(locale)
        };

        try {
            await this._entity.put({
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
            PK: this.partitionKey,
            SK: this.getSortKey(locale)
        };
        try {
            await this._entity.put({
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
                PK: this.partitionKey,
                SK: this.getSortKey(locale)
            },
            {
                ...locale,
                PK: this.defaultPartitionKey,
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
                PK: this.partitionKey,
                SK: this.getSortKey(previous)
            });
        }

        try {
            await this._table.batchWrite(batch.map(item => this._entity.putBatch(item)));
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
            PK: this.partitionKey,
            SK: this.getSortKey(locale)
        };
        try {
            await this._entity.delete(keys);
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
        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredFiles = filterItems({
            items: results,
            where,
            context: this._context
        });

        const totalCount = filteredFiles.length;
        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedFiles = sortItems({
            context: this._context,
            items: filteredFiles,
            sort,
            // TODO: add possibility to add more fields via plugins
            fields: ["code", "createdBy", "createdOn"]
        });
        /**
         * Use the common db-dynamodb method to create the required response.
         */
        return createListResponse<I18NLocale>({
            items: cleanupItems(this._entity, sortedFiles),
            after,
            totalCount,
            limit
        });
    }

    private getSortKey(locale: I18NLocale): string {
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
        let partitionKey = this.partitionKey;
        if (where.default === true) {
            partitionKey = this.defaultPartitionKey;
            delete where.default;
        }
        return {
            entity: this._entity,
            partitionKey,
            options: {}
        };
    }
}
