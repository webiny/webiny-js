// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { ButtonPrimary } from "webiny-ui/Button";
import type { WithCrudFormProps } from "webiny-app-admin/components";
import { withCms, type WithCmsPropsType } from "webiny-app-cms/context";
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
    cms: { theme }
}: WithCrudFormProps & { cms: WithCmsPropsType }) => {
    return (
        <Form data={data || {}} invalidFields={invalidFields} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name" validators={["required"]}>
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
                                <Bind name="layout" defaultValue={theme.layouts[0].name}>
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
                        <ButtonPrimary onClick={form.submit} align="right">
                            {t`Save category`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default withCms()(CategoriesForm);
