import defaults from "../defaults";
import mdbid from "mdbid";
import { CmsContentModelGroupContextType, CmsContentModelGroupType, CmsContext } from "../../types";
import { ContextPlugin } from "@webiny/handler/types";
import { createContentModelGroupPk } from "../partitionKeys";
import toSlug from "../../utils/toSlug";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import { DbItemTypes } from "../dbItemTypes";

const CreateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("required,maxLength:255") })
})();

const UpdateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("maxLength:255") })
})();

export default {
    type: "context",
    apply(context) {
        const { db } = context;

        const groups: CmsContentModelGroupContextType = {
            get: async id => {
                const [response] = await db.read<CmsContentModelGroupType>({
                    ...defaults.db,
                    query: { PK: createContentModelGroupPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            list: async () => {
                const [response] = await db.read<CmsContentModelGroupType>({
                    ...defaults.db,
                    query: { PK: createContentModelGroupPk(context), SK: { $gt: " " } }
                });
                return response;
            },
            create: async (data, createdBy) => {
                const slug = toSlug(data.slug || data.name);
                const createdData = new CreateContentModelGroupModel().populate({
                    ...data,
                    slug
                });
                await createdData.validate();
                const createdDataJson = await createdData.toJSON();

                const contentModelGroups = await context.cms.groups.list();

                const existingGroupSlug = contentModelGroups.some(group => {
                    return group.slug === slug;
                });
                if (existingGroupSlug) {
                    throw new Error(`Content model group with the slug "${slug}" already exists.`);
                }

                const id = mdbid();
                const model = {
                    PK: createContentModelGroupPk(context),
                    SK: id,
                    TYPE: DbItemTypes.CMS_CONTENT_MODEL_GROUP,
                    id,
                    ...createdDataJson,
                    createdOn: new Date().toISOString(),
                    createdBy
                };
                await db.create({
                    ...defaults.db,
                    data: model
                });
                return model;
            },
            update: async (id, data) => {
                const slugValue = data.slug || data.name;
                const updateData = new UpdateContentModelGroupModel().populate({
                    ...data,
                    slug: !!slugValue ? toSlug(slugValue) : undefined
                });
                await updateData.validate();

                const updatedDataJson = await updateData.toJSON({ onlyDirty: true });

                // no need to continue if no values were changed
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }

                if (updatedDataJson.slug) {
                    const contentModelGroups = (await context.cms.groups.list()).filter(group => {
                        return group.id !== id;
                    });
                    const existingGroupSlug = contentModelGroups.some(group => {
                        return group.slug === updatedDataJson.slug;
                    });
                    if (existingGroupSlug) {
                        throw new Error(
                            `Content model group with the slug "${updatedDataJson.slug}" already exists.`
                        );
                    }
                }

                const modelData = Object.assign(updatedDataJson, {
                    changedOn: new Date().toISOString()
                });

                await db.update({
                    ...defaults.es,
                    query: { PK: createContentModelGroupPk(context), SK: id },
                    data: modelData
                });
                return modelData;
            },
            delete: async id => {
                await db.delete({
                    ...defaults.db,
                    query: {
                        PK: createContentModelGroupPk(context),
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
} as ContextPlugin<CmsContext>;
