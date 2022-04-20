import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, ApwCommentListParams } from "~/types";
import resolve from "~/utils/resolve";

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwCommentListItem {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Comment specific fields
            body: JSON
            changeRequest: ID
            # TODO: Remove ApwRefField
            media: JSON
        }

        type ApwListCommentsResponse {
            data: [ApwCommentListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwComment {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # Comment specific fields
            body: JSON
            changeRequest: ID
            media: JSON
        }

        type ApwCommentResponse {
            data: ApwComment
            error: ApwError
        }

        type ApwDeleteCommentResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListCommentsSort {
            id_ASC
            id_DESC
            savedOn_ASC
            savedOn_DESC
            createdOn_ASC
            createdOn_DESC
        }

        input ApwCreateCommentInput {
            body: JSON!
            changeRequest: ID!
            media: JSON
        }

        input ApwUpdateCommentInput {
            body: JSON!
        }

        input ApwListCommentsWhereInput {
            id: ID
            id_not: ID
            id_in: [ID!]
            id_not_in: [ID!]
            createdOn: DateTime
            createdOn_gt: DateTime
            createdOn_gte: DateTime
            createdOn_lt: DateTime
            createdOn_lte: DateTime
            createdOn_between: [DateTime!]
            createdOn_not_between: [DateTime!]
            savedOn: DateTime
            savedOn_gt: DateTime
            savedOn_gte: DateTime
            savedOn_lt: DateTime
            savedOn_lte: DateTime
            savedOn_between: [DateTime!]
            savedOn_not_between: [DateTime!]
            createdBy: String
            createdBy_not: String
            createdBy_in: [String!]
            createdBy_not_in: [String!]
            ownedBy: String
            ownedBy_not: String
            ownedBy_in: [String!]
            ownedBy_not_in: [String!]
            changeRequest: ApwRefFieldWhereInput
        }

        extend type ApwQuery {
            getComment(id: ID!): ApwCommentResponse

            listComments(
                where: ApwListCommentsWhereInput
                limit: Int
                after: String
                sort: [ApwListCommentsSort!]
            ): ApwListCommentsResponse
        }

        extend type ApwMutation {
            createComment(data: ApwCreateCommentInput!): ApwCommentResponse

            updateComment(id: ID!, data: ApwUpdateCommentInput!): ApwCommentResponse

            deleteComment(id: ID!): ApwDeleteCommentResponse
        }
    `,
    resolvers: {
        ApwQuery: {
            getComment: async (_, args: any, context) => {
                return resolve(() => context.apw.comment.get(args.id));
            },
            listComments: async (_, args: any, context) => {
                try {
                    /**
                     * We know that args is ApwCommentListParams.
                     */
                    const [entries, meta] = await context.apw.comment.list(
                        args as unknown as ApwCommentListParams
                    );
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createComment: async (_, args: any, context) => {
                return resolve(() => context.apw.comment.create(args.data));
            },
            updateComment: async (_, args: any, context) => {
                return resolve(() => context.apw.comment.update(args.id, args.data));
            },
            deleteComment: async (_, args: any, context) => {
                return resolve(() => context.apw.comment.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
