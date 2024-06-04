import { Context } from "~/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import { createTypeDefs } from "./typeDefs";
import { createResolvers } from "./resolvers";
import { listModels } from "~/graphql/models";

export const attachHeadlessCmsImportExportGraphQL = async (context: Context): Promise<void> => {
    const models = await listModels(context);

    if (models.length === 0) {
        return;
    }

    const plugin = new CmsGraphQLSchemaPlugin<Context>({
        typeDefs: createTypeDefs(models as [string, ...string[]]),
        resolvers: createResolvers(models as [string, ...string[]])
    });

    plugin.name = "headlessCms.graphql.importExport";

    context.plugins.register(plugin);
};
