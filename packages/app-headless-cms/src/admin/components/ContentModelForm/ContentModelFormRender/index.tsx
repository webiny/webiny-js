import React from "react";
import Input from "./fields/Input";
import Switch from "./fields/Switch";
import { BindComponentRenderProp, Form } from "@webiny/form";
import { CmsContentModelModelField } from "@webiny/app-headless-cms/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { ReactComponent as I18NIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/round-translate-24px.svg";
import { ReactComponent as DropDownIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/round-arrow_drop_down-24px.svg";
import cloneDeep from "lodash.clonedeep";
import get from "lodash.get";
const t = i18n.ns("app-headless-cms/admin/components/content-model-form-render");

import { ButtonIcon, ButtonSecondary, ButtonPrimary } from "@webiny/ui/Button";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { CircularProgress } from "@webiny/ui/Progress";
import { MenuItem, Menu } from "@webiny/ui/Menu";

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
    contentModel,
    getFields,
    getDefaultValues,
    loading,
    data,
    onSubmit
}) => {
    const i18n = useI18N();

    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();

    let formTitle;
    if (contentModel) {
        formTitle = t`New {contentModelTitle}`({ contentModelTitle: contentModel.title });
    }

    return (
        <Form onSubmit={onSubmit} data={data ? data : getDefaultValues()}>
            {({ submit, Bind }) => (
                <SimpleForm data-testid={"cms-content-form"}>
                    <SimpleFormHeader title={formTitle}>
                        <Menu
                            handle={
                                <ButtonSecondary>
                                    <ButtonIcon icon={<I18NIcon />} />
                                    {t`Current locale: {locale}`({ locale: i18n.getLocale().code })}
                                    <DropDownIcon />
                                </ButtonSecondary>
                            }
                        >
                            {i18n.getLocales().map(item => (
                                <MenuItem key={item.id} onClick={() => {}}>
                                    {item.code}
                                </MenuItem>
                            ))}
                        </Menu>
                    </SimpleFormHeader>
                    {loading && <CircularProgress />}
                    <SimpleFormContent>
                        <Grid>
                            {/* Let's render all form fields. */}
                            {fields.map((row, rowIndex) => (
                                <React.Fragment key={rowIndex}>
                                    {row.map(field => renderFieldCell({ field, Bind, row, i18n }))}
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
