import React from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

const animateShow = keyframes`
    0% {
        opacity: 0;
        top: 0;
    }
    60% {
        opacity: 1;
        top: -55px;
    }
    100% {
        opacity: 1;
        top: -50px;
    }
`;

import loadingIcon from "./assets/loading.svg";
import checkIcon from "./assets/check.svg";

const StatusWrapper = styled.div`
    border-radius: 28px;
    width: 320px;
    transform: translate(-50%, -50%);
    position: absolute;
    box-shadow: 0 2px 6px rgba(170, 185, 200, 0.4);
    color: var(--mdc-theme-on-surface);
    background-color: #fff;
    left: calc(50vw - 160px);
    top: -50px;
    display: flex;
    align-items: center;
    animation-name: ${animateShow};
    animation-duration: 1.5s;
    animation-timing-function: ease-out;
`;

const ProgressWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 225px;
    align-items: center;
    justify-content: center;
    margin-left: 15px;
    margin-top: -5px;
`;

const ProgressBar = styled.div`
    top: 0;
    z-index: 1;
    height: 5px;
    border-radius: 5px;
    background-color: var(--mdc-theme-on-background);
    width: 100%;
    overflow: hidden;
`;

const ProgressBarPercentage = styled.span<{ width: string }>`
    display: block;
    height: 100%;
    background-color: var(--mdc-theme-secondary);
    width: ${props => props.width || 0}%;
`;

const UploadingLabel = styled.div`
    z-index: 2;
    padding: 5px 0 6px 0px;
    text-transform: uppercase;
    color: var(--mdc-theme-text-secondary-on-background);
    span {
        font-weight: 600;
    }
`;

const StatusIndicator = styled.div`
    width: 56px !important;
    position: relative;
    display: block;
    z-index: 2;
    background: var(--mdc-theme-secondary);
    line-height: 56px;
    height: 56px;
    border-radius: 28px;
    width: 100%;
    text-align: center;
    color: #fff;
    box-shadow: 0 2px 6px rgba(170, 185, 200, 0.4);
`;

const Percentage = styled.span`
    font-weight: 600;
`;

const Icon = styled.img`
    position: absolute;
    left: 50%;
    top: 50%;
    margin: -15px 0 0 -15px;
    fill: #fff;
    &.loading {
        width: 75px;
        left: 5px;
        top: 5px;
    }
`;

export interface UploadStatusProps {
    progress: number;
    numberOfFiles: number;
}
const UploadStatus: React.VFC<UploadStatusProps> = ({ numberOfFiles, progress }) => {
    return (
        <StatusWrapper>
            <StatusIndicator>
                {Number(progress.toFixed()) <= 98 ? (
                    <Icon className="loading" src={loadingIcon} alt="Loading" />
                ) : (
                    <Icon src={checkIcon} alt="Done" />
                )}
                {Number(progress.toFixed()) <= 98 && <Percentage>{progress.toFixed()}%</Percentage>}
            </StatusIndicator>
            <ProgressWrapper>
                <UploadingLabel>
                    Uploading <span>{numberOfFiles}</span> file(s)
                </UploadingLabel>
                <ProgressBar>
                    <ProgressBarPercentage width={progress.toFixed()} />
                </ProgressBar>
            </ProgressWrapper>
        </StatusWrapper>
    );
};

export default UploadStatus;
