import React, { useState } from "react";
import { plugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { Accordion, AccordionItem } from "@webiny/ui/Accordion";
import { ButtonPrimary } from "@webiny/ui/Button";
import { UserManagementUserFormPlugin } from "@webiny/app-security-user-management/types";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import AccountTokens from "../Account/AccountTokens";
import GroupsAutocomplete from "./../Components/GroupsAutocomplete";
import RolesAutocomplete from "./../Components/RolesAutocomplete";
import AvatarImage from "./../Components/AvatarImage";
import { ReactComponent as SettingsIcon } from "../../assets/icons/settings-24px.svg";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";

const t = i18n.ns("app-security-user-management/admin/users-form");

const UsersForm = () => {
    const [formIsLoading, setFormIsLoading] = useState(false);
    const { form: crudForm } = useCrud();

    const uiPlugins = plugins.byType<UserManagementUserFormPlugin>("user-management-user-form");

    return (
        <Form {...crudForm}>
            {({ data, form, Bind, setValue }) => (
                <>
                    <div style={{ marginBottom: "32px", marginTop: "24px" }}>
                        <Bind name="avatar">
                            <AvatarImage round />
                        </Bind>
                    </div>
                    <SimpleForm>
                        {(formIsLoading || crudForm.loading) && <CircularProgress />}
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
                                    description="Set Groups & Roles"
                                    title="Groups & Roles"
                                    icon={<SecurityIcon />}
                                >
                                    <Cell span={12} style={{ marginBottom: "8px" }}>
                                        <Bind name="groups">
                                            <GroupsAutocomplete label={t`Groups`} />
                                        </Bind>
                                    </Cell>
                                    {/*<Cell span={12}>*/}
                                    {/*    <Bind name="roles">*/}
                                    {/*        <RolesAutocomplete label={t`Roles`} />*/}
                                    {/*    </Bind>*/}
                                    {/*</Cell>*/}
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
