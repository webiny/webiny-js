import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { createVoidComponent, makeDecoratable } from "@webiny/react-composition";

export interface FileManagerOnChange<T> {
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
    showFileManager: (
        onChange?: FileManagerOnChange<FileManagerFileItem | FileManagerFileItem[]>
    ) => void;
};

export type FileManagerRenderPropParams<TValue> = {
    showFileManager: (onChange?: FileManagerOnChange<TValue>) => void;
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
          onChange?: FileManagerOnChange<FileManagerFileItem>;
          render?: SingleFileRenderProp;
      }
    | {
          multiple: true;
          multipleMaxCount?: number;
          multipleMaxSize?: number | string;
          onChange?: FileManagerOnChange<FileManagerFileItem[]>;
          render?: MultiFileRenderProp;
      };

export type FileManagerProps = {
    accept?: string[];
    images?: boolean;
    maxSize?: number | string;
    /**
     * @deprecated This prop is no longer used. The file structure was reduced to a bare minimum so picking is no longer necessary.
     */
    onChangePick?: string[];
    onClose?: () => void;
    onUploadCompletion?: (files: FileManagerFileItem[]) => void;
    own?: boolean;
    scope?: string;
    tags?: string[];
    show?: boolean;
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

export const FileManagerRenderer = makeDecoratable(
    "FileManagerRenderer",
    createVoidComponent<FileManagerRendererProps>()
);

export const FileManager = ({ children, render, onChange, ...rest }: FileManagerProps) => {
    const containerRef = useRef<HTMLElement>(getPortalTarget());
    const [show, setShow] = useState(rest.show ?? false);
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

    return (
        <>
            {show &&
                ReactDOM.createPortal(
                    /**
                     * TODO @pavel
                     */
                    // @ts-expect-error
                    <FileManagerRenderer
                        onClose={() => setShow(false)}
                        onChange={onChangeRef.current}
                        {...rest}
                    />,
                    containerRef.current
                )}
            {children ? children({ showFileManager }) : render ? render({ showFileManager }) : null}
        </>
    );
};
