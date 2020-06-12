import { CmsContext, CmsContentModel } from "@webiny/api-headless-cms/types";
import { parseSort } from "./parseSort";
import { createFindParameters } from "./createFindParameters";
import parseBoolean from "./parseBoolean";
import { parseWhere } from "./parseWhere";
import { requiresTotalCount } from "@webiny/graphql";
import { GraphQLResolveInfo } from "graphql";

type FindEntries = {
    model: CmsContentModel;
    args: {
        locale: string;
        where: { [key: string]: any };
        sort: string[];
        limit: number;
        after: string;
        before: string;
    };
    context: CmsContext;
    info: GraphQLResolveInfo;
};

export default async function findEntries<T = CmsContext>({
    model,
    args,
    context,
    info
}: FindEntries) {
    const Model = context.models[model.modelId];
    const { CmsContentEntrySearch } = context.models;

    parseBoolean(args);
    // eslint-disable-next-line prefer-const
    let { limit, after, before } = args;
    limit = isNaN(limit) || limit < 1 ? 100 : limit;

    const { query, sort } = createFindParameters({
        context,
        model,
        sort: parseSort(model, args.sort),
        where: parseWhere(args.where)
    });

    if (context.cms.READ) {
        query.published = true;
    } else {
        query.latestVersion = true;
    }

    // For `read` API we always include `locale` in the queries
    if (!context.cms.MANAGE) {
        query.locale = context.cms.locale.id;
    }

    // For `manage` API we always want to multiple `limit` by available locales
    if (context.cms.MANAGE) {
        const locales = context.i18n.getLocales();
        const newLimit = limit * locales.length;

        // cap max limit to 100, to avoid `MAX_PER_PAGE_EXCEEDED` error
        limit = Math.min(newLimit, 100);
    }

    // Find IDs using search collection
    const searchEntries = await CmsContentEntrySearch.find({
        query,
        sort,
        limit,
        before,
        after,
        totalCount: requiresTotalCount(info),
        defaultSortField: "revision",
        fields: ["revision"]
    });

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
