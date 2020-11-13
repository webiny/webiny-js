import { ErrorResponse, ListResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export const listPublishedForms: GraphQLFieldResolver = async (root, args, context, info) => {
    const { i18nContent, formBuilder } = context;
    const forms = formBuilder?.crud?.forms;

    const {
        search,
        id = null,
        parent = null,
        slug = null,
        version = null,
        tags = null,
        // sort
        limit = 10
        // after
        // before
    } = args;

    const must: any = [
        { term: { published: true } },
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
    if (id) {
        // Question: Can "parent" will ever be an array?
        if (Array.isArray(id)) {
            must.push({ terms: { "id.keyword": id } });
        } else {
            must.push({ term: { "id.keyword": id } });
        }
    }

    if (parent) {
        // Question: Can "parent" will ever be an array?
        if (Array.isArray(parent)) {
            must.push({ terms: { "parent.keyword": parent } });
        } else {
            must.push({ term: { "parent.keyword": parent } });
        }
    }

    if (slug) {
        must.push({ term: { "slug.keyword": slug } });
    }

    if (version) {
        must.push({ term: { version } });
    }

    if (tags) {
        must.push({ terms: { tags: tags } });
    }

    // Get "published" forms from Elasticsearch.
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
    return list;
};

const resolver: GraphQLFieldResolver = async (...args) => {
    try {
        const forms = await listPublishedForms(...args);
        return new ListResponse(forms);
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data
        });
    }
};

export default resolver;
