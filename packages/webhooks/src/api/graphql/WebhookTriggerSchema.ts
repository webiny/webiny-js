import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";

class WebhookTriggerSchema implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookTriggerResponse {
                data: WebhookDelivery
                error: WebhookError
            }

            extend type WebhookMutation {
                triggerWebhook(id: ID!, payload: JSON!): WebhookTriggerResponse!
            }
        `);

        builder.addResolver<{ id: string; payload: Record<string, unknown> }>({
            path: "WebhookMutation.triggerWebhook",
            dependencies: [TriggerWebhookUseCase],
            resolver: (triggerWebhook: TriggerWebhookUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await triggerWebhook.execute(args.id, args.payload);
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
    implementation: WebhookTriggerSchema,
    dependencies: []
});
