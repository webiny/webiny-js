import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { hasScope } from "@webiny/api-security";
import { Context } from "@webiny/graphql/types";
import { Context as SettingsManagerContext } from "@webiny/api-settings-manager/types";
import { FormBuilderSettingsCRUD } from "../../types";

type SettingsContext = Context & SettingsManagerContext;

export default {
    typeDefs: /* GraphQL*/ `
        type ReCaptchaSettings {
            enabled: Boolean
            siteKey: String
            secretKey: String
        }
    
        input ReCaptchaSettingsInput {
            enabled: Boolean
            siteKey: String
            secretKey: String
        }
    
        type FormsSettings {
            domain: String
            reCaptcha: ReCaptchaSettings
        }
    
        type FormsSettingsResponse {
            data: FormsSettings
            error: FormError
        }
    
        input FormsSettingsInput {
            domain: String
            reCaptcha: ReCaptchaSettingsInput
        }
    
    
        extend type FormsQuery {
            getSettings: FormsSettingsResponse
        }
    
        extend type FormsMutation {
            updateSettings(data: FormsSettingsInput): FormsSettingsResponse
        }
    `,
    resolvers: {
        FormsQuery: {
            getSettings: hasScope("forms:settings")(async (_, args, context: SettingsContext) => {
                try {
                    const formBuilderSettings: FormBuilderSettingsCRUD =
                        context?.formBuilder?.crud?.formBuilderSettings;

                    const data = await formBuilderSettings.getSettings();
                    return new Response(data);
                } catch (err) {
                    return new ErrorResponse(err);
                }
            })
        },
        FormsMutation: {
            updateSettings: hasScope("forms:settings")(
                async (_, args, context: SettingsContext) => {
                    try {
                        const formBuilderSettings: FormBuilderSettingsCRUD =
                            context?.formBuilder?.crud?.formBuilderSettings;

                        const existingSettings = await formBuilderSettings.getSettings();

                        if (!existingSettings) {
                            return new NotFoundResponse(`"Form Builder" settings not found!`);
                        }
                        await formBuilderSettings.updateSettings(args.data);
                        const data = await formBuilderSettings.getSettings();
                        return new Response(data);
                    } catch (err) {
                        return new ErrorResponse(err);
                    }
                }
            )
        }
    }
};
