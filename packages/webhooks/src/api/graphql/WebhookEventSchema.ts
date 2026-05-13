import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import NotAuthorizedResponse from "@webiny/api-core/graphql/security/NotAuthorizedResponse.js";
import { ListAvailableWebhookEventsUseCase } from "~/api/features/ListAvailableWebhookEvents/abstractions.js";

class WebhookEventSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookEvent {
                app: String!
                modelId: String!
                eventName: String!
                label: String!
            }

            type WebhookEventListResponse {
                data: [WebhookEvent!]
                error: WebhookError
            }

            extend type WebhookQuery {
                listAvailableWebhookEvents: WebhookEventListResponse!
            }
        `);

        builder.addResolver({
            path: "WebhookQuery.listAvailableWebhookEvents",
            dependencies: [IdentityContext, ListAvailableWebhookEventsUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                listEvents: ListAvailableWebhookEventsUseCase.Interface
            ) => {
                return async () => {
                    const permission = await identityContext.getPermission("webhooks");
                    if (!permission) {
                        return new NotAuthorizedResponse();
                    }
                    const result = await listEvents.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export default GraphQLSchemaFactory.createImplementation({
    implementation: WebhookEventSchema,
    dependencies: []
});
