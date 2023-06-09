import React, { useCallback } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import {
    createComponentPlugin,
    FileManagerFileItem,
    FileManagerOnChange,
    FileManagerRenderer as BaseFileManagerRenderer
} from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import { AcoProvider } from "@webiny/app-aco";
import FileManagerAcoView, { FileManagerAcoViewProps } from "./FileManagerAcoView";
import { FileManagerAcoViewProvider } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";
import { FM_ACO_APP, LOCAL_STORAGE_LATEST_VISITED_FOLDER } from "~/constants";
import { FileManagerViewWithConfig } from "./FileManagerViewConfig";

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

export const AcoRenderer = createComponentPlugin(BaseFileManagerRenderer, () => {
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

        const viewProps: FileManagerAcoViewProps = {
            ...forwardProps,
            onChange: typeof onChange === "function" ? handleFileOnChange : undefined,
            accept: images ? accept || imagesAccept : accept || []
        };

        const createNavigateFolderStorageKey = useCallback(() => {
            return LOCAL_STORAGE_LATEST_VISITED_FOLDER;
        }, []);

        const client = useApolloClient();

        return (
            <AcoProvider
                id={FM_ACO_APP}
                client={client}
                folderIdQueryString={"fmFolderId"}
                createNavigateFolderStorageKey={createNavigateFolderStorageKey}
            >
                <FileManagerAcoViewProvider
                    accept={viewProps.accept || []}
                    tags={viewProps.tags || []}
                    scope={viewProps.scope}
                    own={viewProps.own}
                >
                    <FileManagerViewWithConfig>
                        <FileManagerAcoView {...viewProps} />
                    </FileManagerViewWithConfig>
                </FileManagerAcoViewProvider>
            </AcoProvider>
        );
    };
});
