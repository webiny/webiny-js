import styled from "@emotion/styled";
import { ReactComponent as Plus } from "@material-design-icons/svg/outlined/add_circle_outline.svg";

export const Button = styled("button")`
    background: none;
    border: none;
    cursor: pointer;
    outline: none;
    font-family: var(--mdc-typography-font-family);
    color: var(--webiny-theme-color-text-secondary);
    fill: currentColor;
    display: flex;
    align-items: center;
    font-size: 1em;
    padding: 8px;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

export const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const Icon = styled(Plus)`
    padding: 0 4px;
    height: 16px;
    width: 16px;
`;
