import { ErrorResponse } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";
type SettingsContext = any;

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
                    const data = await context.settingsManager.getSettings("forms");
                    return { data };
                } catch (err) {
                    return new ErrorResponse(err);
                }
            })
        },
        FormsMutation: {
            /*updateSettings: hasScope("forms:settings")(resolveUpdateSettings(getFormSettings))*/
        }
    }
};
