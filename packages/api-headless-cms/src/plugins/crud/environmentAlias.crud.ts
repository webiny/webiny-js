import defaults from "./defaults";
import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import {
    CmsEnvironmentAliasType,
    CmsEnvironmentAliasContextType,
    CmsContextType
} from "@webiny/api-headless-cms/types";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";

const CreateEnvironmentAliasModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("required,maxLength:100") }),
    description: string({ validation: validation.create("required,maxLength:255") }),
    environment: string({ validation: validation.create("required,maxLength:255") })
})();
const UpdateEnvironmentAliasModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    environment: string({ validation: validation.create("maxLength:255") })
})();

const TYPE = "envAlias";
const PARTITION_KEY_START = "CEA#";
const createPartitionKey = (i18nContent: Record<string, any>) => {
    if (!i18nContent || !i18nContent.locale) {
        return PARTITION_KEY_START;
    }
    return `${PARTITION_KEY_START}${i18nContent.locale.code}`;
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_ENVIRONMENT = createPartitionKey(i18nContent);

        const environmentAlias: CmsEnvironmentAliasContextType = {
            async get(id): Promise<CmsEnvironmentAliasType | null> {
                const [response] = await db.read<CmsEnvironmentAliasType>({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: id },
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
                    query: { PK: PK_ENVIRONMENT, SK: { $gt: " " } }
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

                const targetEnvironment = await context.cms.environment.get(
                    createDataJson.environment
                );
                if (!targetEnvironment) {
                    throw new Error(
                        `Target Environment "${createDataJson.environment}" does not exist.`
                    );
                }
                const id = mdbid();

                const modelData = Object.assign(createDataJson, {
                    PK: PK_ENVIRONMENT,
                    SK: id,
                    TYPE,
                    id,
                    createdOn: new Date().toISOString(),
                    environment: targetEnvironment,
                    createdBy
                });

                // before create hook
                const aliases = await context.cms.environmentAlias.list();
                const existingAliasSlug = aliases.some(alias => {
                    return alias.slug === slug;
                });
                if (existingAliasSlug) {
                    throw Error(`Environment alias with the slug "${this.slug}" already exists.`);
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

                const modelData = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.es,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    data: {
                        ...modelData,
                        createdOn: new Date().toISOString()
                    }
                });

                return modelData;
            },
            async delete(model): Promise<void> {
                // before delete hook
                if (model.slug === "production") {
                    throw new Error(`Cannot delete "production" environment alias.`);
                }
                // delete
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: model.id }
                });
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            environmentAlias
        };
    }
} as ContextPlugin<DbContext, I18NContentContext, CmsContextType>;
