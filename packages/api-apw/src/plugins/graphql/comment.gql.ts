import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, FieldResolversParams } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const fieldIds: Array<FieldResolversParams | string> = [
    {
        fieldId: "body",
        getModel: context => context.advancedPublishingWorkflow.comment.getModel(),
        getField: (model, fieldId) => model.fields.find(field => field.fieldId === fieldId),
        isRoot: true
    },
    "changeRequest"
];

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwCommentListItem {
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
            # Comment specific fields
            body: JSON
            changeRequest: ID
        }

        type ApwListCommentsResponse {
            data: [ApwCommentListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwComment {
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
            # Comment specific fields
            body: JSON
            changeRequest: ID
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
            body: JSON
            changeRequest: ID
        }

        input ApwUpdateCommentInput {
            body: JSON
        }

        input ApwListCommentsWhereInput {
            id: ID
            changeRequest: ID
        }

        input ApwListCommentsSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
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

            # Update workflow by given ID.
            updateComment(id: ID!, data: ApwUpdateCommentInput!): ApwCommentResponse

            # Delete workflow
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
                return resolve(() => context.advancedPublishingWorkflow.comment.get(args.id));
            },
            listComments: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] = await context.advancedPublishingWorkflow.comment.list(
                        args
                    );
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createComment: async (_, args, context) => {
                return resolve(() => context.advancedPublishingWorkflow.comment.create(args.data));
            },
            updateComment: async (_, args, context) => {
                return resolve(() =>
                    context.advancedPublishingWorkflow.comment.update(args.id, args.data)
                );
            },
            deleteComment: async (_, args, context) => {
                return resolve(() => context.advancedPublishingWorkflow.comment.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
