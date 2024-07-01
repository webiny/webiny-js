import React from "react";
import { useFile } from "~/hooks/useFile";
import { useFileManagerViewConfig } from "~/index";

export const Thumbnail = () => {
    const { file } = useFile();
    const { fileDetails, getThumbnailRenderer } = useFileManagerViewConfig();

    const renderer = getThumbnailRenderer(fileDetails.thumbnails, file);

    return <>{renderer?.element || null}</>;
};
