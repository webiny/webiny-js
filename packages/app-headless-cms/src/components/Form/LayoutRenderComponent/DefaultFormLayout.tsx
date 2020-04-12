import React, { useState } from "react";
import Input from "./fields/Input";
import Switch from "./fields/Switch";
import { BindComponentRenderProp, Form } from "@webiny/form";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/components/form-layout");

import { ButtonPrimary } from "@webiny/ui/Button";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

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
    const renderFieldCell = ({ field, Bind, row }) => {
        return (
            <Cell span={Math.floor(12 / row.length)} key={field._id}>
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
            </Cell>
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
            case "boolean":
                return <Switch {...props} />;
            // ---
            default:
                return <span>Cannot render field.</span>;
        }
    };

    return (
        <Form onSubmit={submitForm} data={getDefaultValues()}>
            {({ submit, Bind }) => (
                <SimpleForm data-testid={"pb-contents-form"}>
                    <SimpleFormHeader title={"Novo rate"} />
                    {/*{crudForm.loading && <CircularProgress />}*/}
                    <SimpleFormContent>
                        <Grid>
                            {/* Let's render all form fields. */}
                            {fields.map((row, rowIndex) => (
                                <React.Fragment key={rowIndex}>
                                    {row.map(field => renderFieldCell({ field, Bind, row }))}
                                </React.Fragment>
                            ))}
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={submit}>{t`Save content`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default DefaultFormLayout;
