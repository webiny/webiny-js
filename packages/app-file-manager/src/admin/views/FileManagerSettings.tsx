import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Query, Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import graphql from "../graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import get from "lodash.get";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";

const FileManagerSettings = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={graphql.GET_SETTINGS}>
            {({ data, loading: queryInProgress }) => (
                <Mutation mutation={graphql.UPDATE_SETTINGS}>
                    {(update, { loading: mutationInProgress }) => {
                        const settings = get(data, "files.getSettings.data") || {};

                        return (
                            <Form
                                data={settings}
                                onSubmit={async data => {
                                    await update({
                                        variables: {
                                            data: {
                                                uploadMinFileSize: parseFloat(
                                                    data.uploadMinFileSize
                                                ),
                                                uploadMaxFileSize: parseFloat(
                                                    data.uploadMaxFileSize
                                                )
                                            }
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
                                        <SimpleFormHeader title="General File Manager Settings" />
                                        <SimpleFormContent>
                                            <Grid>
                                                <Cell span={12}>
                                                    <Grid>
                                                        <Cell span={6}>
                                                            <Bind name={"uploadMinFileSize"}>
                                                                <Input
                                                                    type="number"
                                                                    label="Minimum file upload size"
                                                                    description="In bytes"
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>
                                                </Cell>
                                                <Cell span={12}>
                                                    <Grid>
                                                        <Cell span={6}>
                                                            <Bind name={"uploadMaxFileSize"}>
                                                                <Input
                                                                    type="number"
                                                                    label="Maximum file upload size"
                                                                    description="In bytes"
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>
                                                </Cell>
                                            </Grid>
                                        </SimpleFormContent>
                                        <SimpleFormFooter>
                                            <ButtonPrimary onClick={form.submit}>
                                                Save
                                            </ButtonPrimary>
                                        </SimpleFormFooter>
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

export default FileManagerSettings;
