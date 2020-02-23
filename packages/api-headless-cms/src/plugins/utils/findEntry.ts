import { GraphQLContext as APIContext } from "@webiny/api/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { createFindQuery } from "./createFindQuery";

type FindEntry = {
    model: CmsModel;
    args: {
        locale: string;
        where: { [key: string]: any };
    };
    context: APIContext;
};

export const findEntry = async ({ model, args, context }: FindEntry) => {
    const Model = context.models[model.modelId];
    const ModelSearch = context.models[model.modelId + "Search"];

    const query = createFindQuery(model, args.where, context);
    if (!context.cms.manage) {
        query.locale = context.cms.locale.id;
    }

    const searchData = await ModelSearch.findOne({ query });
    if (!searchData) {
        return null;
    }

    return await Model.findById(searchData.instance);
};
