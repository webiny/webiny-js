import React from "react";
import { SettingsModule } from "~/modules/Settings";
import { FileManagerApiProviderModule } from "~/modules/FileManagerApiProvider";
import { FileTypesModule } from "~/modules/FileTypes";
import { FileManagerRendererModule } from "~/modules/FileManagerRenderer";

export const FileManager = () => {
    return (
        <>
            <SettingsModule />
            <FileManagerApiProviderModule />
            <FileTypesModule />
            <FileManagerRendererModule />
        </>
    );
};
