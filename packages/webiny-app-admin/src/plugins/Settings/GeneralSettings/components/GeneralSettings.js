// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { ButtonPrimary } from "webiny-ui/Button";
import Image from "./Image";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import graphql from "./graphql";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

const GeneralSettings = ({ showSnackbar }) => {
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
                                        data: data.general
                                    }
                                });
                                showSnackbar("Settings updated successfully.");
                            }}
                        >
                            {({ Bind, form }) => (
                                <SimpleForm>
                                    <SimpleFormHeader title={`General Settings`} />
                                    <SimpleFormContent>
                                        <Grid>
                                            <Cell span={6}>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Bind name={"general.name"}>
                                                            <Input
                                                                validators={["required", "url"]}
                                                                label="Website name"
                                                            />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={6}>
                                                        <Bind name={"general.favicon"}>
                                                            <Image label="Favicon" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={6}>
                                                        <Bind name={"general.logo"}>
                                                            <Image label="Logo" />
                                                        </Bind>
                                                    </Cell>
                                                </Grid>
                                            </Cell>

                                            <Cell span={6}>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"general.social.facebook"}
                                                            validators={["url"]}
                                                        >
                                                            <Input label="Facebook" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"general.social.twitter"}
                                                            validators={["url"]}
                                                        >
                                                            <Input label="Twitter" />
                                                        </Bind>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Bind
                                                            name={"general.social.instagram"}
                                                            validators={["url"]}
                                                        >
                                                            <Input label="Instagram" />
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
                                </SimpleForm>
                            )}
                        </Form>
                    )}
                </Mutation>
            )}
        </Query>
    );
};

export default withSnackbar()(GeneralSettings);
