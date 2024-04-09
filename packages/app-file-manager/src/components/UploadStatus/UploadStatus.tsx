import React from "react";
import { i18n } from "@webiny/app/i18n";

import {
    StatusWrapper,
    StatusIndicator,
    Icon,
    Percentage,
    ProgressWrapper,
    UploadingLabel,
    ProgressBar,
    ProgressBarPercentage,
    UploadingLabelFile
} from "./styled";

import loadingIcon from "./assets/loading.svg";
import checkIcon from "./assets/check.svg";

const t = i18n.ns("app-admin/file-manager/components/upload-status");

export interface UploadStatusProps {
    progress: number;
    numberOfFiles: number;
}
export const UploadStatus = ({ numberOfFiles, progress }: UploadStatusProps) => {
    if (!numberOfFiles) {
        return null;
    }

    return (
        <StatusWrapper>
            <StatusIndicator>
                {Number(progress.toFixed()) <= 98 ? (
                    <Icon className="loading" src={loadingIcon} alt={t`Loading`} />
                ) : (
                    <Icon src={checkIcon} alt={t`Done`} />
                )}
                {Number(progress.toFixed()) <= 98 && <Percentage>{progress.toFixed()}%</Percentage>}
            </StatusIndicator>
            <ProgressWrapper>
                <UploadingLabel>
                    {t`Uploading {numberOfFiles} {label}`({
                        numberOfFiles: <UploadingLabelFile>{numberOfFiles}</UploadingLabelFile>,
                        label: numberOfFiles === 1 ? t`file` : t`files`
                    })}
                </UploadingLabel>
                <ProgressBar>
                    <ProgressBarPercentage width={progress.toFixed()} />
                </ProgressBar>
            </ProgressWrapper>
        </StatusWrapper>
    );
};
