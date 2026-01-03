import React, { useMemo } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent,
    EmptyView
} from "@webiny/app-admin";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as SecurityIcon } from "@webiny/icons/gpp_maybe.svg";
import { ReactComponent as SecurityTeamsIcon } from "@webiny/icons/admin_panel_settings.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { Accordion, Alert, OverlayLoader, Button, Input, Grid } from "@webiny/admin-ui";
import { config as appConfig } from "@webiny/app/config.js";
import {
    GroupsMultiAutocomplete,
    TeamsMultiAutocomplete
} from "@webiny/app-security-access-management";
import { AvatarImage } from "../../components/AvatarImage/index.js";
import { useUserForm } from "~/admin/ui/views/Users/hooks/useUserForm.js";
import { usePasswordValidator } from "~/admin/ui/usePasswordValidator.js";

const t = i18n.ns("app-security-admin-users/account-form");

export interface UserFormProps {
    teams: boolean;
}

export const UserForm = ({ teams }: UserFormProps) => {
    const userForm = useUserForm();
    const passwordValidator = usePasswordValidator();

    const isExternal = userForm.user?.external === true;
    const formTitle = userForm.isNewUser ? "New User" : userForm.fullName;
    const isNewUser = userForm.isNewUser;

    const emailIsDisabled = appConfig.getKey(
        "ADMIN_USER_CAN_CHANGE_EMAIL",
        process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL === "false"
    );

    const groupValidators = useMemo(() => {
        return teams ? [] : [validation.create("required")];
    }, [teams]);

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

    return (
        <Form data={userForm.user} onSubmit={userForm.onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm size={"lg"}>
                    {userForm.loading && <OverlayLoader />}
                    <div className={"mb-xl"}>
                        <Bind name="avatar">
                            <AvatarImage round disabled={isExternal} />
                        </Bind>
                    </div>
                    <SimpleFormHeader title={formTitle} />
                    <SimpleFormContent>
                        {isExternal && (
                            <Grid>
                                <Grid.Column span={12}>
                                    <Alert type={"info"} title={"External User"}>
                                        This user is an external user and cannot be edited.
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
                                                disabled={isExternal}
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
                                                disabled={isExternal}
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
                                                disabled={emailIsDisabled || isExternal}
                                                data-testid="account.email"
                                                description={
                                                    "Email is your unique identifier used to login!"
                                                }
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind name="password" validators={passwordValidator}>
                                            <Input
                                                autoComplete="off"
                                                disabled={data.external}
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
                                        <Bind name={"groups"} validators={groupValidators}>
                                            <GroupsMultiAutocomplete
                                                label={"Roles"}
                                                data-testid="groups-autocomplete"
                                            />
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
                                                <TeamsMultiAutocomplete
                                                    label={"Teams"}
                                                    data-testid="teams-autocomplete"
                                                />
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
                            disabled={isExternal}
                            onClick={form.submit}
                        />
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};
