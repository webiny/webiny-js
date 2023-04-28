import { AcoContext } from "@webiny/api-aco/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import { CMS_ENTRY_FOLDER_GRAPHQL_SCHEMA_FIELD } from "~/contants";

export const attachManageGraphQLSchema = async (
    context: Pick<AcoContext, "cms" | "plugins" | "security">
): Promise<void> => {
    const models = await context.security.withoutAuthorization(async () => {
        return (await context.cms.listModels()).filter(model => !model.isPrivate);
    });

    const schema = new CmsGraphQLSchemaPlugin({
        typeDefs: models
            .map(model => {
                return `
                extend input ${model.singularApiName}Input {
                    ${CMS_ENTRY_FOLDER_GRAPHQL_SCHEMA_FIELD}: String
                }
            `;
            })
            .join("\n"),
        resolvers: {}
    });
    context.plugins.register(schema);
};
