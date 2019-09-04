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
import { useCrudForm } from "@webiny/app-admin/context/CrudContext";
import { pick, get } from "lodash";
import { GET_ROLE, LIST_SCOPES, CREATE_ROLE, UPDATE_ROLE } from "./graphql";
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

    const { loading, ...crudFormProps } = useCrudForm({
        get: {
            query: GET_ROLE,
            response: data => get(data, "security.role")
        },
        save: {
            create: CREATE_ROLE,
            update: UPDATE_ROLE,
            response: data => data.security.role,
            variables: form => ({
                data: pick(form, ["name", "slug", "description", "scopes"])
            }),
            snackbar: data => t`Role {name} saved successfully.`({ name: data.name })
        }
    });

    return (
        <Form {...crudFormProps}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
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
