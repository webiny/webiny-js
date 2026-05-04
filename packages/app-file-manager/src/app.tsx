import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { SettingsModule } from "~/modules/Settings/index.js";
import { FileManagerApiProviderModule } from "~/modules/FileManagerApiProvider/index.js";
import { FileManagerRendererModule } from "~/modules/FileManagerRenderer/index.js";
import { HeadlessCmsModule } from "~/modules/HeadlessCms/index.js";
import { EnterpriseModule } from "~/modules/Enterprise/index.js";
import { SecurityPermissions } from "./modules/SecurityPermissions.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { GetFileFeature } from "~/features/getFile/feature.js";
import { ResolveImageToolFeature } from "~/presentation/resolveImageTool/feature.js";
import { ListFilesFeature } from "~/features/listFiles/index.js";
import { UpdateFileFeature } from "~/features/updateFile/index.js";
import { DeleteFileFeature } from "~/features/deleteFile/index.js";
import { FileUploaderFeature } from "~/features/fileUploader/index.js";
import { ListTagsFeature } from "~/features/tags/index.js";
import { GetSettingsFeature } from "~/features/settings/index.js";
import { SharedCacheFeature } from "~/features/shared/index.js";

export const FileManager = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={SharedCacheFeature} />
            <RegisterFeature feature={ListFilesFeature} />
            <RegisterFeature feature={GetFileFeature} />
            <RegisterFeature feature={UpdateFileFeature} />
            <RegisterFeature feature={DeleteFileFeature} />
            <RegisterFeature feature={FileUploaderFeature} />
            <RegisterFeature feature={ListTagsFeature} />
            <RegisterFeature feature={GetSettingsFeature} />
            <RegisterFeature feature={FmPermissionsFeature} />
            <RegisterFeature feature={GetFileFeature} />
            <RegisterFeature feature={ResolveImageToolFeature} />
            <SettingsModule />
            <FileManagerApiProviderModule />
            <FileManagerRendererModule />
            <HeadlessCmsModule />
            <EnterpriseModule />
            <SecurityPermissions />
        </>
    );
};
