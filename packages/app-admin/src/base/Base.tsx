import React, { memo } from "react";
import { Extensions } from "@webiny/app-admin-core";
import { AddMenu } from "~/index";
import { plugins } from "@webiny/plugins";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { ReactComponent as FileIcon } from "~/assets/icons/insert_drive_file-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/round-settings-24px.svg";
import { FileManager } from "~/components";

import adminPlugins from "../plugins";

const BaseExtension = () => {
    plugins.register(adminPlugins());

    return (
        <Extensions>
            <AddMenu id={"settings"} label={"Settings"} icon={<SettingsIcon />} pin={"last"} />
            <FileManager>
                {({ showFileManager }) => (
                    <AddMenu
                        id={"fileManager"}
                        label={"File Manager"}
                        icon={<FileIcon />}
                        tags={["footer"]}
                        onClick={showFileManager}
                    />
                )}
            </FileManager>
            <AddMenu
                id={"documentation"}
                label={"Documentation"}
                icon={<DocsIcon />}
                path={"https://docs.webiny.com/"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
            <AddMenu
                id={"slack"}
                label={"Slack"}
                icon={<SlackIcon />}
                path={"https://www.webiny.com/slack/"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
            <AddMenu
                id={"github"}
                label={"Github"}
                icon={<GithubIcon />}
                path={"https://github.com/webiny/webiny-js"}
                rel={"noopener noreferrer"}
                target={"_blank"}
                tags={["footer"]}
            />
        </Extensions>
    );
};

export const Base = memo(BaseExtension);
