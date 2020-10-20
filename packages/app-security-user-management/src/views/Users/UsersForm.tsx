import React, { useCallback, useState } from "react";
import { plugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ButtonPrimary } from "@webiny/ui/Button";
import { UserManagementUserFormPlugin } from "@webiny/app-security-user-management/types";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import AccountTokens from "../Account/AccountTokens";
import GroupAutocomplete from "../Components/GroupAutocomplete";
import AvatarImage from "./../Components/AvatarImage";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings-24px.svg";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";
import { CREATE_USER, READ_USER, LIST_USERS, UPDATE_USER } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "react-apollo";

import { pick } from "lodash";

const t = i18n.ns("app-security-user-management/admin/users-form");

const formatData = data =>
    pick(data, ["email", "password", "firstName", "lastName", "avatar", "enabled", "group"]);

const UsersForm = () => {
    const [formIsLoading, setFormIsLoading] = useState(false);
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(READ_USER, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = data?.security?.user?.error;
            if (error) {
                history.push("/security/users");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_USER, {
        refetchQueries: [{ query: LIST_USERS }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async data => {
            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [
                      update,
                      {
                          variables: {
                              id: data.id,
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

            const response = await operation(args);

            const error = response?.data?.security?.user?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            const id = response?.data?.security?.user?.data?.id;

            !isUpdate && history.push(`/security/users?id=${id}`);
            showSnackbar(t`User saved successfully.`);
        },
        [id]
    );

    const data = getQuery?.data?.security?.user?.data || {};

    const uiPlugins = plugins.byType<UserManagementUserFormPlugin>("user-management-user-form");

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind, setValue }) => (
                <>
                    <div style={{ marginBottom: "32px", marginTop: "24px" }}>
                        <Bind name="avatar">
                            <AvatarImage round />
                        </Bind>
                    </div>
                    <SimpleForm>
                        {(formIsLoading || loading) && <CircularProgress />}
                        <SimpleFormHeader title={data.fullName || t`New User`} />
                        <SimpleFormContent>
                            <Accordion elevation={0}>
                                <AccordionItem
                                    description="Set Account bio information"
                                    title="Bio"
                                    icon={<SettingsIcon />}
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
                                                name="email"
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
                                    description="Set Group"
                                    title="Group"
                                    icon={<SecurityIcon />}
                                >
                                    <Cell span={12} style={{ marginBottom: "8px" }}>
                                        <Bind name="group">
                                            <GroupAutocomplete label={t`Group`} />
                                        </Bind>
                                    </Cell>
                                </AccordionItem>
                                <AccordionItem
                                    description="Set Personal Access Tokens"
                                    title="Personal Access Tokens"
                                    icon={<SecurityIcon />}
                                >
                                    <Bind name="personalAccessTokens">
                                        <AccountTokens
                                            data={data}
                                            setValue={setValue}
                                            setFormIsLoading={setFormIsLoading}
                                        />
                                    </Bind>
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
