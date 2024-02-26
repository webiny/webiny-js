import { FileError } from "react-butterfiles";
import styled from "@emotion/styled";
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

const DisplayError = styled("div")({
    color: "var(--mdc-theme-error)",
    width: "90%",
    margin: "5px auto 0 auto",
    textAlign: "right"
});

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
                return <DisplayError key={`error-${index}`}>{error}</DisplayError>;
            })}
        </>
    );
};
