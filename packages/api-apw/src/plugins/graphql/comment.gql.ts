import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { ApwContext, FieldResolverParams } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";

const fieldIds: Array<FieldResolverParams> = [
    {
        fieldId: "body",
        getModel: context => context.apw.comment.getModel(),
        getField: (model, fieldId) => model.fields.find(field => field.fieldId === fieldId),
        isRoot: false
    }
];

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
            changeRequest: ApwRefField
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
            changeRequest: ApwRefField
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
            publishedOn_ASC
            publishedOn_DESC
            title_ASC
            title_DESC
        }

        input ApwCreateCommentInput {
            body: JSON!
            changeRequest: ApwRefFieldInput!
        }

        input ApwUpdateCommentInput {
            body: JSON!
        }

        input ApwListCommentsWhereInput {
            id: ID
            id_not: ID
            id_in: [ID!]
            id_not_in: [ID!]
            entryId: String
            entryId_not: String
            entryId_in: [String!]
            entryId_not_in: [String!]
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

        input ApwListCommentsSearchInput {
            query: String
        }

        extend type ApwQuery {
            getComment(id: ID!): ApwCommentResponse

            listComments(
                where: ApwListCommentsWhereInput
                limit: Int
                after: String
                sort: [ApwListCommentsSort!]
                search: ApwListCommentsSearchInput
            ): ApwListCommentsResponse
        }

        extend type ApwMutation {
            createComment(data: ApwCreateCommentInput!): ApwCommentResponse

            updateComment(id: ID!, data: ApwUpdateCommentInput!): ApwCommentResponse

            deleteComment(id: ID!): ApwDeleteCommentResponse
        }
    `,
    resolvers: {
        ApwComment: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwCommentListItem: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwQuery: {
            getComment: async (_, args, context) => {
                return resolve(() => context.apw.comment.get(args.id));
            },
            listComments: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] = await context.apw.comment.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createComment: async (_, args, context) => {
                return resolve(() => context.apw.comment.create(args.data));
            },
            updateComment: async (_, args, context) => {
                return resolve(() => context.apw.comment.update(args.id, args.data));
            },
            deleteComment: async (_, args, context) => {
                return resolve(() => context.apw.comment.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
