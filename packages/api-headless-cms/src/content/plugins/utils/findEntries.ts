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
    limit = isNaN(limit) || limit < 1 ? 200 : limit;

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

    /*
       The following code resolves the "limit" issue that happens when accessing the MANAGE API.

       Description:
       There is a difference in how the data is being queries/filtered when comparing READ/PREVIEW and MANAGE APIs.
       When accessing READ/PREVIEW APIs, we always have single-locale filtering, and in that case, applying "limit" to
       queries works correctly. But, when performing queries against the MANAGE API, internally, locale filtering is
       not applied, which introduces an interesting problem.

       If you take a look at the code below, you'll see that we are actually performing two queries:
       1) Query the "CmsContentEntrySearch" collection - we only use the received content model entries IDs.
       2) Use the IDs received from the first query to load the actual content model entries.

       The problem occurs when the "limit" parameter is applied and there are multiple locales in the system. Because
       the single-locale filtering is not applied in the MANAGE API, the result set received from the first query
       might actually contain duplicates - rows that are actually referencing the same content model entry, but are
       representing search entries for different locales. So, having duplicate content model entry IDs in the first
       query result set would cause the final one to contain less results than specified by the "limit" parameter.

       In order to ensure that the final result set always contains the needed number of entries specified by the
       "limit" param, we just multiply it by the number of locales and use that as a new limit when performing the
       first query. Received IDs are then deduplicated and only the first {limit} entries are taken into consideration,
       while the rest is simply discarded.
    */
    if (context.cms.MANAGE) {
        const locales = context.i18n.getLocales();
        const newLimit = limit * locales.length;

        // cap max limit to 200, to avoid `MAX_PER_PAGE_EXCEEDED` error
        limit = Math.min(newLimit, 200);
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
