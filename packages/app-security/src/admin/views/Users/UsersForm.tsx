import * as React from "react";
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
import { SecurityViewUserFormPlugin } from "@webiny/app-security/admin/types";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("app-security/admin/users/form");

const UsersForm = () => {
    const { form: crudForm } = useCrud();

    const auth = getPlugin("security-view-user-form") as SecurityViewUserFormPlugin;

    if (!auth) {
        throw Error(`You must register a "security-view-user-form" plugin to render User form!`);
    }

    return (
        <Form {...crudForm}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {crudForm.loading && <CircularProgress />}
                    <SimpleFormHeader title={data.fullName || t`N/A`} />
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
                                avatar: (
                                    <Bind name="avatar">
                                        <AvatarImage label={t`Avatar`} />
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
                                )
                            }
                        })}
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save user`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default UsersForm;
