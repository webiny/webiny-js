import * as React from "react";
import { useFile } from "~/presentation/hooks/useFile.js";
import { CroppedFileImage } from "./CroppedFileImage.js";

export const GridItemImageRenderer = () => {
    const { file } = useFile();
    return (
        <CroppedFileImage
            file={file}
            width={300}
            fit={"contain"}
            fallbackClassName={"object-contain max-w-full max-h-full"}
        />
    );
};
