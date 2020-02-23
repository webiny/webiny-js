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
    const ModelSearch = context.models[model.modelId + "Search"];
    parseBoolean(args);
    // eslint-disable-next-line prefer-const
    let { where = {}, sort = [], perPage, page } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    // Build query
    const match = createFindQuery(model, where, context);
    if (!context.cms.manage) {
        match.locale = context.cms.locale.id;
    }

    // Build sorters
    const sorters = createFindSorters(model, sort);

    if (!Object.keys(sorters).length) {
        sorters["createdOn"] = -1;
    }

    // Find IDs using search collection

    // TODO: things to improve:
    // - in Manage API, limit records by locales.length * perPage
    // (since we can't use "$group" and you should be able to search values in all locales)
    // - `ModelSearch.find` returns data of which 99% is unused. We only need `instance` value of each entry.
    const searchEntries = await ModelSearch.find({query: match, sort: sorters, page, perPage});
    const meta = searchEntries.getMeta();
    const ids = searchEntries
        .map(item => item.instance)
        .filter((value, index, self) => {
            return self.indexOf(value) === index;
        });

    // Find actual data records
    const entries = await Model.find({query: {id: {$in: ids}}});
    const sortedEntries = entries.sort((a, b) => {
        return ids.indexOf(a.id) - ids.indexOf(b.id);
    });

    return {entries: sortedEntries, meta};
}
