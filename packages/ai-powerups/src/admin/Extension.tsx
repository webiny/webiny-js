import React from "react";
import { AdminConfig, AdminLayout, useRouter, RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as AiPowerUpsIcon } from "@webiny/icons/auto_fix_high.svg";
import { AI_POWERUPS_PERMISSIONS_SCHEMA } from "~/shared/permissionsSchema.js";
import { AiPowerUpsPermissionsFeature } from "~/admin/features/permissions/index.js";
import { HasPermission } from "~/admin/presentation/security/HasPermission.js";
import { AiPowerUpsSettingsFeature } from "./presentation/AiPowerUpsSettings/index.js";
import { AiPowerUpsSettingsPage } from "./presentation/AiPowerUpsSettings/AiPowerUpsSettingsPage.js";
import { WbContentGeneration } from "~/admin/presentation/WbContentGeneration/Extension.js";
import { CmsContentGeneration } from "~/admin/presentation/CmsContentGeneration/Extension.js";
import { CmsEntryWizardExtension } from "~/admin/presentation/CmsEntryWizard/Extension.js";
import { CmsCompareEntryRevisions } from "~/admin/presentation/CmsCompareEntryRevisions/Extension.js";
import { AiPowerUpsHeadlessFeatures } from "~/admin/features/feature.js";
import { AiPromptFormFeature } from "~/admin/presentation/AiPromptFormFactory/feature.js";
import { Routes } from "./routes.js";

const { Menu, Route, Security } = AdminConfig;

const AiPowerUpsSettings = () => {
    const { getLink } = useRouter();

    return (
        <AdminConfig>
            {/* The settings hold the AI provider API keys. */}
            <HasPermission entity={"settings"}>
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title={"AI Power-Ups"}>
                            <AiPowerUpsSettingsPage />
                        </AdminLayout>
                    }
                />
                <Menu
                    parent={"settings.system"}
                    name={"aiPowerUps"}
                    element={
                        <Menu.Link
                            text={"AI Power-Ups"}
                            badge={<Menu.Link.Badge text="BETA" />}
                            to={getLink(Routes.Settings)}
                            pinnable={true}
                        />
                    }
                />
            </HasPermission>
            <Security.Permissions
                name="aiPowerups"
                title="AI Power-Ups"
                description="Manage AI Power-Ups permissions."
                icon={<AiPowerUpsIcon />}
                schema={AI_POWERUPS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={AiPowerUpsPermissionsFeature} />
            <RegisterFeature feature={AiPromptFormFeature} />
            <RegisterFeature feature={AiPowerUpsHeadlessFeatures} />
            <RegisterFeature feature={AiPowerUpsSettingsFeature} />
            <AiPowerUpsSettings />
            {/* Website Builder Extension */}
            <WbContentGeneration />
            {/* Headless CMS Extension */}
            <CmsContentGeneration />
            {/* CMS Revision Comparison */}
            <CmsCompareEntryRevisions />
            {/* AI Entry Wizard (registered first so custom wizards can override) */}
            <CmsEntryWizardExtension />
        </>
    );
};
