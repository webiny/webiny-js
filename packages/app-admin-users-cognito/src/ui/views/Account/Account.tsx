import React, { useState } from "react";
import omit from "lodash/omit";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import { Cell, Grid } from "@webiny/ui/Grid";
import { validation } from "@webiny/validation";
import AvatarImage from "../../components/AvatarImage";
import { GET_CURRENT_USER, UPDATE_CURRENT_USER } from "./graphql";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { useSecurity } from "@webiny/app-security";
import { View } from "@webiny/app/components/View";

const t = i18n.ns("app-security-admin-users/account-form");

const UserAccountForm = () => {
    const [loading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const { setIdentity } = useSecurity();

    const currentUser = useQuery(GET_CURRENT_USER);
    const [updateUser] = useMutation(UPDATE_CURRENT_USER);

    const onSubmit = async formData => {
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
                ...identity,
                displayName: `${formData.firstName} ${formData.lastName}`,
                profile: {
                    ...identity.profile,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    avatar: formData.avatar
                }
            };
        });

        showSnackbar("Account saved successfully!");
    };

    const user = currentUser.loading ? {} : currentUser.data.adminUsers.user.data;

    const emailIsDisabled = process.env.REACT_APP_ADMIN_USER_CAN_CHANGE_EMAIL === "false";

    return (
        <Grid>
            <Cell span={3} />
            <Cell span={6}>
                <Form data={user} onSubmit={onSubmit}>
                    {({ data, form, Bind }) => (
                        <>
                            <div style={{ marginBottom: "32px" }}>
                                <Bind name="avatar">
                                    <AvatarImage round />
                                </Bind>
                            </div>
                            <SimpleForm>
                                {loading && <CircularProgress style={{ zIndex: 3 }} />}
                                <SimpleFormHeader title={"Account"} />
                                <SimpleFormContent>
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
                                                name="email"
                                                validators={validation.create("required,email")}
                                            >
                                                <Input
                                                    value={data.email}
                                                    label={t`Email`}
                                                    disabled={emailIsDisabled}
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
                                <SimpleFormFooter>
                                    <ButtonPrimary
                                        onClick={form.submit}
                                    >{t`Update account`}</ButtonPrimary>
                                </SimpleFormFooter>
                            </SimpleForm>
                        </>
                    )}
                </Form>
            </Cell>
        </Grid>
    );
};

export default UserAccountForm;
