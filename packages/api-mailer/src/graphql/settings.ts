import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import type { Context } from "@webiny/api/types.js";
const emptyResolver = () => ({});

export const createSettingsGraphQL = () => {
    return new GraphQLSchemaPlugin<Context>({
        typeDefs: `
            type MailerTransportSettingsError {
                message: String!
                code: String
                data: JSON
            }

            type MailerTransportSettings {
                host: String
                port: Number
                user: String
                from: String
                replyTo: String
            }

            type MailerTransportSettingsResponse {
                data: MailerTransportSettings
                error: MailerTransportSettingsError
            }

            type MailerQuery {
                getSettings: MailerTransportSettingsResponse!
            }

            input MailerTransportSettingsInput {
                host: String!
                port: Number
                user: String!
                password: String
                from: String!
                replyTo: String
            }

            type MailerMutation {
                saveSettings(data: MailerTransportSettingsInput!): MailerTransportSettingsResponse!
            }

            extend type Query {
                mailer: MailerQuery
            }
            extend type Mutation {
                mailer: MailerMutation
            }
        `,
        resolvers: {
            Query: {
                mailer: emptyResolver
            },
            MailerQuery: {
                getSettings: async (_, __, context) => {
                    try {
                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const result = await getSettings.execute("Mailer/SmtpTransport");

                        const settings = result.value.settings;

                        // Remove password from response
                        if (settings?.password) {
                            // oxlint-disable-next-line typescript/no-unused-vars
                            const { password, ...settingsWithoutPassword } = settings;
                            return new Response(settingsWithoutPassword);
                        }
                        return new Response(settings);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            },
            Mutation: {
                mailer: emptyResolver
            },
            MailerMutation: {
                saveSettings: async (_, args: any, context) => {
                    try {
                        const saveSettings = context.container.resolve(SaveSettingsUseCase);
                        const result = await saveSettings.execute(args.data);

                        if (result.isFail()) {
                            return new ErrorResponse(result.error);
                        }

                        const settings = result.value;

                        // Remove password from response
                        // TODO: create a GraphQL output mapper
                        if (settings?.password) {
                            // oxlint-disable-next-line typescript/no-unused-vars
                            const { password, ...settingsWithoutPassword } = settings;
                            return new Response(settingsWithoutPassword);
                        }
                        return new Response(settings);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
