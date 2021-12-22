import { css } from "emotion";
import styled from "@emotion/styled";
import { Box } from "./theme";

export const restGridStyles = css`
    &.mdc-layout-grid {
        padding: 0;
    }
`;

export const CheckboxWrapper = styled(Box)`
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
`;

export const InputField = styled.input`
    box-sizing: border-box;
    width: 100%;
    border: 1px solid var(--mdc-theme-on-background);
    border-radius: 1px;
    background-color: var(--mdc-theme-background);
    padding: 7px 16px;

    ::placeholder {
        color: var(--mdc-theme-text-primary-on-background);
    }
`;
