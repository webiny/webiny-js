// @flow
import { resolveUpdateSettings, resolveGetSettings } from "@webiny/commodo-graphql";

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
            reCaptcha: ReCaptchaSettings
        }
    
        type FormsSettingsResponse {
            data: FormsSettings
            error: FormError
        }
    
        input FormsSettingsInput {
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
            getSettings: resolveGetSettings(getFormSettings)
        },
        FormsMutation: {
            updateSettings: resolveUpdateSettings(getFormSettings)
        }
    }
};
