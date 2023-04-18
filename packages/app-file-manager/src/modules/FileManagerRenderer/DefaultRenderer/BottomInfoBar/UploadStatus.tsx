import React from "react";
import styled from "@emotion/styled";

const StatusWrapper = styled.div`
    color: var(--mdc-theme-on-surface);
    background-color: #fff;
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
    height: 30px;
    display: flex;
    align-items: center;
    > div {
        position: relative;
        width: 100%;
        height: 100%;
    }
`;

const ProgressBar = styled.div<{ width: string }>`
    position: absolute;
    top: 0;
    z-index: 1;
    height: 100%;
    background-color: var(--mdc-theme-secondary);
    width: ${props => props.width || 0}%;
`;

const UploadingLabel = styled.div`
    position: absolute;
    z-index: 2;
    padding: 10px;
`;

export interface UploadStatusProps {
    progress: number;
    numberOfFiles: number;
}
const UploadStatus: React.FC<UploadStatusProps> = ({ numberOfFiles, progress }) => {
    return (
        <StatusWrapper>
            <div>
                <UploadingLabel>
                    Uploading {numberOfFiles} file(s) ({progress.toFixed()}%)...
                </UploadingLabel>
                <ProgressBar width={progress.toFixed()} />
            </div>
        </StatusWrapper>
    );
};

export default UploadStatus;
