import React, { useEffect, useMemo, useRef, useState } from "react";
import { createReCaptchaComponent, createTermsOfServiceComponent } from "./FormRender/components";
import {
    createFormSubmission,
    handleFormTriggers,
    reCaptchaEnabled,
    termsOfServiceEnabled,
    onFormMounted
} from "./FormRender/functions";

import {
    FormLayoutComponent as FormLayoutComponentType,
    FormData,
    FormDataField,
    FormRenderComponentDataField,
    FormSubmission,
    FormSubmissionResponse,
    FormLayoutComponentProps,
    CreateFormParams,
    FormDataFieldsLayout,
    FormSubmissionFieldValues,
    CreateFormParamsFormLayoutComponent,
    CreateFormParamsValidator
} from "./types";

interface FieldValidator {
    (value: string): Promise<boolean>;
}

export interface FormRenderProps {
    createFormParams: CreateFormParams;
    formData: FormData;
    loading: boolean;
}

const FormRender = (props: FormRenderProps) => {
    const { formData, createFormParams } = props;
    const { preview = false, formLayoutComponents = [] } = createFormParams;
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

    // Check if the form is a multi step.
    const isMultiStepForm = formData.steps.length > 1;

    const goToNextStep = () => {
        setCurrentStepIndex(prevStep => (prevStep += 1));
    };

    const goToPreviousStep = () => {
        setCurrentStepIndex(prevStep => (prevStep -= 1));
    };

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === formData.steps.length - 1;

    const currentStep =
        formData.steps[currentStepIndex] === undefined
            ? formData.steps[formData.steps.length - 1]
            : formData.steps[currentStepIndex];

    const fieldValidators = useMemo<CreateFormParamsValidator[]>(() => {
        let validators: CreateFormParamsValidator[] = [];
        if (createFormParams.fieldValidators) {
            if (typeof createFormParams.fieldValidators === "function") {
                validators = createFormParams.fieldValidators();
            } else {
                validators = createFormParams.fieldValidators;
            }
        }

        return validators;
    }, []);

    const reCaptchaResponseToken = useRef("");
    const termsOfServiceAccepted = useRef(false);

    useEffect((): void => {
        formData && onFormMounted(props);
    }, [formData?.id]);

    let formLayoutComponentsList: CreateFormParamsFormLayoutComponent[];
    if (typeof formLayoutComponents === "function") {
        formLayoutComponentsList = formLayoutComponents();
    } else {
        formLayoutComponentsList = formLayoutComponents;
    }

    let FormLayoutComponent: FormLayoutComponentType | undefined;
    if (formData) {
        FormLayoutComponent = formLayoutComponentsList.find(
            item => item.id === formData.settings.layout.renderer
        )?.component;
    }

    if (!FormLayoutComponent) {
        return <div>Selected form component not found.</div>;
    }

    const { fields, settings, steps } = formData;

    const getFieldById = (id: string): FormDataField | null => {
        return fields.find(field => field._id === id) || null;
    };

    const getFieldByFieldId = (id: string): FormDataField | null => {
        return fields.find(field => field.fieldId === id) || null;
    };

    const getFields = (stepIndex = 0): FormRenderComponentDataField[][] => {
        const fieldLayout = structuredClone(steps[stepIndex].layout) as FormDataFieldsLayout;

        return fieldLayout.map(row => {
            return row.map(id => {
                /**
                 * We can cast safely because we are adding validators
                 */
                const field = getFieldById(id) as FormRenderComponentDataField;
                field.validators = (field.validation || []).reduce((collection, item) => {
                    const fieldValidator = fieldValidators?.find(
                        current => current.name === item.name
                    );

                    if (!fieldValidator || typeof fieldValidator.validate !== "function") {
                        return collection;
                    }

                    const validator: FieldValidator = async (value: string): Promise<boolean> => {
                        let isInvalid;
                        try {
                            const result = await fieldValidator.validate(value, item);
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

    const submit = async (
        formSubmissionFieldValues: FormSubmissionFieldValues
    ): Promise<FormSubmissionResponse> => {
        if (reCaptchaEnabled(formData) && !reCaptchaResponseToken.current) {
            return {
                data: null,
                preview,
                error: {
                    code: "RECAPTCHA_NOT_PASSED",
                    message: settings.reCaptcha.errorMessage
                }
            };
        }

        if (termsOfServiceEnabled(formData) && !termsOfServiceAccepted.current) {
            return {
                data: null,
                preview,
                error: {
                    code: "TOS_NOT_ACCEPTED",
                    message: settings.termsOfServiceMessage.errorMessage
                }
            };
        }

        const formSubmission = await createFormSubmission({
            props,
            formSubmissionFieldValues,
            reCaptchaResponseToken: reCaptchaResponseToken.current
        });

        await handleFormTriggers({ props, formSubmissionData: formSubmissionFieldValues });
        return formSubmission;
    };

    const ReCaptcha = createReCaptchaComponent({
        createFormParams,
        formData,
        setResponseToken: value => (reCaptchaResponseToken.current = value)
    });

    const TermsOfService = createTermsOfServiceComponent({
        createFormParams,
        formData,
        setTermsOfServiceAccepted: value => (termsOfServiceAccepted.current = value)
    });

    const layoutProps: FormLayoutComponentProps<FormSubmission> = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        goToNextStep,
        goToPreviousStep,
        isFirstStep,
        isLastStep,
        isMultiStepForm,
        currentStepIndex,
        currentStep,
        formData,
        ReCaptcha,
        reCaptchaEnabled: reCaptchaEnabled(formData),
        TermsOfService,
        termsOfServiceEnabled: termsOfServiceEnabled(formData)
    };

    return (
        <>
            <FormLayoutComponent {...layoutProps} />
            <ps-tag data-key="fb-form" data-value={formData.formId} />
            <ps-tag data-key="fb-form-revision" data-value={formData.id} />
        </>
    );
};

export default FormRender;
