import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { TriggerWebhookUseCase } from "~/api/features/TriggerWebhook/abstractions.js";

interface ITriggerWebhookArgs {
    id: string;
    payload: Record<string, unknown>;
}

class WebhookTriggerSchema_ implements GraphQLSchemaFactory.Interface {
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

        builder.addResolver<ITriggerWebhookArgs>({
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

export const WebhookTriggerSchema = GraphQLSchemaFactory.createImplementation({
    implementation: WebhookTriggerSchema_,
    dependencies: []
});
