import React from "react";
import { useFile } from "~/hooks/useFile";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig";

/**
 * This component is used in the file grid to render thumbnails, as well as in the File Details preview.
 */
export const Thumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(browser.grid.itemThumbnails, file);

    return <>{renderer?.element || null}</>;
};
