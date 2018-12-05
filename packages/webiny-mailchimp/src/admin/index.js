// @flow
import * as React from "react";
import MailchimpSettings from "./components/MailchimpSettings";
import type { SettingsPluginType } from "webiny-app-admin/types";

export default ([
    {
        type: "settings",
        name: "settings-mailchimp",
        settings: {
            type: "integration",
            name: "Mailchimp",
            component: <MailchimpSettings />,
            route: {
                name: "Settings.Mailchimp",
                path: "/mailchimp",
                title: "Mailchimp",
                group: undefined
            }
        }
    }
]: Array<SettingsPluginType>);
