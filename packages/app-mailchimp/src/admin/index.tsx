import React from "react";
import styled from "@emotion/styled";
import { Tab } from "@webiny/ui/Tabs";
import { Route } from "@webiny/react-router";
import Helmet from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import MailchimpSettings from "./components/MailchimpSettings";
import MailchimpElementAdvancedSettings from "./components/MailchimpElementAdvancedSettings";
import MailchimpElement from "./components/MailchimpElement";
import { hasRoles } from "@webiny/app-security";
import { SecureRoute } from "@webiny/app-security/components";
import { ReactComponent as MailchimpLogo } from "./mailchimp-logo.svg";

import render from "./../render";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/admin/types";
import { SettingsPlugin } from "@webiny/app-admin/types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 80,
    svg: {
        height: 80,
        width: "auto"
    }
});

const roles = ["pb-settings"];

export default [
    ...render,
    {
        name: "pb-page-element-mailchimp",
        type: "pb-editor-page-element",
        elementType: "mailchimp",
        toolbar: {
            title: "Mailchimp",
            group: "pb-editor-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <MailchimpLogo />
                    </PreviewBox>
                );
            }
        },
        settings: ["pb-editor-page-element-settings-delete", "", "pb-editor-page-element-settings-height"],
        target: ["column", "row", "list-item"],
        onCreate: "open-settings",
        render({ element }) {
            return <MailchimpElement element={element} />;
        },
        create() {
            return {
                type: "mailchimp",
                elements: [],
                data: {},
                settings: {}
            };
        }
    } as PbEditorPageElementPlugin,
    {
        name: "pb-element-advanced-settings-mailchimp",
        type: "pb-editor-page-element-advanced-settings",
        elementType: "mailchimp",
        render(props) {
            return (
                <Tab label="Mailchimp">
                    <MailchimpElementAdvancedSettings {...props} />
                </Tab>
            );
        }
    } as PbEditorPageElementAdvancedSettingsPlugin,
    {
        type: "settings",
        name: "settings-mailchimp",
        settings: {
            show: () => hasRoles(roles),
            type: "integration",
            name: "Mailchimp",
            route: (
                <Route
                    path="/mailchimp"
                    render={() => (
                        <AdminLayout>
                            <Helmet title={"Mailchimp"} />
                            <SecureRoute roles={roles}>
                                <MailchimpSettings />
                            </SecureRoute>
                        </AdminLayout>
                    )}
                />
            )
        }
    } as SettingsPlugin
];
