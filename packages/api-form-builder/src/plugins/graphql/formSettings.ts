import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { FormBuilderContext } from "~/types";

export const createFormBuilderSettingsSchema = () => {
    const formBuilderSettingGraphQL = new GraphQLSchemaPlugin<FormBuilderContext>({
        typeDefs: /* GraphQL */ `
            type FbReCaptchaSettings {
                enabled: Boolean
                siteKey: String
                secretKey: String
            }

            input FbReCaptchaSettingsInput {
                enabled: Boolean
                siteKey: String
                secretKey: String
            }

            type FbSettings {
                domain: String
                reCaptcha: FbReCaptchaSettings
            }

            type FbSettingsResponse {
                data: FbSettings
                error: FbError
            }

            input FbSettingsInput {
                domain: String
                reCaptcha: FbReCaptchaSettingsInput
            }

            extend type FbQuery {
                getSettings: FbSettingsResponse
            }

            extend type FbMutation {
                updateSettings(data: FbSettingsInput): FbSettingsResponse
            }
        `,
        resolvers: {
            FbQuery: {
                async getSettings(_, __, context) {
                    try {
                        const settings = await context.formBuilder.getSettings({
                            throwOnNotFound: true
                        });
                        return new Response(settings);
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
            },
            FbMutation: {
                updateSettings: async (_, args: any, context) => {
                    try {
                        const settings = await context.formBuilder.updateSettings(args.data);
                        return new Response(settings);
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
            }
        }
    });

    return formBuilderSettingGraphQL;
};
