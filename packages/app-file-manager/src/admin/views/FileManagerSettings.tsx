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
import { validation } from "@webiny/validation";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { CenteredView } from "@webiny/app-admin";
import { QueryGetSettingsResult, Settings } from "~/types";
import { MutationFunction, MutationResult } from "@apollo/react-common";

function prefixValidator(value: string) {
    if (!value.endsWith("/files/")) {
        throw Error(`File URL prefix must end with "/files/"`);
    }
}

const FileManagerSettings: React.FC = () => {
    const { showSnackbar } = useSnackbar();

    return (
        <Query query={graphql.GET_SETTINGS}>
            {({ data, loading: queryInProgress }: MutationResult<QueryGetSettingsResult>) => (
                <Mutation mutation={graphql.UPDATE_SETTINGS}>
                    {(update: MutationFunction, result: MutationResult) => {
                        const settings = (get(data, "fileManager.getSettings.data") ||
                            {}) as Settings;
                        const { loading: mutationInProgress } = result;

                        const onSubmit = async (data: Settings): Promise<void> => {
                            await update({
                                variables: {
                                    data: {
                                        uploadMinFileSize: parseFloat(data.uploadMinFileSize),
                                        uploadMaxFileSize: parseFloat(data.uploadMaxFileSize),
                                        srcPrefix: data.srcPrefix
                                    }
                                },
                                update: (cache, result) => {
                                    const data = structuredClone(
                                        cache.readQuery({ query: graphql.GET_SETTINGS })
                                    );

                                    data.fileManager.getSettings.data = {
                                        ...data.fileManager.getSettings.data,
                                        ...result.data.fileManager.updateSettings.data
                                    };

                                    cache.writeQuery({
                                        query: graphql.GET_SETTINGS,
                                        data
                                    });
                                }
                            });
                            showSnackbar("Settings updated successfully.");
                        };
                        return (
                            <CenteredView>
                                <Form
                                    data={settings}
                                    onSubmit={data => {
                                        /**
                                         * We are positive that data is Settings.
                                         */
                                        onSubmit(data as unknown as Settings);
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
                                                                        description="The smallest file size in bytes."
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
                                                                        description="The largest file size in bytes."
                                                                    />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>
                                                    </Cell>
                                                    <Cell span={12}>
                                                        <Grid>
                                                            <Cell span={12}>
                                                                <Bind
                                                                    name={"srcPrefix"}
                                                                    validators={[
                                                                        validation.create("url"),
                                                                        prefixValidator
                                                                    ]}
                                                                >
                                                                    <Input
                                                                        label="File URL prefix"
                                                                        description="This prefix will be prepended to the file key to form the full file URL."
                                                                    />
                                                                </Bind>
                                                            </Cell>
                                                        </Grid>
                                                    </Cell>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <ButtonPrimary
                                                    onClick={ev => {
                                                        form.submit(ev);
                                                    }}
                                                >
                                                    Save Settings
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
