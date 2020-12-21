import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { PagesAutocomplete } from "@webiny/app-page-builder/admin/components/PagesAutocomplete";
import { useQuery, useMutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_SETTINGS, UPDATE_SETTINGS } from "./graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import { get, set } from "lodash";
import { validation } from "@webiny/validation";
import { sendEvent, setProperties } from "@webiny/tracking/react";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { WEBSITE_URL_QUERY } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings/usePageBuilderSettings";

const WebsiteSettings = () => {
    const { showSnackbar } = useSnackbar();

    const { data, loading: queryInProgress } = useQuery(GET_SETTINGS);
    const settings = get(data, "pageBuilder.getSettings.data") || {};

    const [update, { loading: mutationInProgress }] = useMutation(UPDATE_SETTINGS, {
        update: (cache, { data }) => {
            const dataFromCache = cache.readQuery({ query: WEBSITE_URL_QUERY });
            const updatedSettings = get(data, "pageBuilder.updateSettings.data");

            if (updatedSettings) {
                cache.writeQuery({
                    query: WEBSITE_URL_QUERY,
                    data: set(dataFromCache, "pageBuilder.getSettings.data", updatedSettings)
                });
            }
        }
    });

    return (
        <Form
            data={settings}
            onSubmit={async data => {
                data.websiteUrl = (data.websiteUrl || "").replace(/\/+$/g, "");

                if (
                    settings.websiteUrl !== data.websiteUrl &&
                    !data.websiteUrl.includes("localhost")
                ) {
                    sendEvent("custom-domain", {
                        domain: data.websiteUrl
                    });
                    setProperties({
                        domain: data.websiteUrl
                    });
                }

                delete data.id;
                await update({ variables: { data } });
                showSnackbar("Settings updated successfully.");
            }}
        >
            {({ Bind, form }) => (
                <SimpleForm>
                    {(queryInProgress || mutationInProgress) && <CircularProgress />}
                    <SimpleFormHeader title={`General`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name={"name"} validators={validation.create("required")}>
                                    <Input label="Website name" />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name={"websiteUrl"} validators={validation.create("url")}>
                                    <Input
                                        label="Website URL"
                                        description={"eg. https://www.mysite.com"}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind
                                    name={"websitePreviewUrl"}
                                    validators={validation.create("url")}
                                >
                                    <Input
                                        label="Website preview URL"
                                        description={"eg. https://preview.mysite.com"}
                                    />
                                </Bind>
                            </Cell>

                            <Cell span={12} />
                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <SimpleFormHeader title={`Default pages`} />
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"pages.home"}>
                                            <PagesAutocomplete
                                                label={"Homepage"}
                                                description={`This is the homepage of your website.`}
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"pages.error"}>
                                            <PagesAutocomplete
                                                label={"Error page"}
                                                description={`Shown when an error occurs during a page load.`}
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"pages.notFound"}>
                                            <PagesAutocomplete
                                                label={"Not found (404) page"}
                                                description={`Shown when the requested page is not found.`}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <SimpleFormHeader title={`Favicon and logo`} />
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name={"favicon"}>
                                            <SingleImageUpload
                                                onChangePick={["id", "src"]}
                                                label="Favicon"
                                                accept={[
                                                    "image/png",
                                                    "image/x-icon",
                                                    "image/vnd.microsoft.icon"
                                                ]}
                                                description={
                                                    <span>
                                                        Supported file types: <strong>.png</strong>{" "}
                                                        and <strong>.ico</strong> .
                                                    </span>
                                                }
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind name={"logo"}>
                                            <SingleImageUpload
                                                label="Logo"
                                                onChangePick={["id", "src"]}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>

                    <SimpleFormHeader title="Social Media" />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name={"social.facebook"}
                                            validators={validation.create("url")}
                                        >
                                            <Input label="Facebook" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name={"social.twitter"}
                                            validators={validation.create("url")}
                                        >
                                            <Input label="Twitter" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name={"social.instagram"}
                                            validators={validation.create("url")}
                                        >
                                            <Input label="Instagram" />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>

                            <Cell span={6}>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"social.image"}>
                                            <SingleImageUpload
                                                onChangePick={["id", "src"]}
                                                label="Default Open Graph image"
                                                description={`The default OG image for all pages. Recommended resolution 1596x545.`}
                                                // TODO: @adrian
                                                // imageEditor={{
                                                //     crop: {
                                                //         autoEnable: true,
                                                //         aspectRatio: 1596 / 545
                                                //     }
                                                // }}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>

                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>Save</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default WebsiteSettings;
