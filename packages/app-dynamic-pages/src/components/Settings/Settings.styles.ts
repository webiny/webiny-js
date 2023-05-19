import { css } from "emotion";
import styled from "@emotion/styled";
import { ButtonSecondary } from "@webiny/ui/Button";

export const SettingsWrapper = styled.div`
    background: var(--mdc-theme-background);
    border: 1px dashed var(--mdc-theme-text-secondary-on-background);
    padding: 12px 8px;

    .mdc-select__selected-text,
    .mdc-text-field__input {
        color: var(--mdc-theme-text-secondary-on-background) !important;
    }
`;

export const SettingsTitle = styled.span`
    display: inline-block;
    font-weight: 700;
    font-size: 12px;
    color: var(--mdc-theme-text-secondary-on-background);
    margin-bottom: 8px;
`;

export const SettingsSubTitle = styled.span`
    display: inline-block;
    font-weight: 400;
    font-size: 12px;
    color: var(--mdc-theme-text-secondary-on-background);
`;

export const ButtonSecondaryStyled = styled(ButtonSecondary)`
    margin-top: 16px;
    background-color: white !important;
    width: 100%;
`;

export const ConditionFormWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid var(--mdc-theme-on-background);
    margin-top: 20px;
    padding: 8px;

    & .mdc-floating-label {
        color: var(--mdc-theme-text-secondary-on-background) !important;
    }
`;

export const ConditionFormTitle = styled.span`
    display: inline-block;
    font-weight: 400;
    font-size: 14px;
    color: var(--mdc-theme-text-secondary-on-background);
    text-transform: uppercase;
    margin-bottom: 14px;
`;

export const ConditionFormButtonsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
`;

export const ConditionFormSelectWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0;
    color: var(--mdc-theme-text-secondary-on-background);
    font-size: 16px;

    & .mdc-select__selected-text {
        padding-left: 12px;
    }

    & .select-title {
        display: inline-block;
        margin-right: 10px;
        margin-left: 10px;
        font-weight: 400;
        font-size: 16px;
        line-height: 20px;
        color: var(--mdc-theme-text-secondary-on-background);
    }
`;

export const SettingsList = styled.div`
    display: grid;
    row-gap: 11px;
    background: white;
    border: 1px solid var(--mdc-theme-on-background);
    margin-top: 20px;
    padding: 8px;
`;

export const SettingsListItem = styled.div`
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    color: var(--mdc-theme-text-secondary-on-background);
    background: var(--mdc-theme-background);
    border: 1px solid var(--mdc-theme-on-background);

    & svg {
        fill: var(--mdc-theme-text-secondary-on-background);
        cursor: pointer;

        & :first-of-type {
            margin-right: 8px;
        }
    }

    .item-title {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 14px;
        line-height: 16px;
        padding-right: 8px;
    }

    .item-buttons {
        flex-shrink: 0;
        display: flex;
        align-items: center;
    }
`;

export const smallSelectStyles = css`
    .mdc-select__anchor {
        height: 35px;

        i {
            bottom: 4px;
        }
    }

    .rmwc-select__native-control {
        height: 35px;
        padding-top: 0;
    }

    .mdc-select__selected-text {
        height: 35px !important;
        padding-top: 5px !important;
    }
`;

export const largeSelectStyles = css`
    height: 54px !important;
    border-bottom: 1px solid var(--mdc-theme-text-secondary-on-background);
`;

export const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 12px;
    color: var(--mdc-theme-text-secondary-on-background);

    .webiny-ui-input {
        height: 35px;
        width: 60px;

        .mdc-text-field__input {
            height: 35px;
            padding-left: 8px;
            padding-right: 8px;

            ::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
        }
    }
`;

export const SwitchWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 35px;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--mdc-theme-text-secondary-on-background);
`;

export const SelectWrapper = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr;
    margin-top: 10px;
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--mdc-theme-text-secondary-on-background);
`;
