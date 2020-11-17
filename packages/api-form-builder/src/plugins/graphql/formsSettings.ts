import { ErrorResponse, NotFoundResponse, Response } from "@webiny/graphql";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerI18NContext } from "@webiny/api-i18n/types";
import { hasPermission } from "@webiny/api-security";
import { SecurityContext } from "@webiny/api-security/types";
import pipe from "@ramda/pipe";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { FormBuilderSettingsCRUD } from "../../types";

type Context = HandlerContext<HandlerI18NContext, SecurityContext>;

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
            getSettings: pipe(
                hasPermission("forms.settings"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
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
            updateSettings: pipe(
                hasPermission("forms.settings"),
                hasI18NContentPermission()
            )(async (_, args, context: Context) => {
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
            })
        }
    }
};
