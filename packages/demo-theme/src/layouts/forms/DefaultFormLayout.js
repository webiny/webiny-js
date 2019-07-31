// @flow
// $FlowFixMe
import React, { useState, useCallback } from "react";
import Input from "./fields/Input";
import Select from "./fields/Select";
import Radio from "./fields/Radio";
import Checkbox from "./fields/Checkbox";
import Textarea from "./fields/Textarea";
import { Form } from "webiny-form";
import { I18NValue } from "webiny-app-i18n/components";
import HelperMessage from "./components/HelperMessage";
import type { FieldType, FormRenderPropsType } from "webiny-app-forms/types";

const FormRenderer = ({ getFields, getDefaultValues, submit, form }: FormRenderPropsType) => {
    const fields = getFields();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    {
        /* Form submit action */
    }
    const submitForm = useCallback(async data => {
        setLoading(true);
        const result = await submit(data);
        setLoading(false);
        if (result.error === null) {
            setSuccess(true);
        }
    }, []);

    {
        /* Renders a field cell with a field element inside */
    }
    const renderFieldCell = (field, Bind) => {
        return (
            <div
                key={field._id}
                className={"webiny-cms-base-element-style webiny-cms-layout-column"}
            >
                <Bind name={field.fieldId} validators={field.validators}>
                    {({ validation, ...bind }) => (
                        <React.Fragment>
                            {/* Render element */}
                            {renderFieldElement({
                                field,
                                bind,
                                validation
                            })}
                        </React.Fragment>
                    )}
                </Bind>
            </div>
        );
    };

    {
        /* Renders a hidden field */
    }
    const renderHiddenField = (field, Bind) => {
        return (
            <Bind name={field.fieldId} validators={field.validators}>
                {({ validation, ...bind }) => (
                    <React.Fragment>
                        {/* Render input */}
                        {renderFieldElement({
                            field,
                            bind,
                            validation
                        })}
                    </React.Fragment>
                )}
            </Bind>
        );
    };

    {
        /* Render a field form element */
    }
    const renderFieldElement = (props: { field: FieldType, bind: Object, validation: Object }) => {
        switch (props.field.type) {
            case "text":
                return <Input {...props} />;
            case "textarea":
                return <Textarea {...props} />;
            case "number":
                return <Input type="number" {...props} />;
            case "rich-text":
                return <span>rich text</span>;
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

    {
        /* Render Terms of Service checkbox */
    }
    const renderTOS = Bind => {
        return (
            <div className="webiny-cms-form-tos">
                <Bind name={"tosAccepted"}>
                    {({ onChange, value }) => (
                        <div className="webiny-cms-form-field webiny-cms-form-field--checkbox">
                            <div className="webiny-cms-form-field__checkbox-group">
                                <div className="webiny-cms-form-field__checkbox">
                                    <input
                                        className="webiny-cms-form-field__checkbox-input"
                                        type={"checkbox"}
                                        name="webiny-tos-checkbox"
                                        id="webiny-tos-checkbox"
                                        checked={Boolean(value)}
                                        onChange={() => onChange(!value)}
                                    />
                                    <label
                                        htmlFor={"webiny-tos-checkbox"}
                                        className="webiny-cms-form-field__checkbox-label"
                                    >
                                        <I18NValue value={form.settings.termsOfServiceMessage} />
                                    </label>
                                </div>
                            </div>
                            <HelperMessage
                                isValid={false}
                                errorMessage={"you must accept our TOS"}
                            />
                        </div>
                    )}
                </Bind>
            </div>
        );
    };

    {
        /* Render the success message */
    }
    const renderSuccessMessage = () => {
        return (
            <div className={"webiny-cms-base-element-style webiny-cms-layout-row"}>
                <div className={"webiny-cms-base-element-style webiny-cms-layout-column"}>
                    <div className="webiny-cms-form__success-message">
                        <div className="webiny-cms-form-field__label webiny-cms-typography-h3">
                            <I18NValue value={form.settings.successMessage} default="Thanks!" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    {
        /* Render the form submit button */
    }
    const renderSubmitButton = (submit, loading, tosAccepted, buttonLabel) => {
        return (
            <div>
                <button
                    className={
                        "webiny-cms-element-button webiny-cms-element-button--primary" +
                        (loading ? " webiny-cms-element-button--loading" : "")
                    }
                    onClick={submit}
                    disabled={!tosAccepted || loading}
                >
                    <I18NValue value={buttonLabel} default="Submit" />
                </button>
            </div>
        );
    };

    return (
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind, data }) => (
                <div className={"webiny-cms-form"}>
                    {success ? (
                        renderSuccessMessage()
                    ) : (
                        <>
                            <div>
                                {fields.map((row, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className={
                                            "webiny-cms-base-element-style webiny-cms-layout-row"
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

                            {/* render tos */}
                            {renderTOS(Bind)}

                            {/* render submit button */}
                            {renderSubmitButton(
                                submit,
                                loading,
                                data.tosAccepted,
                                form.settings.submitButtonLabel
                            )}
                        </>
                    )}
                </div>
            )}
        </Form>
    );
};

export default FormRenderer;
