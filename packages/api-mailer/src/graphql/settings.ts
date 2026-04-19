import { ErrorResponse, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import { ActiveTransport } from "~/domain/MailTransport/abstractions.js";
import type { Context } from "@webiny/api/types.js";
import type { TransportSettings } from "~/types.js";

const PASSWORD_MASK = "********";

const emptyResolver = () => ({});

const maskSettings = (
    settings: TransportSettings | null
): (Omit<TransportSettings, "password"> & { password: string }) | null => {
    if (!settings) {
        return null;
    }
    return {
        ...settings,
        password: settings.password ? PASSWORD_MASK : ""
    };
};

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
                password: String
                from: String
                replyTo: String
            }

            type MailerTransportSettingsResponse {
                data: MailerTransportSettings
                source: String
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
                        const activeTransport = context.container.resolve(ActiveTransport);
                        const transportName = activeTransport.name();

                        if (!transportName) {
                            return { data: null, source: null, error: null };
                        }

                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const result = await getSettings.execute(transportName);

                        const { settings, source } = result.value;

                        return { data: maskSettings(settings), source, error: null };
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

                        // Re-read to get the full stored state (the repository strips the
                        // password from its return value, but masking needs the real state
                        // so the "update without password" case still renders "********").
                        // If saveSettings succeeded, SaveSettingsUseCase's lockedByCode
                        // check already proved ActiveTransport.name() was non-null — so the
                        // non-null assertion here is an invariant, not a runtime guess.
                        const activeTransport = context.container.resolve(ActiveTransport);
                        const transportName = activeTransport.name();
                        if (!transportName) {
                            throw new Error(
                                "Invariant: saveSettings succeeded but ActiveTransport.name() is null."
                            );
                        }
                        const getSettings = context.container.resolve(GetSettingsUseCase);
                        const getResult = await getSettings.execute(transportName);
                        const { settings } = getResult.value;
                        return { data: maskSettings(settings), source: "storage", error: null };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
