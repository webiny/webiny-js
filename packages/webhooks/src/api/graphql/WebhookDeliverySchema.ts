import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
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
                backgroundTaskId: String
                eventType: String!
                status: String!
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
            dependencies: [ListWebhookDeliveriesUseCase],
            resolver: (listDeliveries: ListWebhookDeliveriesUseCase.Interface) => {
                return async ({ args }) => {
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
            dependencies: [GetWebhookDeliveryUseCase],
            resolver: (getDelivery: GetWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
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
            dependencies: [ResendWebhookDeliveryUseCase],
            resolver: (resend: ResendWebhookDeliveryUseCase.Interface) => {
                return async ({ args }) => {
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
