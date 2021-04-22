import React, { useState } from "react";
import { BindComponentRenderProp, Form } from "@webiny/form";
import { FbFormModelField, FormLayoutComponent } from "@webiny/app-form-builder/types";
import { validation } from "@webiny/validation";
import { RichTextRenderer } from "@webiny/react-rich-text-renderer";

import Input from "./fields/Input";
import Select from "./fields/Select";
import Radio from "./fields/Radio";
import Checkbox from "./fields/Checkbox";
import Textarea from "./fields/Textarea";
import HelperMessage from "./components/HelperMessage";

/**
 * This is the default form layout component, in which we render all the form fields. We also render terms of service
 * and reCAPTCHA (if enabled in form settings), and at the bottom, the submit button. Note that we also utilized
 * the "webiny-form" package, which makes working with forms and form fields a walk in the park.
 *
 * Feel free to use this component as your starting point for your own form layouts. Add or remove things as you like!
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
    const submitForm = async data => {
        setLoading(true);
        const result = await submit(data);
        setLoading(false);
        if (result.error === null) {
            setFormSuccess(true);
        }
    };

    /**
     * Renders a field cell with a field element inside.
     */
    const renderFieldCell = (field, Bind) => {
        return (
            <div
                key={field._id}
                className={
                    "webiny-pb-base-page-element-style webiny-pb-layout-column webiny-fb-form-layout-column"
                }
            >
                <Bind name={field.fieldId} validators={field.validators}>
                    {bind => (
                        <React.Fragment>
                            {/* Render element */}
                            {renderFieldElement({
                                field,
                                bind
                            })}
                        </React.Fragment>
                    )}
                </Bind>
            </div>
        );
    };

    /**
     * Renders hidden fields.
     */
    const renderHiddenField = (field, Bind) => {
        return (
            <Bind name={field.fieldId} validators={field.validators}>
                {bind => (
                    <React.Fragment>
                        {/* Render input */}
                        {renderFieldElement({
                            field,
                            bind
                        })}
                    </React.Fragment>
                )}
            </Bind>
        );
    };

    /**
     * Renders a single form field. You can add additional handling of other field types if needed.
     * All of these components are located in the "./fields" folder.
     */
    const renderFieldElement = (props: {
        field: FbFormModelField;
        bind: BindComponentRenderProp;
    }) => {
        switch (props.field.type) {
            case "text":
                return <Input {...props} />;
            case "textarea":
                return <Textarea {...props} />;
            case "number":
                return <Input {...props} type="number" />;
            case "select":
                return <Select {...props} />;
            case "radio":
                return <Radio {...props} />;
            case "checkbox":
                return <Checkbox {...props} />;
            case "hidden":
                return <input type="hidden" value={props.bind.value} />;
            default:
                return <span>Cannot render field.</span>;
        }
    };

    /**
     * Renders Google reCAPTCHA field (checkbox) - to protect us from spam and bots.
     * For this we use the provided ReCaptcha component, which is a render prop component and a regular component
     * at the same time, depending if the function was passed as its children. If no children are present, then
     * it will render the actual Google reCAPTCHA field.
     * Note that you don't have to worry if the reCAPTCHA was actually enabled via the Form Editor - the component
     * does necessary checks internally and will not render anything if it isn't supposed to.
     */
    const renderReCaptcha = Bind => {
        return (
            <ReCaptcha>
                {({ errorMessage }) => (
                    <div className="webiny-fb-form-recaptcha">
                        <Bind name={"reCaptcha"} validators={validation.create("required")}>
                            {({ onChange, validation }) => (
                                <>
                                    <ReCaptcha onChange={onChange} />
                                    <HelperMessage
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

    /**
     * Renders the Terms of Service checkbox - which forces the user to agree to our Terms of Service
     * before actually submitting the form.
     * For this we use the provided TermsOfService component, which is a simple render prop component.
     * Note that you don't have to worry if the terms of service option was actually enabled via the Form Editor -
     * the component does necessary checks internally and will not render anything if it isn't supposed to.
     */
    const renderTermsOfService = Bind => {
        return (
            <TermsOfService>
                {({ message, errorMessage, onChange }) => (
                    <div className="webiny-fb-form-tos">
                        <Bind
                            name={"tosAccepted"}
                            validators={validation.create("required")}
                            afterChange={onChange}
                        >
                            {({ onChange, value, validation }) => (
                                <div className="webiny-fb-form-field webiny-fb-form-field--checkbox">
                                    <div className="webiny-fb-form-field__checkbox-group">
                                        <div className="webiny-fb-form-field__checkbox">
                                            <input
                                                className="webiny-fb-form-field__checkbox-input"
                                                type={"checkbox"}
                                                name="webiny-tos-checkbox"
                                                id="webiny-tos-checkbox"
                                                checked={Boolean(value)}
                                                onChange={() => onChange(!value)}
                                            />
                                            <label
                                                htmlFor={"webiny-tos-checkbox"}
                                                className="webiny-fb-form-field__checkbox-label"
                                            >
                                                <RichTextRenderer data={message} />
                                            </label>
                                        </div>
                                    </div>
                                    <HelperMessage
                                        isValid={validation.isValid}
                                        errorMessage={errorMessage}
                                    />
                                </div>
                            )}
                        </Bind>
                    </div>
                )}
            </TermsOfService>
        );
    };

    /**
     * Renders the success message.
     */
    const renderSuccessMessage = () => {
        return (
            <div
                className={
                    "webiny-pb-base-page-element-style webiny-pb-layout-row webiny-fb-form-layout-row"
                }
            >
                <div
                    className={
                        "webiny-pb-base-page-element-style webiny-pb-layout-column webiny-fb-form-layout-column"
                    }
                >
                    <div className="webiny-fb-form-form__success-message">
                        <div className="webiny-fb-form-field__label webiny-pb-typography-h3">
                            {formData.settings.successMessage ? (
                                <RichTextRenderer data={formData.settings.successMessage} />
                            ) : (
                                "Thanks!"
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Renders the form submit button. We disable the button if the form is in the loading state.
     */
    const renderSubmitButton = (submit, loading, tosAccepted, buttonLabel) => {
        return (
            <div className="webiny-fb-form-submit-button">
                <button
                    className={
                        "webiny-fb-form-page-element-button webiny-pb-page-element-button webiny-pb-page-element-button--primary" +
                        (loading ? " webiny-pb-element-button--loading" : "")
                    }
                    onClick={submit}
                    disabled={loading}
                >
                    {buttonLabel || "Submit"}
                </button>
            </div>
        );
    };

    return (
        /* "onSubmit" callback gets triggered once all of the fields are valid. */
        /* We also pass the default values for all fields via the getDefaultValues callback. */
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind, data }) => (
                <div className={"webiny-fb-form"}>
                    {formSuccess ? (
                        renderSuccessMessage()
                    ) : (
                        <>
                            {/* Let's render all form fields. */}
                            <div>
                                {fields.map((row, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className={
                                            "webiny-pb-base-page-element-style webiny-pb-layout-row webiny-fb-form-layout-row"
                                        }
                                    >
                                        {/* render form fields */}
                                        {row.map(field =>
                                            field.type !== "hidden"
                                                ? renderFieldCell(field, Bind)
                                                : renderHiddenField(field, Bind)
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/*
                                At the bottom of the Form, we render the terms of service,
                                the reCAPTCHA field and the submit button.
                            */}
                            {renderTermsOfService(Bind)}
                            {renderReCaptcha(Bind)}
                            {renderSubmitButton(
                                submit,
                                loading,
                                data.tosAccepted,
                                formData.settings.submitButtonLabel
                            )}
                        </>
                    )}
                </div>
            )}
        </Form>
    );
};

export default DefaultFormLayout;
