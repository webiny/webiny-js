import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ListWebhooksUseCase } from "~/api/features/ListWebhooks/abstractions.js";
import { GetWebhookUseCase } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookUseCase } from "~/api/features/CreateWebhook/abstractions.js";
import { UpdateWebhookUseCase } from "~/api/features/UpdateWebhook/abstractions.js";
import { DeleteWebhookUseCase } from "~/api/features/DeleteWebhook/abstractions.js";

class WebhookCrudSchema implements GraphQLSchemaFactory.Interface {
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
            dependencies: [IdentityContext, ListWebhooksUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                listWebhooks: ListWebhooksUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
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
            dependencies: [IdentityContext, GetWebhookUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getWebhook: GetWebhookUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
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
            dependencies: [IdentityContext, CreateWebhookUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                createWebhook: CreateWebhookUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
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
            dependencies: [IdentityContext, UpdateWebhookUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                updateWebhook: UpdateWebhookUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
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
            dependencies: [IdentityContext, DeleteWebhookUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                deleteWebhook: DeleteWebhookUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
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

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookCrudSchema,
    dependencies: []
});
