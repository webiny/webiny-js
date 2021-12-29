import styled from "@emotion/styled";
import React from "react";
import { Box } from "~/admin/components/Layout";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ReactComponent as CheckIcon } from "~/admin/assets/icons/check_24dp.svg";

const PublishContentBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

function PublishContent() {
    return (
        <PublishContentBox paddingX={5}>
            <ButtonPrimary
                style={{ width: "217px", backgroundColor: "var(--mdc-theme-secondary)" }}
            >
                <ButtonIcon icon={<CheckIcon />} />
                Publish Content
            </ButtonPrimary>
        </PublishContentBox>
    );
}

export default PublishContent;
