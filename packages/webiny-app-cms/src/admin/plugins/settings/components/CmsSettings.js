// @flow
import * as React from "react";
import { Form } from "webiny-form";
import { Grid, Cell } from "webiny-ui/Grid";
import { ButtonPrimary } from "webiny-ui/Button";
import { Query, Mutation } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import graphql from "./graphql";
import PagesAutoComplete from "./PagesAutoComplete";
import { CircularProgress } from "webiny-ui/Progress";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "webiny-admin/components/Views/SimpleForm";

class CmsSettings extends React.Component<Object, Object> {
    render() {
        const { showSnackbar } = this.props;
        return (
            <Query query={graphql.query}>
                {({ data, loading: queryInProgress }) => (
                    <Mutation mutation={graphql.mutation}>
                        {(update, { loading: mutationInProgress }) => (
                            <Form
                                data={data.settings}
                                onSubmit={async data => {
                                    this.setState({ loading: true });
                                    await update({
                                        variables: {
                                            data: data.cms
                                        }
                                    });
                                    this.setState({ loading: false });

                                    showSnackbar("Settings updated successfully.");
                                }}
                            >
                                {({ Bind, form }) => (
                                    <SimpleForm>
                                        {(queryInProgress || mutationInProgress) && (
                                            <CircularProgress />
                                        )}
                                        <SimpleFormHeader title="CMS Settings" />
                                        <SimpleFormContent>
                                            <Grid>
                                                <Cell span={12}>
                                                    <Bind name={"cms.pages.home"}>
                                                        <PagesAutoComplete
                                                            label={"Homepage"}
                                                            description={`This is the homepage of your website.`}
                                                        />
                                                    </Bind>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Bind name={"cms.pages.notFound"}>
                                                        <PagesAutoComplete
                                                            label={"Not found (404) page"}
                                                            description={`Shown when the requested page is not found.`}
                                                        />
                                                    </Bind>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Bind name={"cms.pages.error"}>
                                                        <PagesAutoComplete
                                                            label={"Error page"}
                                                            description={`Shown when an error occurs during a page load.`}
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
    }
}

export default withSnackbar()(CmsSettings);
