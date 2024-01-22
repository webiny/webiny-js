import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, ApwCommentListParams } from "~/types";
import resolve from "~/utils/resolve";
import { onByFields, dateTimeFieldsSorters } from "./utils";

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    // Had to remove /* GraphQL */ because prettier would not format the code correctly.
    typeDefs: () => {
        const metaFieldsBaseNames = ["created", "modified", "saved"];

        const dateTimeWhereFields = metaFieldsBaseNames
            .map(name => {
                return `
                ${name}On: DateTime
                ${name}On_gt: DateTime
                ${name}On_gte: DateTime
                ${name}On_lt: DateTime
                ${name}On_lte: DateTime
                ${name}On_between: [DateTime!]
                ${name}On_not_between: [DateTime!]
            `;
            })
            .join("\n");

        const identityWhereFields = metaFieldsBaseNames
            .map(name => {
                return `
                ${name}By: ID
                ${name}By_not: ID
                ${name}By_in: [ID!]
                ${name}By_not_in: [ID!]
            `;
            })
            .join("\n");

        return [
            `
        type ApwCommentListItem {
            # System generated fields
            id: ID
            
            ${onByFields}
            
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
            
            ${onByFields}
            
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
            
            ${dateTimeFieldsSorters}
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
            
            ${dateTimeWhereFields}
            ${identityWhereFields}
            
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
    `
        ];
    },
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
