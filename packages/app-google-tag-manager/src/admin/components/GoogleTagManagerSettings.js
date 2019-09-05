// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Query, Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/components";
import { Input } from "@webiny/ui/Input";
import graphql from "./graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import get from "lodash.get";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";

const GoogleTagManagerSettings = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={graphql.query}>
            {({ data, loading: queryInProgress }) => (
                <Mutation mutation={graphql.mutation}>
                    {(update, { loading: mutationInProgress }) => {
                        const settings = get(data, "googleTagManager.getSettings.data") || {};

                        return (
                            <Form
                                data={settings}
                                onSubmit={async data => {
                                    await update({
                                        variables: {
                                            data: data
                                        }
                                    });
                                    showSnackbar("Settings updated successfully.");
                                }}
                            >
                                {({ Bind, form, data }) => (
                                    <SimpleForm>
                                        {(queryInProgress || mutationInProgress) && (
                                            <CircularProgress />
                                        )}
                                        <SimpleFormHeader title="Google Tag Manager Settings">
                                            <Bind
                                                name={"enabled"}
                                                afterChange={enabled => {
                                                    if (!enabled) {
                                                        form.submit();
                                                    }
                                                }}
                                            >
                                                <Switch label="Enabled" />
                                            </Bind>
                                        </SimpleFormHeader>
                                        {data.enabled ? (
                                            <>
                                                <SimpleFormContent>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Grid>
                                                                <Cell span={6}>
                                                                    <Bind name={"code"}>
                                                                        <Input
                                                                            label="Container ID"
                                                                            description={
                                                                                'Formatted as "GTM-XXXXXX".'
                                                                            }
                                                                        />
                                                                    </Bind>
                                                                </Cell>
                                                            </Grid>
                                                        </Cell>
                                                    </Grid>
                                                </SimpleFormContent>
                                                <SimpleFormFooter>
                                                    <ButtonPrimary
                                                        type="primary"
                                                        onClick={form.submit}
                                                        align="right"
                                                    >
                                                        Save
                                                    </ButtonPrimary>
                                                </SimpleFormFooter>
                                            </>
                                        ) : null}
                                    </SimpleForm>
                                )}
                            </Form>
                        );
                    }}
                </Mutation>
            )}
        </Query>
    );
};

export default GoogleTagManagerSettings;
