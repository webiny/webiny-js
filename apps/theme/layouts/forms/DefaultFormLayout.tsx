import React, { useState } from "react";
import { Form, BindComponent } from "@webiny/form";
import { validation } from "@webiny/validation";
import { FormLayoutComponent } from "@webiny/app-form-builder/types";
import styled from "@emotion/styled";

import { Row } from "./DefaultFormLayout/Row";
import { Cell } from "./DefaultFormLayout/Cell";
import { Field } from "./DefaultFormLayout/Field";
import { SuccessMessage } from "./DefaultFormLayout/SuccessMessage";
import { SubmitButton } from "./DefaultFormLayout/SubmitButton";
import { TermsOfServiceSection } from "./DefaultFormLayout/TermsOfServiceSection";
import { FieldMessage } from "./DefaultFormLayout/fields/components/FieldMessage";

import theme from "../../theme";

const Wrapper = styled.div`
    width: 100%;
    padding: 0 5px 5px 5px;
    box-sizing: border-box;
    background-color: ${theme.styles.colors.color5};
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
    formData,
    ReCaptcha,
    TermsOfService
}) => {
    // Is the form in loading (submitting) state?
    const [loading, setLoading] = useState(false);

    // Is the form successfully submitted?
    const [formSuccess, setFormSuccess] = useState(false);

    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();

    /**
     * Once the data is successfully submitted, we show a success message.
     */
    const submitForm = async (data: Record<string, any>): Promise<void> => {
        setLoading(true);
        const result = await submit(data);
        setLoading(false);
        if (result.error === null) {
            setFormSuccess(true);
        }
    };

    /**
     * Renders Google reCAPTCHA field (checkbox) - to protect us from spam and bots.
     */
    const renderReCaptcha = (Bind: BindComponent) => {
        return (
            <ReCaptcha>
                {({ errorMessage }) => (
                    <div className="webiny-fb-form-recaptcha">
                        <Bind name={"reCaptcha"} validators={validation.create("required")}>
                            {({ onChange, validation }) => (
                                <>
                                    <ReCaptcha onChange={onChange} />
                                    <FieldMessage
                                        isValid={validation.isValid}
                                        errorMessage={errorMessage}
                                    />
                                </>
                            )}
                        </Bind>
                    </div>
                )}
            </ReCaptcha>
        );
    };

    if (formSuccess) {
        return <SuccessMessage formData={formData} />;
    }

    return (
        /* "onSubmit" callback gets triggered once all of the fields are valid. */
        /* We also pass the default values for all fields via the getDefaultValues callback. */
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind }) => (
                <Wrapper>
                    {fields.map((row, rowIndex) => (
                        <Row key={rowIndex}>
                            {row.map(field => (
                                <Cell key={field._id}>
                                    <Field field={field} />
                                </Cell>
                            ))}
                        </Row>
                    ))}

                    {/*
                        At the bottom of the Form, we render the terms of service,
                        the reCAPTCHA field, and the submit button.
                    */}
                    <TermsOfServiceSection component={TermsOfService} />
                    {renderReCaptcha(Bind)}

                    <SubmitButton onClick={submit} loading={loading}>
                        {formData.settings.submitButtonLabel || "Submit"}
                    </SubmitButton>
                </Wrapper>
            )}
        </Form>
    );
};

export default DefaultFormLayout;
