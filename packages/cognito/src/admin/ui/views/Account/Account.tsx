import React, { useState } from "react";
import omit from "lodash/omit.js";
import { useMutation, useQuery } from "@apollo/client/react";
import { i18n } from "@webiny/app/i18n/index.js";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { AvatarImage } from "../../components/AvatarImage/index.js";
import {
    GET_CURRENT_USER,
    type IGetCurrentUserResponse,
    type IUpdateCurrentUserResponse,
    UPDATE_CURRENT_USER
} from "./graphql.js";
import { config as appConfig } from "@webiny/app/config.js";

import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useIdentity
} from "@webiny/app-admin";
import { usePasswordValidator } from "~/admin/presentation/shared/usePasswordValidator.js";
import { Alert, Button, Grid, Input, OverlayLoader, useToast } from "@webiny/admin-ui";
import type { UserItem } from "~/admin/ui/UserItem.js";

const t = i18n.ns("app-security-admin-users/account-form");

interface UserAccountFormData {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    external?: boolean;
    avatar: {
        src?: string;
    };
}

export const UserAccountForm = () => {
    const [isSaving, setSaving] = useState(false);
    const toast = useToast();
    const { identity } = useIdentity();
    const passwordValidator = usePasswordValidator();
    const currentUser = useQuery<IGetCurrentUserResponse>(GET_CURRENT_USER);
    const [updateUser] = useMutation<IUpdateCurrentUserResponse>(UPDATE_CURRENT_USER);

    const user: Partial<UserItem> = currentUser.loading
        ? {}
        : currentUser.data?.adminUsers?.user?.data || {};

    const isFormLoading = isSaving || currentUser.loading;
    const loaderMessage = isSaving ? "Saving account..." : "Loading account...";

    const emailIsDisabled = appConfig.getKey(
        "ADMIN_USER_CAN_CHANGE_EMAIL",
        process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL === "false"
    );

    const isExternal = user?.external === true;

    const onSubmit = async (formData: UserAccountFormData) => {
        setSaving(true);
        const { data: response } = await updateUser({
            variables: { data: omit(formData, ["id", "external"]) }
        });
        if (!response) {
            toast.showWarningToast({
                title: "Error updating user account.",
                description: "No response from the server.",
                duration: Infinity
            });
            setSaving(false);
            return;
        }

        const { error } = response.adminUsers.updateCurrentUser;
        setSaving(false);

        if (error) {
            toast.showWarningToast({
                title: "Error updating user account.",
                description: error.message,
                duration: Infinity
            });
            return;
        }

        // TODO: set new roles/teams into the identity context

        identity.update({
            displayName: `${formData.firstName} ${formData.lastName}`,
            profile: {
                ...(identity.profile || {}),
                firstName: formData.firstName,
                lastName: formData.lastName,
                avatar: formData.avatar
            }
        });

        toast.showSuccessToast({ title: "Account updated successfully!" });
    };

    return (
        <CenteredView maxWidth={600}>
            <Form<UserAccountFormData> data={user} onSubmit={onSubmit}>
                {({ data, form, Bind }) => (
                    <SimpleForm>
                        {isFormLoading && <OverlayLoader text={loaderMessage} />}
                        <SimpleFormHeader title={"Account"} />
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
                            <Grid>
                                <Grid.Column span={12} data-testid={"avatar"}>
                                    <Bind name="avatar">
                                        <AvatarImage round disabled={isExternal} />
                                    </Bind>
                                </Grid.Column>
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
                                    {" "}
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
                        </SimpleFormContent>
                        <SimpleFormFooter data-testid={"form-footer"}>
                            <Button
                                disabled={isExternal}
                                data-testid="account.updatebutton"
                                onClick={form.submit}
                            >{t`Update account`}</Button>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        </CenteredView>
    );
};
