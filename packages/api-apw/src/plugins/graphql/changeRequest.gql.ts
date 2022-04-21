import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { ApwChangeRequestListParams, ApwContext } from "~/types";
import resolve from "~/utils/resolve";

const workflowSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwChangeRequestListItem {
            # System generated fields
            id: ID
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ChangeRequest specific fields
            step: String!
            title: String!
            body: JSON!
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
            savedOn: DateTime
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ChangeRequest specific fields
            step: String!
            title: String!
            body: JSON!
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
        ApwQuery: {
            getChangeRequest: async (_, args: any, context) => {
                return resolve(() => context.apw.changeRequest.get(args.id));
            },
            listChangeRequests: async (_, args: any, context) => {
                try {
                    /**
                     * We know that args is ApwChangeRequestListParams.
                     */
                    const [entries, meta] = await context.apw.changeRequest.list(
                        args as unknown as ApwChangeRequestListParams
                    );
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createChangeRequest: async (_, args: any, context) => {
                return resolve(() => context.apw.changeRequest.create(args.data));
            },
            updateChangeRequest: async (_, args: any, context) => {
                return resolve(() => context.apw.changeRequest.update(args.id, args.data));
            },
            deleteChangeRequest: async (_, args: any, context) => {
                return resolve(() => context.apw.changeRequest.delete(args.id));
            }
        }
    }
});

export default workflowSchema;
