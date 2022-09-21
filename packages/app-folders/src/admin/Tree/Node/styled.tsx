import { css } from "@emotion/css";

export const Container = css`
    display: flex;
    align-items: center;
    padding: 4px 0;
`;

export const IconContainer = css`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0;
    cursor: pointer;
    height: 24px;
    width: 24px;
`;

export const ArrowIconContainer = css`
    transition: transform linear 0.1s;
    transform: rotate(0deg);

    &.isOpen {
        transform: rotate(90deg);
    }
`;

export const FolderIconContainer = css`
    margin-right: 8px;
`;

export const Label = css`
    display: flex;
    align-items: center;
`;
