import styled from "@emotion/styled";

export const DropDownMenu = styled.div<{ disabled?: boolean }>`
    display: flex;
    align-items: center;
    padding: 4px 36px 4px 12px;
    color: var(--mdc-theme-text-secondary-on-background);
    background: var(--mdc-theme-on-background);
    border-bottom: 1px solid var(--mdc-theme-text-secondary-on-background);
    height: 43px;
    min-width: 0;
    cursor: pointer;
    pointer-events: ${props => (props.disabled ? "none" : "auto")};

    & .db-icon {
        margin-right: 12px;
        color: var(--mdc-theme-text-secondary-on-background);
        flex-shrink: 0;
    }

    & .label-wrapper {
        display: grid;

        .label {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
    }

    & .arrow-down {
        position: absolute;
        right: 8px;
    }
`;

export const DropDownGroupHeading = styled.div`
    position: sticky;
    top: 0;
    padding: 8px 18px;
    background: var(--mdc-theme-background);
    border-bottom: 1px solid var(--mdc-theme-background);
    font-weight: 400;
    font-size: 12px;
    line-height: 15px;
    color: var(--mdc-theme-text-secondary-on-background);
    display: flex;
    align-items: center;

    & .arrow-back-icon {
        flex-shrink: 0;
        transform: rotate(270deg);
        margin-right: 11px;
        color: var(--mdc-theme-text-secondary-on-background);
        opacity: 0.5;

        &.active {
            cursor: pointer;
            opacity: 1;
        }
    }
`;

export const DropDownOptions = styled.div`
    border: 1px solid var(--mdc-theme-background);
    background-color: white;
`;

export const DropDownOptionWrapper = styled.div<{ isActive?: boolean; disabled?: boolean }>`
    padding-left: 12px;
    padding-right: 12px;
    background-color: ${props => (props.isActive ? "var(--mdc-theme-on-background)" : "white")};
    transition: background-color 0.2s;
    cursor: ${props => (props.disabled ? "not-allowed" : "pointer")};

    &:last-child {
        & > div {
            border-bottom: none;
        }
    }

    &:hover {
        background-color: var(--mdc-theme-background);
    }
`;

export const DropDownOption = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 6px;
    border-bottom: 1px solid var(--mdc-theme-on-background);
    color: var(--mdc-theme-text-secondary-on-background);
    font-style: normal;
`;

export const DropDownOptionIcon = styled.div`
    background: var(--mdc-theme-background);
    border: 1px solid var(--mdc-theme-on-background);
    width: 32px;
    height: 32px;
    margin-right: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const DropDownOptionTextContent = styled.div`
    display: flex;
    flex-direction: column;
`;

export const DropDownOptionTitle = styled.div`
    font-weight: 700;
    font-size: 16px;
    line-height: 20px;
    color: var(--mdc-theme-text-secondary-on-background);
    margin-right: 4px;
`;

export const DropDownOptionSubTitle = styled.div`
    font-weight: 400;
    font-size: 12px;
    line-height: 14px;
    margin-right: 4px;
`;

export const LoaderWrapper = styled.div`
    margin-top: 2px;
    margin-left: 6px;
`;

export const OpenNestedFieldsButton = styled.div`
    position: absolute;
    right: 10px;
`;
