import React from "react";
import { FileManager } from "@webiny/app-admin/components";

export const WrapperWithFileUpload = ({ children, onSelect }) => {
    return (
        <FileManager
            onChange={file => {
                onSelect(file.key);
            }}
            onUploadCompletion={uploadedFiles => {
                const zipKey = uploadedFiles[0].key;
                onSelect(zipKey);
            }}
            accept={["application/zip"]}
        >
            {({ showFileManager }) =>
                typeof children === "function"
                    ? children({ showFileManager })
                    : React.cloneElement(children, { onClick: showFileManager })
            }
        </FileManager>
    );
};
