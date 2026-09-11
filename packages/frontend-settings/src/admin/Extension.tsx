import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import { FrontendPermissionsFeature } from "./features/permissions/feature.js";
import { GetFrontendSettingsFeature } from "./features/getSettings/feature.js";
import { UpdateFrontendSettingsFeature } from "./features/updateSettings/feature.js";
import { StarterKitConfigFeature } from "./presentation/StarterKitConfig/feature.js";
import { Extension as NavigationExtension } from "./presentation/StarterKitConfig/Extension.js";

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={FrontendPermissionsFeature} />
            <RegisterFeature feature={GetFrontendSettingsFeature} />
            <RegisterFeature feature={UpdateFrontendSettingsFeature} />
            <RegisterFeature feature={StarterKitConfigFeature} />
            <AdminConfig>
                <NavigationExtension />
            </AdminConfig>
        </>
    );
};
