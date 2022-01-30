import { plugins } from "@webiny/plugins";
import { cloneDeep, get } from "lodash";
import React, { useEffect, useRef, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { createReCaptchaComponent, createTermsOfServiceComponent } from "./components";
import {
    createFormSubmission,
    handleFormTriggers,
    onFormMounted,
    reCaptchaEnabled,
    termsOfServiceEnabled
} from "./functions";

import {
    FormRenderPropsType,
    FbFormRenderComponentProps,
    FormSubmitResponseType,
    FbFormModel,
    FbFormSubmissionData,
    FbFormFieldValidatorPlugin,
    FbFormLayoutPlugin,
    FbFormModelField
} from "~/types";
import { PbThemePlugin } from "@webiny/app-page-builder/types";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            // @ts-ignore
            "ps-tag": {
                class?: string;
                id?: string;
            };
        }
    }
}

const FormRender: React.FC<FbFormRenderComponentProps> = props => {
    const theme = useMemo(
        () => Object.assign({}, ...plugins.byType("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    const client = useApolloClient();
    const data = props.data || ({} as FbFormModel);

    useEffect(() => {
        if (data.id) {
            onFormMounted({ ...props, client });
        }
    }, [data.id]);

    const reCaptchaResponseToken = useRef("");
    const termsOfServiceAccepted = useRef(false);

    if (!data.id) {
        return null;
    }

    const formData: FbFormModel = cloneDeep(data);
    const { layout, fields, settings } = formData;

    const getFieldById = (id: string): FbFormModelField => {
        return fields.find(field => field._id === id);
    };

    const getFieldByFieldId = (id: string): FbFormModelField => {
        return fields.find(field => field.fieldId === id);
    };

    const getFields = () => {
        const fields = cloneDeep(layout);
        const validatorPlugins =
            plugins.byType<FbFormFieldValidatorPlugin>("fb-form-field-validator");

        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                const field = getFieldById(id);
                // row[idIndex] = getFieldById(id);
                field.validators = row[idIndex].validation
                    .map(item => {
                        const validatorPlugin = validatorPlugins.find(
                            plugin => plugin.validator.name === item.name
                        );

                        if (
                            !validatorPlugin ||
                            typeof validatorPlugin.validator.validate !== "function"
                        ) {
                            return null;
                        }

                        return async (value: string): Promise<void> => {
                            let isInvalid;
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
                                throw new Error(item.message || "Invalid value.");
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
            const fieldId = field.fieldId;

            if (
                fieldId &&
                "defaultValue" in field.settings &&
                typeof field.settings.defaultValue !== "undefined"
            ) {
                values[fieldId] = field.settings.defaultValue;
            }
        });
        return { ...values, ...overrides };
    };

    const submit = async (data: FbFormSubmissionData): Promise<FormSubmitResponseType> => {
        if (reCaptchaEnabled(formData) && !reCaptchaResponseToken.current) {
            return {
                data: null,
                preview: Boolean(props.preview),
                error: {
                    code: "RECAPTCHA_NOT_PASSED",
                    message: settings.reCaptcha.errorMessage
                }
            };
        }

        if (termsOfServiceEnabled(formData) && !termsOfServiceAccepted.current) {
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
            client,
            props,
            data,
            reCaptchaResponseToken: reCaptchaResponseToken.current
        });

        await handleFormTriggers({ props, data, formSubmission });
        return formSubmission;
    };

    const layouts = React.useMemo(
        () =>
            [
                ...(get(theme, "formBuilder.layouts") || []),
                ...plugins.byType<FbFormLayoutPlugin>("form-layout").map(pl => pl.layout)
            ].reduce((acc, item) => {
                if (!acc.find(l => l.name === item.name)) {
                    acc.push(item);
                }
                return acc;
            }, []),
        []
    );

    // Get form layout, defined in theme.
    let LayoutRenderComponent = layouts.find(item => item.name === settings.layout.renderer);

    if (!LayoutRenderComponent) {
        return <span>Cannot render form, layout missing.</span>;
    }

    LayoutRenderComponent = LayoutRenderComponent.component;

    const ReCaptcha = createReCaptchaComponent({
        props,
        formData,
        setResponseToken: value => (reCaptchaResponseToken.current = value)
    });

    const TermsOfService = createTermsOfServiceComponent({
        props,
        formData,
        setTermsOfServiceAccepted: value => (termsOfServiceAccepted.current = value)
    });

    const layoutProps: FormRenderPropsType = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        formData,
        ReCaptcha,
        TermsOfService
    };

    return (
        <>
            <ps-tag data-key="fb-form" data-value={data.parent} />
            <LayoutRenderComponent {...layoutProps} />
        </>
    );
};

export default FormRender;
