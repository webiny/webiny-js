// @flow
import * as React from "react";
import GeneralSettings from "./components/GeneralSettings";
import SocialSettings from "./components/SocialSettings";
import type { CmsPageSettingsPluginType } from "webiny-app-cms/types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";
import { ReactComponent as SocialIcon } from "./icons/round-thumb_up-24px.svg";

export default ([
    {
        name: "cms-website-settings-general",
        type: "cms-website-settings",
        title: "General settings",
        description: "Manage things like website name and favorites icon.",
        icon: <SettingsIcon />,
        fields: `
            general {
                image {
                    src
                }
                tags {
                    id 
                    name
                }
                layout
            }
    `,
        render(props: Object) {
            return <GeneralSettings {...props} />;
        }
    },
    {
        name: "cms-website-settings-social",
        type: "cms-website-settings",
        title: "Social media",
        description: "Set your social media links.",
        icon: <SocialIcon />,
        fields: `
            social {
                image {
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
        render(props: Object) {
            return <SocialSettings {...props} />;
        }
    }
]: Array<CmsPageSettingsPluginType>);
