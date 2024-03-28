import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import styled from "@emotion/styled";
import { useRouter } from "@webiny/react-router";

const BackButtonWrapper = styled.div`
    margin-left: -10px;
`;

const BackButton = React.memo(() => {
    const { params, history } = useRouter();

    const id = params ? params["id"] : undefined;

    return (
        <BackButtonWrapper>
            <IconButton
                data-testid="fb-editor-back-button"
                onClick={() => {
                    if (!id) {
                        console.error("Could not determine FormID from params.");
                        return;
                    }
                    history.push(`/form-builder/forms?id=${id}`);
                }}
                icon={<BackIcon />}
            />
        </BackButtonWrapper>
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
