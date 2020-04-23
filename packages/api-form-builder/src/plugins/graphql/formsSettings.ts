import { resolveUpdateSettings, resolveGetSettings } from "@webiny/commodo-graphql";
import { hasScope } from "@webiny/api-security";

const getFormSettings = ctx => ctx.models.FormSettings;

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
            getSettings: hasScope("forms:settings")(resolveGetSettings(getFormSettings))
        },
        FormsMutation: {
            updateSettings: hasScope("forms:settings")(resolveUpdateSettings(getFormSettings))
        }
    }
};
