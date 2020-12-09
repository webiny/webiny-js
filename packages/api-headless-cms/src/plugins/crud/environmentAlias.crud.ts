import defaults from "../../common/defaults";
import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import {
    CmsEnvironmentAliasType,
    CmsEnvironmentAliasContextType,
    CmsCrudContextType,
    CmsEnvironmentType,
    CmsContext
} from "../../types";
import toSlug from "../../utils/toSlug";
import { createEnvironmentAliasPk } from "../../common/partitionKeys";
import { DbItemTypes } from "../../common/dbItemTypes";

const CreateEnvironmentAliasModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    environment: string({ validation: validation.create("required,maxLength:255") })
})();
const UpdateEnvironmentAliasModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    environment: string({ validation: validation.create("maxLength:255") })
})();

const fetchTargetEnvironment = async (
    context: CmsCrudContextType,
    id: string
): Promise<CmsEnvironmentType> => {
    const targetEnvironment = await context.cms.environments.get(id);
    if (!targetEnvironment) {
        throw new Error(`Target Environment "${id}" does not exist.`);
    }
    return targetEnvironment;
};

const productionsSlugs = ["production"];

export default {
    type: "context",
    apply(context) {
        const { db } = context;

        const environmentAliases: CmsEnvironmentAliasContextType = {
            async get(id): Promise<CmsEnvironmentAliasType | null> {
                const [response] = await db.read<CmsEnvironmentAliasType>({
                    ...defaults.db,
                    query: { PK: createEnvironmentAliasPk(context), SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            async list(): Promise<CmsEnvironmentAliasType[]> {
                const [response] = await db.read<CmsEnvironmentAliasType>({
                    ...defaults.db,
                    query: { PK: createEnvironmentAliasPk(context), SK: { $gt: " " } }
                });

                return response;
            },
            async create(data, createdBy): Promise<CmsEnvironmentAliasType> {
                const slug = toSlug(data.slug || data.name);
                const createData = new CreateEnvironmentAliasModel().populate({
                    ...data,
                    slug
                });
                await createData.validate();
                const createDataJson = await createData.toJSON();

                const targetEnvironment = await fetchTargetEnvironment(
                    context,
                    createDataJson.environment
                );
                const id = mdbid();

                const modelData = Object.assign(createDataJson, {
                    PK: createEnvironmentAliasPk(context),
                    SK: id,
                    TYPE: DbItemTypes.CMS_ENVIRONMENT_ALIAS,
                    id,
                    createdOn: new Date().toISOString(),
                    environment: targetEnvironment,
                    createdBy
                });

                // before create hook
                const aliases = await context.cms.environmentAliases.list();
                const existingAliasSlug = aliases.some(alias => {
                    return alias.slug === slug;
                });
                if (existingAliasSlug) {
                    throw new Error(`Environment alias with the slug "${slug}" already exists.`);
                }
                // create
                await db.create({
                    ...defaults.db,
                    data: modelData
                });

                return modelData;
            },
            async update(id, data): Promise<CmsEnvironmentAliasType> {
                const updateData = new UpdateEnvironmentAliasModel().populate(data);
                await updateData.validate();

                const updatedDataJson = await updateData.toJSON({ onlyDirty: true });

                // no need to continue if no values were changed
                if (Object.keys(updatedDataJson).length === 0) {
                    return {} as any;
                }

                const modelData = Object.assign(updatedDataJson, {
                    changedOn: new Date().toISOString()
                });

                if (modelData.environment) {
                    modelData.environment = await fetchTargetEnvironment(
                        context,
                        modelData.environment
                    );
                }

                await db.update({
                    ...defaults.es,
                    query: { PK: createEnvironmentAliasPk(context), SK: id },
                    data: modelData
                });

                return modelData;
            },
            async delete(model): Promise<void> {
                // before delete hook
                if (productionsSlugs.includes(model.slug)) {
                    throw new Error(
                        `Cannot delete "${model.name}" environment alias, it is marked as a production alias.`
                    );
                }
                // delete
                await db.delete({
                    ...defaults.db,
                    query: { PK: createEnvironmentAliasPk(context), SK: model.id }
                });
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            environmentAliases
        };
    }
} as ContextPlugin<CmsContext>;
