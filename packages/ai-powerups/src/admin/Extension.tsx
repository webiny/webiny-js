import React from "react";
import {
    AdminConfig,
    AdminLayout,
    useRouter,
    RegisterFeature,
    useFeatureFlags
} from "@webiny/app-admin";
import { AiPowerUpsSettingsFeature } from "./presentation/AiPowerUpsSettings/index.js";
import { AiPowerUpsSettingsPage } from "./presentation/AiPowerUpsSettings/AiPowerUpsSettingsPage.js";
import { WbContentGeneration } from "~/admin/presentation/WbContentGeneration/Extension.js";
import { CmsContentGeneration } from "~/admin/presentation/CmsContentGeneration/Extension.js";
import { CmsEntryWizardExtension } from "~/admin/presentation/CmsEntryWizard/Extension.js";
import { CmsCompareEntryRevisions } from "~/admin/presentation/CmsCompareEntryRevisions/Extension.js";
import { AiPowerUpsHeadlessFeatures } from "~/admin/features/feature.js";
import { AiPromptFormFeature } from "~/admin/presentation/AiPromptFormFactory/feature.js";
import { AiPowerUpsPermissionsFeature } from "~/admin/features/permissions/feature.js";
import { HasPermission } from "~/admin/presentation/security/HasPermission.js";
import { AI_POWER_UPS_PERMISSIONS_SCHEMA } from "~/admin/permissions.js";
import { ReactComponent as AiPowerUpsIcon } from "@webiny/icons/auto_fix_high.svg";
import { Routes } from "./routes.js";

const { Menu, Route, Security } = AdminConfig;

const AiPowerUpsSettings = () => {
    const { getLink } = useRouter();

    /*
     * Only the settings screen is gated. The AI buttons elsewhere in the Admin stay available to
     * everyone, since the features behind them are not what this permission controls.
     */
    return (
        <AdminConfig>
            <HasPermission entity={"settings"}>
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title={"AI Power-Ups"}>
                            <AdminConfig.Breadcrumb name={"ai-powerups"} label={"AI Power-Ups"} />
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
                name={"aiPowerUps"}
                title={"AI Power-Ups"}
                description={"Manage AI Power-Ups settings."}
                icon={<AiPowerUpsIcon />}
                schema={AI_POWER_UPS_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};

export const Extension = () => {
    /*
     * Gated here rather than around `<Admin.Extension>` in `AiPowerups.tsx`, so a licence granted
     * after the last deploy takes effect on the next page load instead of the next deploy. Returning
     * null registers nothing, so an unlicensed project has no AI Power-Ups settings screen and no AI
     * buttons, rather than ones that fail when clicked. `app-audit-logs` gates the same way.
     */
    const featureFlags = useFeatureFlags();

    if (!featureFlags.isEnabled("aiPowerups")) {
        return null;
    }

    return (
        <>
            <RegisterFeature feature={AiPromptFormFeature} />
            <RegisterFeature feature={AiPowerUpsHeadlessFeatures} />
            <RegisterFeature feature={AiPowerUpsSettingsFeature} />
            <RegisterFeature feature={AiPowerUpsPermissionsFeature} />
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
