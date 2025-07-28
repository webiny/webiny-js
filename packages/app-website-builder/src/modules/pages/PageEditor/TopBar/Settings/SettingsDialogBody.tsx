import React from "react";
import { FileManager } from "@webiny/app-admin";
import { Tabs, Grid, Input, Textarea, FilePicker } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SeoIcon } from "@webiny/icons/search.svg";
import { ReactComponent as SocialIcon } from "@webiny/icons/thumb_up.svg";
import { MetaTags } from "./MetaTags";
import { SimpleTags } from "~/modules/pages/PageEditor/TopBar/Settings/SimpleTags";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue";

export const SettingsDialogBody = () => {
    return (
        <Tabs
            tabs={[
                <Tabs.Tab
                    key={"general"}
                    value={"general"}
                    trigger={"General"}
                    icon={<SettingsIcon />}
                    content={<GeneralSettingsForm />}
                />,
                <Tabs.Tab
                    key={"seo"}
                    value={"seo"}
                    trigger={"SEO"}
                    icon={<SeoIcon />}
                    content={<SeoSettingsForm />}
                />,
                <Tabs.Tab
                    key={"social"}
                    value={"social"}
                    trigger={"Social"}
                    icon={<SocialIcon />}
                    content={<SocialSettingsForm />}
                />
            ]}
        />
    );
};

const GeneralSettingsForm = () => {
    return (
        <Grid className={"wby-mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"properties.title"}>
                    <Input label={"Page title"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.path"}>
                    <Input label={"Path"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.snippet"}>
                    <Textarea label={"Snippet"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.image"}>
                    {({ value, onChange }) => (
                        <FileManager
                            images={true}
                            render={({ showFileManager }) => (
                                <FilePicker
                                    label={"Image"}
                                    description="Select an image to represent this page"
                                    type="compact"
                                    value={value}
                                    onSelectItem={() =>
                                        showFileManager(file => {
                                            onChange(fileManagerItemToValue(file));
                                        })
                                    }
                                    onRemoveItem={() => onChange(undefined)}
                                />
                            )}
                        />
                    )}
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <SimpleTags
                    bindName={"properties.tags"}
                    label={"Tags"}
                    description={
                        "Add page tags. These can be used for page rendering, filtering, etc."
                    }
                />
            </Grid.Column>
        </Grid>
    );
};

const SeoSettingsForm = () => {
    return (
        <Grid className={"wby-mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.title"}>
                    <Input label={"Title"} description={"SEO title"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.description"}>
                    <Textarea label={"Description"} description={"SEO description"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <MetaTags
                    label={"Meta Tags"}
                    description={"Add SEO tags"}
                    bindName={"properties.seo.metaTags"}
                    keyName={"name"}
                    keyLabel={"Name"}
                    valueName={"content"}
                    valueLabel={"Content"}
                />
            </Grid.Column>
        </Grid>
    );
};

const SocialSettingsForm = () => {
    return (
        <Grid className={"wby-mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"properties.social.title"}>
                    <Input label={"Title"} description={"Title for social platforms (og:title)"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.social.description"}>
                    <Textarea
                        label={"Description"}
                        description={"Description for social platforms (og:description)"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.social.image"}>
                    {({ value, onChange }) => (
                        <FileManager
                            images={true}
                            render={({ showFileManager }) => (
                                <FilePicker
                                    label={"Image"}
                                    description="Select an image for social platforms (og:image)"
                                    type="compact"
                                    value={value}
                                    onSelectItem={() =>
                                        showFileManager(file => {
                                            onChange(fileManagerItemToValue(file));
                                        })
                                    }
                                    onRemoveItem={() => onChange(undefined)}
                                />
                            )}
                        />
                    )}
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <MetaTags
                    label={"Meta Tags"}
                    description={"Add more Open Graph tags"}
                    bindName={"properties.social.metaTags"}
                    keyName={"property"}
                    keyLabel={"Property"}
                    valueName={"content"}
                    valueLabel={"Content"}
                />
            </Grid.Column>
        </Grid>
    );
};
