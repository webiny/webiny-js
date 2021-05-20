import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import SeoSettings from "./components/SeoSettings";
import SocialSettings from "./components/SocialSettings";
import { PbEditorPageQueryFieldsPlugin, PbEditorPageSettingsPlugin } from "../../../types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import { ReactComponent as SocialIcon } from "./icons/round-thumb_up-24px.svg";
import { ReactComponent as SeoIcon } from "./icons/round-search-24px.svg";
import { PluginCollection } from "@webiny/plugins/types";

const plugins: PluginCollection = [
    {
        name: "pb-editor-page-settings-general",
        type: "pb-editor-page-settings",
        title: "General settings",
        description: "Manage things like title, page status, path, and more.",
        icon: <SettingsIcon />,
        render(props) {
            return <GeneralSettings {...props} />;
        }
    } as PbEditorPageSettingsPlugin,
    {
        name: "pb-editor-page-query-fields-general-settings",
        type: "pb-editor-page-query-fields",
        fields: `
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
        `
    } as PbEditorPageQueryFieldsPlugin,
    {
        name: "pb-editor-page-settings-seo",
        type: "pb-editor-page-settings",
        title: "SEO",
        description: "Control SEO settings like description and keywords.",
        icon: <SeoIcon />,
        render(props) {
            return <SeoSettings {...props} />;
        }
    } as PbEditorPageSettingsPlugin,
    {
        name: "pb-editor-page-query-fields-seo-settings",
        type: "pb-editor-page-query-fields",
        fields: `
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
        `
    } as PbEditorPageQueryFieldsPlugin,
    {
        name: "pb-editor-page-settings-social",
        type: "pb-editor-page-settings",
        title: "Social media",
        description: "Set share images and settings for social media websites.",
        icon: <SocialIcon />,
        render(props) {
            return <SocialSettings {...props} />;
        }
    },
    {
        name: "pb-editor-page-query-fields-social-settings",
        type: "pb-editor-page-query-fields",
        fields: `
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
        `
    } as PbEditorPageQueryFieldsPlugin
];

export default plugins;
