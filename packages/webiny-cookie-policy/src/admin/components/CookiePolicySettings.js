// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Switch } from "webiny-ui/Switch";
import { ColorPicker } from "webiny-ui/ColorPicker";
import { ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import graphql from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

const CookiePolicySettings = ({ showSnackbar }) => {
    return (
        <Query query={graphql.query}>
            {({ data }) => (
                <Mutation mutation={graphql.mutation}>
                    {update => (
                        <Form
                            data={data.settings}
                            onSubmit={async data => {
                                await update({
                                    variables: {
                                        data: data.cookiePolicy
                                    }
                                });
                                showSnackbar("Settings updated successfully.");
                            }}
                        >
                            {({ Bind, form }) => (
                                <SimpleForm>
                                    <SimpleFormHeader title="Cookie Policy Settings" />
                                    <SimpleFormContent>
                                        <Grid>
                                            <Bind name={"cookiePolicy.enabled"}>
                                                <Switch label="Enabled" />
                                            </Bind>
                                        </Grid>
                                        <Grid>
                                            <Cell span={12}>
                                                <Grid>
                                                    <Cell span={6}>
                                                        <Bind name={"cookiePolicy.palette.popup"}>
                                                            <ColorPicker label="Color - popup" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={6}>
                                                        <Bind name={"cookiePolicy.palette.button"}>
                                                            <ColorPicker label="Color - button" />
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
                                            Save role
                                        </ButtonPrimary>
                                    </SimpleFormFooter>
                                </SimpleForm>
                            )}
                        </Form>
                    )}
                </Mutation>
            )}
        </Query>
    );
};

export default withSnackbar()(CookiePolicySettings);
