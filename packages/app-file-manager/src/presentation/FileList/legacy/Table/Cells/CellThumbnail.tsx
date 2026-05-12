import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerViewConfig } from "~/index.js";

export const CellThumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(browser.table.cellThumbnails, file);

    return <>{renderer?.element || null}</>;
};
