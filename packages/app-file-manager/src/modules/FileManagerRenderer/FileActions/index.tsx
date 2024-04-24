import React from "react";
import { FileManagerViewConfig } from "~/index";
import { Download as GridDownload } from "./Grid/Download";
import { MoveToFolder as GridMoveToFolder } from "./Grid/MoveToFolder";
import { Settings as GridSettings } from "./Grid/Settings";
import { Download as FileDetailsDownload } from "./FileDetails/Download";
import { MoveToFolder as FileDetailsMoveToFolder } from "./FileDetails/MoveToFolder";
import { CopyUrl as FileDetailsCopyUrl } from "./FileDetails/CopyUrl";
import { DeleteImage as FileDetailsDeleteImage } from "./FileDetails/DeleteImage";
import { EditImage as FileDetailsEditImage } from "./FileDetails/EditImage";

const { Browser, FileDetails } = FileManagerViewConfig;

export const FileActions = () => {
    return (
        <>
            {/* Grid actions. */}
            <Browser.Grid.Item.Action name={"download"} element={<GridDownload />} />
            <Browser.Grid.Item.Action name={"move"} element={<GridMoveToFolder />} />
            <Browser.Grid.Item.Action name={"settings"} element={<GridSettings />} />
            {/* File details actions. */}
            <FileDetails.Action name={"download"} element={<FileDetailsDownload />} />
            <FileDetails.Action name={"moveToFolder"} element={<FileDetailsMoveToFolder />} />
            <FileDetails.Action name={"copyUrl"} element={<FileDetailsCopyUrl />} />
            <FileDetails.Action name={"editImage"} element={<FileDetailsEditImage />} />
            <FileDetails.Action name={"delete"} element={<FileDetailsDeleteImage />} />
        </>
    );
};
