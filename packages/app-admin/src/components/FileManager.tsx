import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { makeComposable } from "@webiny/react-composition";
import FileManagerView, { FileManagerViewProps } from "./FileManager/FileManagerView";
import { FileItem } from "./FileManager/types";
import { FileManagerProvider } from "./FileManager/FileManagerContext";

interface OnChange<T> {
    (value: T): void;
}

/**
 * Represents a file object managed by the File Manager.
 */
export interface FileManagerFileItem {
    id: string;
    src: string;
    meta?: Array<FileManagerFileItemMetaItem>;
}

/**
 * With this we allow developers to add any value to file's meta via component composition, thus the `value: any`.
 */
export interface FileManagerFileItemMetaItem {
    key: string;
    value: any;
}

export type DeprecatedFileManagerRenderPropParams = {
    showFileManager: (onChange?: OnChange<FileManagerFileItem | FileManagerFileItem[]>) => void;
};

export type FileManagerRenderPropParams<TValue> = {
    showFileManager: (onChange?: OnChange<TValue>) => void;
};

interface SingleFileRenderProp {
    (params: FileManagerRenderPropParams<FileManagerFileItem>): React.ReactNode;
}

interface MultiFileRenderProp {
    (params: FileManagerRenderPropParams<FileManagerFileItem[]>): React.ReactNode;
}

export type MultipleProps =
    | {
          multiple?: never;
          multipleMaxCount?: never;
          multipleMaxSize?: never;
          onChange?: OnChange<FileManagerFileItem>;
          render?: SingleFileRenderProp;
      }
    | {
          multiple: true;
          multipleMaxCount?: number;
          multipleMaxSize?: number | string;
          onChange?: OnChange<FileManagerFileItem[]>;
          render?: MultiFileRenderProp;
      };

export type FileManagerProps = {
    accept?: Array<string>;
    images?: boolean;
    maxSize?: number | string;
    /**
     * @deprecated This prop is no longer used. The file structure was reduced to a bare minimum so picking is no longer necessary.
     */
    onChangePick?: string[];
    onClose?: Function;
    onUploadCompletion?: (files: FileManagerFileItem[]) => void;
    own?: boolean;
    scope?: string;
    tags?: Array<string>;
    /**
     * @deprecated This prop is no longer used. Use the `render` prop to get better TS autocomplete.
     */
    children?: (params: DeprecatedFileManagerRenderPropParams) => React.ReactNode;
} & MultipleProps;

function getPortalTarget() {
    let target = window.document.getElementById("file-manager-container");
    if (!target) {
        target = document.createElement("div");
        target.setAttribute("id", "file-manager-container");
        document.body && document.body.appendChild(target);
    }
    return target;
}

// This jewel was taken from https://davidgomes.com/pick-omit-over-union-types-in-typescript/. Massive thanks, David!
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type FileManagerRendererProps = DistributiveOmit<FileManagerProps, "render" | "children">;

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

const DefaultFileManagerRenderer: React.FC<FileManagerRendererProps> = props => {
    const { onChange, images, accept, ...forwardProps } = props;

    const handleFileOnChange = (value?: FileItem[] | FileItem) => {
        if (!onChange || !value || (Array.isArray(value) && !value.length)) {
            return;
        }

        if (Array.isArray(value)) {
            const finalValue: FileManagerFileItem[] = value.map(formatFileItem);
            (onChange as OnChange<FileManagerFileItem[]>)(finalValue);
            return;
        }

        (onChange as OnChange<FileManagerFileItem>)(formatFileItem(value));
    };

    const viewProps: FileManagerViewProps = {
        ...forwardProps,
        onChange: typeof onChange === "function" ? handleFileOnChange : undefined,
        accept: images ? accept || imagesAccept : accept || []
    };

    return (
        <FileManagerProvider
            accept={viewProps.accept}
            tags={viewProps.tags || []}
            own={viewProps.own}
            scope={viewProps.scope}
        >
            <FileManagerView {...viewProps} />
        </FileManagerProvider>
    );
};

export const FileManagerRenderer = makeComposable(
    "FileManagerRenderer",
    DefaultFileManagerRenderer
);

export const FileManager: React.FC<FileManagerProps> = ({
    children,
    render,
    onChange,
    ...rest
}) => {
    const containerRef = useRef<HTMLElement>(getPortalTarget());
    const [show, setShow] = useState(false);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const showFileManager = useCallback(onChange => {
        if (typeof onChange === "function") {
            onChangeRef.current = onChange;
        }
        setShow(true);
    }, []);

    // TODO: move Provider outside of the renderer

    return (
        <>
            {show &&
                ReactDOM.createPortal(
                    <FileManagerRenderer
                        onClose={() => setShow(false)}
                        onChange={
                            /* TODO: figure out how to create a conditional type based on the value of `rest.multiple` */
                            onChangeRef.current as any
                        }
                        {...rest}
                    />,
                    containerRef.current
                )}
            {children ? children({ showFileManager }) : render ? render({ showFileManager }) : null}
        </>
    );
};
