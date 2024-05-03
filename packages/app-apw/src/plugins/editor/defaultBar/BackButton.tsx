import React from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { useNavigate } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "~/assets/icons/round-arrow-back_24dp.svg";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

export const BackButton = React.memo(() => {
    const navigate = useNavigate();

    return (
        <BackButtonWrapper>
            <IconButton
                data-testid="apw-content-review-editor-back-button"
                onClick={() => navigate(`/apw/content-reviews`)}
                icon={<BackIcon />}
            />
        </BackButtonWrapper>
    );
});

BackButton.displayName = "BackButton";
