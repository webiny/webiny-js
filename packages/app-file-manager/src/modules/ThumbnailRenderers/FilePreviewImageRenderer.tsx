import * as React from "react";
import { Image } from "@webiny/app/components/index.js";
import { useFile } from "~/hooks/useFile.js";

const width750 = { width: 750 };

export const FilePreviewImageRenderer = () => {
    const { file } = useFile();
    return (
        <Image
            src={file.src}
            alt={file.name}
            transform={width750}
            className={"object-contain max-w-full max-h-full"}
        />
    );
};
