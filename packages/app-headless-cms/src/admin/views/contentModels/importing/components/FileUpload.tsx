import React from "react";
import styled from "@emotion/styled";
import Files from "react-butterfiles";
import { getError } from "./Errors";
import { useImport } from "~/admin/views/contentModels/importing/useImport";

const Container = styled("div")({
    width: "100%",
    margin: "0 auto",
    backgroundColor: "var(--mdc-theme-background)",
    border: "1px dashed var(--mdc-theme-on-background)",
    cursor: "pointer"
});

const Text = styled("p")({
    width: "100%",
    padding: "15px 0",
    textAlign: "center",
    display: "block"
});

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
                        <Container onClick={() => browseFiles()} {...getDropZoneProps()}>
                            <Text>{fileName || "Drop a file here, or click to select one."}</Text>
                        </Container>
                    </>
                );
            }}
        </Files>
    );
};
