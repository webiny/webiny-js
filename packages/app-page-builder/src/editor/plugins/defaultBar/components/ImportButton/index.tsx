import React from "react";
import { FileManager } from "@webiny/app-admin/components";

interface WrapperWithFileUploadProps
    extends Pick<React.ComponentProps<typeof FileManager>, "children"> {
    onSelect: (file: string) => void;
}
export const WrapperWithFileUpload: React.FC<WrapperWithFileUploadProps> = ({
    children,
    onSelect
}) => {
    return (
        <FileManager
            onChange={file => {
                onSelect(file.src);
            }}
            onUploadCompletion={uploadedFiles => {
                if (!uploadedFiles || uploadedFiles.length === 0) {
                    return;
                }
                onSelect(uploadedFiles[0].src);
            }}
            accept={["application/zip"]}
        >
            {({ showFileManager }) =>
                typeof children === "function"
                    ? children({ showFileManager })
                    : React.cloneElement(children as unknown as React.ReactElement, {
                          onClick: showFileManager
                      })
            }
        </FileManager>
    );
};
