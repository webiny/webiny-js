import { ErrorResponse, ListResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context, info) => {
    const { i18nContent, formBuilder } = context;
    const forms = formBuilder?.crud?.forms;
    const {
        // sort = null,
        search = null,
        parent = null,
        limit = 10
        // after,
        // before,
    } = args;

    const must: any = [
        { term: { latestVersion: true } },
        { term: { "locale.keyword": i18nContent?.locale?.code } }
    ];

    if (search) {
        must.push({
            bool: {
                should: [
                    { wildcard: { "name.keyword": `*${search}*` } },
                    { wildcard: { name: `*${search}*` } },
                    { wildcard: { "slug.keyword": `*${search}*` } },
                    { wildcard: { slug: `*${search}*` } }
                ]
            }
        });
    }

    if (parent) {
        if (Array.isArray(parent)) {
            must.push({ terms: { parent: parent } });
        } else {
            must.push({ term: { parent: parent } });
        }
    }

    try {
        // Get "latest" form revisions from Elasticsearch.
        const response = await context.elasticSearch.search({
            index: "form-builder",
            type: "_doc",
            body: {
                query: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    constant_score: {
                        filter: {
                            bool: {
                                must
                            }
                        }
                    }
                },
                size: limit
            }
        });

        let list = response?.body?.hits?.hits?.map(item => item._source);
        // Get complete form data for returned list.
        if (list?.length) {
            const formIds = list.map(item => item.id);
            list = await forms.listFormsInBatch({ ids: formIds });
        }

        return new ListResponse(list);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data
        });
    }
};

export default resolver;
