import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ListWebhookDeliveriesUseCase } from "~/api/features/ListWebhookDeliveries/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/api/features/ResendWebhookDelivery/abstractions.js";

class WebhookDeliverySchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookDelivery {
                id: ID!
                webhookId: ID!
                backgroundTaskId: String!
                eventType: String!
                payload: JSON
                requestHeaders: JSON
                responseTime: Int
                responseStatus: Int
                responseBody: String
                expiresAt: DateTime
                createdOn: DateTime
            }

            type WebhookDeliveryResponse {
                data: WebhookDelivery
                error: WebhookError
            }

            type WebhookDeliveryListResponse {
                data: [WebhookDelivery!]
                meta: WebhookListMeta
                error: WebhookError
            }

            extend type WebhookQuery {
                listWebhookDeliveries(
                    webhookId: ID!
                    limit: Int
                    after: String
                ): WebhookDeliveryListResponse!
                getWebhookDelivery(id: ID!): WebhookDeliveryResponse!
            }

            extend type WebhookMutation {
                resendWebhookDelivery(id: ID!): BooleanResponse!
            }
        `);

        builder.addResolver<{ webhookId: string; limit?: number; after?: string }>({
            path: "WebhookQuery.listWebhookDeliveries",
            dependencies: [IdentityContext, ListWebhookDeliveriesUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                listDeliveries: ListWebhookDeliveriesUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
                    const result = await listDeliveries.execute({
                        webhookId: args.webhookId,
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
            path: "WebhookQuery.getWebhookDelivery",
            dependencies: [IdentityContext, GetWebhookDeliveryUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getDelivery: GetWebhookDeliveryUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
                    const result = await getDelivery.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<{ id: string }>({
            path: "WebhookMutation.resendWebhookDelivery",
            dependencies: [IdentityContext, ResendWebhookDeliveryUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                resend: ResendWebhookDeliveryUseCase.Interface
            ) => {
                return async ({ args }) => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
                    const result = await resend.execute(args.id);
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
    implementation: WebhookDeliverySchema,
    dependencies: []
});
