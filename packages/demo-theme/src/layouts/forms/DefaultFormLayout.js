// @flow
import React from "react";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { Form } from "webiny-form";
import { RadioGroup, Radio } from "webiny-ui/Radio";
import { CheckboxGroup, Checkbox } from "webiny-ui/Checkbox";

import type { FieldType, FormRenderPropsType } from "webiny-app-forms/types";

function renderField(field: FieldType, bind: Object) {
    switch (field.type) {
        case "text":
            return (
                <Input
                    {...bind}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                />
            );
        case "textarea":
            return (
                <Input
                    {...bind}
                    rows={field.rows}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                />
            );
        case "number":
            return (
                <Input
                    type={"number"}
                    {...bind}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                />
            );
        case "rich-text":
            return <span>rich text</span>;

        case "select":
            return (
                <Select
                    {...bind}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                    options={field.options}
                />
            );
        case "radio":
            return (
                <RadioGroup
                    {...bind}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                >
                    {({ onChange, getValue }) => (
                        <>
                            {field.options.map(({ value, label }) => (
                                <Radio
                                    key={value}
                                    label={label}
                                    value={getValue(value)}
                                    onChange={onChange(value)}
                                />
                            ))}
                        </>
                    )}
                </RadioGroup>
            );
        case "checkbox":
            return (
                <CheckboxGroup
                    {...bind}
                    label={field.label}
                    placeholder={field.placeholderText}
                    description={field.helpText}
                >
                    {({ onChange, getValue }) => (
                        <>
                            {field.options.map(({ value, label }) => (
                                <Checkbox
                                    key={value}
                                    label={label}
                                    value={getValue(value)}
                                    onChange={onChange(value)}
                                />
                            ))}
                        </>
                    )}
                </CheckboxGroup>
            );
        case "hidden":
            return <input type={"hidden"} {...bind} />;
        default:
            return <span>Cannot render field.</span>;
    }
}

const FormRenderer = ({ getFields, getDefaultValues, submit }: FormRenderPropsType) => {
    const fields = getFields();

    const customSubmit = data => {
        // Do something extra, finally call the provided callback.
        console.log("Will submit...", data);
        submit();
    };

    return (
        <Form onSubmit={customSubmit} data={getDefaultValues()}>
            {({ submit, Bind }) => (
                <div>
                    <h1>DefaultFormLayout</h1>
                    <div>
                        {fields.map((row, rowIndex) => (
                            <div key={rowIndex} className={"row"}>
                                {row.map(field => (
                                    <div
                                        style={{
                                            display: "inline-block",
                                            width: `calc(100% / ${row.length})`
                                        }}
                                        key={field.id}
                                        className={"field"}
                                    >
                                        <Bind name={field.fieldId} validators={field.validators}>
                                            {({ validation, ...bind }) => (
                                                <div className={"group"}>
                                                    {/* Render input or whatever */}
                                                    {renderField(field, bind)}
                                                    {/* Render validation message */}
                                                    {validation.valid === false
                                                        ? validation.message
                                                        : null}
                                                </div>
                                            )}
                                        </Bind>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div>
                        <button onClick={submit}>Submit</button>
                    </div>
                </div>
            )}
        </Form>
    );
};

export default FormRenderer;
