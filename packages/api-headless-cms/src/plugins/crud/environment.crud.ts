import defaults from "./defaults";
import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import { CmsEnvironmentType, CmsEnvironmentContextType } from "@webiny/api-headless-cms/types";

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

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_ENVIRONMENT = createPartitionKey(i18nContent);

        const environment: CmsEnvironmentContextType = {
            async get(id: string): Promise<CmsEnvironmentType | null> {
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
            async create(data: CmsEnvironmentType): Promise<CmsEnvironmentType> {
                const identity = context.security.getIdentity();
                const createData = new CreateEnvironmentModel().populate(data);
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
                });

                await db.create({
                    ...defaults.db,
                    data: modelData
                });

                return modelData;
            },
            async update(id: string, data: CmsEnvironmentType): Promise<CmsEnvironmentType> {
                const updateData = new UpdateEnvironmentModel().populate(data);
                await updateData.validate();

                const modelData = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.es,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    data: modelData
                });

                return data;
            },
            async delete(id: string): Promise<void> {
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: id }
                });
            }
        };
        context.cms = {
            ...(context.cms || {}),
            environment
        };
    }
} as ContextPlugin<DbContext, I18NContentContext>;
