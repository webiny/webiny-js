import styled from "@emotion/styled";

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

export const FileBody = styled("div")`
    transition: 200ms ease-in opacity;
    width: ${COMPONENT_WIDTH};
    height: ${COMPONENT_HEIGHT};
    overflow: hidden;
`;

export const FileControls = styled("div")`
    opacity: 1;
    position: absolute;
    top: -25px;
    right: 0;
    z-index: 10;
    transition: all 150ms ease-out;
    width: 100%;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const FileSelectedMarker = styled("div")`
    position: absolute;
    z-index: 9;
    width: 100%;
    height: 100%;
    cursor: pointer;
    > div {
        width: 32px;
        height: 32px;
        position: absolute;
        right: 0;
        top: 24px;
        padding: 2px;
        margin: 5px;
        background-color: var(--mdc-theme-surface);
        box-shadow: 0px 0px 4px var(--mdc-theme-on-background);
        border-radius: 50%;
        border: 1px solid var(--mdc-theme-on-background);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.95;
    }
    svg {
        transition: all 150ms ease-out;
        fill: var(--mdc-theme-text-secondary-on-background);
        width: 32px;
        height: 32px;
        opacity: 0.35;
        scale: 0.8;
    }
    &:hover {
        svg {
            opacity: 0.9;
            scale: 0.9;
        }
    }
    &.selected {
        > div {
            background-color: var(--mdc-theme-primary);
        }
        svg {
            opacity: 1;
            scale: 1;
            fill: var(--mdc-theme-surface);
        }
    }
`;

export const FileInfoIcon = styled("div")`
    display: flex;
    & button {
        transition: all 150ms ease-out;
        top: 50px;
        opacity: 0;
        padding: 0;
        svg {
            border: 1px solid var(--mdc-theme-on-background);
            border-radius: 50%;
            background-color: var(--mdc-theme-surface);
            padding: 10px;

            transition: all 150ms ease-out;
            color: var(--mdc-theme-text-primary-on-background);
            scale: 0.7;
            &:hover {
                scale: 1;
            }
        }
        &:nth-of-type(1) {
            transition-delay: 0ms;
        }
        &:nth-of-type(2) {
            transition-delay: 50ms;
        }
        &:nth-of-type(3) {
            transition-delay: 100ms;
        }
    }
`;

export const FilePreview = styled("div")`
    text-align: center;
    position: relative;
    background: repeating-conic-gradient(var(--mdc-theme-surface) 0% 25%, transparent 0% 50%) 50%/18px
        18px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    object-fit: cover;
    justify-content: center;
    align-items: center;
    display: flex;
    svg,
    img {
        width: 100%;
        height: 100%;
        max-height: 210px;
        max-width: 210px;
        object-fit: contain;
        box-sizing: border-box;
        transition: all 150ms ease-out;
    }
    svg {
        fill: var(--mdc-theme-text-secondary-on-background);
    }
    &.selected {
        img,
        svg {
            background-color: rgba(255, 255, 255, 0.6);
            padding: 10px;
            border-radius: 2px;
            scale: 0.8;
            box-shadow: 2px 2px 4px var(--mdc-theme-on-background);
            border: 2px solid var(--mdc-theme-primary);
        }
    }
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
    padding: 25px 10px 15px 10px;
    color: var(--mdc-theme-on-surface);
    background-color: var(--mdc-theme-on-background);
    span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.5;
        &.type {
            font-size: 0.7em;
        }
        &.name {
            font-size: 0.8em;
            font-weight: 600;
        }
    }
`;

export const FileWrapper = styled("div")`
    display: inline-block;
    float: left;
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: ${COMPONENT_WIDTH};
    border: 1px solid var(--mdc-theme-on-background);
    border-radius: 2px;
    overflow: hidden;
    box-shadow: 0 1px 3px var(--mdc-theme-on-background);

    &:hover ${FileControls} {
        opacity: 1;
        button {
            opacity: 1;
            top: 125px;
            width: 100%;
            svg {
                fill: var(--mdc-theme-primary);
            }
            span.mdc-button__label > span {
                display: inline-block;
                width: 75px;
            }
        }
    }
`;
