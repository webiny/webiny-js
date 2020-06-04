import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { AutoComplete } from "@webiny/ui/AutoComplete";

const t = i18n.ns("app-headless-cms/admin/environments/form");

import { useCms } from "@webiny/app-headless-cms/admin/hooks";

function EnvironmentsForm() {
    const { form: crudForm } = useCrud();

    const {
        environments: { environments: createdFromOptions }
    } = useCms();

    return (
        <Form {...crudForm}>
            {({ form, data, Bind }) => (
                <SimpleForm data-testid={"pb-environments-form"}>
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name ? data.name : t`New environment`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="name"
                                    validators={validation.create("required,maxLength:100")}
                                >
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="description">
                                    {props => (
                                        <Input
                                            {...props}
                                            rows={4}
                                            maxLength={200}
                                            characterCount
                                            label={t`Description`}
                                        />
                                    )}
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind
                                    name="createdFrom"
                                    validators={!data.id && validation.create("required")}
                                >
                                    {props => (
                                        <AutoComplete
                                            {...props}
                                            disabled={!!data.id}
                                            label={data.id ? t`Created from` : t`Base environment`}
                                            options={createdFromOptions}
                                            description={
                                                data.id
                                                    ? t`A base environment from which this one was created.`
                                                    : t`A base environment from which the new one will be created.`
                                            }
                                        />
                                    )}
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save environment`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
}

export default EnvironmentsForm;
