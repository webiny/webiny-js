import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/table_chart.svg";
import { FrontendPermissionsFeature } from "./features/permissions/feature.js";
import { GetFrontendSettingsFeature } from "./features/getSettings/feature.js";
import { UpdateFrontendSettingsFeature } from "./features/updateSettings/feature.js";
import { StarterKitConfigFeature } from "./presentation/StarterKitConfig/feature.js";
import { Extension as NavigationExtension } from "./presentation/StarterKitConfig/Extension.js";
import { FRONTEND_PERMISSIONS_SCHEMA } from "./domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={FrontendPermissionsFeature} />
            <RegisterFeature feature={GetFrontendSettingsFeature} />
            <RegisterFeature feature={UpdateFrontendSettingsFeature} />
            <RegisterFeature feature={StarterKitConfigFeature} />
            <AdminConfig>
                <Security.Permissions
                    name="frontend-settings"
                    title="Frontend Settings"
                    description="Manage Frontend Settings permissions."
                    icon={<PermissionsIcon />}
                    schema={FRONTEND_PERMISSIONS_SCHEMA}
                />
                <NavigationExtension />
            </AdminConfig>
        </>
    );
};
