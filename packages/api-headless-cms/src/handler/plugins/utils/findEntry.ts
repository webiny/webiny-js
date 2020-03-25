import { CmsGraphQLContext, CmsModel } from "@webiny/api-headless-cms/types";
import { createFindQuery } from "./createFindQuery";
import { parseWhere } from "./parseWhere";

type FindEntry = {
    model: CmsModel;
    args: {
        locale: string;
        where: { [key: string]: any };
    };
    context: CmsGraphQLContext;
};

export const findEntry = async ({ model, args, context }: FindEntry) => {
    const Model = context.models[model.modelId];
    const ModelSearch = context.models[model.modelId + "Search"];

    const query = createFindQuery(model, parseWhere(args.where), context);

    if (context.cms.READ) {
        query.published = true;
    } else {
        query.latestVersion = true;
    }

    if (!context.cms.MANAGE) {
        query.locale = context.cms.locale.id;
    }

    const searchData = await ModelSearch.findOne({ query });
    if (!searchData) {
        return null;
    }

    return await Model.findById(searchData.revision);
};
