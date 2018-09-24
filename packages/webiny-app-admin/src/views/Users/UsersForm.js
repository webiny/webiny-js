// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import { withForm, withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import { refreshDataList } from "webiny-app/actions";
import compose from "recompose/compose";
import { connect } from "react-redux";
import GroupsAutoComplete from "./GroupsAutoComplete";
import PoliciesAutoComplete from "./PoliciesAutoComplete";
import AvatarImage from "./AvatarImage";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/Views/SimpleForm";

const t = i18n.namespace("Security.UsersForm");

const UsersForm = props => {
    const { SecurityUserForm, router, refreshDataList } = props;

    return (
        <Form
            {...SecurityUserForm}
            onSubmit={data => {
                SecurityUserForm.submit({
                    data,
                    onSuccess: data => {
                        props.showSnackbar(t`User {name} saved successfully.`({ name: data.name }));
                        router.goToRoute({ params: { id: data.id }, merge: true });
                        refreshDataList({ name: "UsersDataList" });
                    }
                });
            }}
        >
            {({ data, form, Bind }) => (
                <SimpleForm>
                    <SimpleFormHeader title={data.fullName || "N/A"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="email" validators={["required", "email"]}>
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
                                </Grid>
                            </Cell>
                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="avatar">
                                            <AvatarImage label={t`Avatar`} />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>

                            <Cell span={6}>
                                <Bind name="firstName" validators={["required"]}>
                                    <Input label={t`First Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="lastName" validators={["required"]}>
                                    <Input label={t`Last name`} />
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind name="groups">
                                    <GroupsAutoComplete label={t`Groups`} />
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind name="policies">
                                    <PoliciesAutoComplete label={t`Policies`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary type="primary" onClick={form.submit} align="right">
                            {t`Save user`}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default compose(
    connect(
        null,
        { refreshDataList }
    ),
    withSnackbar(),
    withRouter(),
    withForm({
        name: "SecurityUserForm",
        type: "Security.Users",
        fields:
            "id email firstName lastName fullName avatar { id src } enabled groups { id name } policies { id name }"
    })
)(UsersForm);
