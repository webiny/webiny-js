// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { withForm } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import compose from "recompose/compose";
import AvatarImage from "./Users/AvatarImage";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.UsersForm");

const UsersForm = props => {
    const { SecurityUserForm } = props;

    return (
        <Form
            {...SecurityUserForm}
            onSubmit={data => {
                SecurityUserForm.submit({
                    data,
                    onSuccess: () => props.showSnackbar(t`Account information update successfully.`)
                });
            }}
        >
            {({ data, form, Bind }) => (
                <SimpleForm>
                    <SimpleFormHeader title={"Account"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={3}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="image" validators={["required"]}>
                                            <AvatarImage />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                            <Cell span={9}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="email" validators={["required"]}>
                                            <Input label={t`E-mail`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name="password"
                                            validators={
                                                data.id ? ["password"] : ["required", "password"]
                                            }
                                        >
                                            <Input
                                                autoComplete="off"
                                                description={
                                                    data.id && t`Type a new password to reset it.`
                                                }
                                                type="password"
                                                label={t`Password`}
                                            />
                                        </Bind>
                                    </Cell>

                                    <Cell span={12}>
                                        <Bind name="firstName" validators={["required"]}>
                                            <Input label={t`First Name`} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="lastName" validators={["required"]}>
                                            <Input label={t`Last name`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Update account`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default compose(
    withSnackbar(),
    withForm({
        name: "SecurityUserForm",
        type: "Security.Users",
        fields:
            "id email firstName lastName fullName avatar { src } enabled groups { id name } policies { id name }"
    })
)(UsersForm);
