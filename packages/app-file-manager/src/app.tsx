import React from "react";
import { AdminConfig, RegisterFeature } from "@webiny/app-admin";
import { FolderTreeFieldRenderer } from "@webiny/app-aco/presentation/folderTree/FolderTreeFieldRenderer.js";
import { SettingsModule } from "~/modules/Settings/index.js";
import { FileModelModule } from "~/modules/FileModelModule.js";
import { DefaultFileManagerConfig } from "~/presentation/config/DefaultFileManagerConfig.js";
import { EnterpriseModule } from "~/modules/Enterprise/index.js";
import { SecurityPermissions } from "./modules/SecurityPermissions.js";
import { FileUrlFormatterModule } from "./modules/FileUrlFormatter.js";
import { FmPermissionsFeature } from "~/features/permissions/feature.js";
import { GetFileFeature } from "~/features/getFile/feature.js";
import { ResolveImageToolFeature } from "~/features/resolveImageTool/feature.js";
import { ListFilesFeature } from "~/features/listFiles/index.js";
import { UpdateFileFeature } from "~/features/updateFile/index.js";
import { DeleteFileFeature } from "~/features/deleteFile/index.js";
import { FileUploaderFeature } from "~/features/fileUploader/index.js";
import { ListTagsFeature } from "~/features/tags/index.js";
import { GetSettingsFeature } from "~/features/settings/index.js";
import { SharedCacheFeature } from "~/features/shared/index.js";
import { FileManagerPresenterFeature } from "~/presentation/FileList/index.js";
import { FileManagerRoutes } from "~/modules/FileManagerRoutes.js";
import { FileManagerRendererDecorator } from "~/presentation/FileManager/FileManagerRenderer.js";
import { FileModelProviderFeature } from "~/features/fileModel/index.js";
import { FileFieldTypeFeature } from "~/modules/HeadlessCms/fieldType/feature.js";
import { CmsFilePickerRenderer } from "~/presentation/fieldRenderers/CmsFilePickerRenderer.js";
import { CmsMultiFilePickerRenderer } from "~/presentation/fieldRenderers/CmsMultiFilePickerRenderer.js";

export const FileManager = () => {
    return (
        <>
            {/* Headless features. */}
            <RegisterFeature feature={FileModelProviderFeature} />
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
            <FileModelModule />
            {/* Presentation features. */}
            <RegisterFeature feature={FileManagerPresenterFeature} />
            {/* Field renderers. */}
            <AdminConfig>
                <AdminConfig.Form.FieldRenderer
                    name={"folderTree"}
                    component={FolderTreeFieldRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsFilePicker"}
                    component={CmsFilePickerRenderer}
                />
                <AdminConfig.Form.FieldRenderer
                    name={"cmsMultiFilePicker"}
                    component={CmsMultiFilePickerRenderer}
                />
            </AdminConfig>
            {/* Legacy modules. */}
            <FileManagerRoutes />
            <SettingsModule />
            <FileManagerRendererDecorator />
            <DefaultFileManagerConfig />
            <RegisterFeature feature={FileFieldTypeFeature} />
            <EnterpriseModule />
            <SecurityPermissions />
            <FileUrlFormatterModule />
        </>
    );
};
