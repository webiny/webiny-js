import React from "react";
import {
    createComponentPlugin,
    FileManagerFileItem,
    FileManagerOnChange,
    FileManagerRenderer as BaseFileManagerRenderer
} from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import FileManagerView, { FileManagerViewProps } from "./FileManagerView";
import { FileManagerViewProvider } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FM_ACO_APP } from "~/constants";
import { FileManagerViewWithConfig } from "./FileManagerViewConfig";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders";
import { NavigateFolderProvider } from "./NavigateFolderProvider";

/**
 * Convert a FileItem object to a FileManagerFileItem, which is then passed to `onChange` callback.
 */
const formatFileItem = ({ id, src, ...rest }: FileItem): FileManagerFileItem => {
    const props: { [key: string]: any } = rest;

    return {
        id,
        src,
        meta: Object.keys(rest).map(key => ({ key, value: props[key] }))
    };
};

/**
 * If `accept` prop is not passed, and `images` prop is set, use these default mime types.
 * Defaults can be overridden using the `createComponentPlugin` and `FileManagerRenderer` component.
 */
const imagesAccept = [
    "image/jpg",
    "image/jpeg",
    "image/tiff",
    "image/gif",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/svg+xml"
];

export const FileManagerRenderer = createComponentPlugin(BaseFileManagerRenderer, () => {
    return function FileManagerRenderer(props) {
        const { onChange, images, accept, ...forwardProps } = props;

        const handleFileOnChange = (value?: FileItem[] | FileItem) => {
            if (!onChange || !value || (Array.isArray(value) && !value.length)) {
                return;
            }

            if (Array.isArray(value)) {
                const finalValue: FileManagerFileItem[] = value.map(formatFileItem);
                (onChange as FileManagerOnChange<FileManagerFileItem[]>)(finalValue);
                return;
            }

            (onChange as FileManagerOnChange<FileManagerFileItem>)(formatFileItem(value));
        };

        const viewProps: FileManagerViewProps = {
            ...forwardProps,
            onChange: typeof onChange === "function" ? handleFileOnChange : undefined,
            accept: images ? accept || imagesAccept : accept || []
        };

        return (
            <FoldersProvider type={FM_ACO_APP}>
                <NavigateFolderProvider>
                    <FileManagerViewProvider
                        accept={viewProps.accept || []}
                        tags={viewProps.tags || []}
                        scope={viewProps.scope}
                        own={viewProps.own}
                    >
                        <FileManagerViewWithConfig>
                            <FileManagerView {...viewProps} />
                        </FileManagerViewWithConfig>
                    </FileManagerViewProvider>
                </NavigateFolderProvider>
            </FoldersProvider>
        );
    };
});
