import * as React from "react";
import { Button, Grid, Input, OverlayLoader } from "@webiny/admin-ui";
import { Form } from "@webiny/form";
import { Mutation, Query } from "@apollo/react-components";
import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useSnackbar
} from "@webiny/app-admin";
import type { GetSettingsResponse } from "../graphql.js";
import graphql from "../graphql.js";
import get from "lodash/get.js";
import { validation } from "@webiny/validation";
import type { QueryGetSettingsResult, Settings } from "~/types.js";
import type { MutationFunction, MutationResult } from "@apollo/react-common";

function prefixValidator(value: string) {
    if (!value) {
        return;
    } else if (!value.endsWith("/files/")) {
        throw Error(`File URL prefix must end with "/files/"`);
    }
}

export const FileManagerSettings = () => {
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
                                        cache.readQuery<GetSettingsResponse>({
                                            query: graphql.GET_SETTINGS
                                        })
                                    );
                                    if (!data) {
                                        return;
                                    }
                                    const error = result.data.fileManager.updateSettings.error;
                                    if (error) {
                                        showSnackbar(`Error updating settings: ${error.message}`);
                                        console.error(error);
                                        return;
                                    }

                                    data.fileManager.getSettings.data = {
                                        ...data.fileManager.getSettings.data,
                                        ...result.data.fileManager.updateSettings.data
                                    };

                                    cache.writeQuery({
                                        query: graphql.GET_SETTINGS,
                                        data
                                    });
                                    showSnackbar("Settings updated successfully.");
                                }
                            });
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
                                                <OverlayLoader />
                                            )}
                                            <SimpleFormHeader title="General Settings" />
                                            <SimpleFormContent>
                                                <Grid>
                                                    <Grid.Column span={12}>
                                                        <Bind name={"uploadMinFileSize"}>
                                                            <Input
                                                                type="number"
                                                                label="Minimum file upload size"
                                                                description="The smallest file size in bytes."
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
                                                        <Bind name={"uploadMaxFileSize"}>
                                                            <Input
                                                                type="number"
                                                                label="Maximum file upload size"
                                                                description="The largest file size in bytes."
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                    <Grid.Column span={12}>
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
                                                    </Grid.Column>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <Button
                                                    text={"Save settings"}
                                                    onClick={ev => {
                                                        form.submit(ev);
                                                    }}
                                                />
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
