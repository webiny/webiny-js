import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import type { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/abstractions.js";
import { SaveSettingsUseCase } from "~/api/features/SaveSettings/abstractions.js";
import type { MailerSettingsSource } from "~/api/features/GetSettings/abstractions.js";
import type { SaveSettingsInput } from "~/api/features/SaveSettings/abstractions.js";
import type { TransportSettings } from "~/api/types.js";
import { SMTP_TRANSPORT_NAME } from "~/api/constants.js";

/*
 * Strip `password` before the settings leave the server and add `source`, so the admin UI can
 * branch on code vs storage. Accepts both the full `TransportSettings` (from getSettings) and the
 * already-stripped `Omit<TransportSettings, "password">` (from saveSettings), as a second check
 * even when the input carries no password.
 */
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

class SmtpSettingsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("mailer-smtp/SmtpSettingsSchemaFactory");

    async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        // `MailerMutation` and `MailerTransportSettingsError` come from the core mailer schema.
        builder.addTypeDefs(`
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

            extend type MailerMutation {
                saveSettings(data: MailerTransportSettingsInput!): MailerTransportSettingsResponse!
            }

            extend type Query {
                mailer: MailerQuery
            }
        `);

        builder.addResolver({
            path: "Query.mailer",
            resolver: () => async () => ({})
        });

        builder.addResolver({
            path: "MailerQuery.getSettings",
            dependencies: [GetSettingsUseCase],
            resolver: (getSettings: GetSettingsUseCase.Interface) => async () => {
                try {
                    const result = await getSettings.execute(SMTP_TRANSPORT_NAME);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

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

export const SmtpSettingsSchemaFactory = GraphQLSchemaFactory.createImplementation({
    implementation: SmtpSettingsSchemaFactoryImpl,
    dependencies: []
});
