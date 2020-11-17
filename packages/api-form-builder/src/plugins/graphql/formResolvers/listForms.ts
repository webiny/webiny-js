import { ErrorResponse, ListResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { FormsCRUD } from "../../../types";
import { hasRwd } from "./utils/formResolversUtils";
import defaults from "../../crud/defaults";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { i18nContent, formBuilder } = context;
    const forms: FormsCRUD = formBuilder?.crud?.forms;
    const {
        // sort = null,
        search = null,
        parent = null,
        limit = 10
        // after,
        // before,
    } = args;

    // If permission has "rwd" property set, but "r" is not part of it, bail.
    const formBuilderFormPermission = await context.security.getPermission("forms.forms");
    if (formBuilderFormPermission && !hasRwd({ formBuilderFormPermission, rwd: "r" })) {
        return new NotAuthorizedResponse();
    }

    const must: any = [
        { term: { latestVersion: true } },
        { term: { "locale.keyword": i18nContent?.locale?.code } }
    ];

    // If user can only manage own records, let's check if he owns the loaded one.
    if (formBuilderFormPermission?.own === true) {
        const identity = context.security.getIdentity();
        // Only get records which are owned by current user.
        must.push({
            term: {
                "createdBy.id": {
                    value: identity.id
                }
            }
        });
    }

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
            ...defaults.es,
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
            list = await forms.listFormsInBatch(formIds);
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
