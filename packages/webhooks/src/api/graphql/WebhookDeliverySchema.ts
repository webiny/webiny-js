import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { ListResponse } from "@webiny/handler-graphql";
import { ListErrorResponse } from "@webiny/handler-graphql";
import { ListWebhookDeliveriesUseCase } from "~/api/features/ListWebhookDeliveries/abstractions.js";
import { GetWebhookDeliveryUseCase } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { ResendWebhookDeliveryUseCase } from "~/api/features/ResendWebhookDelivery/abstractions.js";

interface IListDeliveriesArgs {
    where?: {
        webhookId_eq?: string;
        eventType_in?: string[];
        status_in?: string[];
    };
    limit?: number;
    after?: string;
}

interface IIdArgs {
    id: string;
}

class WebhookDeliverySchema_ implements GraphQLSchemaFactory.Interface {
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
                responseHeaders: JSON
                responseTime: Int
                responseStatus: Int
                responseBody: String
                expiresAt: DateTime
                createdOn: DateTime
            }

            input WebhookDeliveryListWhereInput {
                webhookId_eq: ID
                eventType_in: [String!]
                status_in: [String!]
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
                    where: WebhookDeliveryListWhereInput
                    limit: Int
                    after: String
                ): WebhookDeliveryListResponse!
                getWebhookDelivery(id: ID!): WebhookDeliveryResponse!
            }

            extend type WebhookMutation {
                resendWebhookDelivery(id: ID!): BooleanResponse!
            }
        `);

        builder.addResolver<IListDeliveriesArgs>({
            path: "WebhookQuery.listWebhookDeliveries",
            dependencies: [ListWebhookDeliveriesUseCase],
            resolver: (listDeliveries: ListWebhookDeliveriesUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listDeliveries.execute({
                        where: args.where,
                        limit: args.limit,
                        after: args.after
                    });
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<IIdArgs>({
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

        builder.addResolver<IIdArgs>({
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

export const WebhookDeliverySchema = GraphQLSchemaFactory.createImplementation({
    implementation: WebhookDeliverySchema_,
    dependencies: []
});
