import { GraphQLContext as APIContext } from "@webiny/api/types";
import { CmsModel } from "@webiny/api-headless-cms/types";
import createFindSorters from "./createFindSorters";
import { createFindQuery } from "./createFindQuery";
import parseBoolean from "./parseBoolean";

type FindEntries = {
    model: CmsModel;
    args: {
        locale: string;
        where: { [key: string]: any };
        sort: string[];
        perPage: number;
        page: number;
    };
    context: APIContext;
};

export default async function findEntries({ model, args, context }: FindEntries) {
    const Model = context.models[model.modelId];
    parseBoolean(args);
    // eslint-disable-next-line prefer-const
    let { where = {}, sort = [], perPage, page } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    const match = createFindQuery(model, where, context);
    const sorters = createFindSorters(model, sort);

    if (!Object.keys(sorters).length) {
        sorters["createdOn"] = -1;
    }

    return await Model.find({ query: match, sort: sorters, perPage, page });
}
