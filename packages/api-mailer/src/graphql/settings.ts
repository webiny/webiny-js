import { ErrorResponse, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import type { MailerSettingsSource } from "~/features/GetSettings/abstractions.js";
import type { Context } from "@webiny/api/types.js";
import type { TransportSettings } from "~/types.js";

const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";

const emptyResolver = () => ({});

// Strip `password` before the settings leave the server and tack on `source`
// so the admin UI can branch on code-vs-storage. Accepts both the full
// `TransportSettings` (from getSettings) and the already-stripped
// `Omit<TransportSettings, "password">` (from saveSettings) — defense in depth
// even when the input type carries no password to begin with.
const toPublicSettings = (
    settings: TransportSettings | Omit<TransportSettings, "password"> | null,
    source: MailerSettingsSource
): (Omit<TransportSettings, "password"> & { source: MailerSettingsSource }) | null => {
    if (!settings) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...publicSettings } = settings as TransportSettings;
    return { ...publicSettings, source };
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
                secure: Boolean
                user: String
                from: String
                replyTo: String
                source: String
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
                secure: Boolean
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
                        const result = await getSettings.execute(SMTP_TRANSPORT_NAME);

                        const { settings, source } = result.value;

                        return {
                            data: toPublicSettings(settings, source),
                            error: null
                        };
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

                        return {
                            data: toPublicSettings(result.value, "storage"),
                            error: null
                        };
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
