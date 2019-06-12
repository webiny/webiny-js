import React from "react";
import { Input } from "webiny-ui/Input";
import { Form } from "webiny-form";
import type { FieldType, FormRenderPropsType } from "webiny-app-forms/types";

function renderField(field: FieldType, bind: Object) {
    switch (field.type) {
        case "text":
            return <Input {...bind} label={field.label} />;
        case "richText":
            return "<<RichTextEditor {...bind} label={field.label}/>";
        case "radio":
            return "<<RadioGroup {...bind} label={field.label}/>";
        case "hidden":
            return "<<input type='hidden' {...bind} label={field.label}/>";
        default:
            return <span>Cannot render field.</span>;
    }
}

const FormRenderer = ({ getFields, submit }: FormRenderPropsType) => {
    const fields = getFields();

    const customSubmit = () => {
        // Do something extra, finally call the provided callback.
        console.log("Submit");
        submit();
    };

    return (
        <Form onSubmit={customSubmit}>
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
