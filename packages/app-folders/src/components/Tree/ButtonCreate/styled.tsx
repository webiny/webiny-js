import styled from "@emotion/styled";
import { ReactComponent as Plus } from "@material-design-icons/svg/filled/add_circle_outline.svg";

export const Button = styled("button")`
    background: none;
    border: none;
    cursor: pointer;
    outline: none;
    font-family: var(--mdc-typography-font-family);
    color: var(--webiny-theme-color-text-primary);
    fill: currentColor;
    display: flex;
    align-items: center;
    font-size: 1em;
    padding: 8px;
`;

export const IconContainer = styled.div`
    margin-right: 8px;
    height: 24px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const Icon = styled(Plus)`
    width: 16px;
    height: 16px;
`;
