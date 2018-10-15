// @flow
import * as React from "react";
// Webiny imports
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { ButtonPrimary } from "webiny-ui/Button";
import type { WithCrudFormProps } from "webiny-app-admin/components";
import { withTheme, type WithThemeProps } from "webiny-app-cms/theme";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";
import { categoryUrlValidator } from "./validators";

const t = i18n.namespace("Cms.CategoriesForm");

const CategoriesForm = ({
    data,
    invalidFields,
    onSubmit,
    theme,
}: WithCrudFormProps & WithThemeProps) => {
    return (
        <Form data={data} invalidFields={invalidFields} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name">
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={["required"]}>
                                    <Input disabled={data.id} label={t`Slug`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="url" validators={["required", categoryUrlValidator]}>
                                    <Input disabled={data.id} label={t`URL`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="layout" defaultValue={""}>
                                    <Select label={t`Layout`}>
                                        {theme.layouts.map(({ name, title }) => (
                                            <option key={name} value={name}>
                                                {title}
                                            </option>
                                        ))}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save category`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default withTheme()(CategoriesForm);
