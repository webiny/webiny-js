import styled from "@emotion/styled";
import { ElementStatusWrapper } from "./ElementStatusWrapper";

export const UnlinkElementWrapper = styled(ElementStatusWrapper)`
    // border: 1px dashed var(--mdc-theme-text-secondary-on-background);
    // border-radius: 0px;

    & .unlink-title {
        font-weight: 700;
        font-size: 12px;
        color: var(--mdc-theme-text-secondary-on-background);
    }

    padding: 16px;
    display: grid;
    row-gap: 16px;
    justify-content: center;
    align-items: center;
    text-align: center;
    background-color: var(--mdc-theme-background);
    border: 3px dashed var(--webiny-theme-color-border);
    border-radius: 5px;

    & .info-wrapper {
        display: flex;
        align-items: center;
        text-align: start;
        font-size: 10px;
        & svg {
            width: 18px;
            margin-right: 5px;
        }
    }
`;
