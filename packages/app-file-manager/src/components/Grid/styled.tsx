import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

export const FolderList = styled("div")`
    margin: 16px;
`;

export const FileList = styled("div")`
    display: grid;
    /* define the number of grid columns */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    column-gap: 16px;
    row-gap: 16px;
    margin: 16px;
`;

const COMPONENT_WIDTH = 200;
const COMPONENT_HEIGHT = 200;

const grow = keyframes`
  0% {
    transform: scale(1)
  }
  50% {
    transform: scale(1.2)
  }
  100% {
    transform: scale(1)
  }
`;

type FileWrapperProps = {
    disableSelect: boolean;
    selected: boolean;
};

export const FileBody = styled("div")`
    transition: 200ms ease-in opacity;
    width: ${COMPONENT_WIDTH};
    height: ${COMPONENT_HEIGHT};
    overflow: hidden;
`;

export const FileInfoIcon = styled("div")`
    opacity: 0;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    transition: all 150ms ease-in;

    &:hover {
        animation-name: ${grow};
        animation-duration: 0.4s;
        animation-timing-function: ease-in;
        animation-delay: 0.2s;
    }

    & .mdc-icon-button svg {
        color: var(--mdc-theme-secondary);
    }
`;

export const FilePreview = styled("div")`
    text-align: center;
    position: relative;
    background-color: var(--mdc-theme-surface);
    width: 100%;
    height: 100%;
`;

export const FileClickable = styled("div")`
    position: absolute;
    top: 30px;
    left: 0;
    width: 100%;
    height: 170px;
    z-index: 2;
`;

export const FileLabel = styled("div")`
    padding: 15px 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.8rem;
    color: var(--mdc-theme-on-surface);
    background-color: var(--mdc-theme-on-background);
`;

export const FileWrapper = styled("div")<FileWrapperProps>`
    display: inline-block;
    float: left;
    position: relative;
    z-index: 1;
    cursor: ${({ disableSelect }) => (disableSelect ? "auto" : "pointer")};
    width: 100%;
    max-width: ${COMPONENT_WIDTH};
    border: 1px solid var(--mdc-theme-on-background);
    border-radius: 2px;
    box-shadow: ${({ selected }) =>
        selected ? "0px 0px 0px 2px var(--mdc-theme-primary)" : "none"};

    &:hover ${FileInfoIcon} {
        opacity: 1;
    }
`;
