import React from "react";
import { createDecorator } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

export const BackButtonPlugin = createDecorator(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigatePage();

        return (
            <BackButtonWrapper>
                <IconButton
                    data-testid="pb-editor-back-button"
                    onClick={navigate.navigateToLatestFolder}
                    icon={<BackIcon />}
                />
            </BackButtonWrapper>
        );
    };
});
