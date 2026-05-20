import React, { useCallback, useId, useMemo, useRef } from "react";
import { BrowserFilePickerPresenter } from "./BrowserFilePickerPresenter.js";
import type {
    BrowserFilePickerProps,
    BrowserFilePickerRenderProps,
    BrowseFilesParams
} from "./types.js";

export function BrowserFilePicker({
    accept = [],
    multiple = false,
    maxSize = "2mb",
    multipleMaxSize = "10mb",
    multipleMaxCount = null,
    convertToBase64 = false,
    onSuccess,
    onError,
    children,
    id: externalId
}: BrowserFilePickerProps) {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const inputRef = useRef<HTMLInputElement>(null);
    const browseCallbacksRef = useRef<BrowseFilesParams | null>(null);

    const presenter = useMemo(() => {
        return new BrowserFilePickerPresenter({
            accept,
            multiple,
            maxSize,
            multipleMaxSize,
            multipleMaxCount,
            convertToBase64
        });
    }, [accept, multiple, maxSize, multipleMaxSize, multipleMaxCount, convertToBase64]);

    const resolveCallbacks = useCallback((): BrowseFilesParams => {
        const overrides = browseCallbacksRef.current;
        return {
            onSuccess: overrides?.onSuccess ?? onSuccess,
            onError: overrides?.onError ?? onError
        };
    }, [onSuccess, onError]);

    const handleFiles = useCallback(
        async (files: File[]) => {
            await presenter.processFiles(files, resolveCallbacks());

            if (inputRef.current) {
                inputRef.current.value = "";
            }
            browseCallbacksRef.current = null;
        },
        [presenter, resolveCallbacks]
    );

    const renderProps: BrowserFilePickerRenderProps = useMemo(
        () => ({
            browseFiles: (params?: BrowseFilesParams) => {
                browseCallbacksRef.current = params ?? null;
                inputRef.current?.click();
            },

            getDropZoneProps: (additionalProps: Record<string, any> = {}) => {
                const { onDragOver, onDrop, ...rest } = additionalProps;
                return {
                    ...rest,
                    onDragOver: (e: DragEvent) => {
                        e.preventDefault();
                        typeof onDragOver === "function" && onDragOver(e);
                    },
                    onDrop: async (e: DragEvent) => {
                        e.preventDefault();
                        typeof onDrop === "function" && onDrop(e);
                        if (e.dataTransfer?.files) {
                            await handleFiles(Array.from(e.dataTransfer.files));
                        }
                    }
                };
            },

            getLabelProps: (additionalProps: Record<string, any> = {}) => ({
                ...additionalProps,
                htmlFor: inputId
            }),

            validateFiles: (files: Array<{ type: string; size: number }>) =>
                presenter.validateFiles(files)
        }),
        [inputId, presenter, handleFiles]
    );

    return (
        <>
            {children(renderProps)}
            <input
                id={inputId}
                ref={inputRef}
                accept={accept.join(",")}
                style={{ display: "none" }}
                type="file"
                multiple={multiple}
                onChange={e => {
                    const files = e.target.files;
                    if (files) {
                        void handleFiles(Array.from(files));
                    }
                }}
            />
        </>
    );
}
