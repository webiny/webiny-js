import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Query, Mutation } from "@apollo/react-components";
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
import { CenteredView } from "@webiny/app-admin";
import { QueryGetSettingsResult, Settings } from "~/types";
import { MutationFunction, MutationResult } from "@apollo/react-common";

const FileManagerSettings: React.FC = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={graphql.GET_SETTINGS}>
            {({ data, loading: queryInProgress }: MutationResult<QueryGetSettingsResult>) => (
                <Mutation mutation={graphql.UPDATE_SETTINGS}>
                    {(update: MutationFunction, result: MutationResult) => {
                        const settings: Settings = get(data, "fileManager.getSettings.data") || {};
                        const { loading: mutationInProgress } = result;
                        return (
                            <CenteredView>
                                <Form
                                    data={settings}
                                    onSubmit={async (data: Settings) => {
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
                                    {({ Bind, form }) => (
                                        <SimpleForm>
                                            {(queryInProgress || mutationInProgress) && (
                                                <CircularProgress />
                                            )}
                                            <SimpleFormHeader title="General Settings" />
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Cell span={12}>
                                                        <Grid>
                                                            <Cell span={12}>
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
                                                            <Cell span={12}>
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
                            </CenteredView>
                        );
                    }}
                </Mutation>
            )}
        </Query>
    );
};

export default FileManagerSettings;
