import * as React from "react";
import { Image } from "@webiny/app/components/index.js";
import { useFile } from "~/hooks/useFile.js";

const width100 = { width: 100 };

export const TableItemImageRenderer = () => {
    const { file } = useFile();
    return (
        <Image
            src={file.src}
            alt={file.name}
            transform={width100}
            className={"object-cover w-full h-full"}
        />
    );
};
