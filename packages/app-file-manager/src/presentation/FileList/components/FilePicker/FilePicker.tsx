import React from "react";
import { useCallback } from "react";
import { OverlayLayout } from "@webiny/app-admin";
import { useHotkeys } from "@webiny/app-admin";
import { FileManagerView } from "../../../FileManagerView.js";
import type { FmFile } from "~/features/shared/types.js";

export interface FilePickerProps {
    onChange: (files: FmFile[]) => void;
    onClose: () => void;
    multiple?: boolean;
    accept?: string[];
    scope?: string;
    children: React.ReactNode;
}

// Thin overlay wrapper that renders the FileManagerView with overlay config.
export const FilePicker = ({
    onChange,
    onClose,
    multiple,
    accept,
    scope,
    children
}: FilePickerProps) => {
    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    useHotkeys({
        zIndex: 20,
        keys: {
            esc: handleClose
        }
    });

    return (
        <OverlayLayout onExited={handleClose}>
            <FileManagerView
                onChange={onChange}
                onClose={handleClose}
                multiple={multiple}
                accept={accept}
                scope={scope}
            >
                {children}
            </FileManagerView>
        </OverlayLayout>
    );
};
