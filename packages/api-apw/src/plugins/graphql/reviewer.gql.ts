import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, ApwReviewerListParams } from "~/types";
import resolve from "~/utils/resolve";

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwReviewerListItem {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Reviewer specific fields
            identityId: ID
            displayName: String
            type: String
        }

        type ApwListReviewersResponse {
            data: [ApwReviewerListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwReviewer {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Reviewer specific fields
            identityId: ID
            displayName: String
            type: String
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
        ApwQuery: {
            getReviewer: async (_, args: any, context) => {
                return resolve(() => context.apw.reviewer.get(args.id));
            },
            listReviewers: async (_, args: any, context) => {
                try {
                    /**
                     * We know that args is ApwReviewerListParams.
                     */
                    const [entries, meta] = await context.apw.reviewer.list(
                        args as unknown as ApwReviewerListParams
                    );
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});

export default workflowSchema;
