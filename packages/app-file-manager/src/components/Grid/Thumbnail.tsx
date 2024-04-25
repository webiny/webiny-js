import React from "react";
import { useFile } from "~/hooks/useFile";
import { useFileManagerViewConfig } from "~/index";

export const Thumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(browser.grid.itemThumbnails, file);

    return <>{renderer?.element || null}</>;
};
