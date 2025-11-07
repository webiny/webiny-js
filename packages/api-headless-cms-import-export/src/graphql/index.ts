import type { Context } from "~/types.js";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import { createTypeDefs } from "./typeDefs.js";
import { createResolvers } from "./resolvers.js";
import { listModels } from "~/graphql/models.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export const attachHeadlessCmsImportExportGraphQL = async (context: Context): Promise<void> => {
    const tenant = context.tenancy.getCurrentTenant();
    const models = await listModels(context);

    if (models.length === 0) {
        return;
    }

    const plugin = new CmsGraphQLSchemaPlugin<Context>({
        typeDefs: createTypeDefs(models as NonEmptyArray<CmsModel>),
        resolvers: createResolvers(models as NonEmptyArray<CmsModel>),
        isApplicable: context => context.tenancy.getCurrentTenant().id === tenant.id
    });

    plugin.name = "headlessCms.graphql.importExport";

    context.plugins.register(plugin);
};
