import * as React from "react";
import { Image } from "@webiny/app/components/index.js";
import { useFile } from "~/presentation/hooks/useFile.js";

const width300 = { width: 300 };

export const GridItemImageRenderer = () => {
    const { file } = useFile();
    return (
        <Image
            src={file.src}
            alt={file.name}
            transform={width300}
            className={"object-contain max-w-full max-h-full"}
        />
    );
};
