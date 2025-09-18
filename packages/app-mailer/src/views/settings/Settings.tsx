import React, { useEffect, useRef, useState } from "react";
import { CenteredView, useSnackbar } from "@webiny/app-admin";
import { Mutation, Query } from "@apollo/react-components";
import { Form } from "@webiny/form";
import {
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm/index.js";
import { validation } from "@webiny/validation";
import type {
    SaveSettingsMutationResponse,
    SaveSettingsMutationVariables,
    SettingsQueryResponse
} from "./graphql.js";
import { GET_SETTINGS_QUERY, SAVE_SETTINGS_MUTATION } from "./graphql.js";
import type { TransportSettings, ValidationError } from "~/types.js";
import type { Validator } from "@webiny/validation/types.js";
import dotPropImmutable from "dot-prop-immutable";
import { Alert, Button, Grid, Input, OverlayLoader } from "@webiny/admin-ui";

const displayErrors = (errors?: ValidationError[]) => {
    if (!errors) {
        return null;
    }
    return (
        <>
            {errors.map(error => {
                const field = error.path[0];
                if (!field) {
                    return null;
                }
                return (
                    <Alert key={`${field}`} title={"Error"} type="danger">
                        {error.message}
                        {"ssss"}
                    </Alert>
                );
            })}
        </>
    );
};

export const Settings = () => {
    const { showSnackbar } = useSnackbar();

    const password = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<ValidationError[] | undefined>();

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
                            setErrors([]);
                            await update({
                                variables: {
                                    data
                                },
                                update: (cache, result) => {
                                    const data = structuredClone(
                                        cache.readQuery<SettingsQueryResponse>({
                                            query: GET_SETTINGS_QUERY
                                        })
                                    );

                                    const { data: updateData, error: updateError } =
                                        result.data?.mailer.settings || {};

                                    const errors = updateError?.data.errors;
                                    if (errors) {
                                        setErrors(errors);
                                        showSnackbar(
                                            "Settings not updated! Please check your network and console logs for detailed information."
                                        );
                                        return;
                                    }

                                    cache.writeQuery({
                                        query: GET_SETTINGS_QUERY,
                                        data: dotPropImmutable.set(data, "mailer.settings.data", {
                                            ...settingsData,
                                            ...updateData
                                        })
                                    });
                                    showSnackbar("Settings updated successfully.");
                                }
                            });
                        };
                        if (settingsError) {
                            return (
                                <SimpleForm>
                                    <SimpleFormHeader title="Mailer Settings" />
                                    <SimpleFormContent>
                                        <Grid>
                                            <Grid.Column span={12}>
                                                <Alert title={settingsError.message} type="danger">
                                                    {settingsError.data?.description && (
                                                        <p>{settingsError.data.description}</p>
                                                    )}
                                                </Alert>
                                            </Grid.Column>
                                        </Grid>
                                    </SimpleFormContent>
                                    <SimpleFormFooter>{""}</SimpleFormFooter>
                                </SimpleForm>
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
                                                <OverlayLoader />
                                            )}
                                            <SimpleFormHeader title="Mailer Settings" />
                                            <SimpleFormContent>
                                                {displayErrors(errors)}
                                                <Grid>
                                                    <Grid.Column span={12}>
                                                        <Bind
                                                            name={"host"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1"
                                                                )
                                                            ]}
                                                        >
                                                            <Input
                                                                size={"lg"}
                                                                type="text"
                                                                label="Hostname"
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind name={"port"}>
                                                            <Input
                                                                size={"lg"}
                                                                type="number"
                                                                label="Port"
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind
                                                            name={"user"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1"
                                                                )
                                                            ]}
                                                        >
                                                            <Input
                                                                size={"lg"}
                                                                type="text"
                                                                label="User"
                                                                autoComplete="new-password"
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind
                                                            name={"password"}
                                                            validators={passwordValidators}
                                                        >
                                                            <Input
                                                                size={"lg"}
                                                                label="Password"
                                                                type="password"
                                                                autoComplete="new-password"
                                                                value={""}
                                                                inputRef={password}
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind
                                                            name={"from"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1,email"
                                                                )
                                                            ]}
                                                        >
                                                            <Input
                                                                size={"lg"}
                                                                type="text"
                                                                label="Mail from"
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind
                                                            name={"replyTo"}
                                                            validators={[
                                                                validation.create("email")
                                                            ]}
                                                        >
                                                            <Input
                                                                size={"lg"}
                                                                type="text"
                                                                label="Mail reply-to"
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <Button
                                                    text={"Save"}
                                                    onClick={ev => {
                                                        form.submit(ev);
                                                    }}
                                                />
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
