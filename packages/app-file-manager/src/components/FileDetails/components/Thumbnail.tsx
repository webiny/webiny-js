import React from "react";
import getFileTypePlugin from "~/getFileTypePlugin";
import { useFile } from "~/hooks/useFile";

/**
 * This component is used in the file grid to render thumbnails, as well as in the File Details preview.
 */
export const Thumbnail = () => {
    const { file } = useFile();
    const filePlugin = getFileTypePlugin(file);

    // TODO: implement preview rendering using component composition

    return filePlugin ? (
        <>{filePlugin.render({ file, width: 600 })}</>
    ) : (
        <span>No Preview Available.</span>
    );
};
