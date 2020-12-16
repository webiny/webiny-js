import { withFields, string } from "@commodo/fields";
import { ContextPlugin } from "@webiny/handler/types";
import { validation } from "@webiny/validation";
import mdbid from "mdbid";
import {
    CmsContentModelGroupContextType,
    CmsContentModelGroupType,
    CmsContext,
    DbItemTypes
} from "../../../types";
import * as utils from "../../../utils";
import { beforeDeleteHook } from "./contentModelGroup/beforeDelete.hook";
import { afterSaveHook } from "./contentModelGroup/afterSave.hook";
import { beforeCreateHook } from "./contentModelGroup/beforeCreate.hook";

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

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    async apply(context) {
        const { db } = context;

        const groups: CmsContentModelGroupContextType = {
            get: async id => {
                const [response] = await db.read<CmsContentModelGroupType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelGroupPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            list: async ({ search, limit } = {}) => {
                const [response] = await db.read<CmsContentModelGroupType>({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelGroupPk(context), SK: { $gt: " " } },
                    limit
                });
                const searchKeys = Object.keys(search || {});
                if (searchKeys.length > 0) {
                    return response.filter(group => {
                        return searchKeys.every(key => {
                            return group[key] === search[key];
                        });
                    });
                }
                return response;
            },
            create: async (data, createdBy) => {
                const createdData = new CreateContentModelGroupModel().populate({
                    ...data,
                    slug: data.slug ? utils.toSlug(data.slug) : ""
                });
                await createdData.validate();
                const createdDataJson = await createdData.toJSON();

                await beforeCreateHook(context, createdDataJson);

                const id = mdbid();
                const model = {
                    PK: utils.createContentModelGroupPk(context),
                    SK: id,
                    TYPE: DbItemTypes.CMS_CONTENT_MODEL_GROUP,
                    id,
                    ...createdDataJson,
                    createdOn: new Date().toISOString(),
                    createdBy
                };
                await db.create({
                    ...utils.defaults.db,
                    data: model
                });
                return model;
            },
            update: async (id, data) => {
                const updateData = new UpdateContentModelGroupModel().populate(data);
                await updateData.validate();

                const updatedDataJson = await updateData.toJSON({ onlyDirty: true });

                // no need to continue if no values were changed
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }

                const modelData = Object.assign(updatedDataJson, {
                    changedOn: new Date().toISOString()
                });

                await db.update({
                    ...utils.defaults.db,
                    query: { PK: utils.createContentModelGroupPk(context), SK: id },
                    data: modelData
                });

                await afterSaveHook(context);

                return modelData;
            },
            delete: async id => {
                await beforeDeleteHook(context, id);
                await db.delete({
                    ...utils.defaults.db,
                    query: {
                        PK: utils.createContentModelGroupPk(context),
                        SK: id
                    }
                });
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            groups
        };
    }
});
