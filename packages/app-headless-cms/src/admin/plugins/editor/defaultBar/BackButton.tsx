import React from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { useRouter } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

const BackButton = React.memo(() => {
    const { history } = useRouter();

    return (
        <BackButtonWrapper>
            <IconButton
                data-testid="cms-editor-back-button"
                onClick={() => history.push(`/cms/content-models`)}
                icon={<BackIcon />}
            />
        </BackButtonWrapper>
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
