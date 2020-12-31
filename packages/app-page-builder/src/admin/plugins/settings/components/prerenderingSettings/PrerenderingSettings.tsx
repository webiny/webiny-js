import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useQuery, useMutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_SETTINGS, UPDATE_SETTINGS } from "./graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import { get } from "lodash";
import { validation } from "@webiny/validation";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Input } from "@webiny/ui/Input";

const PrerenderingSettings = () => {
    const { showSnackbar } = useSnackbar();

    const { data, loading: queryInProgress } = useQuery(GET_SETTINGS);
    const settings = get(data, "pageBuilder.getSettings.data") || {};

    const prerendering = get(data, "pageBuilder.getDefaultSettings.data.prerendering");
    const appUrl = get(prerendering, "app.url");
    const storageName = get(prerendering, "storage.name");

    const [update, { loading: mutationInProgress }] = useMutation(UPDATE_SETTINGS);

    return (
        <Form
            data={settings}
            onSubmit={async data => {
                await update({
                    variables: {
                        data
                    }
                });

                showSnackbar("Settings updated successfully.");
            }}
        >
            {({ Bind, form }) => (
                <SimpleForm>
                    {(queryInProgress || mutationInProgress) && <CircularProgress />}
                    <SimpleFormHeader title="Prerendering Settings" />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name={"prerendering.app.url"}
                                    validators={validation.create("url")}
                                >
                                    <Input
                                        label="App URL"
                                        description={
                                            <span>
                                                This is the URL over which your app is available and
                                                which will be used for prerendering.
                                                {appUrl && (
                                                    <>
                                                        If not specified, the default one (
                                                        <a href={appUrl}>{appUrl}</a>) will be used.
                                                    </>
                                                )}
                                            </span>
                                        }
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"prerendering.storage.name"}>
                                    <Input
                                        label="Storage name"
                                        description={
                                            <span>
                                                The name of the cloud resource (bucket) in which the
                                                prerender pages and other related resources will be
                                                stored.{" "}
                                                {storageName && (
                                                    <>
                                                        If not specified, the default one (
                                                        <strong>{storageName}</strong>) will be
                                                        used.
                                                    </>
                                                )}
                                            </span>
                                        }
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>Save</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default PrerenderingSettings;
