import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";

export const CellThumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerConfig();

    const renderer = getThumbnailRenderer(browser.table.cellThumbnails, file);

    return <>{renderer?.element || null}</>;
};
