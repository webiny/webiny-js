// @flow
import * as React from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { CircularProgress } from "@webiny/ui/Progress";
import { useQuery } from "react-apollo";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";

import { get } from "lodash";
import { LIST_SCOPES } from "./graphql";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.namespace("Security.RolesForm");

const RoleForm = () => {
    const scopesQuery = useQuery(LIST_SCOPES);
    const scopes = get(scopesQuery, "data.security.scopes") || [];
    const { form } = useCrud();

    return (
        <Form {...form}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {form.loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name ? data.name : t`Untitled`} />
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
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="description" validators={["required"]}>
                                    <Input label={t`Description`} rows={4} />
                                </Bind>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="scopes">
                                    <MultiAutoComplete
                                        useSimpleValues
                                        options={scopes}
                                        label={t`Scopes`}
                                        description={t`Choose one or more scopes.`}
                                        multiple
                                        unique
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save role`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default RoleForm;
