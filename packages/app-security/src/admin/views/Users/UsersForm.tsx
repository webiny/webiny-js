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
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import AccuntTokens from "@webiny/app-security/admin/views/AccountTokens";

const t = i18n.ns("app-security/admin/users/form");

const useForceRender = () => {
    const [renderIndex, setRenderCount] = useState(0);
    return () => {
        console.log("Current render index: " + renderIndex);
        setRenderCount(Math.random());
    };
};

const GET_NEW_PAT = gql`
    mutation {
        security {
            createPAT
        }
    }
`;

const UsersForm = () => {
    const client = useApolloClient();
    const { form: crudForm } = useCrud();
    const forceRender = useForceRender(); // [CR note] [Andrei] this form is refreshed 3 times. useCrud() provides "data" only on the 3rd render
    // we can't use useEffect() because it "violates rules of hooks" or something. so
    // I'm forcing a render everytime when it's needed... It looks good to me =D
    //
    // If you have better ideas, let me know

    const auth = getPlugin("security-view-user-form") as SecurityViewUserFormPlugin;

    if (!auth) {
        throw Error(`You must register a "security-view-user-form" plugin to render User form!`);
    }

    const deleteToken = removedValue => {
        const tokenIndex = crudForm.data.personalAccessTokens.findIndex(
            PAT => PAT.token === removedValue
        );
        if (tokenIndex === -1) return;

        crudForm.data.personalAccessTokens.splice(tokenIndex, 1);
        forceRender();
    };

    const generateToken = async () => {
        crudForm.loading = true;
        forceRender();
        const queryResponse = await client.mutate({
            mutation: GET_NEW_PAT
        });

        const personalAccessToken = { token: queryResponse.data.security.createPAT };
        crudForm.loading = false;
        if (!crudForm.data.personalAccessTokens)
            crudForm.data.personalAccessTokens = [personalAccessToken];
        else crudForm.data.personalAccessTokens.push(personalAccessToken);

        forceRender();
    };

    return (
        <Form {...crudForm}>
            {({ data, form, Bind }) => (
                <>
                    <div style={{ marginBottom: "32px", marginTop: "24px" }}>
                        <Bind name="avatar">
                            <AvatarImage />
                        </Bind>
                    </div>
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
                                        <AccuntTokens
                                            deleteToken={deleteToken}
                                            generateToken={generateToken}
                                            personalAccessTokens={
                                                crudForm && crudForm.data.personalAccessTokens
                                            }
                                        />
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
