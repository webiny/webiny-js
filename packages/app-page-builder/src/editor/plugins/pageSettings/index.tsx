import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import SeoSettings from "./components/SeoSettings";
import SocialSettings from "./components/SocialSettings";
import { PbEditorPageSettingsPlugin } from "@webiny/app-page-builder/admin/types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import { ReactComponent as SocialIcon } from "./icons/round-thumb_up-24px.svg";
import { ReactComponent as SeoIcon } from "./icons/round-search-24px.svg";

const plugins: PbEditorPageSettingsPlugin[] = [
    {
        name: "pb-editor-page-settings-general",
        type: "pb-editor-page-settings",
        title: "General settings",
        description: "Manage things like title, page status,url and more.",
        icon: <SettingsIcon />,
        fields: `
            general {
                image {
                    id
                    src
                }
                tags
                layout
            }
    `,
        render(props) {
            return <GeneralSettings {...props} />;
        }
    },
    {
        name: "pb-editor-page-settings-seo",
        type: "pb-editor-page-settings",
        title: "SEO",
        description: "Control SEO settings like description and keywords.",
        icon: <SeoIcon />,
        fields: `
            seo {
                title
                description
                meta {
                    name
                    content
                }
            }
    `,
        render(props) {
            return <SeoSettings {...props} />;
        }
    },
    {
        name: "pb-editor-page-settings-social",
        type: "pb-editor-page-settings",
        title: "Social media",
        description: "Set share images and settings for social media sites.",
        icon: <SocialIcon />,
        fields: `
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
    `,
        render(props) {
            return <SocialSettings {...props} />;
        }
    }
];

export default plugins;
