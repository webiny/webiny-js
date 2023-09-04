import React, { useState } from "react";
import { Form } from "@webiny/form";
import { FormLayoutComponent } from "@webiny/app-form-builder/types";
import styled from "@emotion/styled";
import { Row } from "./DefaultFormLayout/Row";
import { Cell } from "./DefaultFormLayout/Cell";
import { Field } from "./DefaultFormLayout/Field";
import { SuccessMessage } from "./DefaultFormLayout/SuccessMessage";
import { TermsOfServiceSection } from "./DefaultFormLayout/TermsOfServiceSection";
import { ReCaptchaSection } from "./DefaultFormLayout/ReCaptchaSection";
import { SubmitButton } from "./DefaultFormLayout/SubmitButton";
import { DefaultButton } from "./DefaultFormLayout/DefaultButton";

const Wrapper = styled.div`
    width: 100%;
    padding: 0 5px 5px 5px;
    box-sizing: border-box;
    background-color: ${props => props.theme.styles.colors["color6"]};
`;

const ButtonsWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    & button {
        height: 45px;
    }

    & button:first-of-type {
        margin-right: 15px;
    }
`;

const StepTitle = styled.div`
    font-size: 1.2em;
    height: 1.2em;
`;

/**
 * This is the default form layout component, in which we render all the form fields. We also render terms of service
 * and reCAPTCHA (if enabled in form settings), and, at the very bottom, the submit button.
 *
 * Feel free to use this component as your starting point for your own form layouts.
 */
const DefaultFormLayout: FormLayoutComponent = ({
    getFields,
    getDefaultValues,
    submit,
    goToNextStep,
    goToPreviousStep,
    isMultiStepForm,
    currentStepIndex,
    currentStep,
    formData,
    ReCaptcha,
    reCaptchaEnabled,
    TermsOfService,
    termsOfServiceEnabled
}) => {
    // Is the form in loading (submitting) state?
    const [loading, setLoading] = useState(false);

    // Is the form successfully submitted?
    const [formSuccess, setFormSuccess] = useState(false);

    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields(currentStepIndex);
    /**
     * Once the data is successfully submitted, we show a success message.
     */
    const submitForm = async (data: Record<string, any>): Promise<void> => {
        if (isMultiStepForm && currentStepIndex !== formData.steps.length - 1) {
            goToNextStep();
        } else {
            setLoading(true);
            const result = await submit(data);
            setLoading(false);
            if (result.error === null) {
                setFormSuccess(true);
            }
        }
    };

    if (formSuccess) {
        return <SuccessMessage formData={formData} />;
    }

    return (
        /* "onSubmit" callback gets triggered once all the fields are valid. */
        /* We also pass the default values for all fields via the getDefaultValues callback. */
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit }) => (
                <Wrapper>
                    <StepTitle>{currentStep?.title}</StepTitle>
                    {fields.map((row, rowIndex) => (
                        <Row key={rowIndex}>
                            {row.map(field => (
                                <Cell key={field._id}>
                                    <Field field={field} />
                                </Cell>
                            ))}
                        </Row>
                    ))}
                    {termsOfServiceEnabled && <TermsOfServiceSection component={TermsOfService} />}
                    {reCaptchaEnabled && <ReCaptchaSection component={ReCaptcha} />}
                    {/*
                        If the form has more than one step then the form will be recognized as a Multi Step Form,
                        so it means that we need to render form step handlers to switch between steps.
                    */}
                    {isMultiStepForm && (
                        <ButtonsWrapper>
                            <DefaultButton
                                onClick={goToPreviousStep}
                                disabled={currentStepIndex === 0}
                            >
                                Previous Step
                            </DefaultButton>
                            {currentStepIndex === formData.steps.length - 1 ? (
                                <SubmitButton onClick={submit} loading={loading} fullWidth={false}>
                                    {formData.settings.submitButtonLabel || "Submit"}
                                </SubmitButton>
                            ) : (
                                <SubmitButton onClick={submit} loading={loading} fullWidth={false}>
                                    Next Step
                                </SubmitButton>
                            )}
                        </ButtonsWrapper>
                    )}
                    {/* If form is single step then we just render submit button */}
                    {!isMultiStepForm && (
                        <SubmitButton
                            onClick={submit}
                            loading={loading}
                            fullWidth={formData.settings.fullWidthSubmitButton}
                        >
                            {formData.settings.submitButtonLabel || "Submit"}
                        </SubmitButton>
                    )}
                </Wrapper>
            )}
        </Form>
    );
};

export default DefaultFormLayout;
