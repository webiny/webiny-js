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
    opacity: 0;
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
    top: 0;
    opacity: 0.5;
    width: 100%;
    height: 200px;
    background-color: var(--mdc-theme-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
        fill: var(--mdc-theme-surface);
        width: 100px;
        height: 100px;
    }
`;

export const FileInfoIcon = styled("div")`
    & .mdc-icon-button {
        padding: 0;
        svg {
            border: 1px solid var(--mdc-theme-on-background);
            border-radius: 50%;
            background-color: var(--mdc-theme-text-hint-on-dark);
            padding: 10px;

            transition: all 150ms ease-out;
            color: var(--mdc-theme-text-primary-on-background);
            scale: 0.7;
            &:hover {
                scale: 1;
            }
        }
    }
`;

export const FilePreview = styled("div")`
    text-align: center;
    position: relative;
    background-color: var(--mdc-theme-surface);
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
        width: 210px;
        height: auto;
        max-height: 210px;
        max-width: 210px;
    }
    svg {
        fill: var(--mdc-theme-text-secondary-on-background);
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
    padding: 15px 10px;
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
        top: 0;
        background: var(--mdc-theme-text-secondary-on-background);
    }
    button.webiny-ui-button {
        width: 100%;
        svg {
            fill: var(--mdc-theme-primary);
        }
        span.mdc-button__label > span {
            display: inline-block;
            width: 75px;
        }
    }
`;
