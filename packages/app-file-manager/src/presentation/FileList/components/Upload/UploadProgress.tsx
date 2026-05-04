import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { cn, IconButton, ProgressBar, Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileManagerPresenter } from "../../FileManagerPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/upload-progress");

/**
 * Upload progress indicator that reads `vm.upload` from the FileListPresenter.
 * Reuses the original UploadStatus markup — a bottom-center bar with progress
 * and a close button.
 */
export const UploadProgress = observer(function UploadProgress() {
    const { vm } = useFileManagerPresenter();
    const { upload } = vm;
    const [isVisible, setIsVisible] = useState(true);

    // Don't render when there are no jobs or the user dismissed it.
    if (upload.jobs.length === 0 || !isVisible) {
        return null;
    }

    const numberOfFiles = upload.jobs.length;

    return (
        <div
            className={cn([
                "p-md rounded-lg",
                "bg-neutral-dark shadow-lg",
                "absolute bottom-xxl left-2/4 -translate-x-1/2 z-10",
                "flex items-center gap-sm-extra",
                "animate-in slide-in-from-top-4 slide-in-from-left-1/2 duration-500"
            ])}
            data-testid={"fm-upload-progress"}
        >
            <Text as={"div"} size={"sm"} className={"text-neutral-disabled shrink-0"}>
                {t`Uploading {numberOfFiles} {label}`({
                    numberOfFiles: `${numberOfFiles}`,
                    label: numberOfFiles === 1 ? t`file` : t`files`
                })}
            </Text>
            <div className={"w-64"}>
                <ProgressBar
                    value={upload.overallProgress.percentage}
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
});
