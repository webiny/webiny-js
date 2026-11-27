import type { FileError } from "@webiny/app-admin/presentation/browserFilePicker/index.js";
import React from "react";

export const getError = (error: FileError): string => {
    switch (error.type) {
        case "unsupportedFileType":
            return `Unsupported file type "${error.file?.type || "unknown"}".`;
        case "maxSizeExceeded":
            return "One or more file sizes are greater than maxSize value.";
        case "multipleMaxCountExceeded":
            return "Selected more files than allowed.";
        case "multipleMaxSizeExceeded":
            return "Selected one or more files with their total size greater than allowed.";
        case "multipleNotAllowed":
            return "Cannot upload more than one file at once.";
        default:
            return `Unknown error: ${error.type}`;
    }
};

interface ErrorsProps {
    errors?: string[] | null;
}

export const Errors = ({ errors }: ErrorsProps) => {
    if (!errors?.length) {
        return null;
    }
    return (
        <>
            {errors.map((error, index) => {
                return (
                    <div key={`error-${index}`} className={"w-[90%] mt-[5px] mx-auto text-right"}>
                        {error}
                    </div>
                );
            })}
        </>
    );
};
