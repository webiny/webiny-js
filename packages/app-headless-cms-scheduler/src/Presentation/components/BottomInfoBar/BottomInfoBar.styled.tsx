import styled from "@emotion/styled";

export const BottomInfoBarWrapper = styled("div")`
    font-size: 0.8rem;
    position: sticky;
    bottom: 0;
    height: 30px;
    color: var(--mdc-theme-text-secondary-on-background);
    border-top: 1px solid var(--mdc-theme-on-background);
    background: var(--mdc-theme-surface);
    width: 100%;
    transform: translateZ(0);
    overflow: hidden;
    display: flex;
    align-items: center;
    z-index: 1;
`;

export const BottomInfoBarInner = styled("div")`
    padding: 0 10px;
    width: 100%;
`;

export const StatusWrapper = styled("div")`
    color: var(--mdc-theme-primary);
    position: absolute;
    right: 0;
    bottom: 10px;
    margin-right: 10px;
    display: flex;
    align-items: center;
    > div {
        display: inline-block;
    }
`;

export const CircularProgressHolder = styled("div")`
    position: relative;
    height: 12px;
    width: 12px;
`;

export const UploadingLabel = styled("div")`
    margin-right: 5px;
`;
