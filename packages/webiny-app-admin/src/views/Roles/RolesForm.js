// @flow
import * as React from "react";
import { get } from "dot-prop-immutable";
import { Query } from "react-apollo";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { AutoComplete } from "webiny-ui/AutoComplete";

import { loadRole } from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.RolesForm");

const RoleForm = (props: Object) => {
    const { id, onSubmit, formErrors, scopes } = props;

    return (
        <Query query={loadRole} variables={{ id }} skip={!id}>
            {({ data }) => {
                let formData = get(data, "security.role.data") || {};

                return (
                    <Form invalidFields={formErrors} data={formData} onSubmit={onSubmit}>
                        {({ data, form, Bind }) => (
                            <SimpleForm>
                                <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
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
                                                <AutoComplete
                                                    options={scopes}
                                                    label="Scopes"
                                                    multiple
                                                    formatValue={item => item.id}
                                                    disabled={false}
                                                    description="Choose one or more scopes."
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </SimpleFormContent>
                                <SimpleFormFooter>
                                    <ButtonPrimary
                                        type="primary"
                                        onClick={form.submit}
                                        align="right"
                                    >
                                        {t`Save role`}
                                    </ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        )}
                    </Form>
                );
            }}
        </Query>
    );
};

export default RoleForm;
