import styled from "@emotion/styled";
import { ReactComponent as UploadIcon } from "@material-design-icons/svg/filled/cloud_upload.svg";

type DropFilesHereWrapperProps = {
    empty?: boolean;
};

export const DropFilesHereWrapper = styled("div")<DropFilesHereWrapperProps>`
    pointer-events: ${({ empty }) => (empty ? "all" : "none")};
    margin: 0 auto;
    padding-top: 0;
    height: calc(100vh - 95px);
    z-index: 100;
    width: 100%;
    position: absolute;
    background: ${({ empty }) => (empty ? "transparent" : "var(--mdc-theme-text-hint-on-light)")};
`;

export const DropFilesHereInner = styled("div")<DropFilesHereWrapperProps>`
    text-align: center;
    width: 300px;
    height: 300px;
    background-color: ${({ empty }) =>
        empty ? "var(--mdc-theme-surface)" : "var(--mdc-theme-background)"};
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
`;

export const DropFilesHereIconWrapper = styled("div")`
    position: absolute;
    top: 90px;
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--mdc-theme-on-surface);
`;

export const DropFilesHereIcon = styled(UploadIcon)`
    width: 100px !important;
    height: auto;
    display: inline-block;
    color: var(--mdc-theme-on-surface);
`;
