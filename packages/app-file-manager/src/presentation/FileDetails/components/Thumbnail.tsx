import React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { useFileManagerViewConfig } from "~/index.js";

export const Thumbnail = () => {
    const { file } = useFile();
    const { fileDetails, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(fileDetails.thumbnails, file);

    return <>{renderer?.element || null}</>;
};
