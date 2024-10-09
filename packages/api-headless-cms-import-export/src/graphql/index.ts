import type { Context } from "~/types";
import { CmsGraphQLSchemaPlugin } from "@webiny/api-headless-cms";
import { createTypeDefs } from "./typeDefs";
import { createResolvers } from "./resolvers";
import { listModels } from "~/graphql/models";
import type { NonEmptyArray } from "@webiny/api/types";
import { CmsModel } from "@webiny/api-headless-cms/types";

export const attachHeadlessCmsImportExportGraphQL = async (context: Context): Promise<void> => {
    const tenant = context.tenancy.getCurrentTenant();
    const locale = context.i18n.getContentLocale();
    const models = await listModels(context);

    if (!tenant || !locale || models.length === 0) {
        return;
    }

    const plugin = new CmsGraphQLSchemaPlugin<Context>({
        typeDefs: createTypeDefs(models as NonEmptyArray<CmsModel>),
        resolvers: createResolvers(models as NonEmptyArray<CmsModel>),
        isApplicable: context =>
            context.tenancy.getCurrentTenant().id === tenant.id &&
            context.i18n.getContentLocale()?.code === locale.code
    });

    plugin.name = "headlessCms.graphql.importExport";

    context.plugins.register(plugin);
};
