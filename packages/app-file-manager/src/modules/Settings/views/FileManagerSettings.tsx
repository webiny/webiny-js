import * as React from "react";
import { Button, Grid, Heading, Input, Link, OverlayLoader, Text } from "@webiny/admin-ui";
import { Form, useBind } from "@webiny/form";
import { Mutation, Query } from "@apollo/react-components";
import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useDialogs,
    useSnackbar
} from "@webiny/app-admin";
import type { GetSettingsResponse } from "../graphql.js";
import graphql from "../graphql.js";
import { validation } from "@webiny/validation";
import type { QueryGetSettingsResult, Settings } from "~/domain/types.js";
import type { MutationFunction, MutationResult } from "@apollo/react-common";

const Code = ({ children }: { children: React.ReactNode }) => {
    return <code className={"text-md font-bold"}>{children}</code>;
};

const textClassName = "mb-md";
const headingLevel = 5;

export const FileManagerSettings = () => {
    const { showSnackbar } = useSnackbar();

    const { showDialog } = useDialogs();

    const learnMore = () => {
        showDialog({
            title: "How to configure file delivery URL?",
            content: (
                <div>
                    <Text as={"div"} className={textClassName}>
                        The file delivery URL must include the <Code>/files/</Code> path to reach
                        Webiny Asset Delivery through AWS CloudFront. When configuring a custom
                        domain, you have two options:
                    </Text>
                    <Heading level={headingLevel} className={"mb-xs"}>
                        Option 1: Custom domain directly on CloudFront
                    </Heading>
                    <Text as={"div"} className={textClassName}>
                        Keep the <Code>/files/</Code> path in your URL.
                        <br />
                        Example: <Code>https://mydomain.com/files/</Code>.
                    </Text>
                    <Heading level={headingLevel} className={"mb-xs"}>
                        Option 2: Additional CDN in front of CloudFront
                    </Heading>
                    <Text as={"div"} className={textClassName}>
                        Configure your CDN to forward requests to CloudFront&apos;s /files/ path.
                        This lets you use a clean URL for users while maintaining the required path
                        on the backend.
                        <ul className={"list-disc my-sm ml-md"}>
                            <li>
                                User-facing URL: <Code>https://mydomain.com/</Code>
                            </li>
                            <li>
                                Your CDN forwards to: <Code>https://api.cloudfront.net/files/</Code>
                            </li>
                        </ul>
                    </Text>
                </div>
            ),
            acceptLabel: "Got it!",
            cancelLabel: null
        });
    };

    return (
        <Query query={graphql.GET_SETTINGS}>
            {({ data, loading: queryInProgress }: MutationResult<QueryGetSettingsResult>) => (
                <Mutation mutation={graphql.UPDATE_SETTINGS}>
                    {(update: MutationFunction, result: MutationResult) => {
                        const settings = data?.fileManager?.getSettings?.data;
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
                                                                validation.create("required,url")
                                                            ]}
                                                        >
                                                            <Input
                                                                label="File delivery URL"
                                                                note={<UrlPreview />}
                                                                description={
                                                                    <>
                                                                        This URL will be prepended
                                                                        to the file key.&nbsp;
                                                                        <Link
                                                                            to="#"
                                                                            onClick={learnMore}
                                                                        >
                                                                            How to configure?
                                                                        </Link>
                                                                    </>
                                                                }
                                                            />
                                                        </Bind>
                                                    </Grid.Column>
                                                </Grid>
                                            </SimpleFormContent>
                                            <SimpleFormFooter>
                                                <Button
                                                    text={"Save settings"}
                                                    onClick={form.submit}
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

const UrlPreview = () => {
    const deliveryUrl = useBind({
        name: "srcPrefix"
    });

    let prefix = deliveryUrl.value ?? "";

    prefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

    return (
        <>
            Example URL: <strong>{prefix}768bed3e544f/image.jpg</strong>
        </>
    );
};
