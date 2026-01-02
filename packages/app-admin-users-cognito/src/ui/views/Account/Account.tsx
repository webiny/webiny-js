import React, { useState } from "react";
import omit from "lodash/omit.js";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n/index.js";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input/index.js";
import { ButtonPrimary } from "@webiny/ui/Button/index.js";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { SnackbarAction } from "@webiny/ui/Snackbar/index.js";
import { Cell, Grid } from "@webiny/ui/Grid/index.js";
import { validation } from "@webiny/validation";
import { AvatarImage } from "../../components/AvatarImage/index.js";
import { GET_CURRENT_USER, UPDATE_CURRENT_USER } from "./graphql.js";
import { config as appConfig } from "@webiny/app/config.js";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent,
    useIdentity
} from "@webiny/app-admin";
import { CenteredView, useSnackbar } from "@webiny/app-admin";
import { Alert } from "@webiny/ui/Alert/index.js";
import { usePasswordValidator } from "~/usePasswordValidator.js";

const t = i18n.ns("app-security-admin-users/account-form");

interface UserAccountFormData {
    firstName: string;
    lastName: string;
    avatar: {
        src?: string;
    };
}

const UserAccountForm = () => {
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { identity } = useIdentity();
    const passwordValidator = usePasswordValidator();

    const currentUser = useQuery(GET_CURRENT_USER);
    const [updateUser] = useMutation(UPDATE_CURRENT_USER);

    const onSubmit = async (formData: UserAccountFormData) => {
        setLoading(true);
        const { data: response } = await updateUser({
            variables: { data: omit(formData, ["id", "external"]) }
        });

        const { error } = response.adminUsers.updateCurrentUser;
        setLoading(false);

        if (error) {
            return showSnackbar(error.message, {
                action: <SnackbarAction label="Close" onClick={() => showSnackbar(null)} />
            });
        }

        identity.update({
            displayName: `${formData.firstName} ${formData.lastName}`,
            profile: {
                ...(identity.profile || {}),
                firstName: formData.firstName,
                lastName: formData.lastName,
                avatar: formData.avatar
            }
        });

        showSnackbar("Account saved successfully!");
    };

    const user = currentUser.loading ? {} : currentUser.data.adminUsers.user.data;

    const emailIsDisabled = appConfig.getKey(
        "ADMIN_USER_CAN_CHANGE_EMAIL",
        process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL === "false"
    );

    const isExternal = user?.external === true;

    return (
        <CenteredView maxWidth={600}>
            <Form
                data={user}
                onSubmit={data => {
                    /**
                     * We are positive that data is UserAccountFormData.
                     */
                    onSubmit(data as unknown as UserAccountFormData);
                }}
            >
                {({ data, form, Bind }) => (
                    <SimpleForm>
                        {loading && <CircularProgress style={{ zIndex: 3 }} />}
                        <SimpleFormHeader title={"Account"} />
                        <SimpleFormContent>
                            {isExternal && (
                                <Grid>
                                    <Cell span={12}>
                                        <Alert type={"info"} title={"External User"}>
                                            This user is an external user and cannot be edited.
                                        </Alert>
                                    </Cell>
                                </Grid>
                            )}
                            <Grid>
                                <Cell span={12} data-testid={"avatar"}>
                                    <Bind name="avatar">
                                        <AvatarImage round disabled={isExternal} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter data-testid={"form-footer"}>
                            <ButtonPrimary
                                disabled={isExternal}
                                data-testid="account.updatebutton"
                                onClick={ev => {
                                    form.submit(ev);
                                }}
                            >{t`Update account`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        </CenteredView>
    );
};

export default UserAccountForm;
