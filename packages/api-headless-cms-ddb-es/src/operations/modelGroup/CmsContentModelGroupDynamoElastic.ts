import {
    CmsContentModelGroup,
    CmsContentModelGroupStorageOperations,
    CmsContentModelGroupStorageOperationsCreateArgs,
    CmsContentModelGroupStorageOperationsDeleteArgs,
    CmsContentModelGroupStorageOperationsGetArgs,
    CmsContentModelGroupStorageOperationsListArgs,
    CmsContentModelGroupStorageOperationsUpdateArgs,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import configurations from "../../configurations";
import { createBasePartitionKey } from "../../utils";

const whereKeySuffix = [
    "_not",
    "_not_in",
    "_in",
    "_gt",
    "_gte",
    "_lt",
    "_lte",
    "_not_between",
    "_between"
].join("|");

const removeWhereKeySuffix = (key: string): string => {
    return key.replace(new RegExp(`${whereKeySuffix}$`), "");
};

const compare = (key: string, compareValue: any, value: any): boolean => {
    if (key.endsWith("_not")) {
        return String(value) !== compareValue;
    } else if (key.endsWith("_not_in")) {
        return !compareValue.includes(value);
    } else if (key.endsWith("_in")) {
        return compareValue.includes(value);
    } else if (key.endsWith("_gt")) {
        return value > compareValue;
    } else if (key.endsWith("_gte")) {
        return value >= compareValue;
    } else if (key.endsWith("_lt")) {
        return value < compareValue;
    } else if (key.endsWith("_lte")) {
        return value <= compareValue;
    } else if (key.endsWith("_not_between")) {
        if (!Array.isArray(compareValue) || compareValue.length === 0) {
            throw new WebinyError(`Wrong compareValue for "${key}".`);
        }
        return value < compareValue[0] && value > compareValue[1];
    } else if (key.endsWith("_between")) {
        if (!Array.isArray(compareValue) || compareValue.length === 0) {
            throw new WebinyError(`Wrong compareValue for "${key}".`);
        }
        return value >= compareValue[0] && value <= compareValue[1];
    }
    return compareValue === value;
};

const whereFilterFactory = (where: Record<string, any> = {}) => {
    return model => {
        if (!where) {
            return true;
        }
        for (const key in where) {
            const whereValue = where[key];
            const value = model[removeWhereKeySuffix(key)];
            return compare(key, whereValue, value);
        }
        return true;
    };
};

interface ConstructorArgs {
    context: CmsContext;
}
export default class CmsContentModelGroupDynamoElastic
    implements CmsContentModelGroupStorageOperations {
    private readonly _context: CmsContext;

    private get context(): CmsContext {
        return this._context;
    }

    private get partitionKey(): string {
        return `${createBasePartitionKey(this.context)}#CMG`;
    }

    public constructor({ context }: ConstructorArgs) {
        this._context = context;
    }

    public async create({ data }: CmsContentModelGroupStorageOperationsCreateArgs) {
        const { db } = this.context;
        const dbData = {
            PK: this.partitionKey,
            SK: data.id,
            TYPE: "cms.group",
            ...data,
            webinyVersion: this.context.WEBINY_VERSION
        };

        await db.create({
            ...configurations.db(),
            data: dbData
        });
        return dbData;
    }
    public async delete({ group }: CmsContentModelGroupStorageOperationsDeleteArgs) {
        const { db } = this.context;
        const { id } = group;
        await db.delete({
            ...configurations.db(),
            query: {
                PK: this.partitionKey,
                SK: id
            }
        });
        return true;
    }
    public async get({ id }: CmsContentModelGroupStorageOperationsGetArgs) {
        const { db } = this.context;
        const [[group]] = await db.read<CmsContentModelGroup>({
            ...configurations.db(),
            query: { PK: this.partitionKey, SK: id }
        });
        return group || null;
    }
    public async list({ where, limit }: CmsContentModelGroupStorageOperationsListArgs) {
        const { db } = this.context;
        const [groups] = await db.read<CmsContentModelGroup>({
            ...configurations.db(),
            query: {
                PK: this.partitionKey,
                SK: { $gt: " " }
            }
        });

        const whereKeys = Object.keys(where || {});
        if (whereKeys.length === 0) {
            return groups;
        }

        const filteredGroups = groups.filter(whereFilterFactory(where));

        return typeof limit !== "undefined" ? filteredGroups.slice(0, limit) : filteredGroups;
    }

    public async update({ group, data }: CmsContentModelGroupStorageOperationsUpdateArgs) {
        const { db } = this.context;
        await db.update({
            ...configurations.db(),
            query: { PK: this.partitionKey, SK: group.id },
            data: {
                ...data,
                webinyVersion: this.context.WEBINY_VERSION
            }
        });
        return {
            ...group,
            ...data
        };
    }
}
