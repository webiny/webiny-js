import { withFields, string } from "@commodo/fields";
import { ContextPlugin } from "@webiny/handler/types";
import { validation } from "@webiny/validation";
import mdbid from "mdbid";
import {
    CmsContentModelGroupContextType,
    CmsContentModelGroupPermissionType,
    CmsContentModelGroupType,
    CmsContext,
    DbItemTypes
} from "../../../types";
import * as utils from "../../../utils";
import { beforeDeleteHook } from "./contentModelGroup/beforeDelete.hook";
import { beforeCreateHook } from "./contentModelGroup/beforeCreate.hook";
import { NotFoundError } from "@webiny/handler-graphql";

const CreateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("required,maxLength:255") })
})();

const UpdateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("maxLength:255") })
})();

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
            throw new Error(`Wrong compareValue for "${key}".`);
        }
        return value < compareValue[0] && value > compareValue[1];
    } else if (key.endsWith("_between")) {
        if (!Array.isArray(compareValue) || compareValue.length === 0) {
            throw new Error(`Wrong compareValue for "${key}".`);
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
        if (!where.hasOwnProperty) {
            throw new Error(
                `Argument "where" does not "hasOwnProperty" because it is a "${typeof where}"`
            );
        }
        for (const key in where) {
            if (where.hasOwnProperty(key) === false) {
                continue;
            }
            const whereValue = where[key];
            const value = model[removeWhereKeySuffix(key)];
            return compare(key, whereValue, value);
        }
        return true;
    };
};

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    async apply(context) {
        const { db } = context;

        const PK_GROUP = () => `${utils.createCmsPK(context)}#CMG`;

        const checkPermissions = (check: string): Promise<CmsContentModelGroupPermissionType> => {
            return utils.checkPermissions(context, "cms.contentModelGroup", { rwd: check });
        };

        const groups: CmsContentModelGroupContextType = {
            get: async id => {
                const permission = await checkPermissions("r");

                const [[group]] = await db.read<CmsContentModelGroupType>({
                    ...utils.defaults.db,
                    query: { PK: PK_GROUP(), SK: id }
                });

                if (!group) {
                    throw new NotFoundError(`Content model group "${id}" was not found!`);
                }

                utils.checkOwnership(context, permission, group);

                return group;
            },
            list: async ({ where, limit } = {}) => {
                const permission = await checkPermissions("r");

                const [response] = await db.read<CmsContentModelGroupType>({
                    ...utils.defaults.db,
                    query: { PK: PK_GROUP(), SK: { $gt: " " } },
                    limit
                });

                const groups = response.filter(group =>
                    utils.validateOwnership(context, permission, group)
                );

                const whereKeys = Object.keys(where || {});
                if (whereKeys.length === 0) {
                    return response;
                }

                return groups.filter(whereFilterFactory(where));
            },
            create: async data => {
                await checkPermissions("w");

                const createdData = new CreateContentModelGroupModel().populate({
                    ...data,
                    slug: data.slug ? utils.toSlug(data.slug) : ""
                });
                await createdData.validate();
                const createdDataJson = await createdData.toJSON();

                await beforeCreateHook(context, createdDataJson);

                const identity = context.security.getIdentity();

                const id = mdbid();
                const model: CmsContentModelGroupType = {
                    ...createdDataJson,
                    id,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    }
                };

                const dbData = {
                    PK: PK_GROUP(),
                    SK: id,
                    TYPE: DbItemTypes.CMS_CONTENT_MODEL_GROUP,
                    ...model
                };

                await db.create({
                    ...utils.defaults.db,
                    data: dbData
                });
                return model;
            },
            update: async (id, data) => {
                const permission = await checkPermissions("w");

                const group = await context.cms.groups.get(id);

                utils.checkOwnership(context, permission, group);

                const updateData = new UpdateContentModelGroupModel().populate(data);
                await updateData.validate();

                const updatedDataJson = await updateData.toJSON({ onlyDirty: true });

                // no need to continue if no values were changed
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }

                const modelData = Object.assign(updatedDataJson, {
                    savedOn: new Date().toISOString()
                });

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: PK_GROUP(), SK: id },
                    data: modelData
                });

                return { ...group, ...modelData };
            },
            delete: async id => {
                const permission = await checkPermissions("d");

                const group = await context.cms.groups.get(id);

                utils.checkOwnership(context, permission, group);

                await beforeDeleteHook(context, id);

                await db.delete({
                    ...utils.defaults.db,
                    query: {
                        PK: PK_GROUP(),
                        SK: id
                    }
                });

                return true;
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            groups
        };
    }
});
