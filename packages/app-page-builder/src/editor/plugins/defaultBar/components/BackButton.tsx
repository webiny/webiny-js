import React from "react";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

const BackButton: React.FC = () => {
    const { match, history } = useRouter();

    const params = match ? (match.params ? (match.params as any).id : "") : { id: "" };
    return (
        <IconButton
            data-testid="pb-editor-back-button"
            className={backStyles}
            onClick={() => history.push(`/page-builder/pages?id=${params.id}`)}
            icon={<BackIcon />}
        />
    );
};

export default BackButton;
