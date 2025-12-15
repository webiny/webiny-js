import React, { useCallback, useEffect, useRef, useState } from "react";
import { Portal } from "@webiny/admin-ui";
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
    onClose?: () => void;
    onUploadCompletion?: (files: FileManagerFileItem[]) => void;
    own?: boolean;
    scope?: string;
    tags?: string[];
    show?: boolean;
    overlay?: boolean;
} & MultipleProps;

// This jewel was taken from https://davidgomes.com/pick-omit-over-union-types-in-typescript/. Massive thanks, David!
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type FileManagerRendererProps = DistributiveOmit<FileManagerProps, "render">;

export const FileManagerRenderer = makeDecoratable(
    "FileManagerRenderer",
    createVoidComponent<FileManagerRendererProps>()
);

type ShowFileManagerProps =
    | FileManagerOnChange<FileManagerFileItem>
    | FileManagerOnChange<FileManagerFileItem[]>
    | undefined;

export const FileManager = ({ render, onChange, ...rest }: FileManagerProps) => {
    const [isFileManagerVisible, setFileManagerVisible] = useState(rest.show);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const handleShowFileManager = useCallback((newOnChange: ShowFileManagerProps) => {
        if (typeof newOnChange === "function") {
            onChangeRef.current = newOnChange;
        }
        setFileManagerVisible(true);
    }, []);

    const handleCloseFileManager = useCallback(() => {
        setFileManagerVisible(false);
    }, []);

    const renderFileManager = () => {
        if (!isFileManagerVisible) {
            return null;
        }

        // Render as overlay
        if (rest.overlay) {
            return (
                <Portal>
                    {/*@ts-expect-error*/}
                    <FileManagerRenderer
                        onClose={handleCloseFileManager}
                        onChange={onChangeRef.current}
                        {...rest}
                    />
                </Portal>
            );
        }

        // Render inline
        return (
            // @ts-expect-error
            <FileManagerRenderer
                onClose={handleCloseFileManager}
                onChange={onChangeRef.current}
                {...rest}
            />
        );
    };

    const renderContent = () => {
        const renderProps = { showFileManager: handleShowFileManager };

        if (render) {
            return render(renderProps);
        }

        return null;
    };

    return (
        <>
            {renderFileManager()}
            {renderContent()}
        </>
    );
};
