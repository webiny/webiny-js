import { get } from "lodash";
import { i18nString, i18nObject } from "@webiny/api-i18n/fields";
import { withFields, string, fields, boolean, withProps } from "@webiny/commodo";
import { flow } from "lodash";
import { GraphQLContext as APIContext } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";

export type CreateSettingsModel = {
    context: APIContext & I18NContext & CommodoContext;
    FormSettings: any;
};

export default ({ context, FormSettings }: CreateSettingsModel) => {
    // When installing the FormBuilder app on a blank system, defaultLocale will be blank, because I18N app wasn't
    // installed yet, meaning no default locale was selected.
    let defaultLocale = null;
    if (context.i18n.getDefaultLocale()) {
        defaultLocale = context.i18n.getDefaultLocale().id;
    }

    return withFields({
        layout: fields({
            value: {},
            instanceOf: withFields({
                renderer: string({ value: "default" })
            })()
        }),
        submitButtonLabel: i18nString({ context }),
        successMessage: i18nObject({ context }),
        termsOfServiceMessage: fields({
            instanceOf: withFields({
                message: i18nObject({ context }),
                errorMessage: i18nString({ context }),
                enabled: boolean()
            })()
        }),
        reCaptcha: fields({
            instanceOf: flow(
                withProps({
                    settings: {
                        get enabled() {
                            return new Promise(async resolve => {
                                const settings = await FormSettings.load();
                                resolve(Boolean(get(settings, "data.reCaptcha.enabled")));
                            });
                        },
                        get siteKey() {
                            return new Promise(async resolve => {
                                const settings = await FormSettings.load();
                                resolve(get(settings, "data.reCaptcha.siteKey"));
                            });
                        },
                        get secretKey() {
                            return new Promise(async resolve => {
                                const settings = await FormSettings.load();
                                resolve(get(settings, "data.reCaptcha.secretKey"));
                            });
                        }
                    }
                }),
                withFields({
                    enabled: boolean(),
                    errorMessage: i18nString({
                        context,
                        value: {
                            values: [
                                {
                                    locale: defaultLocale,
                                    value: "Please verify that you are not a robot."
                                }
                            ]
                        }
                    })
                })
            )(),
            value: {}
        })
    })();
};
