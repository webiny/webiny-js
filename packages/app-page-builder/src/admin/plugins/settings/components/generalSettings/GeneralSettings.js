// @flow
import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

import { Query, Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/components";
import graphql from "./graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import { get } from "lodash";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";

const GeneralSettings = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={graphql.query}>
            {({ data, loading: queryInProgress }) => {
                const settings = get(data, "pageBuilder.getSettings.data") || {};
                return (
                    <Mutation mutation={graphql.mutation}>
                        {(update, { loading: mutationInProgress }) => (
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
                                        {(queryInProgress || mutationInProgress) && (
                                            <CircularProgress />
                                        )}
                                        <SimpleFormHeader title={`General Settings`} />
                                        <SimpleFormContent>
                                            <Grid>
                                                <Cell span={6}>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"name"}
                                                                validators={["required"]}
                                                            >
                                                                <Input label="Website name" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind name={"domain"}>
                                                                <Input
                                                                    label="Domain"
                                                                    description={
                                                                        "eg. https://www.mysite.com"
                                                                    }
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={6}>
                                                            <Bind name={"favicon"}>
                                                                <SingleImageUpload
                                                                    label="Favicon"
                                                                    accept={[
                                                                        "image/png",
                                                                        "image/x-icon",
                                                                        "image/vnd.microsoft.icon"
                                                                    ]}
                                                                    description={
                                                                        <span>
                                                                            Supported file types:{" "}
                                                                            <strong>.png</strong>{" "}
                                                                            and{" "}
                                                                            <strong>.ico</strong> .
                                                                        </span>
                                                                    }
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={6}>
                                                            <Bind name={"logo"}>
                                                                <SingleImageUpload label="Logo" />
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>
                                                </Cell>

                                                <Cell span={6}>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.facebook"}
                                                                validators={["url"]}
                                                            >
                                                                <Input label="Facebook" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.twitter"}
                                                                validators={["url"]}
                                                            >
                                                                <Input label="Twitter" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.instagram"}
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
                );
            }}
        </Query>
    );
};

export default GeneralSettings;
