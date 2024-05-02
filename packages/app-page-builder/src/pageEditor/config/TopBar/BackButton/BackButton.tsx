import React from "react";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

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
