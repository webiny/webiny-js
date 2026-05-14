import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { SettingsModule } from "~/modules/Settings/index.js";
import { FileManagerApiProviderModule } from "~/modules/FileManagerApiProvider/index.js";
import { FileManagerRendererModule } from "~/modules/FileManagerRenderer/index.js";
import { HeadlessCmsModule } from "~/modules/HeadlessCms/index.js";
import { EnterpriseModule } from "~/modules/Enterprise/index.js";
import { SecurityPermissions } from "./modules/SecurityPermissions.js";
import { FileUrlFormatterModule } from "./modules/FileUrlFormatter.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { GetFileFeature } from "~/features/getFile/feature.js";
import { ResolveImageToolFeature } from "~/presentation/resolveImageTool/feature.js";

export const FileManager = () => {
    return (
        <>
            <RegisterFeature feature={FmPermissionsFeature} />
            <RegisterFeature feature={GetFileFeature} />
            <RegisterFeature feature={ResolveImageToolFeature} />
            <SettingsModule />
            <FileManagerApiProviderModule />
            <FileManagerRendererModule />
            <HeadlessCmsModule />
            <EnterpriseModule />
            <SecurityPermissions />
            <FileUrlFormatterModule />
        </>
    );
};
