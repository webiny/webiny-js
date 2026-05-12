// @ts-nocheck
import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const Thumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(browser.grid.itemThumbnails, file);

    return <>{renderer?.element || null}</>;
};
