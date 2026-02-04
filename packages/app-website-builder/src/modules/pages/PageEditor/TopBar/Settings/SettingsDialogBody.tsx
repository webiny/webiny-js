import React from "react";
import { FileManager } from "@webiny/app-admin";
import {
    Tabs,
    Grid,
    Input,
    Textarea,
    FilePicker,
    Switch,
    CodeEditor,
    Text
} from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { ReactComponent as SeoIcon } from "@webiny/icons/search.svg";
import { validation } from "@webiny/validation";
import { ReactComponent as SocialIcon } from "@webiny/icons/thumb_up.svg";
import { ReactComponent as SchemaIcon } from "@webiny/icons/schema.svg";
import { MetaTags } from "./MetaTags.js";
import { SimpleTags } from "~/modules/pages/PageEditor/TopBar/Settings/SimpleTags.js";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue.js";

const PATHNAME_REGEX = new RegExp(
    `^\\/(?:[a-zA-Z0-9._~:@!$&'()*+,;=%/-])*(?:\\?[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?(?:#[a-zA-Z0-9._~:@!$&'()*+,;=?/%#[\\]-]*)?$`
);
const validatePathname = (pathname: string) => {
    if (!pathname) {
        return;
    }

    if (PATHNAME_REGEX.test(pathname)) {
        return;
    }

    throw new Error(`Enter a valid pathname, e.g.: /path/to/page?query=value`);
};

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
                />,
                <Tabs.Tab
                    key={"schema"}
                    value={"schema"}
                    trigger={"Schema"}
                    icon={<SchemaIcon />}
                    content={<SchemaForm />}
                />
            ]}
        />
    );
};

const GeneralSettingsForm = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Bind name={"properties.title"} validators={[validation.create("required")]}>
                    <Input label={"Page title"} />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.path"} validators={[validation.create("required")]}>
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
        <Grid className={"mt-md"}>
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
            <Grid.Column span={12}>
                <Bind name={"properties.seo.canonicalUrl"} validators={[validatePathname]}>
                    <Input
                        label={"Canonical URL"}
                        description={"The canonical URL for this page"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.noIndex"} defaultValue={false}>
                    <Switch
                        label={"No Index"}
                        description={"Whether this page should be indexed by search engines"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.noFollow"} defaultValue={false}>
                    <Switch
                        label={"No Follow"}
                        description={"Whether search engines should follow links on this page"}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

const SocialSettingsForm = () => {
    return (
        <Grid className={"mt-md"}>
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

const SchemaForm = () => {
    return (
        <Grid className={"mt-md"}>
            <Grid.Column span={12}>
                <Text size={"sm"} className={""}>
                    Enter your&nbsp;
                    <a href={"https://schema.org"} target={"_blank"} rel={"noreferrer noopener"}>
                        schema.org
                    </a>
                    &nbsp; markup for this page:
                </Text>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"properties.seo.structuredSchema"} defaultValue={""}>
                    {({ value, onChange }) => (
                        <CodeEditor
                            value={value}
                            height={400}
                            onChange={onChange}
                            language={"html"}
                        />
                    )}
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
