import styled from "@emotion/styled";
import { ButtonDefault } from "@webiny/ui/Button";

export const SelectAllContainer = styled.div`
    width: 100%;
    height: auto;
    background-color: var(--mdc-theme-background);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding: 16px;
    text-align: center;
`;

export const MessageContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const Button = styled(ButtonDefault)`
    margin-left: 8px;
`;
