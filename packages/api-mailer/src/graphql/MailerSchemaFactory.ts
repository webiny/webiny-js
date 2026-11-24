import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { SendTestMailUseCase } from "~/features/SendTestMail/abstractions.js";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";

/*
 * The `mailer` namespaces, the test email, and the settings of any transport that registers a
 * `TransportSettingsDefinition`, as JSON. Secrets are never returned.
 */
class MailerSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("api-mailer/MailerSchemaFactoryImpl");

    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(`
            type MailerTransportSettingsError {
                message: String!
                code: String
                data: JSON
            }

            type MailerSendTestMailResponse {
                data: Boolean
                error: MailerTransportSettingsError
            }

            type MailerTransportSettingsData {
                transport: String!
                settings: JSON
                source: String
            }

            type MailerTransportSettingsDataResponse {
                data: MailerTransportSettingsData
                error: MailerTransportSettingsError
            }

            type MailerQuery {
                getTransportSettings(transport: String!): MailerTransportSettingsDataResponse!
            }

            type MailerMutation {
                sendTestMail(to: String!): MailerSendTestMailResponse!
                saveTransportSettings(
                    transport: String!
                    settings: JSON!
                ): MailerTransportSettingsDataResponse!
            }

            extend type Query {
                mailer: MailerQuery
            }

            extend type Mutation {
                mailer: MailerMutation
            }
        `);

        builder.addResolver({
            path: "Query.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "Mutation.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver<{ transport: string }>({
            path: "MailerQuery.getTransportSettings",
            dependencies: [GetSettingsUseCase],
            resolver:
                (getSettings: GetSettingsUseCase.Interface) =>
                async ({ args }) => {
                    try {
                        const result = await getSettings.execute(args.transport);
                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }
                        return {
                            data: { transport: args.transport, ...result.value },
                            error: null
                        };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
        });

        builder.addResolver<{ transport: string; settings: Record<string, unknown> }>({
            path: "MailerMutation.saveTransportSettings",
            dependencies: [SaveSettingsUseCase],
            resolver:
                (saveSettings: SaveSettingsUseCase.Interface) =>
                async ({ args }) => {
                    try {
                        const result = await saveSettings.execute(args.transport, args.settings);
                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }
                        return {
                            data: {
                                transport: args.transport,
                                settings: result.value,
                                source: "storage"
                            },
                            error: null
                        };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
        });

        builder.addResolver<{ to: string }>({
            path: "MailerMutation.sendTestMail",
            dependencies: [SendTestMailUseCase],
            resolver:
                (sendTestMail: SendTestMailUseCase.Interface) =>
                async ({ args }) => {
                    try {
                        const result = await sendTestMail.execute({ to: args.to });

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        return { data: true, error: null };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
        });

        return builder;
    }
}

export const MailerSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: MailerSchemaFactoryImpl,
    dependencies: []
});
