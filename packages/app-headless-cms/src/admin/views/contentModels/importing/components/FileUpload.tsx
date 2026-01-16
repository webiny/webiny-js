import React from "react";
import Files from "react-butterfiles";
import { Text } from "@webiny/admin-ui";
import { getError } from "./Errors.js";
import { useImport } from "~/admin/views/contentModels/importing/useImport.js";

export const FileUpload = () => {
    const { onFile, onFileError, file } = useImport();
    const fileName = file?.name;

    return (
        <Files
            accept={["application/json"]}
            maxSize={"5mb"}
            onSuccess={files => {
                const file = files.find(f => f.src.file);
                const uploadedFile = file?.src?.file;
                if (!uploadedFile) {
                    onFileError(
                        "File is not valid. Please make sure you are uploading a valid JSON file."
                    );
                    return;
                }
                onFile(uploadedFile);
            }}
            onError={err => {
                const errors = err.map(er => {
                    return getError(er);
                });
                if (errors.length === 0) {
                    return;
                }
                onFileError(errors[0]);
            }}
            multiple={false}
        >
            {({ browseFiles, getDropZoneProps }) => {
                return (
                    <>
                        <div
                            className={
                                "w-full mx-auto my-0 border-sm border-dashed cursor-pointer border-neutral-muted bg-neutral-base text-center p-md "
                            }
                            onClick={() => browseFiles()}
                            {...getDropZoneProps()}
                        >
                            <Text>{fileName || "Drop a file here, or click to select one."}</Text>
                        </div>
                    </>
                );
            }}
        </Files>
    );
};
