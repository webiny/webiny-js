import React, { useCallback } from "react";
import pick from "lodash/pick";
import isEmpty from "lodash/isEmpty";
import styled from "@emotion/styled";
import { plugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ButtonDefault, ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { SecurityUserFormPlugin } from "../../types";
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
import { useMutation, useQuery } from "@apollo/react-hooks";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const t = i18n.ns("app-security-tenancy/admin/users-form");

const AvatarWrapper = styled("div")({
    margin: "24px 100px 32px"
});

const FormWrapper = styled("div")({
    margin: "0 100px"
});

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

const pickDataForCreateOperation = data =>
    pick(data, ["login", "password", "firstName", "lastName", "avatar", "group"]);

const pickDataForUpdateOperation = data =>
    pick(data, ["password", "firstName", "lastName", "avatar", "group"]);

const UsersForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newUser = new URLSearchParams(location.search).get("new") === "true";
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
                              data: pickDataForUpdateOperation(data)
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: pickDataForCreateOperation(data)
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

    const showEmptyView = !newUser && !userLoading && isEmpty(user);
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display user details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-record-button"
                        onClick={() => history.push("/security/users?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New User`}
                    </ButtonDefault>
                }
            />
        );
    }

    return (
        <Form data={user} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <>
                    <AvatarWrapper>
                        <Bind name="avatar">
                            <AvatarImage round />
                        </Bind>
                    </AvatarWrapper>
                    <FormWrapper>
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
                                                    <Input label={t`Last Name`} />
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind
                                                    name="login"
                                                    beforeChange={(value: string, cb) =>
                                                        cb(value.toLowerCase())
                                                    }
                                                    validators={validation.create("required,email")}
                                                >
                                                    <Input
                                                        label={t`E-mail`}
                                                        disabled={Boolean(login)}
                                                    />
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
                                        open
                                    >
                                        <Cell span={12} style={{ marginBottom: "8px" }}>
                                            <Bind
                                                name="group"
                                                validators={validation.create("required")}
                                            >
                                                <GroupAutocomplete label={t`Group`} />
                                            </Bind>
                                        </Cell>
                                    </AccordionItem>
                                </Accordion>
                            </SimpleFormContent>
                            <SimpleFormFooter>
                                <ButtonWrapper>
                                    <ButtonDefault
                                        onClick={() => history.push("/security/users")}
                                    >{t`Cancel`}</ButtonDefault>
                                    <ButtonPrimary
                                        onClick={form.submit}
                                    >{t`Save user`}</ButtonPrimary>
                                </ButtonWrapper>
                            </SimpleFormFooter>
                        </SimpleForm>
                    </FormWrapper>
                </>
            )}
        </Form>
    );
};

export default UsersForm;
