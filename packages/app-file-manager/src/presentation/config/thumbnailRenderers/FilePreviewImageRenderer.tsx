import * as React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { CroppedFileImage } from "./CroppedFileImage.js";

export const FilePreviewImageRenderer = () => {
    const { file } = useFile();
    return (
        <CroppedFileImage
            file={file}
            width={750}
            fit={"contain"}
            fallbackClassName={"object-contain max-w-full max-h-full"}
        />
    );
};
