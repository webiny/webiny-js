import { CmsGraphQLContext, CmsModel } from "@webiny/api-headless-cms/types";
import createFindSorters from "./createFindSorters";
import { createFindQuery } from "./createFindQuery";
import parseBoolean from "./parseBoolean";
import { parseWhere } from "./parseWhere";

type FindEntries = {
    model: CmsModel;
    args: {
        locale: string;
        where: { [key: string]: any };
        sort: string[];
        perPage: number;
        page: number;
    };
    context: CmsGraphQLContext;
};

export default async function findEntries<T = CmsGraphQLContext>({
    model,
    args,
    context
}: FindEntries) {
    const Model = context.models[model.modelId];
    const ModelSearch = context.models[model.modelId + "Search"];
    parseBoolean(args);
    // eslint-disable-next-line prefer-const
    let { sort = [], perPage, page } = args;
    page = isNaN(page) || page < 1 ? 1 : page;
    perPage = isNaN(perPage) || perPage < 1 ? 100 : perPage;

    // For Manage API, limit records by locales.length * perPage
    // (since we can't use "$group" and you should be able to search values in all locales)
    if (context.cms.MANAGE) {
        // TODO @adrian Error: { message: 'Cannot query for more than 100 models per page.' }
        // perPage = perPage * context.i18n.getLocales().length;
    }

    // Parse "where" arguments
    const where = parseWhere(args.where);

    // Build query
    let match: any = {};
    const conditions = [];
    const notConditions = [];

    where.forEach(cond => {
        if (cond.operator.startsWith("not")) {
            notConditions.push(cond);
        } else {
            conditions.push(cond);
        }
    });

    if (context.cms.MANAGE && notConditions.length) {
        // Replace "not"
        const invertedConditions = notConditions.map(cond => {
            if (cond.operator === "not") {
                return { ...cond, operator: "eq" };
            }
            return { ...cond, operator: cond.operator.replace("not_", "") };
        });

        // Run extra query to find IDs we DON'T want to include in the final search
        const query = createFindQuery(model, invertedConditions, context);
        const searchEntries = await ModelSearch.find({ query });
        const skipIds = searchEntries.map(entry => entry.revision);
        match = {
            revision: { $nin: [...skipIds] },
            ...createFindQuery(model, conditions, context)
        };
    } else {
        match = {
            ...createFindQuery(model, [...conditions, ...notConditions], context)
        };
    }

    if (context.cms.READ) {
        match.published = true;
    } else {
        match.latestVersion = true;
    }

    // For `read` API we always include `locale` in the queries
    if (!context.cms.MANAGE) {
        match.locale = context.cms.locale.id;
    }

    // Build sorters
    const sorters = createFindSorters(model, sort);

    if (!Object.keys(sorters).length) {
        sorters["createdOn"] = -1;
    } else {
        // Make sure the field being sorted has a non-null value
        if (!match.$and) {
            match.$and = [];
        }

        Object.keys(sorters).forEach(key => {
            match.$and.push({ [key]: { $ne: null } });
        });
    }

    // Find IDs using search collection
    // TODO: things to improve:
    // - `ModelSearch.find` returns data of which 99% is unused. We only need `instance` value of each entry.
    const searchEntries = await ModelSearch.find({ query: match, sort: sorters, page, perPage });
    const meta = searchEntries.getMeta();
    const ids = Array.from(
        searchEntries
            .map(item => {
                return item.revision;
            })
            .filter((value, index, self) => {
                return self.indexOf(value) === index;
            })
    );

    // Find actual data records
    const entries = await Model.find({ query: { id: { $in: ids } } });
    const sortedEntries = entries.sort((a, b) => {
        return ids.indexOf(a.id) - ids.indexOf(b.id);
    });

    return { entries: sortedEntries, meta };
}
