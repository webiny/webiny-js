import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { FileManagerResolverContext } from "../../types";
import defaults from "../crud/defaults";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    const { i18nContent, security } = context;
    const identity = security.getIdentity();
    const esDefaults = defaults.es(security.getTenant());

    try {
        // If permission has "rwd" property set, but "r" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("fm.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "r" })) {
            return new NotAuthorizedResponse();
        }

        const { limit = 40, search = "", types = [], tags = [], ids = [] } = args;

        const must: any[] = [
            // Skip files created by the system, eg. installation files.
            { term: { "meta.private": false } },
            // Filter files for current content locale
            { term: { "locale.keyword": i18nContent.locale.code } }
        ];

        if (filesFilePermission.own === true) {
            must.push({ term: { "createdBy.id.keyword": identity.id } });
            must.push({ term: { "createdBy.type.keyword": identity.type } });
        }

        if (Array.isArray(types) && types.length) {
            must.push({ terms: { "type.keyword": types } });
        }

        if (search) {
            must.push({
                bool: {
                    should: [
                        { wildcard: { name: `*${search}*` } },
                        { terms: { tags: search.toLowerCase().split(" ") } }
                    ]
                }
            });
        }

        if (Array.isArray(tags) && tags.length > 0) {
            must.push({
                terms: { "tags.keyword": tags.map(tag => tag.toLowerCase()) }
            });
        }

        if (Array.isArray(ids) && ids.length > 0) {
            must.push({
                terms: { "id.keyword": ids }
            });
        }

        const response = await context.elasticSearch.search({
            ...esDefaults,
            body: {
                query: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    constant_score: {
                        filter: {
                            bool: {
                                must: must
                            }
                        }
                    }
                },
                size: limit
                // TODO: Add sort later.
                // sort: [sorters[sort] || sorters.CREATED_ON_ASC]
            }
        });

        return new Response(response.body.hits.hits.map(item => item._source));
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
