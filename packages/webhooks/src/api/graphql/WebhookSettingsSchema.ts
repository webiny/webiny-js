import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { UpdateWebhookSettingsUseCase } from "~/api/features/UpdateWebhookSettings/abstractions.js";
import type { IUpdateWebhookSettingsInput } from "~/api/features/UpdateWebhookSettings/abstractions.js";

interface IUpdateWebhookSettingsArgs {
    input: IUpdateWebhookSettingsInput;
}

class WebhookSettingsSchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type WebhookSettings {
                signingSecret: String
                deliveryRetentionDays: Int
            }

            type WebhookSettingsResponse {
                data: WebhookSettings
                error: WebhookError
            }

            input UpdateWebhookSettingsInput {
                signingSecret: String
                deliveryRetentionDays: Int
            }

            extend type WebhookQuery {
                getSettings: WebhookSettingsResponse
            }

            extend type WebhookMutation {
                updateSettings(input: UpdateWebhookSettingsInput!): WebhookSettingsResponse
            }
        `);

        builder.addResolver({
            path: "WebhookQuery.getSettings",
            dependencies: [GetWebhookSettingsRepository],
            resolver: (getSettings: GetWebhookSettingsRepository.Interface) => {
                return async () => {
                    const result = await getSettings.execute();
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IUpdateWebhookSettingsArgs>({
            path: "WebhookMutation.updateSettings",
            dependencies: [UpdateWebhookSettingsUseCase],
            resolver: (updateSettings: UpdateWebhookSettingsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await updateSettings.execute(args.input);
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

export const WebhookSettingsSchema = GraphQLSchemaFactory.createImplementation({
    implementation: WebhookSettingsSchema_,
    dependencies: []
});
