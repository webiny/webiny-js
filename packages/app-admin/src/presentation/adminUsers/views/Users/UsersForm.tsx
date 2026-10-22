import React, { useMemo } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "~/components/SimpleForm/index.js";
import { EmptyView } from "~/components/EmptyView.js";
import { RolesMultiAutocomplete } from "~/components/RolesMultiAutocomplete/index.js";
import { TeamsMultiAutocomplete } from "~/components/TeamsMultiAutocomplete/index.js";
import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
import { useRouter } from "@webiny/app";
import { useFeature } from "@webiny/app";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SecurityIcon } from "@webiny/icons/gpp_maybe.svg";
import { ReactComponent as SecurityTeamsIcon } from "@webiny/icons/admin_panel_settings.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { Accordion, Alert, OverlayLoader, Button, Input, Grid, Link } from "@webiny/admin-ui";
import { AvatarImage } from "../../components/AvatarImage/index.js";
import { useUserForm } from "~/presentation/adminUsers/views/Users/hooks/useUserForm.js";
import { PasswordPolicyFeature } from "~/features/adminUsers/passwordPolicy/index.js";
import { AdminUsersSettingsFeature } from "~/features/adminUsers/settings/index.js";
import { Routes } from "~/presentation/adminUsers/routes.js";

const t = i18n.ns("app-security-admin-users/account-form");

export interface UserFormProps {
    teams: boolean;
}

export const UserForm = ({ teams }: UserFormProps) => {
    const { identity } = useAuthentication();
    const userForm = useUserForm();
    const { passwordPolicy } = useFeature(PasswordPolicyFeature);
    const { getLink } = useRouter();

    const isExternal = userForm.user?.external === true;
    const formTitle = userForm.isNewUser ? "New User" : userForm.fullName;
    const isNewUser = userForm.isNewUser;

    const { settings } = useFeature(AdminUsersSettingsFeature);
    const emailIsDisabled = !isNewUser && !settings.emailChangeable;

    const groupValidators = useMemo(() => {
        return teams ? [] : [validation.create("required")];
    }, [teams]);

    const accountLink = getLink(Routes.Users.Account);

    // Render "No content" selected view.
    if (userForm.showEmptyView) {
        return (
            <EmptyView
                icon={<SettingsIcon />}
                title={t`Click on the left side list to display user details or create a...`}
                action={
                    <Button
                        icon={<AddIcon />}
                        text={t`New User`}
                        data-testid="new-record-button"
                        onClick={userForm.createUser}
                    />
                }
            />
        );
    }

    const isSelf = userForm.user?.id === identity.id;
    const isDisabled = isExternal || isSelf;

    return (
        <Form data={userForm.user} onSubmit={userForm.onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm size={"lg"}>
                    {userForm.loading && <OverlayLoader />}
                    <div className={"mb-xl"}>
                        <Bind name="avatar">
                            <AvatarImage round disabled={isDisabled} />
                        </Bind>
                    </div>
                    <SimpleFormHeader title={formTitle} />
                    <SimpleFormContent>
                        {isExternal && (
                            <Grid className={"mb-lg"}>
                                <Grid.Column span={12}>
                                    <Alert type={"info"} title={"External User"}>
                                        This user is an external user and cannot be edited.
                                    </Alert>
                                </Grid.Column>
                            </Grid>
                        )}
                        {isSelf && (
                            <Grid className={"mb-lg"}>
                                <Grid.Column span={12}>
                                    <Alert type={"info"} title={"Own Profile"}>
                                        You cannot edit your own profile using this form. Please use
                                        the <Link to={accountLink}>account settings</Link> instead.
                                    </Alert>
                                </Grid.Column>
                            </Grid>
                        )}
                        <Accordion variant={"underline"}>
                            <Accordion.Item
                                title={"Bio"}
                                description={"Account information"}
                                icon={<SettingsIcon />}
                                defaultOpen={true}
                            >
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="firstName"
                                            validators={validation.create("required")}
                                        >
                                            <Input
                                                label={t`First Name`}
                                                disabled={isDisabled}
                                                data-testid="account.firstname"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="lastName"
                                            validators={validation.create("required")}
                                        >
                                            <Input
                                                label={t`Last Name`}
                                                disabled={isDisabled}
                                                data-testid="account.lastname"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="email"
                                            validators={validation.create("required,email")}
                                        >
                                            <Input
                                                value={data.email}
                                                label={t`Email`}
                                                disabled={emailIsDisabled || isDisabled}
                                                data-testid="account.email"
                                                autoComplete="new-password"
                                                description={
                                                    "Email is your unique identifier used to login!"
                                                }
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="password"
                                            validators={value => passwordPolicy.validate(value)}
                                        >
                                            <Input
                                                autoComplete="new-password"
                                                disabled={isDisabled}
                                                description={
                                                    data.id && "Type a new password to reset it."
                                                }
                                                type="password"
                                                label={"Password"}
                                                data-testid="account.password"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </Accordion.Item>
                            <Accordion.Item
                                title={"Roles"}
                                description={"Assign to security roles"}
                                icon={<SecurityIcon />}
                            >
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind name={"roles"} validators={groupValidators}>
                                            {({ value, onChange, validation }) => (
                                                <RolesMultiAutocomplete
                                                    values={value}
                                                    onChange={onChange}
                                                    validation={validation}
                                                    label={"Roles"}
                                                    data-testid="roles-autocomplete"
                                                    disabled={isDisabled}
                                                />
                                            )}
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </Accordion.Item>
                            {teams ? (
                                <Accordion.Item
                                    title={"Teams"}
                                    description={"Assign to teams"}
                                    icon={<SecurityTeamsIcon />}
                                >
                                    <Grid>
                                        <Grid.Column span={12}>
                                            <Bind name={"teams"}>
                                                {({ value, onChange, validation }) => (
                                                    <TeamsMultiAutocomplete
                                                        values={value}
                                                        onChange={onChange}
                                                        validation={validation}
                                                        label={"Teams"}
                                                        data-testid="teams-autocomplete"
                                                        disabled={isDisabled}
                                                    />
                                                )}
                                            </Bind>
                                        </Grid.Column>
                                    </Grid>
                                </Accordion.Item>
                            ) : null}
                        </Accordion>
                    </SimpleFormContent>
                    <SimpleFormFooter data-testid={"form-footer"}>
                        <Button
                            variant={"secondary"}
                            text={t`Cancel`}
                            onClick={userForm.cancelEditing}
                        />
                        <Button
                            variant={"primary"}
                            text={isNewUser ? t`Create user` : t`Update user`}
                            disabled={isDisabled}
                            onClick={form.submit}
                        />
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};
