import React from "react";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import { css } from "emotion";
import { createDecorator } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { TopBar } from "~/editor/config/TopBar/TopBar";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

export const BackButton = () => {
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
