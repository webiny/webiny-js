import React from "react";
import {
    createComponentPlugin,
    FileManagerFileItem,
    FileManagerOnChange,
    FileManagerRenderer as BaseFileManagerRenderer
} from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import FileManagerView from "./FileManagerView";
import {
    FileManagerViewProvider,
    FileManagerViewProviderProps
} from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { FM_ACO_APP } from "~/constants";
import { FileManagerViewWithConfig } from "./FileManagerViewConfig";
import { FoldersProvider } from "@webiny/app-aco/contexts/folders";
import { NavigateFolderProvider } from "./NavigateFolderProvider";
import { AcoWithConfig, DialogsProvider } from "@webiny/app-aco";
import { CompositionScope } from "@webiny/react-composition";

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

interface FileManagerProviderProps
    extends Omit<FileManagerViewProviderProps, "accept" | "children"> {
    children: React.ReactNode;
    images?: boolean;
    accept?: string[];
}

export function FileManagerProvider({
    children,
    images,
    accept,
    ...props
}: FileManagerProviderProps) {
    const mimeTypes = images ? accept || imagesAccept : accept || [];

    return (
        <CompositionScope name={"fm"}>
            <FoldersProvider type={FM_ACO_APP}>
                <NavigateFolderProvider>
                    <DialogsProvider>
                        <AcoWithConfig>
                            <FileManagerViewProvider {...props} accept={mimeTypes}>
                                <FileManagerViewWithConfig>{children}</FileManagerViewWithConfig>
                            </FileManagerViewProvider>
                        </AcoWithConfig>
                    </DialogsProvider>
                </NavigateFolderProvider>
            </FoldersProvider>
        </CompositionScope>
    );
}

export const FileManagerRenderer = createComponentPlugin(BaseFileManagerRenderer, () => {
    return function FileManagerRenderer(props) {
        const { onChange, ...forwardProps } = props;

        const handleFileOnChange = (value?: FileItem[] | FileItem) => {
            if (!onChange || !value || (Array.isArray(value) && !value.length)) {
                return;
            }

            if (Array.isArray(value)) {
                const finalValue = value.map(formatFileItem);
                (onChange as FileManagerOnChange<FileManagerFileItem[]>)(finalValue);
                return;
            }

            (onChange as FileManagerOnChange<FileManagerFileItem>)(formatFileItem(value));
        };

        const viewProps: Omit<FileManagerProviderProps, "children"> = {
            ...forwardProps,
            onUploadCompletion:
                forwardProps.onUploadCompletion as FileManagerViewProviderProps["onUploadCompletion"],
            onChange: typeof onChange === "function" ? handleFileOnChange : undefined
        };

        return (
            <FileManagerProvider {...viewProps}>
                <FileManagerView />
            </FileManagerProvider>
        );
    };
});
