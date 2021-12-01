import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, FieldResolversParams } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const fieldIds: Array<FieldResolversParams | string> = [
    {
        fieldId: "body",
        getModel: context => context.advancedPublishingWorkflow.changeRequested.getModel(),
        getField: (model, fieldId) => model.fields.find(field => field.fieldId === fieldId),
        isRoot: true
    },
    "title",
    "resolved",
    "media"
];

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwChangeRequestedListItem {
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
            # ChangeRequested specific fields
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        type ApwListChangesRequestedResponse {
            data: [ApwChangeRequestedListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwChangeRequested {
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
            # ChangeRequested specific fields
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        type ApwChangeRequestedResponse {
            data: ApwChangeRequested
            error: ApwError
        }

        type ApwDeleteChangeRequestedResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListChangeRequestedSort {
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

        input ApwCreateChangeRequestedInput {
            title: String!
            body: JSON!
            resolved: Boolean
            media: JSON
        }

        input ApwUpdateChangeRequestedInput {
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        input ApwListChangeRequestedWhereInput {
            id: ID
        }

        input ApwListChangeRequestedSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        extend type ApwQuery {
            getChangeRequested(id: ID!): ApwChangeRequestedResponse

            listChangesRequested(
                where: ApwListChangeRequestedWhereInput
                limit: Int
                after: String
                sort: [ApwListChangeRequestedSort!]
                search: ApwListChangeRequestedSearchInput
            ): ApwListChangesRequestedResponse
        }

        extend type ApwMutation {
            createChangeRequested(data: ApwCreateChangeRequestedInput!): ApwChangeRequestedResponse

            # Update workflow by given ID.
            updateChangeRequested(
                id: ID!
                data: ApwUpdateChangeRequestedInput!
            ): ApwChangeRequestedResponse

            # Delete workflow
            deleteChangeRequested(id: ID!): ApwDeleteChangeRequestedResponse
        }
    `,
    resolvers: {
        ApwChangeRequested: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwChangeRequestedListItem: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwQuery: {
            getChangeRequested: async (_, args, context) => {
                return resolve(() =>
                    context.advancedPublishingWorkflow.changeRequested.get(args.id)
                );
            },
            listChangesRequested: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] =
                        await context.advancedPublishingWorkflow.changeRequested.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createChangeRequested: async (_, args, context) => {
                return resolve(() =>
                    context.advancedPublishingWorkflow.changeRequested.create(args.data)
                );
            },
            updateChangeRequested: async (_, args, context) => {
                return resolve(() =>
                    context.advancedPublishingWorkflow.changeRequested.update(args.id, args.data)
                );
            },
            deleteChangeRequested: async (_, args, context) => {
                return resolve(() =>
                    context.advancedPublishingWorkflow.changeRequested.delete(args.id)
                );
            }
        }
    }
});

export default workflowSchema;
