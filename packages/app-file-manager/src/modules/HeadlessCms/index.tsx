import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import { fileField } from "./fileField";
import { singleFile } from "./fileRenderer/fileField";
import { multipleFiles } from "./fileRenderer/fileFields";

export const HeadlessCmsModule = () => {
    useEffect(() => {
        plugins.register(fileField, singleFile, multipleFiles);
    });

    return null;
};
