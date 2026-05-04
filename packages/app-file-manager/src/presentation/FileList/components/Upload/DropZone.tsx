import React, { useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import { cn, Text } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/drop-zone");

/**
 * Parse a size string like "26214400" (bytes) or "25MB" into bytes.
 */
function parseSizeToBytes(size: string): number {
    const num = parseFloat(size);
    if (isNaN(num)) {
        return 0;
    }
    const lower = size.toLowerCase();
    if (lower.endsWith("gb")) {
        return num * 1024 * 1024 * 1024;
    }
    if (lower.endsWith("mb")) {
        return num * 1024 * 1024;
    }
    if (lower.endsWith("kb")) {
        return num * 1024;
    }
    // Assume raw bytes.
    return num;
}

interface DropZoneProps {
    /** Accepted MIME types (e.g. ["image/*", "application/pdf"]). */
    accept?: string[];
    /** Maximum file size in bytes or human-readable string from Settings. */
    maxFileSize?: string;
    /** Minimum file size in bytes or human-readable string from Settings. */
    minFileSize?: string;
    children: React.ReactNode;
}

/**
 * Drag-and-drop upload zone that wraps the file list area.
 * Reads `vm.dragging` for overlay visibility and passes dropped files
 * to `presenter.actions.upload()`.
 */
export const DropZone = observer(function DropZone({
    accept,
    maxFileSize,
    minFileSize,
    children
}: DropZoneProps) {
    const presenter = useFileManagerPresenter();
    const { vm, actions } = presenter;
    const dragCounterRef = useRef(0);

    // Filter files by accept list and size limits.
    const filterFiles = useCallback(
        (files: File[]): File[] => {
            return files.filter(file => {
                // Check accept filter.
                if (accept && accept.length > 0) {
                    const accepted = accept.some(pattern => {
                        if (pattern.endsWith("/*")) {
                            // Wildcard match (e.g. "image/*").
                            const prefix = pattern.slice(0, -1);
                            return file.type.startsWith(prefix);
                        }
                        return file.type === pattern;
                    });
                    if (!accepted) {
                        return false;
                    }
                }

                // Check max file size.
                if (maxFileSize) {
                    const max = parseSizeToBytes(maxFileSize);
                    if (max > 0 && file.size > max) {
                        return false;
                    }
                }

                // Check min file size.
                if (minFileSize) {
                    const min = parseSizeToBytes(minFileSize);
                    if (min > 0 && file.size < min) {
                        return false;
                    }
                }

                return true;
            });
        },
        [accept, maxFileSize, minFileSize]
    );

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;

            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length === 0) {
                return;
            }

            const validFiles = filterFiles(droppedFiles);
            if (validFiles.length > 0) {
                void actions.upload(validFiles);
            }
        },
        [filterFiles, actions]
    );

    // Only show the drop zone when the user has create permission.
    if (!vm.permissions.canCreate) {
        return <>{children}</>;
    }

    return (
        <div
            className={"relative size-full"}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-testid={"fm-drop-zone"}
        >
            {children}
            {/* Drop overlay. */}
            {vm.dragging && (
                <div
                    className={cn([
                        "absolute inset-0 z-50",
                        "flex items-center justify-center",
                        "bg-primary-default/10",
                        "border-lg border-dashed border-primary-default",
                        "rounded-lg",
                        "pointer-events-none"
                    ])}
                    data-testid={"fm-drop-zone-overlay"}
                >
                    <Text size={"lg"} className={"text-primary-default font-semibold"}>
                        {t`Drop files here to upload`}
                    </Text>
                </div>
            )}
        </div>
    );
});
