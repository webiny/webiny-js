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
import type { FieldType, FormRenderPropsType } from "webiny-app-forms/types";

// TODO: this is an example, do whatever you want.. feel free to use 3rd party components....
function renderField(props: { field: FieldType, bind: Object, validation: Object }) {
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
}

const FormRenderer = ({ getFields, getDefaultValues, submit, form }: FormRenderPropsType) => {
    const fields = getFields();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const submitForm = useCallback(async data => {
        setLoading(true);
        const result = await submit(data);
        setLoading(false);
        if (result.error === null) {
            setSuccess(true);
        }
    }, []);

    return (
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind, data }) => (
                <div className={"webiny-cms-form"}>
                    {success ? (
                        <div className={"webiny-cms-base-element-style webiny-cms-layout-row"}>
                            <div
                                className={"webiny-cms-base-element-style webiny-cms-layout-column"}
                            >
                                <div className="webiny-cms-form__success-message">
                                    <div className="webiny-cms-form-field__label webiny-cms-typography-h3">
                                        <I18NValue
                                            value={form.settings.successMessage}
                                            default="Thanks!"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                        {row.map(field => (
                                            <div
                                                key={field._id}
                                                className={
                                                    "webiny-cms-base-element-style webiny-cms-layout-column"
                                                }
                                            >
                                                <Bind
                                                    name={field.fieldId}
                                                    validators={field.validators}
                                                >
                                                    {({ validation, ...bind }) => (
                                                        <React.Fragment>
                                                            {/* Render input or whatever */}
                                                            {renderField({
                                                                field,
                                                                bind,
                                                                validation
                                                            })}
                                                            {/* Render validation message */}
                                                            {validation.isValid === false
                                                                ? validation.message
                                                                : null}
                                                        </React.Fragment>
                                                    )}
                                                </Bind>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <Bind name={"tosAccepted"}>
                                    {({ onChange, value }) => (
                                        <>
                                            <input
                                                type={"checkbox"}
                                                checked={Boolean(value)}
                                                onChange={() => onChange(!value)}
                                            />
                                            <I18NValue
                                                value={form.settings.termsOfServiceMessage}
                                            />
                                        </>
                                    )}
                                </Bind>
                            </div>
                            <div>
                                <button
                                    className={
                                        "webiny-cms-element-button webiny-cms-element-button--primary" +
                                        (loading ? " webiny-cms-element-button--loading" : "")
                                    }
                                    onClick={submit}
                                    disabled={!data.tosAccepted || loading}
                                >
                                    <I18NValue
                                        value={form.settings.submitButtonLabel}
                                        default="Submit"
                                    />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Form>
    );
};

export default FormRenderer;
