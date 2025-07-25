import styled from "@emotion/styled";
import { Icon } from "@webiny/ui/Icon";
import { IconButton } from "@webiny/ui/Button";

export const SearchIconContainer = styled(Icon)`
    &.mdc-button__icon {
        color: var(--mdc-theme-text-secondary-on-background);
        position: absolute;
        width: 24px;
        height: 24px;
        left: 8px;
        top: 8px;
    }
`;

export const FilterButton = styled(IconButton)`
    position: absolute;
    top: -4px;
    right: -3px;
`;

export const InputContainer = styled.div`
    background-color: var(--mdc-theme-on-background);
    position: relative;
    height: 32px;
    padding: 3px;
    width: 100%;
    border-radius: 2px;
    > input {
        border: none;
        font-size: 14px;
        width: calc(100% - 10px);
        height: 100%;
        margin-left: 32px;
        background-color: transparent;
        outline: none;
        color: var(--mdc-theme-text-primary-on-background);
    }
`;
