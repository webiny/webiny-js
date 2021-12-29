import styled from "@emotion/styled";
import { Box } from "../../Layout";
import React from "react";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as CheckIcon } from "~/admin/assets/icons/check_24dp.svg";

const SignOffBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

function ProvideSignOff() {
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

export default ProvideSignOff;
