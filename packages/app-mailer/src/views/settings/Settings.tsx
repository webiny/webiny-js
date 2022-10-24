import React, { useEffect, useRef } from "react";
import { CenteredView, useSnackbar } from "@webiny/app-admin";
import { Mutation, Query } from "@apollo/react-components";
import { Form } from "@webiny/form";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { validation } from "@webiny/validation";
import { ButtonPrimary } from "@webiny/ui/Button";
import {
    GET_SETTINGS_QUERY,
    SettingsQueryResponse,
    SAVE_SETTINGS_MUTATION,
    SaveSettingsMutationVariables,
    SaveSettingsMutationResponse
} from "./graphql";
import { TransportSettings } from "~/types";
import { Alert } from "@webiny/ui/Alert";
import { Validator } from "@webiny/validation/types";

export const Settings: React.FC = () => {
    const { showSnackbar } = useSnackbar();

    const password = useRef<HTMLInputElement>();

    useEffect(() => {
        const t = setTimeout(() => {
            if (!password.current) {
                return;
            }
            password.current.value = "";
        }, 300);

        return () => {
            clearTimeout(t);
        };
    }, []);

    return (
        <Query<SettingsQueryResponse> query={GET_SETTINGS_QUERY}>
            {({ data: response, loading: queryInProgress }) => (
                <Mutation<SaveSettingsMutationResponse, SaveSettingsMutationVariables>
                    mutation={SAVE_SETTINGS_MUTATION}
                >
                    {(update, result) => {
                        const { data: settingsData, error: settingsError } =
                            response?.mailer.settings || {};
                        const { loading: mutationInProgress } = result;

                        const onSubmit = async (data: TransportSettings): Promise<void> => {
                            await update({
                                variables: {
                                    data
                                },
                                update: (cache, result) => {
                                    const data = structuredClone(
                                        cache.readQuery({ query: GET_SETTINGS_QUERY })
                                    );

                                    data.mailer.settings.data = {
                                        ...settingsData,
                                        ...result.data?.mailer.settings.data
                                    };

                                    cache.writeQuery({
                                        query: GET_SETTINGS_QUERY,
                                        data
                                    });
                                }
                            });
                            showSnackbar("Settings updated successfully.");
                        };
                        if (settingsError) {
                            return (
                                <CenteredView>
                                    <SimpleFormHeader title="Mailer Settings" />
                                    <Grid style={{ backgroundColor: "#FFFFFF" }}>
                                        <Cell span={12}>
                                            <Alert title={settingsError.message} type="danger" />
                                            {settingsError.data?.description && (
                                                <p>{settingsError.data.description}</p>
                                            )}
                                        </Cell>
                                    </Grid>
                                </CenteredView>
                            );
                        }

                        const passwordValidators: Validator[] = [];
                        if (!settingsData?.user) {
                            passwordValidators.push(validation.create("required,minLength:5"));
                        }

                        return (
                            <CenteredView>
                                <Form
                                    data={settingsData || {}}
                                    onSubmit={data => {
                                        /**
                                         * We are positive that data is TransportSettings.
                                         */
                                        onSubmit(data as unknown as TransportSettings);
                                    }}
                                >
                                    {({ Bind, form }) => (
                                        <SimpleForm>
                                            {(queryInProgress || mutationInProgress) && (
                                                <CircularProgress />
                                            )}
                                            <SimpleFormHeader title="Mailer Settings" />
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"host"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1"
                                                                )
                                                            ]}
                                                        >
                                                            <Input type="text" label="Hostname" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"user"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1"
                                                                )
                                                            ]}
                                                        >
                                                            <Input
                                                                type="text"
                                                                label="User"
                                                                autoComplete="new-password"
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"password"}
                                                            validators={passwordValidators}
                                                        >
                                                            <Input
                                                                label="Password"
                                                                type="password"
                                                                autoComplete="new-password"
                                                                value={""}
                                                                // @ts-ignore
                                                                inputRef={password}
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"from"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1"
                                                                )
                                                            ]}
                                                        >
                                                            <Input type="text" label="Mail from" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind name={"replyTo"}>
                                                            <Input
                                                                type="text"
                                                                label="Mail reply-to"
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <ButtonPrimary
                                                    onClick={ev => {
                                                        form.submit(ev);
                                                    }}
                                                >
                                                    Save Settings
                                                </ButtonPrimary>
                                            </SimpleFormFooter>
                                        </SimpleForm>
                                    )}
                                </Form>
                            </CenteredView>
                        );
                    }}
                </Mutation>
            )}
        </Query>
    );
};
