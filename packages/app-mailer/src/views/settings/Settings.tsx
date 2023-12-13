import React, { useEffect, useRef, useState } from "react";
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
    SAVE_SETTINGS_MUTATION,
    SaveSettingsMutationResponse,
    SaveSettingsMutationVariables,
    SettingsQueryResponse
} from "./graphql";
import { TransportSettings, ValidationError } from "~/types";
import { Alert } from "@webiny/ui/Alert";
import { Validator } from "@webiny/validation/types";
import dotPropImmutable from "dot-prop-immutable";

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
                return <Alert key={`${field}`} title={error.message} type="danger" />;
            })}
        </>
    );
};

export const Settings = () => {
    const { showSnackbar } = useSnackbar();

    const password = useRef<HTMLInputElement>();

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
                                                {displayErrors(errors)}
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
                                                        <Bind name={"port"}>
                                                            <Input type="number" label="Port" />
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
                                                                // @ts-expect-error
                                                                inputRef={password}
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"from"}
                                                            validators={[
                                                                validation.create(
                                                                    "required,minLength:1,email"
                                                                )
                                                            ]}
                                                        >
                                                            <Input type="text" label="Mail from" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"replyTo"}
                                                            validators={[
                                                                validation.create("email")
                                                            ]}
                                                        >
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
