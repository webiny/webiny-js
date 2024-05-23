import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";

import { AddRoute, Layout } from "@webiny/app-admin";
import { GeneralSettings } from "./settingsGroups/GeneralSettings";
import { DefaultPages } from "./settingsGroups/DefaultPages";
import { WebsiteSettingsView } from "./WebsiteSettingsView";
import { FaviconAndLogo } from "./settingsGroups/FaviconAndLogo";
import { SocialMedia } from "./settingsGroups/SocialMedia";
import { HtmlTags } from "./settingsGroups/HtmlTags";
import { WebsiteSettingsWithConfig } from "./config/WebsiteSettingsConfig";

export const WebsiteSettings = () => {
    return (
        <Fragment>
            <HasPermission name={"pb.settings"}>
                <AddRoute path="/settings/page-builder/website">
                    <Layout title={"Page Builder - Website Settings"}>
                        <WebsiteSettingsWithConfig>
                            <WebsiteSettingsView />
                        </WebsiteSettingsWithConfig>
                    </Layout>
                </AddRoute>
            </HasPermission>
            <GeneralSettings />
            <DefaultPages />
            <FaviconAndLogo />
            <SocialMedia />
            <HtmlTags />
        </Fragment>
    );
};
