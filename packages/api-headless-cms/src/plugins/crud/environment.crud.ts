import defaults from "./defaults";
import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import {
    CmsEnvironmentType,
    CmsEnvironmentContextType,
    CmsContextType
} from "@webiny/api-headless-cms/types";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";

const CreateEnvironmentModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("required,maxLength:100") }),
    description: string({ validation: validation.create("required,maxLength:255") }),
    createdFrom: string({ validation: validation.create("required,maxLength:65") })
})();
const UpdateEnvironmentModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    createdFrom: string({ validation: validation.create("maxLength:65") })
})();

const TYPE = "env";
const PARTITION_KEY_START = "CE#";

const createPartitionKey = (i18nContent: Record<string, any>) => {
    if (!i18nContent || !i18nContent.locale) {
        return PARTITION_KEY_START;
    }
    return `${PARTITION_KEY_START}${i18nContent.locale.code}`;
};

type CmsEnvironmentDynamoType = {
    PK: string;
    SK: string;
    TYPE: string;
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_ENVIRONMENT = createPartitionKey(i18nContent);

        const environment: CmsEnvironmentContextType = {
            async get(id): Promise<CmsEnvironmentType | null> {
                const [response] = await db.read<CmsEnvironmentType>({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response.find(() => true);
            },
            async list(): Promise<CmsEnvironmentType[]> {
                const [response] = await db.read<CmsEnvironmentType>({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: { $gt: " " } }
                });

                return response;
            },
            async create(data, initial): Promise<CmsEnvironmentType> {
                const identity = context.security.getIdentity();
                const slug = toSlug(data.slug || data.name);
                const createData = new CreateEnvironmentModel().populate({
                    ...data,
                    slug
                });
                await createData.validate();

                const id = mdbid();

                const modelData = Object.assign(await createData.toJSON(), {
                    PK: PK_ENVIRONMENT,
                    SK: id,
                    TYPE,
                    id,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        type: identity.type,
                        displayName: identity.displayName
                    }
                }) as CmsEnvironmentType & CmsEnvironmentDynamoType;

                // need to read all environments
                // because we need to check if environment with exact slug already exists
                // and to check if source environment environment actually exists - when required to
                const existingEnvironments = await context.cms.environment.list();
                const sourceEnvironment = existingEnvironments.find(model => {
                    return model.id === modelData.createdFrom.id;
                });

                // before create hook
                if (!initial && !sourceEnvironment) {
                    throw new Error('Base environment ("createdFrom" field) not set.');
                }
                const existing = existingEnvironments.some(model => {
                    return model.slug === slug;
                });
                if (existing) {
                    throw Error(`Environment with slug "${slug}" already exists.`);
                }
                // save
                await db.create({
                    ...defaults.db,
                    data: modelData
                });

                // after create hook
                // there is a possibility that there is no sourceEnvironment - installation process
                if (sourceEnvironment) {
                    await context.cms.dataManager.copyEnvironment({
                        copyFrom: sourceEnvironment.id,
                        copyTo: id
                    });
                }
                //

                return modelData;
            },
            async update(id, data): Promise<CmsEnvironmentType> {
                const updateData = new UpdateEnvironmentModel().populate(data);
                await updateData.validate();

                const modelData = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.es,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    data: modelData
                });

                // after change hook
                const aliases = (await context.cms.environmentAlias.list())
                    .filter(alias => {
                        return alias.environment.id === id;
                    })
                    // update all aliases last updated time
                    .map(alias => {
                        return {
                            data: {
                                ...alias,
                                changedOn: new Date()
                            }
                        };
                    });
                if (aliases.length > 0) {
                    const dbBatch = db.batch();
                    dbBatch.update(...aliases);
                    await dbBatch.execute();
                }

                return modelData;
            },
            async delete(id): Promise<void> {
                // before delete hook
                const aliases = (await context.cms.environmentAlias.list())
                    .filter(alias => {
                        return alias.environment.id === id;
                    })
                    .map(alias => alias.name);
                if (aliases.length) {
                    throw new Error(
                        `Cannot delete the environment because it's currently linked to the "${aliases.join(
                            ", "
                        )}" environment aliases.`
                    );
                }
                // delete
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: id }
                });
                // after delete hook
                await context.cms.dataManager.deleteEnvironment({ environment: id });
            }
        };
        context.cms = {
            ...(context.cms || ({} as any)),
            environment
        };
    }
} as ContextPlugin<DbContext, I18NContentContext, CmsContextType>;
