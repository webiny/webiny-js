import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerConfig } from "~/index.js";

export const Thumbnail = () => {
    const { file } = useFile();
    const { fileDetails, getThumbnailRenderer } = useFileManagerConfig();

    const renderer = getThumbnailRenderer(fileDetails.thumbnails, file);

    return <>{renderer?.element || null}</>;
};
