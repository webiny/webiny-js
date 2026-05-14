import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Property, useIdGenerator } from "@webiny/react-properties";
import type { FileUrlFormatter } from "@webiny/admin-ui";

export interface FileUrlFormatterConfigProps {
    formatter: FileUrlFormatter;
}

const BaseFileUrlFormatterConfig = ({ formatter }: FileUrlFormatterConfigProps) => {
    const getId = useIdGenerator("FileUrlFormatter");
    return <Property id={getId("fileUrlFormatter")} name={"fileUrlFormatter"} value={formatter} />;
};

export const FileUrlFormatterConfig = makeDecoratable(
    "FileUrlFormatterConfig",
    BaseFileUrlFormatterConfig
);
