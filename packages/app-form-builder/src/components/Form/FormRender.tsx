import { plugins } from "@webiny/plugins";
import { cloneDeep } from "lodash";
import React, { useEffect, useRef } from "react";
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
    FbFormSubmissionData,
    FbFormFieldValidatorPlugin,
    FbFormModelField,
    FormRenderFbFormModelField,
    FbFormModel,
    FbFormLayout
} from "~/types";
import { FbFormLayoutPlugin } from "~/plugins";

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

interface FieldValidator {
    (value: string): Promise<boolean>;
}

const FormRender: React.FC<FbFormRenderComponentProps> = props => {
    const client = useApolloClient();
    const data = props.data || ({} as FbFormModel);

    useEffect((): void => {
        if (!data.id) {
            return;
        }
        onFormMounted({
            preview: props.preview || false,
            data: props.data || null,
            client
        });
    }, [data.id]);

    const reCaptchaResponseToken = useRef("");
    const termsOfServiceAccepted = useRef(false);

    if (!data.id) {
        return null;
    }

    const formData: FbFormModel = cloneDeep(data);
    const { layout, fields, settings } = formData;

    const getFieldById = (id: string): FbFormModelField | null => {
        return fields.find(field => field._id === id) || null;
    };

    const getFieldByFieldId = (id: string): FbFormModelField | null => {
        return fields.find(field => field.fieldId === id) || null;
    };

    const getFields = (): FormRenderFbFormModelField[][] => {
        const fieldLayout = cloneDeep(layout);
        const validatorPlugins =
            plugins.byType<FbFormFieldValidatorPlugin>("fb-form-field-validator");

        return fieldLayout.map(row => {
            return row.map(id => {
                /**
                 * We can cast safely because we are adding validators
                 */
                const field = getFieldById(id) as FormRenderFbFormModelField;
                field.validators = (field.validation || []).reduce((collection, item) => {
                    const validatorPlugin = validatorPlugins.find(
                        plugin => plugin.validator.name === item.name
                    );

                    if (
                        !validatorPlugin ||
                        typeof validatorPlugin.validator.validate !== "function"
                    ) {
                        return collection;
                    }

                    const validator: FieldValidator = async (value: string): Promise<boolean> => {
                        let isInvalid;
                        try {
                            const result = await validatorPlugin.validator.validate(value, item);
                            isInvalid = result === false;
                        } catch (e) {
                            isInvalid = true;
                        }

                        if (isInvalid) {
                            throw new Error(item.message || "Invalid value.");
                        }
                        return true;
                    };
                    collection.push(validator);
                    return collection;
                }, [] as FieldValidator[]);
                return field;
            });
        });
    };

    const getDefaultValues = (
        overrides: Record<string, string> = {}
    ): Record<string, string | string[]> => {
        const values: Record<string, string | string[]> = {};
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

    const layouts: Array<FbFormLayout> = React.useMemo(() => {
        return plugins.byType<FbFormLayoutPlugin>(FbFormLayoutPlugin.type).map(pl => pl.layout);
    }, []);

    // Get form layout, defined in theme.
    let LayoutRenderComponent: any = layouts.find(item => item.name === settings.layout.renderer);

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

    const layoutProps: FormRenderPropsType<FbFormSubmissionData> = {
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
