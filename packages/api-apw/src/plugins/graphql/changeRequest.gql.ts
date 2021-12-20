import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwContext, FieldResolversParams } from "~/types";
import resolve from "~/utils/resolve";
import { generateFieldResolvers } from "~/utils/fieldResolver";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";

const fieldIds: Array<FieldResolversParams | string> = [
    {
        fieldId: "body",
        getModel: context => context.apw.changeRequest.getModel(),
        getField: (model, fieldId) => model.fields.find(field => field.fieldId === fieldId),
        isRoot: true
    },
    "title",
    "resolved",
    "media",
    "step"
];

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwChangeRequestListItem {
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
            # ChangeRequest specific fields
            step: String!
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        type ApwListChangeRequestsResponse {
            data: [ApwChangeRequestListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwChangeRequest {
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
            # ChangeRequest specific fields
            step: String!
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        type ApwChangeRequestResponse {
            data: ApwChangeRequest
            error: ApwError
        }

        type ApwDeleteChangeRequestResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListChangeRequestSort {
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

        input ApwCreateChangeRequestInput {
            step: String!
            title: String!
            body: JSON!
            resolved: Boolean
            media: JSON
        }

        input ApwUpdateChangeRequestInput {
            title: String
            body: JSON
            resolved: Boolean
            media: JSON
        }

        input ApwListChangeRequestWhereInput {
            id: ID
            step: String
        }

        input ApwListChangeRequestSearchInput {
            query: String
        }

        extend type ApwQuery {
            getChangeRequest(id: ID!): ApwChangeRequestResponse

            listChangeRequests(
                where: ApwListChangeRequestWhereInput
                limit: Int
                after: String
                sort: [ApwListChangeRequestSort!]
                search: ApwListChangeRequestSearchInput
            ): ApwListChangeRequestsResponse
        }

        extend type ApwMutation {
            createChangeRequest(data: ApwCreateChangeRequestInput!): ApwChangeRequestResponse

            updateChangeRequest(
                id: ID!
                data: ApwUpdateChangeRequestInput!
            ): ApwChangeRequestResponse

            deleteChangeRequest(id: ID!): ApwDeleteChangeRequestResponse
        }
    `,
    resolvers: {
        ApwChangeRequest: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwChangeRequestListItem: {
            ...generateFieldResolvers(fieldIds)
        },
        ApwQuery: {
            getChangeRequest: async (_, args, context) => {
                return resolve(() => context.apw.changeRequest.get(args.id));
            },
            listChangeRequests: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] = await context.apw.changeRequest.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createChangeRequest: async (_, args, context) => {
                return resolve(() => context.apw.changeRequest.create(args.data));
            },
            updateChangeRequest: async (_, args, context) => {
                return resolve(() => context.apw.changeRequest.update(args.id, args.data));
            },
            deleteChangeRequest: async (_, args, context) => {
                return resolve(() => context.apw.changeRequest.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
