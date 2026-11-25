import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import type { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ErrorResponse } from "@webiny/api-graphql/responses.js";
import { GetSettingsUseCase, SaveSettingsUseCase } from "@webiny/api-mailer";
import type { MailerSettingsSource } from "@webiny/api-mailer";
import type { TransportSettings } from "~/api/types.js";
import { SMTP_TRANSPORT_NAME } from "~/api/constants.js";

type SaveSettingsInput = Partial<TransportSettings>;

/*
 * Add `source`, so the admin UI can branch on code vs storage. The core mailer already leaves the
 * password out; it is stripped again here in case a definition is replaced.
 */
const toPublicSettings = (
    settings: Record<string, unknown> | null,
    source: MailerSettingsSource
): Record<string, unknown> | null => {
    if (!settings) {
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...publicSettings } = settings;
    return { ...publicSettings, source };
};

class SmtpSettingsSchemaFactoryImpl implements GraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("mailer-smtp/SmtpSettingsSchemaFactory");

    async execute(
        builder: GraphQLSchemaBuilder.Interface
    ): Promise<GraphQLSchemaBuilder.Interface> {
        // `MailerQuery`, `MailerMutation` and `MailerTransportSettingsError` come from the core
        // mailer schema. These typed fields are SMTP's; other transports use the JSON ones.
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

            extend type MailerQuery {
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
        `);

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
                        const result = await saveSettings.execute(SMTP_TRANSPORT_NAME, args.data);

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
