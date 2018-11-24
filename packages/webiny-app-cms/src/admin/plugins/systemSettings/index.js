// @flow
import * as React from "react";
import CmsSettings from "./components/CmsSettings";
import type { CmsPageSettingsPluginType } from "webiny-app-cms/types";
import { ReactComponent as SettingsIcon } from "./icons/round-settings-24px.svg";

export default ([
    {
        name: "system-settings-cms",
        type: "system-settings",
        title: "CMS",
        description: "Manage CMS related settings.",
        icon: <SettingsIcon />,
        fields: `
            cms {
                name
                logo {
                    src
                }
                favicon {
                    src
                }
                social {
                    facebook
                    twitter
                    instagram
                }
            }
    `,
        render(props: Object) {
            return <CmsSettings {...props} />;
        }
    }
]: Array<CmsPageSettingsPluginType>);
