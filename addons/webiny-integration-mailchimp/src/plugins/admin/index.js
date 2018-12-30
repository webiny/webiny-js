// @flow
import React from "react";
import { Tab } from "webiny-ui/Tabs";
import MailchimpSettings from "./components/MailchimpSettings";
import MailchimpElementAdvancedSettings from "./components/MailchimpElementAdvancedSettings";
import MailchimpElement from "./components/MailchimpElement";

import render from "./../render";

export default [
    ...render,
    {
        name: "cms-element-mailchimp",
        type: "cms-element",
        toolbar: {
            title: "Mailchimp",
            group: "cms-element-group-form",
            preview() {
                return <span>A Mailchimp sample</span>;
            }
        },
        settings: ["cms-element-settings-delete", "", "cms-element-settings-height"],
        target: ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        onCreate: "open-settings",
        render({ element }: Object) {
            return <MailchimpElement element={element} />;
        },
        create() {
            return {
                type: "cms-element-mailchimp",
                elements: [],
                data: {},
                settings: {}
            };
        }
    },
    {
        name: "cms-element-advanced-settings-mailchimp",
        type: "cms-element-advanced-settings",
        element: "cms-element-mailchimp",
        render(props: Object) {
            return (
                <Tab label="Mailchimp">
                    <MailchimpElementAdvancedSettings {...props} />
                </Tab>
            );
        }
    },
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
];
