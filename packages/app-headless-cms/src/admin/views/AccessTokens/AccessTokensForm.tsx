import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { i18n } from "@webiny/app/i18n";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";

import { useCms } from "@webiny/app-headless-cms/admin/hooks";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";

const t = i18n.ns("app-headless-cms/admin/accessTokens/form");

function EnvironmentAliasesForm() {
    const { form: crudForm } = useCrud();
    const environments = useCms().environments.environments;

    return (
        <Form {...crudForm}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-environmentAliases-form"}>
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name ? data.name : t`New Access Token`} />
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
                                            maxLength={100}
                                            characterCount
                                            label={t`Description`}
                                        />
                                    )}
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="token">
                                    <Input disabled label={t`Token`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="selectedEnvironmentIds"
                                    defaultValue={(data.environments || []).map(env => env.id)}
                                >
                                    <CheckboxGroup
                                        label="Environments"
                                        description={
                                            "Select the environments this Token will be allowed to access."
                                        }
                                    >
                                        {({ onChange, getValue }) => (
                                            <React.Fragment>
                                                {environments.map(({ id, name }) => (
                                                    <div key={`access-token-environment-${id}`}>
                                                        <Checkbox
                                                            label={name}
                                                            value={getValue(id)}
                                                            onChange={onChange(id)}
                                                        />
                                                    </div>
                                                ))}
                                            </React.Fragment>
                                        )}
                                    </CheckboxGroup>
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            onClick={form.submit}
                        >{t`Save environment alias`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
}

export default EnvironmentAliasesForm;
