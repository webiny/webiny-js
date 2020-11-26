import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { FileManagerResolverContext } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    try {
        // If permission has "rwd" property set, but "r" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("fm.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "r" })) {
            return new NotAuthorizedResponse();
        }

        const { limit = 40, search = "", types = [], tags = [], ids = [] } = args;

        // Files created by the system, eg. installation files.
        const must: any[] = [{ term: { "meta.private": false } }];

        const { i18nContent } = context;
        if (i18nContent?.locale?.code) {
            must.push({
                term: {
                    "locale.keyword": i18nContent.locale.code
                }
            });
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
            index: "file-manager",
            type: "_doc",
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

        let list = response?.body?.hits?.hits?.map(item => item._source);

        if (!Array.isArray(list)) {
            const files = context.fileManager.files;

            list = await files.listFiles({});
        }

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission?.own === true) {
            const identity = context.security.getIdentity();
            list = list.filter(file => file.createdBy.id === identity.id);
        }

        return new Response(list);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
