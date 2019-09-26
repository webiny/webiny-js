import { get } from "lodash";
import { i18nString, i18nObject } from "@webiny/api-i18n/fields";
import { withFields, string, fields, boolean, withProps } from "@webiny/commodo";
import { flow } from "lodash";

export default ({ context, FormSettings }) =>
    withFields({
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
                                    locale: context.i18n.getDefaultLocale().id,
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
