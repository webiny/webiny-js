import React, { memo } from "react";
import { Plugins } from "@webiny/app-admin-core";
import { AddMenu, AddRoute, Dashboard, Layout, NotFound } from "~/index";
import { plugins } from "@webiny/plugins";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { ReactComponent as FileIcon } from "~/assets/icons/insert_drive_file-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/round-settings-24px.svg";
import { FileManager } from "~/components";

import adminPlugins from "../plugins";

const BaseExtension: React.FC = () => {
    plugins.register(adminPlugins());

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
