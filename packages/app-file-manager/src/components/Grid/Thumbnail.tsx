import React from "react";
import { makeComposable } from "@webiny/app-admin";
import getFileTypePlugin from "~/getFileTypePlugin";
import { useFile } from "~/hooks/useFile";

/**
 * This component is used in the file grid to render thumbnails.
 */
export const Thumbnail = makeComposable("GridThumbnail", () => {
    const { file } = useFile();
    const filePlugin = getFileTypePlugin(file);

    return filePlugin ? (
        <>{filePlugin.render({ file, width: 600 })}</>
    ) : (
        <span>No Preview Available.</span>
    );
});
