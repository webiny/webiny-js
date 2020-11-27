import defaults from "./defaults";
import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";

type EnvironmentType = {
    name: string;
    slug: string;
    description: string;
    createdFrom: string;
};
type EnvironmentContextType = {
    get: (id: string) => Promise<EnvironmentType>;
    list: () => Promise<EnvironmentType[]>;
    create: (data: EnvironmentType) => Promise<EnvironmentType>;
    update: (id: string, data: EnvironmentType) => Promise<EnvironmentType>;
    delete: (id: string) => Promise<void>;
};
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

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent } = context;
        const PK_ENVIRONMENT = `CE#${i18nContent?.locale?.code}`;

        const environment: EnvironmentContextType = {
            async get(id: string): Promise<EnvironmentType> {
                const [response] = await db.read<EnvironmentType>({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    limit: 1
                });
                if (!response || response.length === 0) {
                    return null;
                }
                return response[0];
            },
            async list(): Promise<EnvironmentType[]> {
                const [response] = await db.read<EnvironmentType>({
                    ...defaults.db,
                    query: { PK: PK_ENVIRONMENT, SK: { $gt: " " } }
                });

                return response;
            },
            async create(data: EnvironmentType): Promise<EnvironmentType> {
                const identity = context.security.getIdentity();
                const createData = new CreateEnvironmentModel().populate(data);
                await createData.validate();

                const id = mdbid();

                data = Object.assign(await createData.toJSON(), {
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

                await db.create({ ...defaults.db, data });

                return data;
            },
            async update(id: string, data: EnvironmentType): Promise<EnvironmentType> {
                const updateData = new UpdateEnvironmentModel().populate(data);
                await updateData.validate();

                data = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.es,
                    query: { PK: PK_ENVIRONMENT, SK: id },
                    data
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
