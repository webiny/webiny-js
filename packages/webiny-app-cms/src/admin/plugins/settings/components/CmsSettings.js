// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import graphql from "./graphql";
import PagesAutoComplete from "./PagesAutoComplete";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-app-admin/components/Views/SimpleForm";

const CmsSettings = ({ showSnackbar }) => {
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
                                        data: data.cms
                                    }
                                });
                                showSnackbar("Settings updated successfully.");
                            }}
                        >
                            {({ Bind, form }) => (
                                <SimpleForm>
                                    <SimpleFormHeader title="CMS Settings" />
                                    <SimpleFormContent>
                                        <Grid>
                                            <Cell span={12}>
                                                <Bind name={"cms.pages.home"}>
                                                    <PagesAutoComplete
                                                        label={"Homepage"}
                                                        description={`This page will be shown if none was specified via URL (when "/" is visited)`}
                                                    />
                                                </Bind>
                                            </Cell>
                                            <Cell span={12}>
                                                <Bind name={"cms.pages.notFound"}>
                                                    <PagesAutoComplete
                                                        label={"Not found (404) page"}
                                                        description={`This page will be shown if current URL does not a page assigned to it.`}
                                                    />
                                                </Bind>
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

export default withSnackbar()(CmsSettings);
