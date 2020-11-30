import React, { useCallback, useState } from "react";
import { plugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ButtonPrimary } from "@webiny/ui/Button";
import { SecurityUserFormPlugin } from "@webiny/app-security-tenancy/types";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import GroupAutocomplete from "../Components/GroupAutocomplete";
import AvatarImage from "./../Components/AvatarImage";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings-24px.svg";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";
import { CREATE_USER, READ_USER, LIST_USERS, UPDATE_USER } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "react-apollo";

import { pick } from "lodash";

const t = i18n.ns("app-security-tenancy/admin/users-form");

const formatData = data =>
    pick(data, ["login", "password", "firstName", "lastName", "avatar", "group"]);

const UsersForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const login = new URLSearchParams(location.search).get("login");

    const { data, loading: userLoading } = useQuery(READ_USER, {
        variables: { login },
        skip: !login,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.user;
            if (error) {
                history.push("/security/users");
                showSnackbar(error.message);
            }
        }
    });

    const [create, { loading: createLoading }] = useMutation(CREATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const [update, { loading: updateLoading }] = useMutation(UPDATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const loading = userLoading || createLoading || updateLoading;

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [
                      update,
                      {
                          variables: {
                              login: data.login,
                              data: formatData(data)
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: formatData(data)
                          }
                      }
                  ];

            const result = await operation(args);

            const { data: user, error } = result.data.security.user;

            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/security/users?login=${user.login}`);
            showSnackbar(t`User saved successfully.`);
        },
        [login]
    );

    const user = userLoading ? {} : data ? data.security.user.data : {};

    const uiPlugins = plugins.byType<SecurityUserFormPlugin>("security-user-form");
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return (
        <Form data={user} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <>
                    <div style={{ marginBottom: "32px", marginTop: "24px" }}>
                        <Bind name="avatar">
                            <AvatarImage round />
                        </Bind>
                    </div>
                    <SimpleForm>
                        {loading && <CircularProgress />}
                        <SimpleFormHeader title={fullName || t`New User`} />
                        <SimpleFormContent>
                            <Accordion elevation={0}>
                                <AccordionItem
                                    description="Account information"
                                    title="Bio"
                                    icon={<SettingsIcon />}
                                    open
                                >
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind
                                                name="firstName"
                                                validators={validation.create("required")}
                                            >
                                                <Input label={t`First Name`} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name="lastName"
                                                validators={validation.create("required")}
                                            >
                                                <Input label={t`Last name`} />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind
                                                name="login"
                                                validators={validation.create("required,email")}
                                            >
                                                <Input label={t`E-mail`} />
                                            </Bind>
                                        </Cell>
                                        {uiPlugins.map(pl => (
                                            <React.Fragment key={pl.name}>
                                                {pl.render({ Bind, data })}
                                            </React.Fragment>
                                        ))}
                                    </Grid>
                                </AccordionItem>
                                <AccordionItem
                                    description="Assign to security group"
                                    title="Group"
                                    icon={<SecurityIcon />}
                                >
                                    <Cell span={12} style={{ marginBottom: "8px" }}>
                                        <Bind name="group">
                                            <GroupAutocomplete label={t`Group`} />
                                        </Bind>
                                    </Cell>
                                </AccordionItem>
                            </Accordion>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary onClick={form.submit}>{t`Save user`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                </>
            )}
        </Form>
    );
};

export default UsersForm;
