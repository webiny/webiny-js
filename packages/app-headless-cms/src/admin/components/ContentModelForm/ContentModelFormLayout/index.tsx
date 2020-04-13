import React from "react";
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
import { CircularProgress } from "@webiny/ui/Progress";

export const ContentModelFormLayout = ({
    contentModel = {},
    getFields,
    getDefaultValues,
    loading,
    data,
    onSubmit
}) => {
    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();

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

    console.log("contentModel", contentModel);
    const formTitle = t`New {contentModelTitle}`({ contentModelTitle: contentModel.title });

    return (
        <Form onSubmit={onSubmit} data={data ? data : getDefaultValues()}>
            {({ submit, Bind }) => (
                <SimpleForm data-testid={"pb-contents-form"}>
                    <SimpleFormHeader title={formTitle} />
                    {loading && <CircularProgress />}
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
                        <ButtonPrimary onClick={submit}>{t`Save`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};
