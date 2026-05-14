import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerConfig } from "~/index.js";

export const Thumbnail = () => {
    const { file } = useFile();
    const { browser, getThumbnailRenderer } = useFileManagerConfig();

    const renderer = getThumbnailRenderer(browser.grid.itemThumbnails, file);

    return <>{renderer?.element || null}</>;
};
