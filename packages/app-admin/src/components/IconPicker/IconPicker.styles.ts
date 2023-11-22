import { css } from "emotion";
import styled from "@emotion/styled";

export const IconPickerWrapper = styled.div`
    .mdc-menu-surface {
        overflow: visible !important;
    }
`;

export const iconPickerLabel = css`
    margin-bottom: 5px;
    margin-left: 2px;
`;

export const IconPickerInput = styled.div`
    background-color: ${props => props.theme.styles.colors.color5};
    border-bottom: 1px solid ${props => props.theme.styles.colors.color3};
    padding: 8px;
    height: 32px;
    width: fit-content;
    cursor: pointer;
    :hover {
        border-bottom: 1px solid ${props => props.theme.styles.colors.color3};
    }
`;

export const MenuHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-transform: uppercase;
    padding: 12px;
    border-bottom: 1px solid ${props => props.theme.styles.colors.color5};
    color: ${props => props.theme.styles.colors.color4};

    & > svg {
        cursor: pointer;
        fill: ${props => props.theme.styles.colors.color4};
    }
`;

export const MenuContent = styled.div`
    position: relative;
    width: 364px;
    height: 524px;
`;

export const Row = styled.div`
    display: flex;
    align-items: center;
`;

export const Cell = styled.div<{ isActive: boolean }>`
    cursor: pointer;
     color: ${({ color }) => color};
    background-color: ${({ isActive, theme }) =>
        isActive ? theme.styles.colors.color5 : theme.styles.colors.color6};

    & > * {
        padding: 4px;
    }
`;

export const CategoryLabel = styled.div`
    align-self: flex-end;
    margin-bottom: 4px;
    text-transform: uppercase;
    ${props => props.theme.styles.typography.paragraphs.stylesById("paragraph2")};
    color: ${props => props.theme.styles.colors.color4};
`;

export const TabContentWrapper = styled.div`
    width: 340px;
    padding: 12px;
`;

export const ListWrapper = styled.div`
    position: relative;
`;

export const NoResultsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
`;

export const InputsWrapper = styled.div`
    display: flex;
    column-gap: 12px;
    padding-bottom: 12px;
    height: 40px;

    [class$="color"] {
        height: 24px;
        width: 24px;
        margin: 3px;
        border-radius: 50%;
    }

    [class$="classNames"] {
        display: none;
    }

    .webiny-ui-input {
        height: 40px !important;
    }
`;

export const addButtonStyle = css`
    &.mdc-button {
        height: 40px;
    }
`;

export const placeholderIcon = css`
    fill: #00000040;
`;
