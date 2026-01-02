import React from "react";
import { FileManagerViewConfig } from "~/index.js";
import { Delete as GridDelete } from "./Grid/Delete.js";
import { Download as GridDownload } from "./Grid/Download.js";
import { MoveToFolder as GridMoveToFolder } from "./Grid/MoveToFolder.js";
import { Settings as GridSettings } from "./Grid/Settings.js";
import { Download as FileDetailsDownload } from "./FileDetails/Download.js";
import { MoveToFolder as FileDetailsMoveToFolder } from "./FileDetails/MoveToFolder.js";
import { CopyUrl as FileDetailsCopyUrl } from "./FileDetails/CopyUrl.js";
import { DeleteImage as FileDetailsDeleteImage } from "./FileDetails/DeleteImage.js";

const { Browser, FileDetails } = FileManagerViewConfig;

export const FileActions = () => {
    return (
        <>
            {/* Grid actions. */}
            <Browser.Grid.Item.Action name={"settings"} element={<GridSettings />} />
            <Browser.Grid.Item.Action name={"download"} element={<GridDownload />} />
            <Browser.Grid.Item.Action name={"move"} element={<GridMoveToFolder />} />
            <Browser.Grid.Item.Action name={"delete"} element={<GridDelete />} />
            {/* File details actions. */}
            <FileDetails.Action name={"download"} element={<FileDetailsDownload />} />
            <FileDetails.Action name={"moveToFolder"} element={<FileDetailsMoveToFolder />} />
            <FileDetails.Action name={"copyUrl"} element={<FileDetailsCopyUrl />} />
            <FileDetails.Action name={"delete"} element={<FileDetailsDeleteImage />} />
        </>
    );
};
