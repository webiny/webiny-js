import React from "react";
import { SettingsModule } from "~/modules/Settings";
import { FileManagerApiProviderModule } from "~/modules/FileManagerApiProvider";
import { FileManagerRendererModule } from "~/modules/FileManagerRenderer";
import { HeadlessCmsModule } from "~/modules/HeadlessCms";

export const FileManager = () => {
    return (
        <>
            <SettingsModule />
            <FileManagerApiProviderModule />
            <FileManagerRendererModule />
            <HeadlessCmsModule />
        </>
    );
};
