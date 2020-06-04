import React, { useState } from "react";
import { getPlugin } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonPrimary } from "@webiny/ui/Button";
import GroupsAutocomplete from "./../Components/GroupsAutocomplete";
import RolesAutocomplete from "./../Components/RolesAutocomplete";
import AvatarImage from "./../Components/AvatarImage";
import { useCrud } from "@webiny/app-admin/hooks/useCrud";
import { validation } from "@webiny/validation";
import { SecurityViewUserFormPlugin } from "@webiny/app-security/types";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import AccountTokens from "@webiny/app-security/admin/views/AccountTokens";

const t = i18n.ns("app-security/admin/users/form");

const UsersForm = () => {
    const [formIsLoading, setFormIsLoading] = useState(false);
    const { form: crudForm } = useCrud();

    const auth = getPlugin<SecurityViewUserFormPlugin>("security-view-user-form");

    if (!auth) {
        throw Error(`You must register a "security-view-user-form" plugin to render User form!`);
    }

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
                            {React.createElement(auth.view, {
                                Bind,
                                data,
                                fields: {
                                    firstName: (
                                        <Bind
                                            name="firstName"
                                            validators={validation.create("required")}
                                        >
                                            <Input label={t`First Name`} />
                                        </Bind>
                                    ),
                                    lastName: (
                                        <Bind
                                            name="lastName"
                                            validators={validation.create("required")}
                                        >
                                            <Input label={t`Last name`} />
                                        </Bind>
                                    ),
                                    email: (
                                        <Bind
                                            name="email"
                                            validators={validation.create("required,email")}
                                        >
                                            <Input label={t`E-mail`} />
                                        </Bind>
                                    ),
                                    groups: (
                                        <Bind name="groups">
                                            <GroupsAutocomplete label={t`Groups`} />
                                        </Bind>
                                    ),
                                    roles: (
                                        <Bind name="roles">
                                            <RolesAutocomplete label={t`Roles`} />
                                        </Bind>
                                    ),
                                    personalAccessTokens: (
                                        <Bind name="personalAccessTokens">
                                            <AccountTokens
                                                data={data}
                                                setValue={setValue}
                                                setFormIsLoading={setFormIsLoading}
                                            />
                                        </Bind>
                                    )
                                }
                            })}
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
