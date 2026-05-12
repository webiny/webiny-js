import React from "react";
import type { FileManagerFileItem, FileManagerOnChange } from "@webiny/app-admin";
import { FileManagerRenderer as BaseFileManagerRenderer } from "@webiny/app-admin";
import type { FmFile } from "~/features/shared/types.js";
import { FileManagerView } from "./FileManagerView.js";

const formatFileItem = (file: FmFile): FileManagerFileItem => {
    return {
        id: file.id,
        src: file.src,
        name: file.name,
        type: file.type,
        size: file.size,
        width: file.metadata?.image?.width,
        height: file.metadata?.image?.height,
        extensions: file.extensions,
        metadata: file.metadata
    };
};

export const FileManagerRendererDecorator = BaseFileManagerRenderer.createDecorator(() => {
    return function FileManagerRendererImpl(props) {
        const { onChange, onClose, multiple, accept, scope } = props;

        const handleChange = (files: FmFile[]) => {
            if (!onChange || !files.length) {
                return;
            }

            if (multiple) {
                (onChange as FileManagerOnChange<FileManagerFileItem[]>)(files.map(formatFileItem));
            } else {
                (onChange as FileManagerOnChange<FileManagerFileItem>)(formatFileItem(files[0]));
            }

            onClose?.();
        };

        return (
            <FileManagerView
                onChange={handleChange}
                onClose={onClose}
                multiple={multiple}
                accept={accept}
                scope={scope}
            />
        );
    };
});
