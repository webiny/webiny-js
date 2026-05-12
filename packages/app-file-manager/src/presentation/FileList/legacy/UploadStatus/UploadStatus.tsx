import React from "react";
import { cn, IconButton, ProgressBar, Text } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";

const t = i18n.ns("app-admin/file-manager/components/upload-status");

export interface UploadStatusProps {
    progress: number;
    numberOfFiles: number;
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
}

export const UploadStatus = ({
    numberOfFiles,
    progress = 0,
    isVisible,
    setIsVisible
}: UploadStatusProps) => {
    if (!numberOfFiles || !isVisible) {
        return null;
    }

    return (
        <div
            className={cn([
                "p-md rounded-lg",
                "bg-neutral-dark shadow-lg",
                "absolute bottom-xxl left-2/4 -translate-x-1/2 z-10",
                "flex items-center gap-sm-extra",
                "animate-in slide-in-from-top-4 slide-in-from-left-1/2 duration-500"
            ])}
        >
            <Text as={"div"} size={"sm"} className={"text-neutral-disabled shrink-0"}>
                {t`Uploading {numberOfFiles} {label}`({
                    numberOfFiles: `${numberOfFiles}`,
                    label: numberOfFiles === 1 ? t`file` : t`files`
                })}
            </Text>
            <div className={"w-64"}>
                <ProgressBar
                    value={progress}
                    valuePosition={"end"}
                    className={"text-neutral-light"}
                />
            </div>
            <IconButton
                onClick={() => setIsVisible(false)}
                icon={<CloseIcon />}
                variant={"ghost-negative"}
                size={"sm"}
            />
        </div>
    );
};
