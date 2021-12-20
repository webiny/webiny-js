import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { ApwContext } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";

const fieldIds = ["identityId", "displayName"];

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwReviewerListItem {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Reviewer specific fields
            identityId: ID
            displayName: String
        }

        type ApwListReviewersResponse {
            data: [ApwReviewerListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwReviewer {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Reviewer specific fields
            identityId: ID
            displayName: String
        }

        type ApwReviewerResponse {
            data: ApwReviewer
            error: ApwError
        }

        type ApwDeleteReviewerResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListReviewersSort {
            id_ASC
            id_DESC
            savedOn_ASC
            savedOn_DESC
            createdOn_ASC
            createdOn_DESC
            publishedOn_ASC
            publishedOn_DESC
            title_ASC
            title_DESC
        }

        input ApwListReviewersWhereInput {
            identityId: ID
        }

        input ApwListReviewersSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        extend type ApwQuery {
            getReviewer(id: ID!): ApwReviewerResponse

            listReviewers(
                where: ApwListReviewersWhereInput
                limit: Int
                after: String
                sort: [ApwListReviewersSort!]
                search: ApwListReviewersSearchInput
            ): ApwListReviewersResponse
        }
    `,
    resolvers: {
        ApwReviewer: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwReviewerListItem: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwQuery: {
            getReviewer: async (_, args, context) => {
                return resolve(() => context.apw.reviewer.get(args.id));
            },
            listReviewers: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] = await context.apw.reviewer.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

export default workflowSchema;
