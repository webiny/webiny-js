import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { ListWebhooksUseCase } from "~/api/features/ListWebhooks/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/api/features/UpdateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/api/features/DeleteWebhook/abstractions.js";

class WebhookCrudSchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookError {
                code: String
                message: String
                data: JSON
            }

            type WebhookListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type Webhook {
                id: ID!
                name: String!
                slug: String!
                endpointUrl: String!
                description: String
                enabled: Boolean!
                events: [String!]!
                signingSecret: String!
                createdOn: DateTime
                modifiedOn: DateTime
            }

            type WebhookResponse {
                data: Webhook
                error: WebhookError
            }

            type WebhookListResponse {
                data: [Webhook!]
                meta: WebhookListMeta
                error: WebhookError
            }

            input CreateWebhookInput {
                name: String!
                slug: String
                endpointUrl: String!
                description: String
                enabled: Boolean
                events: [String!]!
            }

            input UpdateWebhookInput {
                name: String
                slug: String
                endpointUrl: String
                description: String
                enabled: Boolean
                events: [String!]
            }

            input ListWebhooksWhereInput {
                enabled: Boolean
            }

            type WebhookQuery {
                listWebhooks(
                    where: ListWebhooksWhereInput
                    limit: Int
                    after: String
                ): WebhookListResponse!
                getWebhook(id: ID!): WebhookResponse!
            }

            type WebhookMutation {
                createWebhook(input: CreateWebhookInput!): WebhookResponse!
                updateWebhook(id: ID!, input: UpdateWebhookInput!): WebhookResponse!
                deleteWebhook(id: ID!): BooleanResponse!
            }

            extend type Query {
                webhooks: WebhookQuery!
            }

            extend type Mutation {
                webhooks: WebhookMutation!
            }
        `);

        builder.addResolver({
            path: "Query.webhooks",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.webhooks",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver<{ where?: { enabled?: boolean }; limit?: number; after?: string }>({
            path: "WebhookQuery.listWebhooks",
            dependencies: [ListWebhooksUseCase],
            resolver: (listWebhooks: ListWebhooksUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listWebhooks.execute({
                        where: args.where ?? undefined,
                        limit: args.limit ?? undefined,
                        after: args.after ?? undefined
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookQuery.getWebhook",
            dependencies: [GetWebhookUseCase],
            resolver: (getWebhook: GetWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await getWebhook.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ input: CreateWebhookUseCase.Input }>({
            path: "WebhookMutation.createWebhook",
            dependencies: [CreateWebhookUseCase],
            resolver: (createWebhook: CreateWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await createWebhook.execute(args.input);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string; input: UpdateWebhookUseCase.Input }>({
            path: "WebhookMutation.updateWebhook",
            dependencies: [UpdateWebhookUseCase],
            resolver: (updateWebhook: UpdateWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateWebhook.execute(args.id, args.input);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookMutation.deleteWebhook",
            dependencies: [DeleteWebhookUseCase],
            resolver: (deleteWebhook: DeleteWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await deleteWebhook.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export const WebhookCrudSchema = GraphQLSchemaFactory.createImplementation({
    implementation: WebhookCrudSchema_,
    dependencies: []
});
