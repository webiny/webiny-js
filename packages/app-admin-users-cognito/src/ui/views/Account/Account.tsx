import React, { useState } from "react";
import omit from "lodash/omit";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import AvatarImage from "../../components/AvatarImage";
import { GET_CURRENT_USER, UPDATE_CURRENT_USER } from "./graphql";
import { config as appConfig } from "@webiny/app/config";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { useSecurity } from "@webiny/app-security";
import { View } from "@webiny/app/components/View";
import { CenteredView, useSnackbar } from "@webiny/app-admin";
import { SecurityIdentity } from "@webiny/app-security/types";

const t = i18n.ns("app-security-admin-users/account-form");

interface UserAccountFormData {
    firstName: string;
    lastName: string;
    avatar: {
        src?: string;
    };
}

const UserAccountForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { setIdentity } = useSecurity();

    const currentUser = useQuery(GET_CURRENT_USER);
    const [updateUser] = useMutation(UPDATE_CURRENT_USER);

    const onSubmit = async (formData: UserAccountFormData) => {
        setLoading(true);
        const { data: response } = await updateUser({
            variables: { data: omit(formData, ["id"]) }
        });

        const { error } = response.adminUsers.updateCurrentUser;
        setLoading(false);

        if (error) {
            return showSnackbar(error.message, {
                action: <SnackbarAction label="Close" onClick={() => showSnackbar(null)} />
            });
        }

        setIdentity(identity => {
            return {
                ...(identity || ({} as SecurityIdentity)),
                displayName: `${formData.firstName} ${formData.lastName}`,
                profile: {
                    ...(identity?.profile || {}),
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    avatar: formData.avatar
                }
            };
        });

        showSnackbar("Account saved successfully!");
    };

    const user = currentUser.loading ? {} : currentUser.data.adminUsers.user.data;

    const emailIsDisabled = appConfig.getKey(
        "ADMIN_USER_CAN_CHANGE_EMAIL",
        process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL === "false"
    );

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
                            <Grid>
                                <Cell span={12} data-testid={"avatar"}>
                                    <Bind name="avatar">
                                        <AvatarImage round />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name="firstName"
                                        validators={validation.create("required")}
                                    >
                                        <Input
                                            label={t`First Name`}
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
                                            disabled={emailIsDisabled}
                                            data-testid="account.email"
                                            description={
                                                "Email is your unique identifier used to login!"
                                            }
                                        />
                                    </Bind>
                                </Cell>
                                <View
                                    name={"adminUsers.account.form.fields"}
                                    props={{ Bind, data }}
                                />
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter data-testid={"form-footer"}>
                            <ButtonPrimary
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
