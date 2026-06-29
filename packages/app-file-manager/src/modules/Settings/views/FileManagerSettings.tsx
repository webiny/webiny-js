import React, { useCallback, useEffect, useState } from "react";
import { Button, Grid, Input, Link, OverlayLoader, Text, Heading } from "@webiny/admin-ui";
import { Form, useBind } from "@webiny/form";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import {
    CenteredView,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useDialogs,
    useSnackbar
} from "@webiny/app-admin";
import { GET_SETTINGS, UPDATE_SETTINGS } from "../graphql.js";
import { validation } from "@webiny/validation";
import type { Settings } from "~/domain/types.js";

interface GetSettingsResponse {
    fileManager: {
        getSettings: {
            data: Settings | null;
        };
    };
}

interface UpdateSettingsResponse {
    fileManager: {
        updateSettings: {
            data: Settings | null;
            error: {
                message: string;
                code: string;
                data: Record<string, any>;
            } | null;
        };
    };
}

const Code = ({ children }: { children: React.ReactNode }) => {
    return <code className={"text-md font-bold"}>{children}</code>;
};

const textClassName = "mb-md";
const headingLevel = 5;

export const FileManagerSettings = () => {
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialogs();
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);

    const [settings, setSettings] = useState<Settings | null>(null);
    const [queryInProgress, setQueryInProgress] = useState(true);
    const [mutationInProgress, setMutationInProgress] = useState(false);

    useEffect(() => {
        client.execute<GetSettingsResponse>({ query: GET_SETTINGS }).then(response => {
            setSettings(response.fileManager.getSettings.data);
            setQueryInProgress(false);
        });
    }, []);

    const onSubmit = useCallback(
        async (data: Settings) => {
            setMutationInProgress(true);

            const response = await client.execute<UpdateSettingsResponse>({
                query: UPDATE_SETTINGS,
                variables: {
                    data: {
                        uploadMinFileSize: parseFloat(data.uploadMinFileSize),
                        uploadMaxFileSize: parseFloat(data.uploadMaxFileSize),
                        srcPrefix: data.srcPrefix
                    }
                }
            });

            setMutationInProgress(false);

            const error = response.fileManager.updateSettings.error;
            if (error) {
                showSnackbar(`Error updating settings: ${error.message}`);
                console.error(error);
                return;
            }

            const updatedData = response.fileManager.updateSettings.data;
            if (updatedData) {
                setSettings(prev => ({ ...prev, ...updatedData }));
            }

            showSnackbar("Settings updated successfully.");
        },
        [client, showSnackbar]
    );

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
        <CenteredView>
            <Form
                data={settings || {}}
                onSubmit={data => {
                    onSubmit(data as unknown as Settings);
                }}
            >
                {({ Bind, form }) => (
                    <SimpleForm>
                        {(queryInProgress || mutationInProgress) && <OverlayLoader />}
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
                                        validators={[validation.create("required,url")]}
                                    >
                                        <Input
                                            label="File delivery URL"
                                            note={<UrlPreview />}
                                            description={
                                                <>
                                                    This URL will be prepended to the file
                                                    key.&nbsp;
                                                    <Link to="#" onClick={learnMore}>
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
                            <Button text={"Save settings"} onClick={form.submit} />
                        </SimpleFormFooter>
                    </SimpleForm>
                )}
            </Form>
        </CenteredView>
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
