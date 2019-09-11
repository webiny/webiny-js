// @flow
import * as React from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { ButtonPrimary } from "@webiny/ui/Button";
import type { WithCrudFormProps } from "@webiny/app-admin/components";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { categoryUrlValidator } from "./validators";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";

const t = i18n.namespace("Pb.CategoriesForm");

const CategoriesForm = ({ data, invalidFields, onSubmit, loading }: WithCrudFormProps) => {
    const { theme } = usePageBuilder();
    return (
        <Form data={data || {}} invalidFields={invalidFields} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name || t`New Category`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
                                    <Input disabled={data.id} label={t`Slug`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="url"
                                    validators={[
                                        validation.create("required"),
                                        categoryUrlValidator
                                    ]}
                                >
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

export default CategoriesForm;
