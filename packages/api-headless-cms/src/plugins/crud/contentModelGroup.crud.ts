import defaults from "./defaults";
import mdbid from "mdbid";
import {
    CmsContentModelGroupContextType,
    CmsContentModelGroupType,
    CmsContextType,
    CmsEnvironmentType
} from "@webiny/api-headless-cms/types";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { createContentModelGroupPk } from "@webiny/api-headless-cms/plugins/crud/partitionKeys";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";

const CreateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("required,maxLength:255") }),
    environment: string({ validation: validation.create("required,maxLength:255") })
})();

const UpdateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("maxLength:255") })
})();

const fetchTargetEnvironment = async (
    context: CmsContextType,
    id: string
): Promise<CmsEnvironmentType> => {
    const env = await context.cms.environment.get(id);
    if (!env) {
        throw new Error(`There is no environment "${id}".`);
    }
    return env;
};

const TYPE = "cms#cmg";

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

                const id = mdbid();

                const targetEnvironment = await fetchTargetEnvironment(
                    context,
                    createdDataJson.environment
                );

                const model = {
                    PK: createContentModelGroupPk(context),
                    SK: id,
                    TYPE,
                    id,
                    ...createdDataJson,
                    environment: targetEnvironment,
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
} as ContextPlugin<DbContext, I18NContentContext, CmsContextType, TenancyContext>;
