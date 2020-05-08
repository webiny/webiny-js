import React from "react";
import Input from "./fields/Input";
import Switch from "./fields/Switch";
import { BindComponentRenderProp, Form } from "@webiny/form";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import cloneDeep from "lodash.clonedeep";
import get from "lodash.get";
const t = i18n.ns("app-headless-cms/admin/components/content-model-form-render");

import { ButtonPrimary } from "@webiny/ui/Button";

import { CircularProgress } from "@webiny/ui/Progress";

const setValue = ({ value, bind, i18n }) => {
    const currentLocale = i18n.getLocale();
    const newValue = cloneDeep({ values: [], ...bind.value });
    const index = value ? newValue.values.findIndex(item => item.locale === currentLocale.id) : -1;
    if (index >= 0) {
        newValue.values[index].value = value;
    } else {
        newValue.values.push({ locale: currentLocale.id, value: value });
    }

    // Filter out redundant empty values.
    newValue.values = newValue.values.filter(item => !!item.value);
    bind.onChange(newValue);
};

const getValue = ({ bind, i18n }) => {
    const currentLocale = i18n.getLocale();
    const value = get(bind, "value.values", []).find(item => item.locale === currentLocale.id);
    return value ? value.value : null;
};

const renderFieldElement = (props: {
    field: CmsContentModelModelField;
    bind: BindComponentRenderProp;
}) => {
    switch (props.field.type) {
        case "text":
            return <Input {...props} />;
        case "number":
            return <Input {...props} type="number" />;
        case "boolean":
            return <Switch {...props} />;
        // ---
        default:
            return <span>Cannot render field.</span>;
    }
};

const renderFieldCell = ({ field, Bind, row, i18n }) => {
    return (
        <Cell span={Math.floor(12 / row.length)} key={field._id}>
            <Bind name={field.fieldId} validators={field.validators}>
                {bind =>
                    renderFieldElement({
                        field,
                        bind: {
                            ...bind,
                            value: getValue({ bind, i18n }),
                            onChange: value => setValue({ value, bind, i18n })
                        }
                    })
                }
            </Bind>
        </Cell>
    );
};

export const ContentModelFormRender = ({
    getFields,
    getDefaultValues,
    loading,
    content,
    onSubmit,
    onChange
}) => {
    const i18n = useI18N();

    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();

    return (
        <Form onChange={onChange} onSubmit={onSubmit} data={content ? content : getDefaultValues()}>
            {({ submit, Bind }) => (
                <div data-testid={"cms-content-form"}>
                    {loading && <CircularProgress />}
                    <Grid>
                        {/* Let's render all form fields. */}
                        {fields.map((row, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                {row.map(field => renderFieldCell({ field, Bind, row, i18n }))}
                            </React.Fragment>
                        ))}
                        <Cell span={12} style={{ textAlign: "right" }}>
                            <ButtonPrimary onClick={submit}>{t`Save`}</ButtonPrimary>
                        </Cell>
                    </Grid>
                </div>
            )}
        </Form>
    );
};
