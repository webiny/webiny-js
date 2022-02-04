import React from "react";
import styled from "@emotion/styled";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as CheckIcon } from "~/admin/assets/icons/check_24dp.svg";
import { Box } from "~/admin/components/Layout";

const SignOffBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

export function ProvideSignOff() {
    return (
        <SignOffBox paddingX={5}>
            <ButtonPrimary
                style={{ width: "217px", backgroundColor: "var(--mdc-theme-secondary)" }}
            >
                <ButtonIcon icon={<CheckIcon />} />
                Provide Sign off
            </ButtonPrimary>
        </SignOffBox>
    );
}
