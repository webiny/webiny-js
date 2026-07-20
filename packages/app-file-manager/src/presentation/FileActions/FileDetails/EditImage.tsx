import React, { useCallback } from "react";
import { ReactComponent as CropIcon } from "@webiny/icons/crop.svg";
import { ImageEditor } from "@webiny/admin-ui";
import { FileManagerViewConfig, useFile } from "~/index.js";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";
import { useEditImage } from "~/presentation/hooks/useEditImage.js";
import type { FileItem } from "~/domain/types.js";

const { FileDetails } = FileManagerViewConfig;

/**
 * "Edit image" action in the File Details drawer. Shown for images only. Opens
 * the reusable crop/hotspot/alt editor and saves to the file's asset-level
 * metadata. The drawer stays mounted while open, so the dialog state is safe here.
 */
export const EditImage = () => {
    const { file } = useFile();
    const { vm } = useFileManagerPresenter();
    const fileDetails = vm.fileDetails;

    // After saving, replace the file shown in the drawer so the preview updates
    // in place (without needing to close and reopen the drawer).
    const onSaved = useCallback(
        (updated: FileItem) => {
            fileDetails?.setFile(updated);
        },
        [fileDetails]
    );

    const { open, openEditor, closeEditor, value, save } = useEditImage(file, { onSaved });

    if (!file.type?.startsWith("image/") || file.type === "image/svg+xml") {
        return null;
    }

    return (
        <>
            <FileDetails.Action.Button
                label={"Edit image"}
                icon={<CropIcon />}
                onAction={openEditor}
            />
            <ImageEditor
                open={open}
                onClose={closeEditor}
                image={{
                    src: file.src,
                    width: file.metadata?.image?.width ?? 0,
                    height: file.metadata?.image?.height ?? 0
                }}
                value={value}
                onSave={save}
            />
        </>
    );
};
