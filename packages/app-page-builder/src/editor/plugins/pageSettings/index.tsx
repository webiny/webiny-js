import * as React from "react";
import { gql } from "graphql-tag";
import { PluginCollection } from "@webiny/plugins/types";
import { AddQuerySelectionPlugin } from "@webiny/app/plugins/AddQuerySelectionPlugin";
import GeneralSettings from "./components/GeneralSettings";
import SeoSettings from "./components/SeoSettings";
import SocialSettings from "./components/SocialSettings";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import { ReactComponent as SocialIcon } from "./icons/round-thumb_up-24px.svg";
import { ReactComponent as SeoIcon } from "./icons/round-search-24px.svg";
import { PbEditorPageSettingsPlugin } from "~/plugins/PbEditorPageSettingsPlugin";

const plugins: PluginCollection = [
    new PbEditorPageSettingsPlugin({
        title: "General settings",
        description: "Manage things like title, page status, path, and more.",
        icon: <SettingsIcon />,
        render(props) {
            return <GeneralSettings {...props} />;
        }
    }),
    new PbEditorPageSettingsPlugin({
        title: "SEO",
        description: "Control SEO settings like description and keywords.",
        icon: <SeoIcon />,
        render(props) {
            return <SeoSettings {...props} />;
        }
    }),
    new PbEditorPageSettingsPlugin({
        title: "Social media",
        description: "Set share images and settings for social media websites.",
        icon: <SocialIcon />,
        render(props) {
            return <SocialSettings {...props} />;
        }
    }),
    new AddQuerySelectionPlugin({
        operationName: "GetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    general {
                        snippet
                        image {
                            id
                            src
                        }
                        tags
                        layout
                    }
                }
            }
        `
    }),
    new AddQuerySelectionPlugin({
        operationName: "GetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    seo {
                        title
                        description
                        meta {
                            name
                            content
                        }
                    }
                }
            }
        `
    }),
    new AddQuerySelectionPlugin({
        operationName: "GetPage",
        selectionPath: "pageBuilder.getPage.data",
        addSelection: gql`
            {
                settings {
                    social {
                        image {
                            id
                            src
                        }
                        title
                        description
                        meta {
                            property
                            content
                        }
                    }
                }
            }
        `
    })
];

export default plugins;
