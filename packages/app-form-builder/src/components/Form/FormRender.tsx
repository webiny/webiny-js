import { plugins } from "@webiny/plugins";
import cloneDeep from "lodash/cloneDeep";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ReCaptchaComponent } from "./components/createReCaptchaComponent";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "ps-tag": {
                "data-key": string;
                "data-value": string;
            };
        }
    }
}

interface FieldValidator {
    (value: string): Promise<boolean>;
}

const FormRender = (props: FbFormRenderComponentProps) => {
    const client = useApolloClient();
    const data = props.data || ({} as FbFormModel);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

    const [layoutRenderKey, setLayoutRenderKey] = useState<string>(new Date().getTime().toString());
    const resetLayoutRenderKey = useCallback(() => {
        setLayoutRenderKey(new Date().getTime().toString());
    }, []);

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

    // We need this useEffect in case when user has deleted a step and he was on that step on the preview tab,
    // so it won't trigger an error when we trying to view the step that we have deleted,
    // we will simpy change currentStep to the first step.
    useEffect(() => {
        setCurrentStepIndex(0);
    }, [data.steps.length]);

    const reCaptchaResponseToken = useRef("");
    const termsOfServiceAccepted = useRef(false);

    if (!data.id) {
        return null;
    }

    const goToNextStep = () => {
        setCurrentStepIndex(prevStep => (prevStep += 1));
    };

    const goToPreviousStep = () => {
        setCurrentStepIndex(prevStep => (prevStep -= 1));
    };

    const formData: FbFormModel = cloneDeep(data);
    const { fields, settings, steps } = formData;

    // Check if the form is a multi step.
    const isMultiStepForm = formData.steps.length > 1;

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    // We need this check in case we deleted last step and at the same time we were previewing it.
    const currentStep =
        steps[currentStepIndex] === undefined
            ? steps[formData.steps.length - 1]
            : steps[currentStepIndex];

    const getFieldById = (id: string): FbFormModelField | null => {
        return fields.find(field => field._id === id) || null;
    };

    const getFieldByFieldId = (id: string): FbFormModelField | null => {
        return fields.find(field => field.fieldId === id) || null;
    };

    // We need to have "stepIndex" prop in order to get corresponding fields for the current step.
    const getFields = (stepIndex = 0): FormRenderFbFormModelField[][] => {
        const stepFields =
            steps[stepIndex] === undefined ? steps[steps.length - 1] : steps[stepIndex];
        const fieldLayout = cloneDeep(stepFields.layout.filter(Boolean));
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
                        } catch {
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

            if (field.settings.otherOption) {
                values[`${fieldId}Other`] = "";
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

        setTimeout(() => {
            if (props.preview) {
                setCurrentStepIndex(0);
                resetLayoutRenderKey();
            }
        }, 2000);

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
    }) as ReCaptchaComponent;

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
        goToNextStep,
        goToPreviousStep,
        isLastStep,
        isFirstStep,
        currentStepIndex,
        currentStep,
        isMultiStepForm,
        formData,
        ReCaptcha,
        reCaptchaEnabled: reCaptchaEnabled(formData),
        TermsOfService,
        termsOfServiceEnabled: termsOfServiceEnabled(formData)
    };

    return (
        <>
            <ps-tag data-key="fb-form" data-value={data.formId} />
            <LayoutRenderComponent {...layoutProps} key={layoutRenderKey} />
        </>
    );
};

export default FormRender;
