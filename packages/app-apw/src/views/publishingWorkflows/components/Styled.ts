import { css } from "emotion";
import styled from "@emotion/styled";
import { Box } from "~/components/Layout";
import WorkflowStepLabelLinkIcon from "~/assets/icons/step-label-link.svg";

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

export const StepWrapper = styled.div`
    box-sizing: border-box;
    position: relative;
    width: 100%;
    min-height: 300px;
    margin-top: 36px;
    margin-bottom: 30px;
    padding: 32px 24px 24px;
    border: 1px dashed var(--mdc-theme-secondary);
    border-radius: 6px;

    &::before {
        content: attr(data-step-number);
        position: absolute;
        top: -15px;
        left: 20px;
        background-color: white;
        padding: 5px 30px 7px;
        border: 1px dashed var(--mdc-theme-secondary);
        border-radius: 6px;
        line-height: 1;
    }

    &::after {
        content: "";
        position: absolute;
        width: 8px;
        height: 24px;
        top: -36px;
        left: 70px;
        background-image: url(${WorkflowStepLabelLinkIcon});
        background-repeat: no-repeat;
    }
`;
