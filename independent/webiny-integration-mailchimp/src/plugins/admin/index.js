// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "webiny-ui/Tabs";
import MailchimpSettings from "./components/MailchimpSettings";
import MailchimpElementAdvancedSettings from "./components/MailchimpElementAdvancedSettings";
import MailchimpElement from "./components/MailchimpElement";
import { hasRoles } from "webiny-app-security";
import { SecureRoute } from "webiny-app-security/components";
import { ReactComponent as MailchimpLogo } from "./mailchimp-logo.svg";

import render from "./../render";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 80,
    svg: {
        height: 80,
        width: "auto"
    }
});

const roles = ["cms-settings"];

export default [
    ...render,
    {
        name: "cms-element-mailchimp",
        type: "cms-element",
        toolbar: {
            title: "Mailchimp",
            group: "cms-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <MailchimpLogo />
                    </PreviewBox>
                );
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
            show: () => hasRoles(roles),
            type: "integration",
            name: "Mailchimp",
            component: (
                <SecureRoute roles={roles}>
                    <MailchimpSettings />
                </SecureRoute>
            ),
            route: {
                name: "Settings.Mailchimp",
                path: "/mailchimp",
                title: "Mailchimp",
                group: undefined
            }
        }
    }
];
