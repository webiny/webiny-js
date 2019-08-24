// @flow
import * as React from "react";
import { i18n } from "webiny-app/i18n";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { CircularProgress } from "webiny-ui/Progress";
import { ButtonPrimary } from "webiny-ui/Button";
import GroupsAutoComplete from "./../Components/GroupsAutoComplete";
import RolesAutoComplete from "./../Components/RolesAutoComplete";
import AvatarImage from "./../Components/AvatarImage";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "webiny-app-admin/components/SimpleForm";

import type { WithCrudFormProps } from "webiny-app-admin/components";

const t = i18n.namespace("Security.UsersForm");

const UsersForm = ({ onSubmit, data, invalidFields, loading }: WithCrudFormProps) => {
    return (
        <Form invalidFields={invalidFields} data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
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
                                <Bind name="roles">
                                    <RolesAutoComplete label={t`Roles`} />
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

export default UsersForm;
