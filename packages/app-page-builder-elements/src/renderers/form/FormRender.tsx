import React, { useEffect, useMemo, useRef, useState } from "react";
import { createReCaptchaComponent, createTermsOfServiceComponent } from "./FormRender/components";
import {
    createFormSubmission,
    handleFormTriggers,
    reCaptchaEnabled,
    termsOfServiceEnabled,
    onFormMounted,
    getNextStepIndex
} from "./FormRender/functions";
import { checkIfConditionsMet } from "./FormRender/functions/getNextStepIndex";
import {
    FormLayoutComponent as FormLayoutComponentType,
    FormData,
    FormDataField,
    FormRenderComponentDataField,
    FormSubmission,
    FormSubmissionResponse,
    FormLayoutComponentProps,
    CreateFormParams,
    FormSubmissionFieldValues,
    CreateFormParamsFormLayoutComponent,
    CreateFormParamsValidator,
    FormRule
} from "./types";

interface FieldValidator {
    (value: string): Promise<boolean>;
}

export interface FormRenderProps {
    createFormParams: CreateFormParams;
    formData: FormData;
    loading: boolean;
}

type FormRedirectTrigger = {
    redirect: {
        url: string;
    };
};

const FormRender = (props: FormRenderProps) => {
    const { formData, createFormParams } = props;
    const { preview = false, formLayoutComponents = [] } = createFormParams;
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [formState, setFormState] = useState<any>();
    const [formRedirectTrigger, setFormRedirectTrigger] = useState<FormRedirectTrigger | null>(
        null
    );

    // We need to add index to every step so we can properly,
    // add or remove step from array of steps based on step rules.
    formData.steps = formData.steps.map((formStep, index) => ({
        ...formStep,
        index
    }));

    const [modifiedSteps, setModifiedSteps] = useState(formData.steps);

    // Check if the form is a multi step.
    const isMultiStepForm = formData.steps.length > 1;

    const goToNextStep = () => {
        setCurrentStepIndex(prevStep => {
            const nextStep = (prevStep += 1);
            validateStepConditions(formState, nextStep);
            return nextStep;
        });
    };

    const goToPreviousStep = () => {
        setCurrentStepIndex(prevStep => (prevStep -= 1));
    };

    const resolvedSteps = useMemo(() => {
        return modifiedSteps || formData.steps;
    }, [formData.steps, modifiedSteps]);

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === resolvedSteps.length - 1;

    // We need this check in case we deleted last step and at the same time we were previewing it.
    const currentStep =
        resolvedSteps[currentStepIndex] === undefined
            ? resolvedSteps[resolvedSteps.length - 1]
            : resolvedSteps[currentStepIndex];

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

    const validateStepConditions = (formData: Record<string, any>, stepIndex: number) => {
        const currentStep = resolvedSteps[stepIndex];

        const action = getNextStepIndex({
            formData,
            rules: currentStep.rules
        });

        if (action.type === "submitAndRedirect") {
            setModifiedSteps([...modifiedSteps.slice(0, stepIndex + 1)]);
            setFormRedirectTrigger({
                redirect: {
                    url: action.value
                }
            });
        } else {
            setFormRedirectTrigger(null);
            if (action.type === "submit") {
                setModifiedSteps([...modifiedSteps.slice(0, stepIndex + 1)]);
            } else if (action.type === "goToStep") {
                setModifiedSteps([
                    ...modifiedSteps.slice(0, stepIndex + 1),
                    ...steps.slice(+action.value)
                ]);
            } else {
                setModifiedSteps([
                    ...modifiedSteps.slice(0, stepIndex + 1),
                    ...steps.slice(currentStep.index + 1)
                ]);
            }
        }
    };

    const getFields = (stepIndex = 0): FormRenderComponentDataField[][] => {
        const stepFields =
            resolvedSteps[stepIndex] === undefined
                ? resolvedSteps[resolvedSteps.length - 1]
                : resolvedSteps[stepIndex];
        const fieldLayout = structuredClone(stepFields.layout.filter(Boolean));

        // Here we are adding condition group fields into step layout.
        fieldLayout.forEach((row, fieldIndex) => {
            row.forEach(fieldId => {
                const field = getFieldById(fieldId);
                if (!field) {
                    return;
                }

                if (field.settings.rules !== undefined) {
                    field.settings?.rules.forEach((rule: FormRule) => {
                        if (checkIfConditionsMet({ formData: formState, rule })) {
                            if (rule.action.value === "show") {
                                fieldLayout.splice(fieldIndex, 1, ...field.settings.layout);
                            } else {
                                fieldLayout.splice(fieldIndex, field.settings.layout.length, [
                                    field._id
                                ]);
                            }
                        } else {
                            if (field.settings.defaultBehaviour === "show") {
                                fieldLayout.splice(fieldIndex, 1, ...field.settings.layout);
                            }
                        }
                    });
                }
            });
        });

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

        if (formRedirectTrigger) {
            props.formData.triggers = {
                ...props.formData.triggers,
                ...formRedirectTrigger
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
        validateStepConditions,
        setFormState,
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
