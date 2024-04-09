import React, { memo } from "react";
import { ReactComponent as FileIcon } from "@material-design-icons/svg/filled/insert_drive_file.svg";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/outlined/settings.svg";
import { Plugin } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-security";
import { AddMenu, AddRoute, Dashboard, Layout, NotFound } from "~/index";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { FileManager } from "~/base/ui/FileManager";
import { globalSearchHotkey } from "~/plugins/globalSearch";
import { uiLayoutPlugin } from "~/plugins/uiLayoutRenderer";

const BaseExtension = () => {
    plugins.register([globalSearchHotkey, uiLayoutPlugin]);

    return (
        <Plugin>
            <AddMenu name={"settings"} label={"Settings"} icon={<SettingsIcon />} pin={"last"} />
            <HasPermission name={"fm.file"}>
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
            </HasPermission>
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
        </Plugin>
    );
};

export const Base = memo(BaseExtension);
