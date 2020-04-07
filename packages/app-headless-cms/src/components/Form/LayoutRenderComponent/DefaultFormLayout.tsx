import React, { useState } from "react";
import Select from "./fields/Select";
import Radio from "./fields/Radio";
import Input from "./fields/Input";
import Checkbox from "./fields/Checkbox";
import Textarea from "./fields/Textarea";
import { BindComponentRenderProp, Form } from "@webiny/form";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";

import { ButtonPrimary } from "@webiny/ui/Button";

const DefaultFormLayout = ({ getFields, getDefaultValues, submit }) => {
    // Is the form in loading (submitting) state?
    const [loading, setLoading] = useState(false);

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
            // setFormSuccess(true);
            console.log("wohooo!");
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
        field: CmsContentModelModelField;
        bind: BindComponentRenderProp;
    }) => {
        switch (props.field.type) {
            case "text":
                return <Input {...props} />;
            case "integer":
                return <Input {...props} type="number" />;
            case "float":
                return <Input {...props} type="number" />;
            // ---
            case "textarea":
                return <Textarea {...props} />;

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

    return (
        /* "onSubmit" callback gets triggered once all of the fields are valid. */
        /* We also pass the default values for all fields via the getDefaultValues callback. */
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind }) => (
                <div className={"webiny-fb-form"}>
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
                                    {row.map(field =>
                                        field.type !== "hidden"
                                            ? renderFieldCell(field, Bind)
                                            : renderHiddenField(field, Bind)
                                    )}
                                </div>
                            ))}
                        </div>

                        <ButtonPrimary onClick={submit}>Submit</ButtonPrimary>
                    </>
                </div>
            )}
        </Form>
    );
};

export default DefaultFormLayout;
