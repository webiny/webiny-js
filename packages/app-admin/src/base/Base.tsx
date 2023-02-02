import React, { memo } from "react";
import { Plugins } from "@webiny/app";
import { AddMenu, AddRoute, Dashboard, FileManagerFileTypePlugin, Layout, NotFound } from "~/index";
import { plugins } from "@webiny/plugins";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { ReactComponent as FileIcon } from "~/assets/icons/insert_drive_file-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/round-settings-24px.svg";
import { FileManager } from "~/components";

import { defaultFileTypePlugin, imageFileTypePlugin } from "~/plugins/fileManager";
import { globalSearchHotkey } from "~/plugins/globalSearch";
import { uiLayoutPlugin } from "~/plugins/uiLayoutRenderer";

function registerFileTypePlugins() {
    // This is an ugly hack, which we will replace when we implement file thumbnail rendering via the Composition API.
    const fileTypePlugins = plugins.byType(FileManagerFileTypePlugin.type);

    // First we need to unregister already registered plugins.
    fileTypePlugins.forEach(pl => plugins.unregister(pl.name as string));

    // Then, we need to register the default plugins first, then register user's plugins again, to generate new names.
    plugins.register([
        defaultFileTypePlugin,
        imageFileTypePlugin,
        ...fileTypePlugins.map(pl => {
            pl.name = undefined;
            return pl;
        })
    ]);
}

const BaseExtension: React.FC = () => {
    plugins.register([globalSearchHotkey, uiLayoutPlugin]);

    registerFileTypePlugins();

    return (
        <Plugins>
            <AddMenu name={"settings"} label={"Settings"} icon={<SettingsIcon />} pin={"last"} />
            <FileManager>
                {({ showFileManager }) => (
                    <AddMenu
                        name={"fileManager"}
                        label={"File Manager"}
                        icon={<FileIcon />}
                        tags={["footer"]}
                        onClick={showFileManager}
                        testId={"admin-drawer-footer-menu-file-manager"}
                    />
                )}
            </FileManager>
            <AddMenu
                name={"documentation"}
                label={"Documentation"}
                icon={<DocsIcon />}
                path={"https://www.webiny.com/docs"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
            <AddMenu
                name={"slack"}
                label={"Slack"}
                icon={<SlackIcon />}
                path={"https://www.webiny.com/slack/"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
            <AddMenu
                name={"github"}
                label={"Github"}
                icon={<GithubIcon />}
                path={"https://github.com/webiny/webiny-js"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
            <AddRoute path={"/"}>
                <Layout title={"Welcome!"}>
                    <Dashboard />
                </Layout>
            </AddRoute>
            <AddRoute path={"*"}>
                <Layout title={"Not Accessible"}>
                    <NotFound />
                </Layout>
            </AddRoute>
        </Plugins>
    );
};

export const Base = memo(BaseExtension);
