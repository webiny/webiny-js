import React from "react";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

const BackButton: React.FC = () => {
    const { params, history } = useRouter();

    const id = params ? params["id"] : null;
    return (
        <IconButton
            data-testid="pb-editor-back-button"
            className={backStyles}
            onClick={() => {
                if (!id) {
                    console.error("Could not determine PageID from params.");
                    return;
                }
                history.push(`/page-builder/pages?id=${id}`);
            }}
            icon={<BackIcon />}
        />
    );
};

export default BackButton;
