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
                                <Bind name={"prerendering.app.url"} validators={validation.create("url")}>
                                    <Input
                                        label="App URL"
                                        description={
                                            "This is the URL over which your app is available and which will be used for prerendering."
                                        }
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name={"prerendering.storage.name"}>
                                    <Input
                                        label="Storage name"
                                        description={
                                            "The name of the cloud resource (bucket) in which the prerender pages and other related resources will be stored."
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
