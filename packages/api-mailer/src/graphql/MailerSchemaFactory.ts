import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { GetSettingsUseCase } from "~/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/features/SaveSettings/abstractions.js";
import type { MailerSettingsSource } from "~/features/GetSettings/abstractions.js";
import type { SaveSettingsInput } from "~/features/SaveSettings/abstractions.js";
import type { TransportSettings } from "~/types.js";

const SMTP_TRANSPORT_NAME = "Mailer/SmtpTransport";

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

class MailerSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(`
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
        `);

        builder.addResolver({
            path: "Query.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "Mutation.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "MailerQuery.getSettings",
            dependencies: [GetSettingsUseCase],
            resolver: (getSettings: GetSettingsUseCase.Interface) => async () => {
                try {
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
        });

        builder.addResolver<{ data: SaveSettingsInput }>({
            path: "MailerMutation.saveSettings",
            dependencies: [SaveSettingsUseCase],
            resolver:
                (saveSettings: SaveSettingsUseCase.Interface) =>
                async ({ args }) => {
                    try {
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
        });

        return builder;
    }
}

export const MailerSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: MailerSchemaFactoryImpl,
    dependencies: []
});
