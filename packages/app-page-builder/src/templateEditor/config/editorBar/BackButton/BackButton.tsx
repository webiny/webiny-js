import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { createDecorator } from "@webiny/app-admin";
import { useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

export const BackButtonPlugin = createDecorator(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigate();

        const onClick = useCallback(() => {
            navigate(-1);
        }, [navigate]);

        return (
            <BackButtonWrapper>
                <IconButton
                    data-testid="pb-editor-back-button"
                    onClick={onClick}
                    icon={<BackIcon />}
                />
            </BackButtonWrapper>
        );
    };
});
