// @flow
import React from "react";
import Input from "./fields/Input";
import Select from "./fields/Select";
import Radio from "./fields/Radio";
import Checkbox from "./fields/Checkbox";
import Textarea from "./fields/Textarea";
import { Form } from "webiny-form";

import type { FieldType, FormRenderPropsType } from "webiny-app-forms/types";

function renderField(field: FieldType, bind: Object, validation: Object) {
    switch (field.type) {
        case "text":
            return <Input field={field} bind={bind} validation={validation} />;
        case "textarea":
            return <Textarea field={field} bind={bind} validation={validation} />;
        case "number":
            return <Input field={field} bind={bind} validation={validation} />;
        case "rich-text":
            return <span>rich text</span>;

        case "select":
            return <Select field={field} bind={bind} validation={validation} />;
        case "radio":
            return <Radio field={field} bind={bind} validation={validation} />;
        case "checkbox":
            return <Checkbox field={field} bind={bind} validation={validation} />;
        case "hidden":
            return <input type={"hidden"} {...bind} />;
        default:
            return <span>Cannot render field.</span>;
    }
}

const FormRenderer = ({ getFields, getDefaultValues, submit, form }: FormRenderPropsType) => {
    const fields = getFields();

    return (
        <Form onSubmit={submit} data={getDefaultValues()}>
            {({ submit, Bind }) => (
                <div className={"webiny-cms-form"}>
                    <div>
                        {fields.map((row, rowIndex) => (
                            <div
                                key={rowIndex}
                                className={"webiny-cms-base-element-style webiny-cms-layout-row"}
                            >
                                {row.map(field => (
                                    <div
                                        key={field.id}
                                        className={
                                            "webiny-cms-base-element-style webiny-cms-layout-column"
                                        }
                                    >
                                        <Bind name={field.fieldId} validators={field.validators}>
                                            {({ validation, ...bind }) => (
                                                <React.Fragment>
                                                    {/* Render input or whatever */}
                                                    {renderField(field, bind, validation)}
                                                    {/* Render validation message */}
                                                    {validation.valid === false
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
                        <button
                            className={
                                "webiny-cms-element-button webiny-cms-element-button--primary"
                            }
                            onClick={submit}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}
        </Form>
    );
};

export default FormRenderer;
