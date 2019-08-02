// @flow
// $FlowFixMe
import React, { useEffect, useRef } from "react";
import { get, cloneDeep } from "lodash";
import { withCms } from "webiny-app-cms/context";
import { onFormMounted, createFormSubmission, handleFormTriggers } from "./functions";
import { withApollo } from "react-apollo";
import { getPlugins } from "webiny-plugins";
import { I18NValue } from "webiny-app-i18n/components";
import { compose } from "recompose";
import type {
    FormRenderPropsType,
    FormRenderComponentPropsType,
    FormSubmitResponseType
} from "webiny-app-forms/types";
import ReCAPTCHA from "react-google-recaptcha";

const FormRender = compose(
    withCms(),
    withApollo
)((props: FormRenderComponentPropsType) => {
    if (!props.data) {
        // TODO: handle this - loader?
        return null;
    }

    useEffect(() => onFormMounted(props), [props.data.id]);

    const reCaptchaResponseToken = useRef("");
    const termsOfServiceAccepted = useRef(false);

    const data = cloneDeep(props.data);
    const { layout, fields, settings } = data;

    const reCaptchaEnabled =
        get(settings, "reCaptcha.enabled") && get(settings, "reCaptcha.settings.enabled");
    const termsOfServiceEnabled = get(settings, "termsOfServiceMessage.enabled");

    const getFieldById = id => {
        return fields.find(field => field._id === id);
    };

    const getFieldByFieldId = id => {
        return fields.find(field => field.fieldId === id);
    };

    const getFields = () => {
        const fields = cloneDeep(layout);
        const validatorPlugins = getPlugins("form-field-validator");

        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
                row[idIndex].validators = row[idIndex].validation
                    .map(item => {
                        const validatorPlugin = validatorPlugins.find(
                            plugin => plugin.validator.name === item.name
                        );

                        if (
                            !validatorPlugin ||
                            typeof validatorPlugin.validator.validate !== "function"
                        ) {
                            return;
                        }

                        return async value => {
                            let isInvalid = true;
                            try {
                                const result = await validatorPlugin.validator.validate(
                                    value,
                                    item
                                );
                                isInvalid = result === false;
                            } catch (e) {
                                isInvalid = true;
                            }

                            if (isInvalid) {
                                throw new Error(
                                    I18NValue({ value: item.message }) || "Invalid value."
                                );
                            }
                        };
                    })
                    .filter(Boolean);
            });
        });
        return fields;
    };

    const getDefaultValues = (overrides = {}) => {
        const values = {};
        fields.forEach(field => {
            if (
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[field.fieldId] = field.settings.defaultValue;
            }
        });
        return { ...values, ...overrides };
    };

    const submit = async (data: Object): Promise<FormSubmitResponseType> => {
        if (reCaptchaEnabled && !reCaptchaResponseToken.current) {
            return {
                data: null,
                preview: Boolean(props.preview),
                error: {
                    code: "RECAPTCHA_NOT_PASSED",
                    message: settings.reCaptcha.errorMessage
                }
            };
        }

        if (termsOfServiceEnabled && !termsOfServiceAccepted.current) {
            return {
                data: null,
                preview: Boolean(props.preview),
                error: {
                    code: "TOS_NOT_ACCEPTED",
                    message: settings.termsOfServiceMessage.errorMessage
                }
            };
        }

        const formSubmission = await createFormSubmission({
            props,
            data,
            reCaptchaResponseToken: reCaptchaResponseToken.current
        });

        await handleFormTriggers({ props, data, formSubmission });
        return formSubmission;
    };

    // Get form layout, defined in theme.
    let LayoutRenderComponent = get(props.cms, "theme.forms.layouts", []).find(
        item => item.name === settings.layout.renderer
    );

    if (!LayoutRenderComponent) {
        return <span>Cannot render form, layout missing.</span>;
    }

    LayoutRenderComponent = LayoutRenderComponent.component;

    const ReCaptcha = props => {
        if (!reCaptchaEnabled) {
            return null;
        }

        if (typeof props.children === "function") {
            return props.children({
                errorMessage: settings.reCaptcha.errorMessage
            });
        }

        if (props.children) {
            return props.children;
        }

        return (
            <ReCAPTCHA
                {...props}
                sitekey={settings.reCaptcha.settings.siteKey}
                onChange={response => {
                    reCaptchaResponseToken.current = response;
                    typeof props.onChange === "function" && props.onChange(response);
                }}
                onErrored={(...args) => {
                    reCaptchaResponseToken.current = "";
                    typeof props.onErrored === "function" && props.onErrored(...args);
                }}
                onExpired={(...args) => {
                    reCaptchaResponseToken.current = "";
                    typeof props.onExpired === "function" && props.onExpired(...args);
                }}
            />
        );
    };

    const TermsOfService = props => {
        if (!termsOfServiceEnabled) {
            return null;
        }

        if (typeof props.children === "function") {
            return props.children({
                errorMessage: settings.termsOfServiceMessage.errorMessage,
                message: settings.termsOfServiceMessage.message,
                onChange: value => (termsOfServiceAccepted.current = value)
            });
        }

        throw new Error("Please use a function for children prop of TermsOfService component.");
    };

    const layoutProps: FormRenderPropsType = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        ReCaptcha,
        TermsOfService,
        form: data
    };

    return <LayoutRenderComponent {...layoutProps} />;
});

export default FormRender;
