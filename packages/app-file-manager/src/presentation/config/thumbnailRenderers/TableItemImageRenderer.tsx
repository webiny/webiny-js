import * as React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { CroppedFileImage } from "./CroppedFileImage.js";

export const TableItemImageRenderer = () => {
    const { file } = useFile();
    return (
        <CroppedFileImage
            file={file}
            width={100}
            fit={"cover"}
            fallbackClassName={"object-cover w-full h-full"}
        />
    );
};
